# Deployment Scripts

Scripts to deploy the Lifestyle Medicine application to Hostinger VPS with HestiaCP.

**Domains:**
- API: https://api.rindra.org
- Dashboard: https://lifestyle.rindra.org

See **[DEPLOY_HESTIA.md](./DEPLOY_HESTIA.md)** for detailed instructions.

---

## Quick Start

### Prerequisites (in HestiaCP Panel)

1. Create user `rindra`
2. Add domain `api.rindra.org` with PHP 8.4
3. Add domain `lifestyle.rindra.org`
4. Enable SSL for both domains
5. Create database

### Initial Setup

```bash
ssh root@YOUR_VPS_IP
cd /home/rindra/web
git clone YOUR_REPO_URL lifestyle-medicine
cd lifestyle-medicine
./scripts/setup-hestia.sh
```

### Deploying Updates

**From Windows:**
```cmd
scripts\remote-deploy-hestia.bat YOUR_VPS_IP
```

**From VPS:**
```bash
cd /home/rindra/web/lifestyle-medicine
./scripts/deploy-hestia.sh
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `setup-hestia.sh` | Initial VPS setup for HestiaCP |
| `deploy-hestia.sh` | Deploy API and/or frontend |
| `remote-deploy-hestia.bat` | Trigger deploy from Windows via SSH |
| `create-admin.sh` | Create admin user |
| `sync-database-to-vps.bat` | Sync local database to VPS |
| `export-database.bat` | Export local database |

---

## Directory Structure on VPS

```
/home/rindra/web/
├── lifestyle-medicine/              # Git repository
├── api.rindra.org/
│   ├── app/                         # Laravel application
│   └── public_html/                 # Web root (points to app/)
└── lifestyle.rindra.org/
    └── public_html/                 # React build
```

---

## What deploy-hestia.sh Does

1. `git pull` latest code
2. **API:**
   - Composer install
   - Rsync to `api.rindra.org/app/`
   - Update `index.php` paths
   - Run migrations
   - Cache config/routes
3. **Frontend:**
   - npm install & build
   - Copy to `lifestyle.rindra.org/public_html/`

---

## Troubleshooting

### Permission Issues
```bash
chown -R rindra:www-data /home/rindra/web/api.rindra.org
chmod -R 775 /home/rindra/web/api.rindra.org/app/storage
```

### open_basedir Error
```bash
nano /etc/php/8.4/fpm/pool.d/api.rindra.org.conf
# Add /home/rindra/web/api.rindra.org/app to open_basedir
systemctl restart php8.4-fpm
```

### Check Logs
```bash
tail -50 /home/rindra/web/api.rindra.org/app/storage/logs/laravel.log
tail -50 /var/log/apache2/domains/api.rindra.org.error.log
```
