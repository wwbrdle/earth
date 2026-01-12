variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

variable "bucket_name" {
  description = "S3 bucket name"
  type        = string
  default     = "earth-app-prod"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name for CloudFront (e.g., earth-prod.duckdns.org)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for DNS management (optional, if not provided, DNS records must be added manually)"
  type        = string
  default     = ""
}
