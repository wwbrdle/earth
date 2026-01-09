#!/bin/bash

# Oracle Cloud 인스턴스 초기 설정 스크립트
# Ubuntu 20.04/22.04 기준

echo "🚀 Oracle Cloud 인스턴스 설정을 시작합니다..."

# 시스템 업데이트
echo "📦 시스템 업데이트 중..."
sudo apt update && sudo apt upgrade -y

# 필수 패키지 설치
echo "🔧 필수 패키지 설치 중..."
sudo apt install -y nginx curl wget git unzip

# Node.js 18.x 설치
echo "📱 Node.js 18.x 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginx 설정
echo "🌐 Nginx 설정 중..."
sudo mkdir -p /var/www/earth/build
sudo chown -R $USER:$USER /var/www/earth

# Nginx 설정 파일 복사
sudo cp nginx.conf /etc/nginx/sites-available/earth
sudo ln -sf /etc/nginx/sites-available/earth /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 방화벽 설정 (Oracle Cloud Security Lists에서도 설정 필요)
echo "🔥 방화벽 설정 중..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

# SSL 인증서 설정 (Let's Encrypt)
echo "🔒 SSL 인증서 설정 중..."
sudo apt install -y certbot python3-certbot-nginx

echo "✅ 서버 설정이 완료되었습니다!"
echo "📝 다음 단계:"
echo "1. 도메인을 설정하고 nginx.conf의 server_name을 변경하세요"
echo "2. GitHub Secrets를 설정하세요"
echo "3. 첫 번째 배포를 실행하세요"
