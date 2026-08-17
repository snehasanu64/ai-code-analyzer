#!/bin/bash
# AWS EC2 Automated Deployment Script for AI Code Analyzer
echo "🚀 Starting AI Code Analyzer AWS Deployment..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20 LTS & Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git

# 3. Install PM2 globally
sudo npm install -g pm2

# 4. Install backend & frontend dependencies and build static React assets
npm run build

# 5. Start backend via PM2 and configure auto-restart on system reboot
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu || true

# 6. Configure Nginx Reverse Proxy (Port 80 -> Port 5000)
sudo cat << 'EOF' > /etc/nginx/sites-available/ai-code-analyzer
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 7. Enable Nginx site and reload
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/ai-code-analyzer /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ AWS EC2 Deployment Complete! Application is running live on Port 80."
