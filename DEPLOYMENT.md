# 🚀 배포 가이드

이 문서는 Earth 앱을 AWS에 배포하는 방법을 설명합니다.

## 📋 배포 전 준비사항

### 1. AWS 계정 설정

1. **AWS 계정 생성** (없는 경우)
   - [AWS 콘솔](https://console.aws.amazon.com/)에서 계정 생성

2. **AWS CLI 설치 및 구성**
   ```bash
   # AWS CLI 설치 (macOS)
   brew install awscli
   
   # AWS 자격 증명 설정
   aws configure
   # AWS Access Key ID 입력
   # AWS Secret Access Key 입력
   # Default region: ap-northeast-2
   # Default output format: json
   ```

3. **IAM 사용자 생성** (GitHub Actions용)
   - AWS 콘솔 → IAM → 사용자 → 사용자 추가
   - 권한: `AmazonS3FullAccess`, `CloudFrontFullAccess`, `LambdaFullAccess`, `IAMFullAccess`, `SSMFullAccess`
   - 액세스 키 생성 및 저장

### 2. Google Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성
3. API 키 복사 및 안전하게 보관

### 3. Terraform 변수 설정

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` 파일 편집:
```hcl
aws_region   = "ap-northeast-2"
bucket_name  = "earth-app-prod"  # 고유한 버킷 이름으로 변경
environment  = "production"
gemini_api_key = "your-gemini-api-key-here"  # 실제 Gemini API 키 입력
```

### 4. GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret

다음 secrets 추가:
- `AWS_ACCESS_KEY_ID`: AWS IAM 사용자의 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY`: AWS IAM 사용자의 시크릿 액세스 키

## 🚀 배포 방법

### 방법 1: GitHub Actions 자동 배포 (권장)

가장 간단한 방법입니다. 코드를 푸시하면 자동으로 배포됩니다.

1. **코드 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push origin prod  # prod 브랜치에만 배포됩니다
   ```
   
   **참고**: `prod` 브랜치가 없으면 먼저 생성하세요:
   ```bash
   git checkout -b prod
   git push -u origin prod
   ```

2. **GitHub Actions 확인**
   - GitHub 저장소 → Actions 탭
   - 배포 워크플로우 실행 확인
   - 완료되면 웹사이트 URL 확인

3. **배포 완료 확인**
   - GitHub Actions 로그에서 `website_url` 확인
   - 또는 Terraform outputs에서 확인:
     ```bash
     cd terraform
     terraform output website_url
     ```

### 방법 2: 수동 배포

#### 2-1. 인프라 배포 (Terraform)

```bash
cd terraform

# Terraform 초기화
terraform init

# 배포 계획 확인
terraform plan

# 인프라 배포
terraform apply
```

배포되는 리소스:
- S3 버킷 (정적 웹사이트 호스팅)
- CloudFront 배포 (CDN, HTTPS)
- Lambda 함수 (Gemini API 호출)
- API Gateway (Lambda 함수 URL)
- Parameter Store (Gemini API 키 저장)

#### 2-2. Lambda 함수 배포

```bash
# Lambda 함수 패키징
cd lambda/gemini-analysis
npm install --production
zip -r ../../terraform/lambda-function.zip . -x "*.git*" "*.md" "README*"

# Terraform으로 Lambda 함수 업데이트
cd ../../terraform
terraform apply
```

#### 2-3. 프론트엔드 배포

```bash
# 프로젝트 루트로 이동
cd ..

# 의존성 설치
npm install

# Lambda 함수 URL 가져오기
cd terraform
LAMBDA_URL=$(terraform output -raw lambda_function_url)
cd ..

# 빌드 (Lambda URL 환경 변수 포함)
REACT_APP_LAMBDA_FUNCTION_URL=$LAMBDA_URL npm run build

# S3 버킷 이름 가져오기
BUCKET_NAME=$(cd terraform && terraform output -raw s3_bucket_name)

# S3에 배포
aws s3 sync build/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html"

aws s3 sync build/ s3://$BUCKET_NAME \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html"

# CloudFront 캐시 무효화
DISTRIBUTION_ID=$(cd terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"
```

## 🔍 배포 확인

### 1. 웹사이트 접속
```bash
cd terraform
terraform output website_url
```
출력된 URL로 접속하여 앱이 정상 작동하는지 확인

### 2. Lambda 함수 테스트
```bash
LAMBDA_URL=$(cd terraform && terraform output -raw lambda_function_url)
curl -X POST $LAMBDA_URL \
  -H "Content-Type: application/json" \
  -d '{
    "userAnswer": "I like watching documentaries.",
    "sampleAnswer": "I enjoy watching nature documentaries because they are educational.",
    "question": "What kind of TV programs do you like?",
    "analysisType": "similarity"
  }'
```

### 3. CloudFront 배포 상태 확인
```bash
DISTRIBUTION_ID=$(cd terraform && terraform output -raw cloudfront_distribution_id)
aws cloudfront get-distribution --id $DISTRIBUTION_ID
```

## 🔄 업데이트 배포

### 코드 변경 후 재배포

1. **자동 배포 (GitHub Actions)**
   ```bash
   git add .
   git commit -m "Update features"
   git push origin main
   ```

2. **수동 배포**
   ```bash
   # 프론트엔드만 업데이트
   npm run build
   aws s3 sync build/ s3://$(cd terraform && terraform output -raw s3_bucket_name) --delete
   
   # CloudFront 캐시 무효화
   aws cloudfront create-invalidation \
     --distribution-id $(cd terraform && terraform output -raw cloudfront_distribution_id) \
     --paths "/*"
   ```

### Lambda 함수만 업데이트

```bash
cd lambda/gemini-analysis
npm install --production
zip -r ../../terraform/lambda-function.zip . -x "*.git*" "*.md" "README*"
cd ../../terraform
terraform apply
```

## 🗑️ 인프라 삭제

⚠️ **주의**: 모든 리소스가 삭제됩니다!

```bash
cd terraform
terraform destroy
```

## 📝 주요 Terraform Outputs

```bash
cd terraform
terraform output
```

출력되는 값:
- `website_url`: CloudFront 배포 URL
- `s3_bucket_name`: S3 버킷 이름
- `cloudfront_distribution_id`: CloudFront 배포 ID
- `lambda_function_url`: Lambda 함수 URL

## 🐛 문제 해결

### 배포 실패 시

1. **Terraform 오류**
   ```bash
   cd terraform
   terraform plan  # 계획 확인
   terraform validate  # 설정 검증
   ```

2. **S3 업로드 실패**
   - AWS 자격 증명 확인: `aws sts get-caller-identity`
   - 버킷 권한 확인

3. **Lambda 함수 오류**
   - CloudWatch Logs 확인
   - Lambda 함수 테스트 실행

4. **CloudFront 캐시 문제**
   - 캐시 무효화 실행
   - 브라우저 캐시 삭제

## 📚 추가 리소스

- [Terraform AWS Provider 문서](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS S3 정적 웹사이트 호스팅](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront 문서](https://docs.aws.amazon.com/cloudfront/)
- [AWS Lambda 문서](https://docs.aws.amazon.com/lambda/)
