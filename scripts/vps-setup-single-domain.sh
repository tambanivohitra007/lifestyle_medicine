#!/bin/bash
#===============================================================================
# Lifestyle Medicine - Hostinger VPS Setup Script (Single Domain)
# For setups using ONE domain: yourdomain.com
#   - yourdomain.com → React Admin Dashboard
#   - yourdomain.com/api → Laravel API
#
# Prerequisites:
#   - Application must already be cloned to /var/www/lifestyle-medicine
#
# Usage:
#   chmod +x vps-setup-single-domain.sh
#   sudo ./vps-setup-single-domain.sh
#===============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Check root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (sudo ./vps-setup-single-domain.sh)"
    exit 1
fi

print_header "Lifestyle Medicine VPS Setup (Single Domain)"

APP_DIR="/var/www/lifestyle-medicine"

# Check if application is already cloned
if [ ! -f "$APP_DIR/artisan" ]; then
    print_warning "Application not found at $APP_DIR"
    echo ""
    echo -e "${YELLOW}The application needs to be cloned first.${NC}"
    echo ""
    read -p "Enter Git repository URL (or press Enter to skip): " REPO_URL

    if [ -n "$REPO_URL" ]; then
        echo "Cloning repository..."
        mkdir -p /var/www
        git clone "$REPO_URL" "$APP_DIR"

        if [ ! -f "$APP_DIR/artisan" ]; then
            print_error "Clone failed or invalid Laravel project"
            exit 1
        fi
        print_success "Repository cloned to $APP_DIR"
    else
        echo ""
        echo "Please clone the repository manually:"
        echo -e "  ${BLUE}git clone YOUR_REPO_URL $APP_DIR${NC}"
        echo ""
        echo "Then run this script again."
        exit 1
    fi
else
    print_success "Application found at $APP_DIR"
fi

echo -e "${YELLOW}This script sets up a single domain configuration:${NC}"
echo "  - yourdomain.com     → Admin Dashboard (React)"
echo "  - yourdomain.com/api → API (Laravel)"
echo ""

# Prompt for configuration
read -p "Domain (e.g., lifestyle.rindra.org): " DOMAIN
read -p "Database Name [lifestyle_medicine]: " DB_NAME
DB_NAME=${DB_NAME:-lifestyle_medicine}
read -p "Database User [lifestyle_user]: " DB_USER
DB_USER=${DB_USER:-lifestyle_user}
read -sp "Database Password: " DB_PASSWORD
echo
read -p "Deploy User [deploy]: " DEPLOY_USER
DEPLOY_USER=${DEPLOY_USER:-deploy}
read -p "Admin Email (for SSL): " ADMIN_EMAIL

# Confirm
echo -e "\n${YELLOW}Configuration Summary:${NC}"
echo "  Domain:         $DOMAIN"
echo "  Admin URL:      https://$DOMAIN"
echo "  API URL:        https://$DOMAIN/api/v1"
echo "  Database:       $DB_NAME"
echo "  DB User:        $DB_USER"
echo "  Deploy User:    $DEPLOY_USER"
echo

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 1
fi

#===============================================================================
# STEP 1: System Update
#===============================================================================
print_header "Step 1: Updating System"
read -p "Run system update? (y/n) [n]: " RUN_UPDATE
if [ "$RUN_UPDATE" = "y" ]; then
    apt update && apt upgrade -y
    print_success "System updated"
else
    print_warning "Skipped system update"
fi

#===============================================================================
# STEP 2: Install Required Packages
#===============================================================================
print_header "Step 2: Installing Required Packages"

# Check what's already installed
NGINX_INSTALLED=$(command -v nginx &> /dev/null && echo "yes" || echo "no")
PHP_INSTALLED=$(command -v php &> /dev/null && php -v 2>/dev/null | grep -q "8.2" && echo "yes" || echo "no")
MYSQL_INSTALLED=$(command -v mysql &> /dev/null && echo "yes" || echo "no")
COMPOSER_INSTALLED=$(command -v composer &> /dev/null && echo "yes" || echo "no")
NODE_INSTALLED=$(command -v node &> /dev/null && echo "yes" || echo "no")
CERTBOT_INSTALLED=$(command -v certbot &> /dev/null && echo "yes" || echo "no")

apt install -y curl wget git unzip software-properties-common ufw

# PHP repository (only add if PHP 8.2 not installed)
if [ "$PHP_INSTALLED" = "no" ]; then
    add-apt-repository ppa:ondrej/php -y
    apt update
fi

