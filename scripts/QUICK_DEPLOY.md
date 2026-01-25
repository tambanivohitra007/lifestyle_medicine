# Quick Deploy Checklist

## Before You Start

1. **Domain Setup**: Point DNS records to your VPS IP
   - `api.yourdomain.com` → VPS IP
   - `admin.yourdomain.com` → VPS IP

2. **Wait for DNS propagation** (5-30 minutes)
   ```bash
   ping api.yourdomain.com
   ```

---

## Deploy in 4 Steps

### 1️⃣ Upload Setup Script to VPS
```bash
scp scripts/vps-setup.sh root@YOUR_VPS_IP:~/
```

### 2️⃣ Run Setup Script on VPS
```bash
ssh root@YOUR_VPS_IP
chmod +x vps-setup.sh
./vps-setup.sh
```
Follow the prompts. Takes ~5-10 minutes.

### 3️⃣ Build and Upload React Frontend (Local Machine)

**Windows:**
```cmd
scripts\build-and-upload.bat YOUR_VPS_IP api.yourdomain.com
```

**Mac/Linux:**
```bash
./scripts/build-and-upload.sh YOUR_VPS_IP api.yourdomain.com
```

### 4️⃣ Create Admin User (On VPS)
```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/lifestyle-medicine
php artisan tinker
```
```php
User::create(['name'=>'Admin', 'email'=>'you@email.com', 'password'=>Hash::make('YourPassword'), 'role'=>'admin', 'is_active'=>true]);
```

---

## You're Done! 🎉

- **API:** https://api.yourdomain.com
- **Admin:** https://admin.yourdomain.com

---

## Future Updates

**Update Backend:**
```bash
ssh deploy@YOUR_VPS_IP
cd /var/www/lifestyle-medicine
./deploy.sh
```

**Update Frontend:**
```bash
# On local machine
scripts\build-and-upload.bat YOUR_VPS_IP api.yourdomain.com
```

---

## Important Files on VPS

| File | Location |
|------|----------|
| Laravel App | `/var/www/lifestyle-medicine` |
| Environment | `/var/www/lifestyle-medicine/.env` |
| Logs | `/var/www/lifestyle-medicine/storage/logs/` |
| Nginx API | `/etc/nginx/sites-available/lifestyle-api` |
| Nginx Admin | `/etc/nginx/sites-available/lifestyle-admin` |
| Deploy Script | `/var/www/lifestyle-medicine/deploy.sh` |
