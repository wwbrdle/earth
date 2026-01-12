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
  
  # State를 S3에 저장 (선택사항 - state 파일 관리용)
  # backend "s3" {
  #   bucket = "earth-app-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "ap-northeast-2"
  # }
}

provider "aws" {
  region = var.aws_region
}

# CloudFront용 ACM 인증서는 us-east-1 리전에서만 발급 가능
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# S3 버킷 (정적 웹사이트 호스팅)
resource "aws_s3_bucket" "app" {
  bucket = var.bucket_name
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

  viewer_certificate {
    cloudfront_default_certificate = true
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

# Lambda 함수용 IAM 역할
resource "aws_iam_role" "lambda_role" {
  name = "${var.bucket_name}-lambda-role"

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
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda 함수용 IAM 정책 (Parameter Store 읽기 권한)
resource "aws_iam_role_policy" "lambda_ssm" {
  name = "${var.bucket_name}-lambda-ssm-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/gemini/api_key"
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

# AWS Systems Manager Parameter Store에 Gemini API 키 저장
# terraform.tfvars에서 gemini_api_key를 제공하지 않으면 기존 값을 유지
# 주의: 이미 Parameter Store에 키가 있으면 이 리소스를 import하거나 생략해야 합니다
resource "aws_ssm_parameter" "gemini_api_key" {
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

# Lambda 함수
resource "aws_lambda_function" "gemini_analysis" {
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

# Lambda Function URL (CORS 활성화)
resource "aws_lambda_function_url" "gemini_analysis" {
  function_name      = aws_lambda_function.gemini_analysis.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["POST", "OPTIONS"]
    allow_headers     = ["content-type"]
    expose_headers    = []
    max_age           = 86400
  }
}