# Nginx
if [ "$NGINX_INSTALLED" = "yes" ]; then
    print_warning "Nginx already installed - skipping"
else
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    print_success "Nginx installed"
fi

# PHP 8.2
if [ "$PHP_INSTALLED" = "yes" ]; then
    print_warning "PHP 8.2 already installed - skipping"
else
    apt install -y php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
        php8.2-xml php8.2-curl php8.2-gd php8.2-mbstring php8.2-zip \
        php8.2-bcmath php8.2-intl php8.2-readline php8.2-sqlite3
    print_success "PHP 8.2 installed"
fi

# MySQL
if [ "$MYSQL_INSTALLED" = "yes" ]; then
    print_warning "MySQL already installed - skipping"
else
    apt install -y mysql-server
    systemctl enable mysql
    systemctl start mysql
    print_success "MySQL installed"
fi

# Composer
if [ "$COMPOSER_INSTALLED" = "yes" ]; then
    print_warning "Composer already installed - skipping"
else
    curl -sS https://getcomposer.org/installer | php
    mv composer.phar /usr/local/bin/composer
    print_success "Composer installed"
fi

# Node.js 20.x
if [ "$NODE_INSTALLED" = "yes" ]; then
    print_warning "Node.js already installed - skipping"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    print_success "Node.js installed"
fi

# Certbot
if [ "$CERTBOT_INSTALLED" = "yes" ]; then
    print_warning "Certbot already installed - skipping"
else
    apt install -y certbot python3-certbot-nginx
    print_success "Certbot installed"
fi

#===============================================================================
# STEP 3: Configure Firewall
#===============================================================================
print_header "Step 3: Configuring Firewall"

if ufw status | grep -q "Status: active"; then
    print_warning "Firewall already enabled - skipping"
else
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    ufw --force enable
    print_success "Firewall configured"
fi

#===============================================================================
# STEP 4: Create Deploy User
#===============================================================================
print_header "Step 4: Creating Deploy User"

if id "$DEPLOY_USER" &>/dev/null; then
    print_warning "User $DEPLOY_USER already exists"
else
    adduser --disabled-password --gecos "" $DEPLOY_USER
    usermod -aG sudo $DEPLOY_USER

    if [ -d "/root/.ssh" ]; then
        mkdir -p /home/$DEPLOY_USER/.ssh
        cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/ 2>/dev/null || true
        chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
        chmod 700 /home/$DEPLOY_USER/.ssh
        chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys 2>/dev/null || true
    fi
    print_success "User $DEPLOY_USER created"
fi

# Configure sudoers (only if not already configured)
if [ ! -f "/etc/sudoers.d/$DEPLOY_USER" ]; then
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart php8.2-fpm" >> /etc/sudoers.d/$DEPLOY_USER
    echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx" >> /etc/sudoers.d/$DEPLOY_USER
    chmod 440 /etc/sudoers.d/$DEPLOY_USER
    print_success "Sudoers configured for $DEPLOY_USER"
else
    print_warning "Sudoers already configured for $DEPLOY_USER - skipping"
fi

#===============================================================================
# STEP 5: Configure MySQL
#===============================================================================
print_header "Step 5: Configuring MySQL"

# Check if database exists
if mysql -e "USE $DB_NAME" 2>/dev/null; then
    print_warning "Database $DB_NAME already exists - skipping creation"
else
    mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    print_success "Database $DB_NAME created"
fi

# Create user and grant privileges (safe to re-run)
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
print_success "Database user $DB_USER configured"

#===============================================================================
# STEP 6: Install Laravel Dependencies
#===============================================================================
print_header "Step 6: Installing Laravel Dependencies"

# Ensure app directory has correct ownership
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

cd $APP_DIR
if [ -d "$APP_DIR/vendor" ] && [ -f "$APP_DIR/vendor/autoload.php" ]; then
    print_warning "Composer dependencies already installed - skipping"
else
    sudo -u $DEPLOY_USER composer install --optimize-autoloader --no-dev
    print_success "Composer dependencies installed"
fi

#===============================================================================
# STEP 7: Configure Laravel Environment
#===============================================================================
print_header "Step 7: Configuring Laravel Environment"

if [ -f "$APP_DIR/.env" ] && grep -q "APP_ENV=production" "$APP_DIR/.env"; then
    print_warning ".env already configured for production - skipping"
