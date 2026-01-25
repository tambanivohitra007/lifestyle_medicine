#!/bin/bash
#===============================================================================
# Lifestyle Medicine - Hostinger VPS Setup Script (Single Domain)
# For setups using ONE domain: yourdomain.com
#   - yourdomain.com → React Admin Dashboard
#   - yourdomain.com/api → Laravel API
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
read -p "Git Repository URL: " GIT_REPO
read -p "Admin Email (for SSL): " ADMIN_EMAIL

# Confirm
echo -e "\n${YELLOW}Configuration Summary:${NC}"
echo "  Domain:         $DOMAIN"
echo "  Admin URL:      https://$DOMAIN"
echo "  API URL:        https://$DOMAIN/api/v1"
echo "  Database:       $DB_NAME"
echo "  DB User:        $DB_USER"
echo "  Deploy User:    $DEPLOY_USER"
echo "  Git Repo:       $GIT_REPO"
echo

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 1
fi

APP_DIR="/var/www/lifestyle-medicine"

#===============================================================================
# STEP 1: System Update
#===============================================================================
print_header "Step 1: Updating System"
apt update && apt upgrade -y
print_success "System updated"

#===============================================================================
# STEP 2: Install Required Packages
#===============================================================================
print_header "Step 2: Installing Required Packages"

apt install -y curl wget git unzip software-properties-common ufw

# PHP repository
add-apt-repository ppa:ondrej/php -y
apt update

# Nginx
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_success "Nginx installed"

# PHP 8.2
apt install -y php8.2-fpm php8.2-cli php8.2-common php8.2-mysql \
    php8.2-xml php8.2-curl php8.2-gd php8.2-mbstring php8.2-zip \
    php8.2-bcmath php8.2-intl php8.2-readline php8.2-sqlite3
print_success "PHP 8.2 installed"

# MySQL
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql
print_success "MySQL installed"

# Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
print_success "Composer installed"

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_success "Node.js installed"

# Certbot
apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

#===============================================================================
# STEP 3: Configure Firewall
#===============================================================================
print_header "Step 3: Configuring Firewall"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
print_success "Firewall configured"

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

echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart php8.2-fpm" >> /etc/sudoers.d/$DEPLOY_USER
echo "$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx" >> /etc/sudoers.d/$DEPLOY_USER
chmod 440 /etc/sudoers.d/$DEPLOY_USER

#===============================================================================
# STEP 5: Configure MySQL
#===============================================================================
print_header "Step 5: Configuring MySQL"

mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
print_success "Database $DB_NAME created"

#===============================================================================
# STEP 6: Clone Application
#===============================================================================
print_header "Step 6: Cloning Application"

mkdir -p $APP_DIR
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
sudo -u $DEPLOY_USER git clone $GIT_REPO $APP_DIR
print_success "Repository cloned"

#===============================================================================
# STEP 7: Install Laravel Dependencies
#===============================================================================
print_header "Step 7: Installing Laravel Dependencies"

cd $APP_DIR
sudo -u $DEPLOY_USER composer install --optimize-autoloader --no-dev
print_success "Composer dependencies installed"

#===============================================================================
# STEP 8: Configure Laravel Environment
#===============================================================================
print_header "Step 8: Configuring Laravel Environment"

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

#===============================================================================
# STEP 9: Run Migrations
#===============================================================================
print_header "Step 9: Running Migrations"

sudo -u $DEPLOY_USER php artisan migrate --force
sudo -u $DEPLOY_USER php artisan storage:link
print_success "Migrations completed"

#===============================================================================
# STEP 10: Optimize Laravel
#===============================================================================
print_header "Step 10: Optimizing Laravel"

sudo -u $DEPLOY_USER php artisan config:cache
sudo -u $DEPLOY_USER php artisan route:cache
sudo -u $DEPLOY_USER php artisan view:cache
sudo -u $DEPLOY_USER php artisan event:cache
print_success "Laravel optimized"

#===============================================================================
# STEP 11: Set Permissions
#===============================================================================
print_header "Step 11: Setting Permissions"

chown -R $DEPLOY_USER:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/storage
chmod -R 775 $APP_DIR/bootstrap/cache
print_success "Permissions set"

#===============================================================================
# STEP 12: Build React Admin (placeholder)
#===============================================================================
print_header "Step 12: Creating Admin Directory"

mkdir -p $APP_DIR/public/admin
chown -R $DEPLOY_USER:www-data $APP_DIR/public/admin

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
print_success "Admin directory created"

#===============================================================================
# STEP 13: Configure Nginx (Single Domain)
#===============================================================================
print_header "Step 13: Configuring Nginx (Single Domain)"

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
# STEP 14: Configure PHP-FPM
#===============================================================================
print_header "Step 14: Configuring PHP-FPM"

sed -i "s/user = www-data/user = $DEPLOY_USER/g" /etc/php/8.2/fpm/pool.d/www.conf
sed -i "s/listen.owner = www-data/listen.owner = $DEPLOY_USER/g" /etc/php/8.2/fpm/pool.d/www.conf

systemctl restart php8.2-fpm
print_success "PHP-FPM configured"

#===============================================================================
# STEP 15: Install SSL Certificate
#===============================================================================
print_header "Step 15: Installing SSL Certificate"

certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL --redirect
print_success "SSL certificate installed"

(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
print_success "SSL auto-renewal configured"

#===============================================================================
# STEP 16: Create Deploy Script
#===============================================================================
print_header "Step 16: Creating Deploy Script"

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
# STEP 17: Log Rotation
#===============================================================================
print_header "Step 17: Configuring Log Rotation"

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
