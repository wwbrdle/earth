# Terraform으로 AWS 인프라 구성

이 디렉토리는 Terraform을 사용하여 AWS S3 + CloudFront 인프라를 구성합니다.

## 📋 사전 요구사항

- Terraform >= 1.0
- AWS CLI 설치 및 구성
- AWS 자격 증명 설정

## 🚀 사용 방법

### 1. 변수 파일 생성

```bash
cp terraform.tfvars.example terraform.tfvars
```

`terraform.tfvars` 파일을 열어서 필요한 값들을 수정하세요:

```hcl
aws_region   = "ap-northeast-2"
bucket_name = "earth-app-prod"
environment  = "production"
```

### 2. Terraform 초기화

```bash
cd terraform
terraform init
```

### 3. 계획 확인

```bash
terraform plan
```

### 4. 인프라 생성

```bash
terraform apply
```

확인 메시지가 나오면 `yes`를 입력하세요.

### 5. 출력 값 확인

```bash
terraform output
```

다음 정보가 출력됩니다:
- `s3_bucket_name`: S3 버킷 이름
- `cloudfront_distribution_id`: CloudFront 배포 ID
- `cloudfront_domain_name`: CloudFront 도메인 이름
- `website_url`: 웹사이트 URL

## 🔧 주요 리소스

- **S3 버킷**: 정적 파일 호스팅
- **CloudFront 배포**: HTTPS + CDN
- **Origin Access Control**: S3와 CloudFront 간 보안 연결

## 🗑️ 인프라 삭제

```bash
terraform destroy
```

## 📝 참고사항

- Terraform 상태 파일(`.tfstate`)은 버전 관리에 포함하지 마세요
- 프로덕션 환경에서는 Terraform 상태를 S3나 Terraform Cloud에 저장하는 것을 권장합니다
- CloudFront 배포 생성에는 5-10분이 소요될 수 있습니다

## 🔐 상태 파일 관리 (선택사항)

프로덕션 환경에서는 Terraform 상태를 원격으로 저장하는 것이 좋습니다:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "earth-app/terraform.tfstate"
    region = "ap-northeast-2"
  }
}
```