else
    sudo -u $DEPLOY_USER cp .env.example .env

    # Update .env - Note: API URL includes /api path prefix handled by Nginx
    sudo -u $DEPLOY_USER sed -i "s|APP_ENV=local|APP_ENV=production|g" .env
    sudo -u $DEPLOY_USER sed -i "s|APP_DEBUG=true|APP_DEBUG=false|g" .env
    sudo -u $DEPLOY_USER sed -i "s|APP_URL=http://localhost:8000|APP_URL=https://$DOMAIN|g" .env
    sudo -u $DEPLOY_USER sed -i "s|DB_CONNECTION=sqlite|DB_CONNECTION=mysql|g" .env
    sudo -u $DEPLOY_USER sed -i "s|DB_DATABASE=lifestyle_medicine|DB_DATABASE=$DB_NAME|g" .env
    sudo -u $DEPLOY_USER sed -i "s|# DB_USERNAME=|DB_USERNAME=$DB_USER|g" .env
    sudo -u $DEPLOY_USER sed -i "s|# DB_PASSWORD=|DB_PASSWORD=$DB_PASSWORD|g" .env
    sudo -u $DEPLOY_USER sed -i "s|CORS_ALLOWED_ORIGINS=http://localhost:5173|CORS_ALLOWED_ORIGINS=https://$DOMAIN|g" .env
    sudo -u $DEPLOY_USER sed -i "s|SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000|SANCTUM_STATEFUL_DOMAINS=$DOMAIN|g" .env

    sudo -u $DEPLOY_USER php artisan key:generate
    print_success "Environment configured"
fi

#===============================================================================
# STEP 8: Run Migrations
#===============================================================================
print_header "Step 8: Running Migrations"

# Check if migrations table exists (indicates migrations have run before)
if mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME -e "SELECT 1 FROM migrations LIMIT 1" 2>/dev/null; then
    print_warning "Migrations table exists - running any pending migrations"
fi
sudo -u $DEPLOY_USER php artisan migrate --force
print_success "Migrations completed"

# Storage link
if [ -L "$APP_DIR/public/storage" ]; then
    print_warning "Storage link already exists - skipping"
else
    sudo -u $DEPLOY_USER php artisan storage:link
    print_success "Storage link created"
fi

#===============================================================================
# STEP 9: Optimize Laravel
#===============================================================================
print_header "Step 9: Optimizing Laravel"

sudo -u $DEPLOY_USER php artisan config:cache
sudo -u $DEPLOY_USER php artisan route:cache
sudo -u $DEPLOY_USER php artisan view:cache
sudo -u $DEPLOY_USER php artisan event:cache
print_success "Laravel optimized"

#===============================================================================
# STEP 10: Set Permissions
#===============================================================================
print_header "Step 10: Setting Permissions"

chown -R $DEPLOY_USER:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/storage
chmod -R 775 $APP_DIR/bootstrap/cache
print_success "Permissions set"

#===============================================================================
# STEP 11: Build React Admin (placeholder)
#===============================================================================
print_header "Step 11: Creating Admin Directory"

mkdir -p $APP_DIR/public/admin
chown -R $DEPLOY_USER:www-data $APP_DIR/public/admin

# Only create placeholder if no real React build exists (check for assets folder)
if [ -d "$APP_DIR/public/admin/assets" ]; then
    print_warning "React build already exists in admin directory - skipping placeholder"
