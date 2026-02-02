# Production Deployment Checklist

> **Project:** Lifestyle Medicine & Gospel Medical Evangelism Platform
> **Last Updated:** January 25, 2026

---

## Pre-Deployment Security Fixes Applied

### Critical Fixes (Completed)
- [x] **HTML Sanitization** - Added DOMPurify to sanitize rich text content, preventing XSS attacks
- [x] **Global Error Handling** - Enhanced API interceptor with user-friendly error messages for all HTTP status codes
- [x] **SSL Configuration** - Made SSL bypass explicit via environment variable (GEMINI_VERIFY_SSL)
- [x] **Rate Limiting** - Added rate limiters for API (60/min), Login (5/min), AI (10/min), Export (10/min)

---

## Environment Configuration Checklist

### Required Environment Variables
```bash
# CRITICAL - Must be set in production
APP_ENV=production
APP_DEBUG=false                    # MUST be false in production
APP_KEY=                           # Run: php artisan key:generate
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_DATABASE=lifestyle_medicine
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password

# CORS - Set to your frontend domain
CORS_ALLOWED_ORIGINS=https://your-admin-domain.com
SANCTUM_STATEFUL_DOMAINS=your-admin-domain.com

# API Keys (keep these secret!)
GEMINI_API_KEY=your-gemini-api-key
GEMINI_VERIFY_SSL=true             # MUST be true in production
BIBLE_API_KEY=your-bible-api-key
```

### Security Settings
```bash
# Strong password requirements enforced in production
BCRYPT_ROUNDS=12

# Session security
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true         # For HTTPS
SESSION_HTTP_ONLY=true
```

---

## Deployment Steps

### 1. Backend (Laravel)

```bash
# Pull latest code
git pull origin main

# Install dependencies (production)
composer install --optimize-autoloader --no-dev

# Generate app key (if not set)
php artisan key:generate

# Run migrations
php artisan migrate --force

# Clear and rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set file permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 2. Frontend (React Admin Dashboard)

```bash
cd admin-dashboard

# Install dependencies
npm ci

# Build for production
npm run build

# Copy dist folder to public web directory
cp -r dist/* /var/www/html/admin/
```

### 3. Web Server Configuration

#### Nginx Example
```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;
    root /var/www/lifestyle-medicine/public;

    # SSL Configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

---

## Post-Deployment Verification

### API Health Checks
- [ ] `GET /up` returns 200 OK
- [ ] `POST /api/v1/login` works with valid credentials
- [ ] `GET /api/v1/conditions` returns data
- [ ] Export endpoints work (PDF, CSV)

### Security Verification
- [ ] APP_DEBUG is false (no stack traces in errors)
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] CORS only allows your frontend domain
- [ ] Rate limiting is working (test with rapid requests)
- [ ] Login rate limit blocks after 5 attempts

### Functional Testing
- [ ] User can login/logout
- [ ] Admin can create/edit/delete content
- [ ] Search functionality works
- [ ] PDF export generates correctly
- [ ] CSV export downloads properly
- [ ] Knowledge Graph loads

---

## Monitoring & Maintenance

### Recommended Services
- **Error Tracking:** Sentry, Bugsnag, or Laravel Telescope
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Log Aggregation:** Papertrail, Loggly

### Regular Maintenance
- [ ] Weekly database backups
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Review error logs weekly

### Backup Strategy
```bash
# Database backup
mysqldump -u user -p lifestyle_medicine > backup_$(date +%Y%m%d).sql

# Application backup (storage folder)
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/
```

---

## Known Limitations & Future Improvements

### Deferred (Post-Launch)
1. **Token Storage** - Consider migrating to httpOnly cookies for auth tokens
2. **Bulk Operations** - Not yet implemented
3. **Advanced Filtering** - Date ranges, multi-select filters
4. **Dark Mode** - UI theming not implemented
5. **Test Coverage** - No automated tests yet

### Bundle Size Warning
The frontend bundle is ~3MB. Consider implementing:
- Code splitting with React.lazy()
- Manual chunk configuration in Vite

---

## Rollback Procedure

If issues occur after deployment:

```bash
# Rollback to previous version
git checkout <previous-commit-hash>

# Rollback migrations (if needed)
php artisan migrate:rollback --step=1

# Rebuild caches
php artisan config:cache
php artisan route:cache
```

---

## Support Contacts

- **Development Team:** [Your contact]
- **Infrastructure:** [Your contact]
- **Emergency:** [Your contact]

---

**Document maintained by:** Development Team
**Next Review:** After first production deployment
