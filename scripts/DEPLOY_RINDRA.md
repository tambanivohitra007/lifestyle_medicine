# Deployment Guide for rindra.org

## Domains
- **API**: https://api.rindra.org
- **Admin Dashboard**: https://lifestyle.rindra.org

---

## Initial Setup (One Time)

### 1. Point DNS Records
In your domain registrar, create A records:
```
api.rindra.org       → YOUR_VPS_IP
lifestyle.rindra.org → YOUR_VPS_IP
```

### 2. Upload and Run Setup Script
```bash
# From your local machine
scp scripts/vps-setup-rindra.sh root@YOUR_VPS_IP:~/

# On VPS
ssh root@YOUR_VPS_IP
chmod +x vps-setup-rindra.sh
./vps-setup-rindra.sh
```

### 3. Create Admin User (On VPS)
```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/lifestyle-medicine
php artisan tinker
```
```php
User::create(['name'=>'Admin', 'email'=>'your@email.com', 'password'=>Hash::make('YourPassword'), 'role'=>'admin', 'is_active'=>true]);
```

### 4. Configure API Keys (On VPS)
```bash
nano /var/www/lifestyle-medicine/.env
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

After making changes and pushing to git:

### Full Deploy (API + Frontend)
```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/lifestyle-medicine
./deploy.sh
```

### API Only
```bash
./deploy.sh api
```

### Frontend Only
```bash
./deploy.sh frontend
```

---

## What the Deploy Script Does

### API Deploy (`./deploy.sh api`)
1. Pulls latest code from git
2. Installs Composer dependencies
3. Runs database migrations
4. Clears and rebuilds Laravel caches
5. Restarts PHP-FPM

### Frontend Deploy (`./deploy.sh frontend`)
1. Pulls latest code from git
2. Creates production .env with API URL
3. Installs npm dependencies
4. Builds React app
5. Copies build to public/admin

---

## Quick Commands Reference

| Task | Command |
|------|---------|
| SSH to VPS | `ssh deploy@YOUR_VPS_IP` |
| Deploy everything | `./deploy.sh` |
| Deploy API only | `./deploy.sh api` |
| Deploy frontend only | `./deploy.sh frontend` |
| View Laravel logs | `tail -f storage/logs/laravel.log` |
| Clear all caches | `php artisan optimize:clear` |
| Restart services | `sudo systemctl restart php8.2-fpm nginx` |

---

## Troubleshooting

### Permission Issues
```bash
sudo chown -R deploy:www-data /var/www/lifestyle-medicine
sudo chmod -R 775 /var/www/lifestyle-medicine/storage
```

### Build Fails
```bash
cd admin-dashboard
rm -rf node_modules
npm install
npm run build
```

### SSL Issues
```bash
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Database Connection Failed
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify credentials in .env
cat .env | grep DB_
```
