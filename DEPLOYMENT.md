# Oracle Cloud 배포 가이드

이 문서는 Earth 앱을 Oracle Cloud 인스턴스에 배포하는 방법을 설명합니다.

## 🚀 1단계: Oracle Cloud 인스턴스 생성

### 1.1 인스턴스 생성
- Oracle Cloud Console에 로그인
- Compute > Instances > Create Instance
- **Image**: Canonical Ubuntu 22.04
- **Shape**: VM.Standard.A1.Flex (1 OCPU, 6GB RAM 권장)
- **Networking**: 기본 VCN 사용 또는 새로 생성
- **Public IP**: Yes

### 1.2 보안 그룹 설정
- **Ingress Rules**:
  - Port 22 (SSH)
  - Port 80 (HTTP)
  - Port 443 (HTTPS)

## 🔧 2단계: 서버 초기 설정

### 2.1 SSH 연결
```bash
ssh ubuntu@YOUR_INSTANCE_IP
```

### 2.2 서버 설정 스크립트 실행
```bash
# 스크립트를 실행 가능하게 만들기
chmod +x setup-server.sh

# 스크립트 실행
./setup-server.sh
```

### 2.3 도메인 설정 (선택사항)
```bash
# nginx.conf 파일 수정
sudo nano /etc/nginx/sites-available/earth

# server_name을 실제 도메인으로 변경
server_name your-domain.com;
```

## 🔑 3단계: GitHub Secrets 설정

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 secrets를 추가하세요:

### 3.1 필수 Secrets
- `ORACLE_HOST`: Oracle Cloud 인스턴스의 공인 IP 주소
- `ORACLE_USERNAME`: SSH 사용자명 (보통 `ubuntu`)
- `ORACLE_SSH_KEY`: SSH 개인키 내용 (전체 내용)
- `ORACLE_PORT`: SSH 포트 (기본값: 22)

### 3.2 SSH 키 생성 및 설정
```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 공개키를 서버에 복사
ssh-copy-id -i ~/.ssh/id_rsa.pub ubuntu@YOUR_INSTANCE_IP

# 개인키 내용을 GitHub Secrets에 추가
cat ~/.ssh/id_rsa
```

## 📦 4단계: 첫 번째 배포

### 4.1 자동 배포
- GitHub 저장소에 코드를 push하면 자동으로 배포됩니다
- `main` 또는 `master` 브랜치에 push할 때마다 배포가 실행됩니다

### 4.2 수동 배포
- GitHub Actions 탭에서 "Deploy to Oracle Cloud" 워크플로우 선택
- "Run workflow" 버튼 클릭

## 🌐 5단계: SSL 인증서 설정 (권장)

### 5.1 Let's Encrypt 인증서 발급
```bash
# 도메인이 설정된 경우
sudo certbot --nginx -d your-domain.com

# IP 주소만 있는 경우 (개발용)
sudo certbot --nginx --agree-tos --no-eff-email --email your-email@example.com
```

### 5.2 자동 갱신 설정
```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# cron 작업 확인
sudo crontab -l
```

## 🔍 6단계: 배포 확인

### 6.1 로그 확인
```bash
# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# GitHub Actions 로그
# GitHub 저장소의 Actions 탭에서 확인
```

### 6.2 앱 접속 테스트
- 브라우저에서 `http://YOUR_INSTANCE_IP` 또는 `https://your-domain.com` 접속
- Earth 앱이 정상적으로 로드되는지 확인

## 🚨 문제 해결

### 6.1 일반적인 문제들
- **권한 오류**: `sudo chown -R www-data:www-data /var/www/earth`
- **Nginx 오류**: `sudo nginx -t`로 설정 파일 문법 확인
- **방화벽 문제**: Oracle Cloud Security Lists에서 포트 허용 확인

### 6.2 로그 확인 명령어
```bash
# 시스템 로그
sudo journalctl -u nginx -f

# 앱 디렉토리 확인
ls -la /var/www/earth/

# Nginx 상태 확인
sudo systemctl status nginx
```

## 📚 추가 리소스

- [Oracle Cloud Documentation](https://docs.oracle.com/en-us/iaas/Content/home.htm)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Let's Encrypt](https://letsencrypt.org/docs/)

## 🆘 지원

문제가 발생하면 다음을 확인하세요:
1. GitHub Actions 로그
2. 서버 로그
3. 방화벽 설정
4. 네트워크 연결
