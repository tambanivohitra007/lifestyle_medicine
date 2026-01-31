# Deployment Scripts

Scripts to deploy the Lifestyle Medicine application to Hostinger VPS with HestiaCP.

**Domains:**
- API: https://api.rindra.org
- Dashboard: https://lifestyle.rindra.org

See **[DEPLOY_HESTIA.md](./DEPLOY_HESTIA.md)** for detailed instructions.

---

## Quick Start

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

**From Windows:**
```cmd
scripts\remote-deploy-hestia.bat YOUR_VPS_IP
scripts\remote-deploy-hestia.bat YOUR_VPS_IP api       # API only
scripts\remote-deploy-hestia.bat YOUR_VPS_IP frontend  # Frontend only
```

**From VPS:**
```bash
ssh root@YOUR_VPS_IP
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
| `create-admin.sh` | Create admin user in database |
| `sync-database-to-vps.bat` | Sync local database to VPS |
| `export-database.bat` | Export local database |

---

## What deploy-hestia.sh Does

1. `git pull` in `/home/rindra/web/lifestyle-medicine`
2. **API:** composer install, rsync to `api.rindra.org/public_html/`, migrate, cache
3. **Frontend:** npm build, copy to `lifestyle.rindra.org/public_html/`

---

## Troubleshooting

### Permission Issues
```bash
chown -R rindra:rindra /home/rindra/web/api.rindra.org/public_html
chmod -R 775 /home/rindra/web/api.rindra.org/public_html/storage
```

### Database Connection Error
```bash
cat /home/rindra/web/api.rindra.org/public_html/.env | grep DB_
php artisan config:clear
```

### Clear All Caches
```bash
cd /home/rindra/web/api.rindra.org/public_html
php artisan optimize:clear
```
