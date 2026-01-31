# Deployment Scripts

Scripts to deploy the Lifestyle Medicine application to a Hostinger VPS.

## Quick Start (rindra.org with HestiaCP)

For HestiaCP deployment, see **[DEPLOY_HESTIA.md](./DEPLOY_HESTIA.md)**

**Domains:**
- API: https://api.rindra.org
- Dashboard: https://lifestyle.rindra.org

---

## Deployment Workflow (HestiaCP)

### Initial Setup (One Time)

1. **Configure HestiaCP Panel:**
   - Create user `rindra`
   - Add domains: `api.rindra.org`, `lifestyle.rindra.org`
   - Enable SSL for both domains
   - Create database

2. **Clone repo and run setup:**
   ```bash
   ssh root@YOUR_VPS_IP
   cd /home/rindra/web
   git clone YOUR_REPO_URL lifestyle-medicine
   cd lifestyle-medicine
   ./scripts/setup-hestia.sh
   ```

### Deploying Updates

**Option 1: Remote deploy from Windows**
```cmd
scripts\remote-deploy-hestia.bat YOUR_VPS_IP           # Deploy everything
scripts\remote-deploy-hestia.bat YOUR_VPS_IP api       # API only
scripts\remote-deploy-hestia.bat YOUR_VPS_IP frontend  # Frontend only
```

**Option 2: SSH and deploy**
```bash
ssh root@YOUR_VPS_IP
cd /home/rindra/web/lifestyle-medicine
./scripts/deploy-hestia.sh           # Deploy everything
./scripts/deploy-hestia.sh api       # API only
./scripts/deploy-hestia.sh frontend  # Frontend only
```

---

## Scripts Reference

| Script | Platform | Purpose |
|--------|----------|---------|
| **HestiaCP Scripts (Recommended)** | | |
| `setup-hestia.sh` | VPS | Initial setup for HestiaCP |
| `deploy-hestia.sh` | VPS | Deploy script for HestiaCP |
| `remote-deploy-hestia.bat` | Windows | Trigger HestiaCP deploy via SSH |
| **Generic Setup Scripts** | | |
| `vps-setup-rindra.sh` | VPS | Setup for bare VPS (no control panel) |
| `vps-setup.sh` | VPS | Generic two-domain setup |
| `vps-setup-single-domain.sh` | VPS | Single domain setup |
| **Generic Deploy Scripts** | | |
| `deploy.sh` | VPS | Deploy script for bare VPS |
| `remote-deploy.bat` | Windows | Trigger remote deploy via SSH |
| `remote-deploy.ps1` | Windows (PS) | Trigger remote deploy via SSH |
| **Legacy Scripts** | | |
| `build-and-upload.bat` | Windows | Build locally & upload React |
| `build-and-upload.ps1` | Windows (PS) | Build locally & upload React |
| `build-and-upload.sh` | Mac/Linux | Build locally & upload React |
| **Utility Scripts** | | |
| `create-admin.sh` | VPS | Create admin user |
| `sync-database-to-vps.bat` | Windows | Sync local DB to VPS |
| `export-database.bat` | Windows | Export local database |

---

## What deploy-hestia.sh Does

### Full Deploy (`./scripts/deploy-hestia.sh`)
1. `git pull` in ~/web/lifestyle-medicine
2. **API:**
   - Composer install
   - Rsync files to ~/web/api.rindra.org/public_html/
   - Run migrations
   - Clear and rebuild Laravel caches
3. **Frontend:**
   - npm ci & build in admin-dashboard
   - Copy dist/* to ~/web/lifestyle.rindra.org/public_html/

### API Only (`./scripts/deploy-hestia.sh api`)
- Composer install, rsync, migrate, cache

### Frontend Only (`./scripts/deploy-hestia.sh frontend`)
- npm install, build, copy to public_html

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
