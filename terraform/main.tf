terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  
  # State를 S3에 저장하여 영구 보관
  backend "s3" {
    bucket = "earth-app-terraform-state"
    key    = "terraform.tfstate"
    region = "ap-northeast-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# CloudFront용 ACM 인증서는 us-east-1 리전에서만 발급 가능
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Route 53 호스팅 존 (선택사항 - 기존 존이 있으면 route53_zone_id 변수 사용)
# DuckDNS를 사용하는 경우, Route 53 호스팅 존을 생성하거나 기존 존을 사용해야 합니다
# data "aws_route53_zone" "main" {
#   name = var.domain_name
# }

# ACM 인증서 (CloudFront용, us-east-1 리전에서만 가능)
resource "aws_acm_certificate" "cloudfront" {
  provider          = aws.us_east_1
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.bucket_name}-certificate"
    Environment = var.environment
  }
}

# Route 53 DNS 검증 레코드 (Route 53을 사용하는 경우)
resource "aws_route53_record" "acm_validation" {
  provider = aws.us_east_1
  for_each = var.domain_name != "" && var.route53_zone_id != "" ? {
    for dvo in aws_acm_certificate.cloudfront[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60

  allow_overwrite = true
}

# ACM 인증서 DNS 검증 (Route 53을 사용하는 경우 자동 검증)
resource "aws_acm_certificate_validation" "cloudfront" {
  provider        = aws.us_east_1
  count           = var.domain_name != "" && var.route53_zone_id != "" ? 1 : 0
  certificate_arn = aws_acm_certificate.cloudfront[0].arn
  validation_record_fqdns = [for record in aws_route53_record.acm_validation : record.fqdn]

  timeouts {
    create = "5m"
  }
}

# Route 53 A 레코드 (CloudFront 배포)
resource "aws_route53_record" "cloudfront" {
  count   = var.domain_name != "" && var.route53_zone_id != "" ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.app.domain_name
    zone_id                = aws_cloudfront_distribution.app.hosted_zone_id
    evaluate_target_health = false
  }
}

# S3 버킷 (정적 웹사이트 호스팅)
resource "aws_s3_bucket" "app" {
  bucket = var.bucket_name

  lifecycle {
    ignore_changes = [bucket]  # 기존 버킷이 있으면 무시
  }
}

resource "aws_s3_bucket_website_configuration" "app" {
  bucket = aws_s3_bucket.app.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# S3 버킷 퍼블릭 액세스 차단 해제
resource "aws_s3_bucket_public_access_block" "app" {
  bucket = aws_s3_bucket.app.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 버킷 정책 (퍼블릭 읽기)
resource "aws_s3_bucket_policy" "app" {
  bucket = aws_s3_bucket.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.app.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.app]
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "app" {
  name                              = "${var.bucket_name}-oac"
  description                       = "OAC for ${var.bucket_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"

  lifecycle {
    create_before_destroy = true
  }
}

# CloudFront 배포
resource "aws_cloudfront_distribution" "app" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment             = "Distribution for ${var.bucket_name}"

  origin {
    domain_name              = aws_s3_bucket.app.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.app.id
    origin_id                 = "S3-${var.bucket_name}"
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${var.bucket_name}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # React Router를 위한 에러 페이지 설정
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # 커스텀 도메인 별칭 추가
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # 커스텀 도메인이 있으면 ACM 인증서 사용, 없으면 CloudFront 기본 인증서 사용
  viewer_certificate {
    acm_certificate_arn      = var.domain_name != "" ? aws_acm_certificate.cloudfront[0].arn : null
    ssl_support_method       = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version = var.domain_name != "" ? "TLSv1.2_2021" : null
    cloudfront_default_certificate = var.domain_name == "" ? true : null
  }

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
  }
}

# S3 버킷 정책 업데이트 (CloudFront OAC용)
resource "aws_s3_bucket_policy" "cloudfront" {
  bucket = aws_s3_bucket.app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.app.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.app.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_cloudfront_distribution.app]
}

# Lambda 함수용 IAM 역할 (us-east-1)
resource "aws_iam_role" "lambda_role" {
  provider = aws.us_east_1
  name     = "${var.bucket_name}-lambda-role"

  lifecycle {
    ignore_changes = [name]  # 기존 역할이 있으면 무시
  }

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda 함수용 IAM 정책 (기본 실행 권한)
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  provider   = aws.us_east_1
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda 함수용 IAM 정책 (Parameter Store 읽기 권한)
resource "aws_iam_role_policy" "lambda_ssm" {
  provider = aws.us_east_1
  name     = "${var.bucket_name}-lambda-ssm-policy"
  role     = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:us-east-1:*:parameter/gemini/api_key"
      }
    ]
  })
}

# Lambda 함수 패키징을 위한 데이터 소스
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda/gemini-analysis"
  output_path = "${path.module}/lambda-function.zip"
}

# AWS Systems Manager Parameter Store에 Gemini API 키 저장 (us-east-1)
# terraform.tfvars에서 gemini_api_key를 제공하지 않으면 기존 값을 유지
# 주의: 이미 Parameter Store에 키가 있으면 이 리소스를 import하거나 생략해야 합니다
resource "aws_ssm_parameter" "gemini_api_key" {
  provider    = aws.us_east_1
  count       = var.gemini_api_key != "" ? 1 : 0
  name        = "/gemini/api_key"
  description = "Google Gemini API Key"
  type        = "SecureString"
  value       = var.gemini_api_key

  tags = {
    Name        = "gemini-api-key"
    Environment = var.environment
  }
}

# Lambda 함수 (us-east-1)
resource "aws_lambda_function" "gemini_analysis" {
  provider         = aws.us_east_1
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.bucket_name}-gemini-analysis"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  # AWS_REGION은 Lambda에서 자동으로 제공되므로 환경 변수로 설정할 필요 없음

  depends_on = [
    aws_iam_role_policy.lambda_ssm
  ]
}

# Lambda Function URL (CORS 활성화, us-east-1)
resource "aws_lambda_function_url" "gemini_analysis" {
  provider          = aws.us_east_1
  function_name      = aws_lambda_function.gemini_analysis.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = []
    max_age           = 86400
  }
}
