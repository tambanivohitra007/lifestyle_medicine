# Production Deployment Guide

This guide covers deploying the Lifestyle Medicine application to production.

## Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0+ or PostgreSQL 14+
- Web server (Nginx recommended)
- SSL certificate

## Pre-Deployment Checklist

### 1. Environment Configuration

#### Backend (.env)

Copy `.env.example` to `.env` and configure:

```bash
# Application
APP_NAME="Lifestyle Medicine"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.your-domain.com

# Frontend URL
FRONTEND_URL=https://admin.your-domain.com

# Logging
LOG_LEVEL=warning

# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=lifestyle_medicine
DB_USERNAME=your-secure-username
DB_PASSWORD=your-strong-password

# Session
SESSION_DOMAIN=.your-domain.com

# CORS & Sanctum
CORS_ALLOWED_ORIGINS=https://admin.your-domain.com
SANCTUM_STATEFUL_DOMAINS=admin.your-domain.com,your-domain.com

# External APIs (get new keys for production)
GEMINI_API_KEY=your-production-gemini-key
BIBLE_API_KEY=your-production-bible-key
BIBLE_API_DEFAULT_ID=de4e12af7f28f599-02
```

#### Frontend (admin-dashboard/.env)

```bash
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
```

### 2. Security Checklist

- [ ] Generate new `APP_KEY`: `php artisan key:generate`
- [ ] Rotate all API keys (Gemini, Bible API)
- [ ] Use strong database credentials
- [ ] Set `APP_DEBUG=false`
- [ ] Set `APP_ENV=production`
- [ ] Configure HTTPS
- [ ] Set proper CORS origins
- [ ] Review file permissions

## Deployment Steps

### Backend (Laravel)

```bash
# 1. Install dependencies
composer install --optimize-autoloader --no-dev

# 2. Generate application key (first time only)
php artisan key:generate

# 3. Run migrations
php artisan migrate --force

# 4. Optimize for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 5. Create storage symlink
php artisan storage:link

# 6. Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Frontend (React Admin Dashboard)

```bash
cd admin-dashboard

# 1. Install dependencies
npm ci

# 2. Create production .env
echo "VITE_API_BASE_URL=https://api.your-domain.com/api/v1" > .env

# 3. Build for production
npm run build

# 4. Deploy dist/ folder to web server
```

## Nginx Configuration

### Backend API

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    root /var/www/lifestyle-medicine/public;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

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
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Frontend Admin Dashboard

```nginx
server {
    listen 443 ssl http2;
    server_name admin.your-domain.com;
    root /var/www/admin-dashboard/dist;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Post-Deployment Verification

1. **API Health Check**
   ```bash
   curl https://api.your-domain.com/up
   ```

2. **Test Authentication**
   - Navigate to admin dashboard
   - Attempt login
   - Verify token-based authentication works

3. **Test External APIs**
   - Verify Bible API integration
   - Verify Gemini AI integration

4. **Check Error Logs**
   ```bash
   tail -f storage/logs/laravel.log
   ```

## Maintenance Commands

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Re-cache after config changes
php artisan config:cache
php artisan route:cache

# Run database migrations
php artisan migrate --force

# View logs
tail -f storage/logs/laravel.log
```

## Troubleshooting

### CORS Issues
- Verify `CORS_ALLOWED_ORIGINS` matches your frontend domain exactly
- Check `SANCTUM_STATEFUL_DOMAINS` includes your domains
- Ensure cookies are set with proper domain

### 500 Errors
- Check `storage/logs/laravel.log`
- Verify file permissions on `storage/` and `bootstrap/cache/`
- Ensure `APP_DEBUG=false` but `LOG_LEVEL` allows error logging

### API Connection Issues
- Verify `VITE_API_BASE_URL` in frontend `.env`
- Check SSL certificates are valid
- Test API endpoint directly with curl

## Backup Strategy

```bash
# Database backup
mysqldump -u username -p lifestyle_medicine > backup_$(date +%Y%m%d).sql

# Files backup
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/app
```