else
    cat > $APP_DIR/public/admin/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .message { text-align: center; padding: 40px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #d31e3a; }
        code { background: #f0f0f0; padding: 2px 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="message">
        <h1>Admin Dashboard</h1>
        <p>Upload the React build files to complete setup.</p>
        <p>Build locally with <code>npm run build</code></p>
    </div>
</body>
</html>
EOF
    chown $DEPLOY_USER:www-data $APP_DIR/public/admin/index.html
    print_success "Admin placeholder created"
fi

#===============================================================================
# STEP 12: Configure Nginx (Single Domain)
#===============================================================================
print_header "Step 12: Configuring Nginx (Single Domain)"

if [ -f "/etc/nginx/sites-available/lifestyle-medicine" ]; then
    print_warning "Nginx config already exists - recreating with current settings"
fi

cat > /etc/nginx/sites-available/lifestyle-medicine << EOF
server {
    listen 80;
    server_name $DOMAIN;
    root $APP_DIR/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    index index.html index.php;
    charset utf-8;

    client_max_body_size 20M;

    # React Admin Dashboard (default)
    location / {
        # First try admin files, then fall back to index.html for SPA routing
        root $APP_DIR/public/admin;
        try_files \$uri \$uri/ /index.html;
    }

    # Laravel API routes
    location /api {
        root $APP_DIR/public;
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # Laravel specific routes (sanctum, broadcasting, etc.)
    location /sanctum {
        root $APP_DIR/public;
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location /broadcasting {
        root $APP_DIR/public;
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # Storage files
    location /storage {
        root $APP_DIR/public;
        try_files \$uri \$uri/ =404;
    }

    # Health check endpoint
    location /up {
        root $APP_DIR/public;
        try_files \$uri /index.php?\$query_string;
    }

    # PHP handling
    location ~ \.php\$ {
        root $APP_DIR/public;
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Static assets caching for admin
    location ~* ^/assets/.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        root $APP_DIR/public/admin;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

ln -sf /etc/nginx/sites-available/lifestyle-medicine /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
print_success "Nginx configured"

#===============================================================================
# STEP 13: Configure PHP-FPM
#===============================================================================
print_header "Step 13: Configuring PHP-FPM"

if grep -q "user = $DEPLOY_USER" /etc/php/8.2/fpm/pool.d/www.conf 2>/dev/null; then
    print_warning "PHP-FPM already configured for $DEPLOY_USER - skipping"
else
    sed -i "s/user = www-data/user = $DEPLOY_USER/g" /etc/php/8.2/fpm/pool.d/www.conf
    sed -i "s/listen.owner = www-data/listen.owner = $DEPLOY_USER/g" /etc/php/8.2/fpm/pool.d/www.conf
    systemctl restart php8.2-fpm
    print_success "PHP-FPM configured"
fi

#===============================================================================
# STEP 14: Install SSL Certificate
#===============================================================================
print_header "Step 14: Installing SSL Certificate"

if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "SSL certificate already exists for $DOMAIN - skipping"
else
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL --redirect
    print_success "SSL certificate installed"
fi

# Add cron job only if not already present
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    print_warning "SSL auto-renewal cron already exists - skipping"
else
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    print_success "SSL auto-renewal configured"
fi

#===============================================================================
# STEP 15: Create Deploy Script
#===============================================================================
print_header "Step 15: Creating Deploy Script"

if [ -f "$APP_DIR/deploy.sh" ]; then
    print_warning "Deploy script already exists - recreating"
fi

cat > $APP_DIR/deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."
cd /var/www/lifestyle-medicine

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev

echo "🗃️ Running migrations..."
php artisan migrate --force

echo "🧹 Clearing caches..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

echo "🔄 Restarting PHP-FPM..."
sudo systemctl restart php8.2-fpm

echo "✅ Deployment complete!"
DEPLOY_SCRIPT

chmod +x $APP_DIR/deploy.sh
chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR/deploy.sh
print_success "Deploy script created"

#===============================================================================
# STEP 16: Log Rotation
#===============================================================================
print_header "Step 16: Configuring Log Rotation"

if [ -f "/etc/logrotate.d/lifestyle-medicine" ]; then
    print_warning "Log rotation already configured - skipping"
else
    cat > /etc/logrotate.d/lifestyle-medicine << EOF
$APP_DIR/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $DEPLOY_USER www-data
}
EOF
    print_success "Log rotation configured"
fi

#===============================================================================
# COMPLETE
#===============================================================================
print_header "Setup Complete!"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     Installation Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "Your site:        ${BLUE}https://$DOMAIN${NC}"
echo -e "API endpoint:     ${BLUE}https://$DOMAIN/api/v1${NC}"
echo -e "App Directory:    ${BLUE}$APP_DIR${NC}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo
echo "1. Create admin user:"
echo "   cd $APP_DIR && php artisan tinker"
echo "   User::create(['name'=>'Admin','email'=>'admin@example.com','password'=>Hash::make('password'),'role'=>'admin','is_active'=>true]);"
echo
echo "2. Build React frontend on your LOCAL machine:"
echo "   cd admin-dashboard"
echo "   echo 'VITE_API_BASE_URL=https://$DOMAIN/api/v1' > .env.production"
echo "   npm run build"
echo "   scp -r dist/* $DEPLOY_USER@YOUR_VPS_IP:$APP_DIR/public/admin/"
echo
echo "3. Import your database (if you have existing data):"
echo "   scp database_backup.sql $DEPLOY_USER@YOUR_VPS_IP:~/"
echo "   ssh $DEPLOY_USER@YOUR_VPS_IP"
echo "   mysql -u $DB_USER -p $DB_NAME < ~/database_backup.sql"
echo
echo "4. Update API keys in .env:"
echo "   nano $APP_DIR/.env"
echo "   # Add GEMINI_API_KEY and BIBLE_API_KEY"
echo "   php artisan config:cache"
echo
echo -e "${GREEN}Done! Your server is ready.${NC}"
