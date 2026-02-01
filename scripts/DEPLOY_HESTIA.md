# Deployment Guide - HestiaCP

## Overview

Deployment for Hostinger VPS with **HestiaCP** control panel.

**Domains:**
- API: https://api.rindra.org
- Dashboard: https://lifestyle.rindra.org

**Directory Structure:**
```
/home/rindra/web/
├── lifestyle-medicine/              # Git repository
├── api.rindra.org/
│   ├── app/                         # Laravel application
│   │   ├── vendor/
│   │   ├── storage/
│   │   ├── .env
│   │   └── ...
│   └── public_html/                 # Laravel's public folder (web root)
│       └── index.php                # Points to ../app/
└── lifestyle.rindra.org/
    └── public_html/                 # React build
```

---

## Prerequisites (HestiaCP Panel)

Before running setup, configure these in HestiaCP:

### 1. Create User
- Create user `rindra` in HestiaCP

### 2. Add Domains
- Add domain `api.rindra.org` with **PHP 8.4**
- Add domain `lifestyle.rindra.org`

### 3. Enable SSL
- Enable Let's Encrypt SSL for both domains

### 4. Create Database
- Create MySQL database (e.g., `rindra_lifestyle_medicine`)
- Create database user with full privileges

---

## Initial Setup

### 1. SSH as root and clone the repository
```bash
ssh root@YOUR_VPS_IP
cd /home/rindra/web
git clone YOUR_REPO_URL lifestyle-medicine
```

### 2. Run setup script
```bash
cd lifestyle-medicine
./scripts/setup-hestia.sh
```

The script will:
- Install Composer dependencies
- Configure `.env` for production
- Deploy Laravel to `api.rindra.org/app/`
- Update `index.php` paths
- Configure PHP-FPM `open_basedir`
- Build and deploy React frontend
- Configure SPA routing

### 3. Create Admin User
```bash
cd /home/rindra/web/api.rindra.org/app
php artisan tinker
```
```php
User::create(['name'=>'Admin', 'email'=>'your@email.com', 'password'=>Hash::make('YourPassword'), 'role'=>'admin', 'is_active'=>true]);
```

### 4. Configure API Keys
```bash
nano /home/rindra/web/api.rindra.org/app/.env
```
Add:
```
GEMINI_API_KEY=your_key
BIBLE_API_KEY=your_key
```
Then:
```bash
php artisan config:cache
```

---

## Deploying Updates

### From Windows
```cmd
scripts\remote-deploy-hestia.bat YOUR_VPS_IP           :: Deploy both
scripts\remote-deploy-hestia.bat YOUR_VPS_IP api       :: API only
scripts\remote-deploy-hestia.bat YOUR_VPS_IP frontend  :: Frontend only
```

### From VPS
```bash
ssh root@YOUR_VPS_IP
cd /home/rindra/web/lifestyle-medicine
./scripts/deploy-hestia.sh           # Deploy both
./scripts/deploy-hestia.sh api       # API only
./scripts/deploy-hestia.sh frontend  # Frontend only
```

---

## What Deploy Does

### Full Deploy (`./scripts/deploy-hestia.sh`)
1. `git pull` latest code
2. **API:**
   - Composer install
   - Rsync to `api.rindra.org/app/`
   - Update `public_html/index.php` paths
   - Run migrations
   - Cache config/routes
3. **Frontend:**
   - npm install & build
   - Copy to `lifestyle.rindra.org/public_html/`

---

## Quick Commands

| Task | Command |
|------|---------|
| SSH to VPS | `ssh root@YOUR_VPS_IP` |
| Go to repo | `cd /home/rindra/web/lifestyle-medicine` |
| Deploy all | `./scripts/deploy-hestia.sh` |
| Deploy API | `./scripts/deploy-hestia.sh api` |
| Deploy frontend | `./scripts/deploy-hestia.sh frontend` |
| Laravel logs | `tail -f /home/rindra/web/api.rindra.org/app/storage/logs/laravel.log` |
| Clear caches | `cd /home/rindra/web/api.rindra.org/app && php artisan optimize:clear` |
| Tinker | `cd /home/rindra/web/api.rindra.org/app && php artisan tinker` |

---

## Troubleshooting

### 500 Internal Server Error
```bash
# Check Laravel logs
tail -50 /home/rindra/web/api.rindra.org/app/storage/logs/laravel.log

# Check Apache logs
tail -50 /var/log/apache2/domains/api.rindra.org.error.log
```

### open_basedir Restriction
```bash
# Edit PHP-FPM config
nano /etc/php/8.4/fpm/pool.d/api.rindra.org.conf

# Add /home/rindra/web/api.rindra.org/app to open_basedir
# Then restart PHP-FPM
systemctl restart php8.4-fpm
```

### Permission Issues
```bash
chown -R rindra:www-data /home/rindra/web/api.rindra.org
chmod -R 775 /home/rindra/web/api.rindra.org/app/storage
chmod -R 775 /home/rindra/web/api.rindra.org/app/bootstrap/cache
```

### CORS Errors
Laravel handles CORS. Check `.env`:
```
CORS_ALLOWED_ORIGINS=https://lifestyle.rindra.org
SANCTUM_STATEFUL_DOMAINS=lifestyle.rindra.org
```
Then: `php artisan config:cache`

### SPA 404 on Refresh
```bash
# Check SPA config exists
cat /home/rindra/conf/web/lifestyle.rindra.org/nginx.ssl.conf_spa

# Should contain:
# error_page 404 /index.html;
```

### Database Connection Error
```bash
cat /home/rindra/web/api.rindra.org/app/.env | grep DB_
php artisan config:clear
```
