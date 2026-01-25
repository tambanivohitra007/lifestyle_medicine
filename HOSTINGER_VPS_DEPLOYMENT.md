# Hostinger VPS Deployment Guide

> **Application:** Lifestyle Medicine Platform (Laravel API + React Admin Dashboard)
> **Target:** Hostinger VPS (Ubuntu 22.04/24.04)

---

## Table of Contents
1. [Initial VPS Setup](#1-initial-vps-setup)
2. [Install Required Software](#2-install-required-software)
3. [Configure MySQL Database](#3-configure-mysql-database)
4. [Deploy Laravel Backend](#4-deploy-laravel-backend)
5. [Build & Deploy React Frontend](#5-build--deploy-react-frontend)
6. [Configure Nginx](#6-configure-nginx)
7. [SSL Certificate Setup](#7-ssl-certificate-setup)
8. [Final Configuration](#8-final-configuration)
9. [Maintenance Commands](#9-maintenance-commands)

---

## Prerequisites

- Hostinger VPS with Ubuntu 22.04 or 24.04
- Domain name pointed to your VPS IP (e.g., `api.yourdomain.com` and `admin.yourdomain.com`)
- SSH access to your VPS
- Local machine with the project code

---

## 1. Initial VPS Setup

### 1.1 Connect to Your VPS
```bash
ssh root@YOUR_VPS_IP
```

### 1.2 Update System
```bash
apt update && apt upgrade -y
```

### 1.3 Create a Deploy User (Recommended)
```bash
# Create user
adduser deploy
usermod -aG sudo deploy

# Set up SSH key for deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Switch to deploy user for remaining steps
su - deploy
```

### 1.4 Configure Firewall
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 2. Install Required Software

### 2.1 Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.2 Install PHP 8.2 and Extensions
```bash
# Add PHP repository
sudo apt install software-properties-common -y
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP and required extensions
sudo apt install php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
    php8.2-xml php8.2-curl php8.2-gd php8.2-mbstring php8.2-zip \
    php8.2-bcmath php8.2-intl php8.2-readline php8.2-sqlite3 -y

# Verify installation
php -v
```

### 2.3 Install MySQL 8.0
```bash
sudo apt install mysql-server -y
sudo systemctl enable mysql
sudo systemctl start mysql

# Secure MySQL installation
sudo mysql_secure_installation
# Answer: Y, set root password, Y, Y, Y, Y
```

### 2.4 Install Composer
```bash
cd ~
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### 2.5 Install Node.js 20.x (for building React)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
node -v
npm -v
```

### 2.6 Install Git
```bash
sudo apt install git -y
```

---

## 3. Configure MySQL Database

### 3.1 Create Database and User
```bash
sudo mysql -u root -p
```

```sql
-- Create database
CREATE DATABASE lifestyle_medicine CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with strong password
CREATE USER 'lifestyle_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON lifestyle_medicine.* TO 'lifestyle_user'@'localhost';
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
EXIT;
```

---

## 4. Deploy Laravel Backend

### 4.1 Create Application Directory
```bash
sudo mkdir -p /var/www/lifestyle-medicine
sudo chown -R deploy:deploy /var/www/lifestyle-medicine
cd /var/www/lifestyle-medicine
```

### 4.2 Clone Repository
```bash
# Using HTTPS
git clone https://github.com/YOUR_USERNAME/lifestyle_medicine.git .

# OR using SSH (requires SSH key setup)
git clone git@github.com:YOUR_USERNAME/lifestyle_medicine.git .
```

### 4.3 Install PHP Dependencies
```bash
cd /var/www/lifestyle-medicine
composer install --optimize-autoloader --no-dev
```

### 4.4 Configure Environment
```bash
# Copy environment file
cp .env.example .env

# Edit environment file
nano .env
```

**Update these values in `.env`:**
```bash
APP_NAME="Lifestyle Medicine"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lifestyle_medicine
DB_USERNAME=lifestyle_user
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Session & Cache
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

# CORS - Your admin dashboard domain
CORS_ALLOWED_ORIGINS=https://admin.yourdomain.com
SANCTUM_STATEFUL_DOMAINS=admin.yourdomain.com

# API Keys
GEMINI_API_KEY=your_gemini_api_key
GEMINI_VERIFY_SSL=true
BIBLE_API_KEY=your_bible_api_key
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

### 4.5 Generate Application Key
```bash
php artisan key:generate
```

### 4.6 Run Migrations
```bash
php artisan migrate --force
```

### 4.7 Create Storage Link
```bash
php artisan storage:link
```

### 4.8 Optimize for Production
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

### 4.9 Set Permissions
```bash
sudo chown -R deploy:www-data /var/www/lifestyle-medicine
sudo chmod -R 755 /var/www/lifestyle-medicine
sudo chmod -R 775 /var/www/lifestyle-medicine/storage
sudo chmod -R 775 /var/www/lifestyle-medicine/bootstrap/cache
```

### 4.10 Create Admin User
```bash
php artisan tinker
```

```php
use App\Models\User;
use Illuminate\Support\Facades\Hash;

User::create([
    'name' => 'Admin',
    'email' => 'admin@yourdomain.com',
    'password' => Hash::make('YourSecurePassword123!'),
    'role' => 'admin',
    'is_active' => true,
]);

exit
```

---

## 5. Build & Deploy React Frontend

### 5.1 Build on Local Machine (Recommended)

On your **local Windows machine**:
```bash
cd C:\Users\rindra\Projects\lifestyle_medicine\admin-dashboard

# Create production environment file
echo "VITE_API_BASE_URL=https://api.yourdomain.com/api/v1" > .env.production

# Install dependencies and build
npm ci
npm run build
```

### 5.2 Upload Build to VPS

**Option A: Using SCP**
```bash
# From your local machine (PowerShell/CMD)
scp -r admin-dashboard/dist/* deploy@YOUR_VPS_IP:/var/www/lifestyle-medicine/public/admin/
```

**Option B: Using FileZilla**
1. Connect to VPS via SFTP
2. Upload contents of `admin-dashboard/dist/` to `/var/www/lifestyle-medicine/public/admin/`

### 5.3 Alternative: Build on VPS
```bash
cd /var/www/lifestyle-medicine/admin-dashboard

# Create production env
echo "VITE_API_BASE_URL=https://api.yourdomain.com/api/v1" > .env.production

# Install and build
npm ci
npm run build

# Move build to public folder
mkdir -p /var/www/lifestyle-medicine/public/admin
cp -r dist/* /var/www/lifestyle-medicine/public/admin/
```

---

## 6. Configure Nginx

### 6.1 Create API Configuration
```bash
sudo nano /etc/nginx/sites-available/lifestyle-api
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    root /var/www/lifestyle-medicine/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    index index.php;

    charset utf-8;

    # API routes
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Increase upload size for imports
    client_max_body_size 20M;
}
```

### 6.2 Create Admin Dashboard Configuration
```bash
sudo nano /etc/nginx/sites-available/lifestyle-admin
```

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /var/www/lifestyle-medicine/public/admin;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.html;

    charset utf-8;

    # React SPA - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
}
```

### 6.3 Enable Sites
```bash
sudo ln -s /etc/nginx/sites-available/lifestyle-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/lifestyle-admin /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 7. SSL Certificate Setup

### 7.1 Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 7.2 Obtain SSL Certificates
```bash
# For API domain
sudo certbot --nginx -d api.yourdomain.com

# For Admin domain
sudo certbot --nginx -d admin.yourdomain.com
```

Follow the prompts:
- Enter email address
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 7.3 Verify Auto-Renewal
```bash
sudo certbot renew --dry-run
```

### 7.4 Set Up Auto-Renewal Cron
```bash
sudo crontab -e
```

Add this line:
```
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 8. Final Configuration

### 8.1 Configure PHP-FPM
```bash
sudo nano /etc/php/8.2/fpm/pool.d/www.conf
```

Find and update:
```ini
user = deploy
group = www-data
listen.owner = deploy
listen.group = www-data
```

Restart PHP-FPM:
```bash
sudo systemctl restart php8.2-fpm
```

### 8.2 Set Up Log Rotation
```bash
sudo nano /etc/logrotate.d/lifestyle-medicine
```

```
/var/www/lifestyle-medicine/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy www-data
    sharedscripts
    postrotate
        systemctl reload php8.2-fpm
    endscript
}
```

### 8.3 Create Deployment Script
```bash
nano /var/www/lifestyle-medicine/deploy.sh
```

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

cd /var/www/lifestyle-medicine

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev

echo "🗃️ Running migrations..."
php artisan migrate --force

echo "🧹 Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "🔄 Restarting PHP-FPM..."
sudo systemctl restart php8.2-fpm

echo "✅ Deployment complete!"
```

```bash
chmod +x /var/www/lifestyle-medicine/deploy.sh
```

### 8.4 Verify Deployment

Test the API:
```bash
curl -I https://api.yourdomain.com/up
# Should return HTTP/2 200
```

Test the Admin Dashboard:
- Open `https://admin.yourdomain.com` in browser
- Login with the admin credentials you created

---

## 9. Maintenance Commands

### Daily Operations

```bash
# View Laravel logs
tail -f /var/www/lifestyle-medicine/storage/logs/laravel.log

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -h
```

### Deployment Updates

```bash
# Quick deploy (after pushing changes to git)
cd /var/www/lifestyle-medicine && ./deploy.sh

# Manual deploy steps
cd /var/www/lifestyle-medicine
git pull origin main
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo systemctl restart php8.2-fpm
```

### Rebuild React Frontend

```bash
# On local machine, build and upload:
cd admin-dashboard
npm run build
scp -r dist/* deploy@YOUR_VPS_IP:/var/www/lifestyle-medicine/public/admin/
```

### Database Operations

```bash
# Backup database
mysqldump -u lifestyle_user -p lifestyle_medicine > backup_$(date +%Y%m%d).sql

# Restore database
mysql -u lifestyle_user -p lifestyle_medicine < backup_file.sql

# Access MySQL
mysql -u lifestyle_user -p lifestyle_medicine
```

### Service Management

```bash
# Restart services
sudo systemctl restart nginx
sudo systemctl restart php8.2-fpm
sudo systemctl restart mysql

# Check service status
sudo systemctl status nginx
sudo systemctl status php8.2-fpm
sudo systemctl status mysql
```

### Clear All Caches

```bash
cd /var/www/lifestyle-medicine
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Troubleshooting

### 502 Bad Gateway
```bash
# Check PHP-FPM is running
sudo systemctl status php8.2-fpm

# Check PHP-FPM socket
ls -la /var/run/php/php8.2-fpm.sock

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm
```

### Permission Denied Errors
```bash
sudo chown -R deploy:www-data /var/www/lifestyle-medicine
sudo chmod -R 775 /var/www/lifestyle-medicine/storage
sudo chmod -R 775 /var/www/lifestyle-medicine/bootstrap/cache
```

### Database Connection Error
```bash
# Test MySQL connection
mysql -u lifestyle_user -p -e "SELECT 1"

# Check .env database settings
cat /var/www/lifestyle-medicine/.env | grep DB_
```

### CORS Errors
```bash
# Check CORS settings in .env
cat /var/www/lifestyle-medicine/.env | grep CORS

# Clear config cache after changes
php artisan config:cache
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Check Nginx SSL config
sudo nginx -t
```

---

## Security Checklist

- [ ] APP_DEBUG=false in production
- [ ] Strong database password
- [ ] Strong admin user password
- [ ] SSL certificates installed
- [ ] Firewall configured (UFW)
- [ ] Regular backups scheduled
- [ ] Log rotation configured
- [ ] PHP expose_php = Off
- [ ] Nginx server_tokens off

---

## Quick Reference

| Service | Command |
|---------|---------|
| API URL | https://api.yourdomain.com |
| Admin URL | https://admin.yourdomain.com |
| App Directory | /var/www/lifestyle-medicine |
| Nginx Config | /etc/nginx/sites-available/ |
| PHP Config | /etc/php/8.2/fpm/ |
| Laravel Logs | /var/www/lifestyle-medicine/storage/logs/ |
| Deploy Script | /var/www/lifestyle-medicine/deploy.sh |

---

**Document Created:** January 25, 2026
**For:** Hostinger VPS Ubuntu 22.04/24.04
