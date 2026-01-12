output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.app.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.app.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.app.domain_name
}

output "cloudfront_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.app.arn
}

output "website_url" {
  description = "Website URL"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.app.domain_name}"
}

output "custom_domain_name" {
  description = "Custom domain name (if configured)"
  value       = var.domain_name != "" ? var.domain_name : null
}

output "lambda_function_url" {
  description = "Lambda Function URL for Gemini API"
  value       = aws_lambda_function_url.gemini_analysis.function_url
}

output "acm_certificate_arn" {
  description = "ACM Certificate ARN (for CloudFront)"
  value       = var.domain_name != "" ? aws_acm_certificate.cloudfront[0].arn : null
}

output "acm_certificate_dns_validation" {
  description = "DNS validation records for ACM certificate. Add these to your DNS provider if not using Route 53"
  value = var.domain_name != "" && var.route53_zone_id == "" ? [
    for record in aws_acm_certificate.cloudfront[0].domain_validation_options : {
      name   = record.resource_record_name
      type   = record.resource_record_type
      value  = record.resource_record_value
    }
  ] : []
}

output "route53_zone_needed" {
  description = "If Route 53 zone ID is not provided, you need to manually add DNS validation records"
  value       = var.domain_name != "" && var.route53_zone_id == "" ? "Please add DNS validation records manually or provide route53_zone_id" : null
}
