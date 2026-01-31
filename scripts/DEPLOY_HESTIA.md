# Deployment Guide - HestiaCP

## Overview

This guide is for deploying on a Hostinger VPS with **HestiaCP** control panel.

**Domains:**
- API: https://api.rindra.org
- Dashboard: https://lifestyle.rindra.org

**Directory Structure:**
```
/home/rindra/
├── lifestyle-medicine/        # Git repository (source)
├── web/
│   ├── api.rindra.org/
│   │   └── public_html/       # Laravel API
│   └── lifestyle.rindra.org/
│       └── public_html/       # React Dashboard
└── deploy.sh                  # Deploy script
```

---

## Prerequisites (HestiaCP Panel)

Before running setup, configure these in HestiaCP:

### 1. Create User
- Create user `rindra` in HestiaCP (or use existing)

### 2. Add Domains
- Add domain `api.rindra.org`
- Add domain `lifestyle.rindra.org`

### 3. Configure SSL
- Enable Let's Encrypt SSL for both domains

### 4. Create Database
- Create MySQL database (e.g., `rindra_lifestyle`)
- Create database user with full privileges

### 5. Configure PHP (for api.rindra.org)
- Set PHP version to 8.2 or higher
- Ensure these extensions are enabled:
  - curl, mbstring, xml, zip, bcmath, intl, gd, mysql

### 6. Configure Nginx Template (for api.rindra.org)
In HestiaCP, edit the web domain and add this to **Nginx Proxy Support** or custom template:

```nginx
location / {
    try_files $uri $uri/ /index.php?$query_string;
}
```

---

## Initial Setup

### 1. SSH as your HestiaCP user
```bash
ssh rindra@YOUR_VPS_IP
```

### 2. Upload and run setup script
```bash
# From your local machine
scp scripts/setup-hestia.sh rindra@YOUR_VPS_IP:~/

# On VPS
chmod +x setup-hestia.sh
./setup-hestia.sh
```

### 3. Create Admin User
```bash
cd ~/web/api.rindra.org/public_html
php artisan tinker
```
```php
User::create(['name'=>'Admin', 'email'=>'your@email.com', 'password'=>Hash::make('YourPassword'), 'role'=>'admin', 'is_active'=>true]);
```

### 4. Configure API Keys
```bash
nano ~/web/api.rindra.org/public_html/.env
```
Add:
```
GEMINI_API_KEY=your_key
BIBLE_API_KEY=your_key
```
Then:
```bash
cd ~/web/api.rindra.org/public_html
php artisan config:cache
```

---

## Deploying Updates

### From Windows (Remote Deploy)
```cmd
scripts\remote-deploy-hestia.bat YOUR_VPS_IP           :: Deploy both
scripts\remote-deploy-hestia.bat YOUR_VPS_IP api       :: API only
scripts\remote-deploy-hestia.bat YOUR_VPS_IP frontend  :: Frontend only
```

### From VPS (SSH)
```bash
ssh rindra@YOUR_VPS_IP
./deploy.sh           # Deploy both
./deploy.sh api       # API only
./deploy.sh frontend  # Frontend only
```

---

## What Deploy Does

### Full Deploy (`./deploy.sh`)
1. `git pull` in ~/lifestyle-medicine
2. **API:**
   - composer install
   - rsync files to ~/web/api.rindra.org/public_html/
   - php artisan migrate
   - Clear & rebuild caches
3. **Frontend:**
   - npm ci & build
   - Copy dist/* to ~/web/lifestyle.rindra.org/public_html/

### API Only (`./deploy.sh api`)
- Composer install, sync, migrate, cache

### Frontend Only (`./deploy.sh frontend`)
- npm install, build, copy to public_html

---

## Quick Commands

| Task | Command |
|------|---------|
| SSH to VPS | `ssh rindra@YOUR_VPS_IP` |
| Deploy all | `./deploy.sh` |
| Deploy API | `./deploy.sh api` |
| Deploy frontend | `./deploy.sh frontend` |
| View Laravel logs | `tail -f ~/web/api.rindra.org/public_html/storage/logs/laravel.log` |
| Clear caches | `cd ~/web/api.rindra.org/public_html && php artisan optimize:clear` |
| Tinker | `cd ~/web/api.rindra.org/public_html && php artisan tinker` |

---

## Troubleshooting

### 500 Error on API
```bash
# Check Laravel logs
tail -50 ~/web/api.rindra.org/public_html/storage/logs/laravel.log

# Fix permissions
chmod -R 775 ~/web/api.rindra.org/public_html/storage
chmod -R 775 ~/web/api.rindra.org/public_html/bootstrap/cache
```

### Database Connection Error
```bash
# Verify database credentials
cat ~/web/api.rindra.org/public_html/.env | grep DB_

# Test connection
mysql -u YOUR_DB_USER -p YOUR_DB_NAME
```

### Blank Page on Dashboard
```bash
# Check if build exists
ls -la ~/web/lifestyle.rindra.org/public_html/

# Rebuild if needed
cd ~/lifestyle-medicine/admin-dashboard
npm run build
cp -r dist/* ~/web/lifestyle.rindra.org/public_html/
```

### CORS Errors
Edit `~/web/api.rindra.org/public_html/.env`:
```
CORS_ALLOWED_ORIGINS=https://lifestyle.rindra.org
SANCTUM_STATEFUL_DOMAINS=lifestyle.rindra.org
```
Then: `php artisan config:cache`

### Node.js Not Installed
Ask your hosting provider or run as root:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
```

---

## HestiaCP Nginx Template for Laravel

If Laravel routes don't work, create a custom Nginx template in HestiaCP:

1. SSH as root
2. Copy template:
   ```bash
   cp /usr/local/hestia/data/templates/web/nginx/default.tpl /usr/local/hestia/data/templates/web/nginx/laravel.tpl
   cp /usr/local/hestia/data/templates/web/nginx/default.stpl /usr/local/hestia/data/templates/web/nginx/laravel.stpl
   ```
3. Edit `laravel.tpl` and `laravel.stpl`, find the `location /` block and change to:
   ```nginx
   location / {
       try_files $uri $uri/ /index.php?$query_string;
   }
   ```
4. In HestiaCP panel, edit api.rindra.org and select "laravel" as the Nginx template
