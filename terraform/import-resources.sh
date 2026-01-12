#!/bin/bash
# 기존 리소스를 Terraform state에 import하는 스크립트

set -e

echo "=== Terraform State Import Script ==="
echo "이 스크립트는 기존 AWS 리소스를 Terraform state에 import합니다."
echo ""

cd "$(dirname "$0")"

# Terraform init
echo "1. Terraform 초기화..."
terraform init -migrate-state

BUCKET_NAME="earth-app-prod"

# S3 버킷 import
echo ""
echo "2. S3 버킷 import..."
terraform import aws_s3_bucket.app $BUCKET_NAME || echo "  (이미 state에 있거나 실패)"
terraform import aws_s3_bucket_public_access_block.app $BUCKET_NAME || echo "  (이미 state에 있거나 실패)"
terraform import aws_s3_bucket_policy.app $BUCKET_NAME || echo "  (이미 state에 있거나 실패)"
terraform import aws_s3_bucket_website_configuration.app $BUCKET_NAME || echo "  (이미 state에 있거나 실패)"

# CloudFront OAC import
echo ""
echo "3. CloudFront OAC import..."
OAC_ID=$(aws cloudfront list-origin-access-controls --query 'OriginAccessControlList.Items[?Name==`earth-app-prod-oac`].Id' --output text 2>/dev/null | head -1)
if [ ! -z "$OAC_ID" ] && [ "$OAC_ID" != "None" ] && [ "$OAC_ID" != "" ]; then
  echo "  OAC ID: $OAC_ID"
  terraform import aws_cloudfront_origin_access_control.app $OAC_ID || echo "  (이미 state에 있거나 실패)"
else
  echo "  CloudFront OAC를 찾을 수 없습니다."
fi

# IAM Role import
echo ""
echo "4. IAM Role import..."
terraform import aws_iam_role.lambda_role earth-app-prod-lambda-role || echo "  (이미 state에 있거나 실패)"
terraform import aws_iam_role_policy.lambda_ssm earth-app-prod-lambda-role:earth-app-prod-lambda-ssm-policy || echo "  (이미 state에 있거나 실패)"
terraform import aws_iam_role_policy_attachment.lambda_basic earth-app-prod-lambda-role/arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole || echo "  (이미 state에 있거나 실패)"

# State refresh
echo ""
echo "5. State 새로고침..."
terraform refresh

echo ""
echo "=== Import 완료 ==="
echo "이제 terraform plan을 실행하여 변경사항을 확인하세요."
