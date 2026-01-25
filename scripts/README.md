# Deployment Scripts

Scripts to deploy the Lifestyle Medicine application to a Hostinger VPS.

## Quick Start

### Step 1: Initial VPS Setup (Run Once)

Upload `vps-setup.sh` to your VPS and run it:

```bash
# On your local machine
scp scripts/vps-setup.sh root@YOUR_VPS_IP:~/

# On your VPS
ssh root@YOUR_VPS_IP
chmod +x vps-setup.sh
./vps-setup.sh
```

The script will prompt you for:
- API domain (e.g., `api.yourdomain.com`)
- Admin domain (e.g., `admin.yourdomain.com`)
- Database credentials
- Git repository URL
- Email for SSL certificates

### Step 2: Build and Upload React Frontend

**Windows (Command Prompt):**
```cmd
cd scripts
build-and-upload.bat YOUR_VPS_IP api.yourdomain.com
```

**Windows (PowerShell):**
```powershell
cd scripts
.\build-and-upload.ps1 -VpsIp "YOUR_VPS_IP" -ApiDomain "api.yourdomain.com"
```

**Mac/Linux:**
```bash
cd scripts
chmod +x build-and-upload.sh
./build-and-upload.sh YOUR_VPS_IP api.yourdomain.com
```

### Step 3: Create Admin User

SSH into your VPS and run:

```bash
cd /var/www/lifestyle-medicine/scripts
chmod +x create-admin.sh
./create-admin.sh
```

### Step 4: Update API Keys

Edit the `.env` file on your VPS:

```bash
nano /var/www/lifestyle-medicine/.env
```

Add your API keys:
```
GEMINI_API_KEY=your_gemini_api_key
BIBLE_API_KEY=your_bible_api_key
```

Then clear the config cache:
```bash
cd /var/www/lifestyle-medicine
php artisan config:cache
```

---

## Scripts Reference

| Script | Platform | Purpose |
|--------|----------|---------|
| `vps-setup.sh` | VPS (Ubuntu) | Initial server setup |
| `build-and-upload.bat` | Windows | Build & upload React |
| `build-and-upload.ps1` | Windows (PS) | Build & upload React |
| `build-and-upload.sh` | Mac/Linux | Build & upload React |
| `create-admin.sh` | VPS | Create admin user |

---

## Deployment Updates

After the initial setup, use the deploy script on your VPS:

```bash
cd /var/www/lifestyle-medicine
./deploy.sh
```

This will:
- Pull latest code from Git
- Install Composer dependencies
- Run migrations
- Clear and rebuild caches
- Restart PHP-FPM

---

## Troubleshooting

### SSH Connection Issues
```bash
# Test SSH connection
ssh deploy@YOUR_VPS_IP

# If using SSH key, ensure it's loaded
ssh-add ~/.ssh/id_rsa
```

### Permission Denied
```bash
# On VPS, fix permissions
sudo chown -R deploy:www-data /var/www/lifestyle-medicine
sudo chmod -R 775 /var/www/lifestyle-medicine/storage
```

### Build Fails
```bash
# Clear npm cache and retry
cd admin-dashboard
rm -rf node_modules package-lock.json
npm install
npm run build
```

### SSL Certificate Issues
```bash
# On VPS, renew certificates
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```
