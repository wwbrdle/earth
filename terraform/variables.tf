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
