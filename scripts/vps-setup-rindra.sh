#!/bin/bash
#===============================================================================
# Lifestyle Medicine - VPS Setup for rindra.org
# Configured for:
#   - api.rindra.org      → Laravel API
#   - lifestyle.rindra.org → React Admin Dashboard
#
# Prerequisites:
#   - Fresh Ubuntu 22.04/24.04 VPS
#   - DNS records pointing both domains to this VPS
#
# Usage:
#   chmod +x vps-setup-rindra.sh
#   sudo ./vps-setup-rindra.sh
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
    print_error "Please run as root (sudo ./vps-setup-rindra.sh)"
    exit 1
fi

#===============================================================================
# CONFIGURATION
#===============================================================================
API_DOMAIN="api.rindra.org"
ADMIN_DOMAIN="lifestyle.rindra.org"
APP_DIR="/var/www/lifestyle-medicine"

print_header "Lifestyle Medicine VPS Setup"
echo -e "${YELLOW}This script will configure:${NC}"
echo "  - API:       https://$API_DOMAIN"
echo "  - Dashboard: https://$ADMIN_DOMAIN"
echo ""

# Prompt for configuration
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
echo "  API Domain:     $API_DOMAIN"
echo "  Admin Domain:   $ADMIN_DOMAIN"
echo "  Database:       $DB_NAME"
echo "  DB User:        $DB_USER"
echo "  Deploy User:    $DEPLOY_USER"
echo "  Git Repo:       $GIT_REPO"
echo

read -p "Continue with installation? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 1
fi

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

# Add PHP repository
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

# Node.js 20.x (for building React on VPS)
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

# Allow deploy user to restart services without password
cat > /etc/sudoers.d/$DEPLOY_USER << EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart php8.2-fpm
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
EOF
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

if [ -d "$APP_DIR/.git" ]; then
    print_warning "Repository already exists - pulling latest"
    sudo -u $DEPLOY_USER git -C $APP_DIR pull origin main
else
    sudo -u $DEPLOY_USER git clone $GIT_REPO $APP_DIR
fi
print_success "Repository ready"

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

# Update .env file
sudo -u $DEPLOY_USER sed -i "s|APP_ENV=local|APP_ENV=production|g" .env
sudo -u $DEPLOY_USER sed -i "s|APP_DEBUG=true|APP_DEBUG=false|g" .env
sudo -u $DEPLOY_USER sed -i "s|APP_URL=http://localhost:8000|APP_URL=https://$API_DOMAIN|g" .env
sudo -u $DEPLOY_USER sed -i "s|APP_URL=http://localhost|APP_URL=https://$API_DOMAIN|g" .env
sudo -u $DEPLOY_USER sed -i "s|DB_CONNECTION=sqlite|DB_CONNECTION=mysql|g" .env
sudo -u $DEPLOY_USER sed -i "s|DB_DATABASE=laravel|DB_DATABASE=$DB_NAME|g" .env
sudo -u $DEPLOY_USER sed -i "s|DB_DATABASE=lifestyle_medicine|DB_DATABASE=$DB_NAME|g" .env
sudo -u $DEPLOY_USER sed -i "s|# DB_HOST=127.0.0.1|DB_HOST=127.0.0.1|g" .env
sudo -u $DEPLOY_USER sed -i "s|# DB_PORT=3306|DB_PORT=3306|g" .env
sudo -u $DEPLOY_USER sed -i "s|# DB_USERNAME=root|DB_USERNAME=$DB_USER|g" .env
sudo -u $DEPLOY_USER sed -i "s|# DB_USERNAME=|DB_USERNAME=$DB_USER|g" .env
sudo -u $DEPLOY_USER sed -i "s|DB_USERNAME=root|DB_USERNAME=$DB_USER|g" .env
sudo -u $DEPLOY_USER sed -i "s|# DB_PASSWORD=|DB_PASSWORD=$DB_PASSWORD|g" .env
sudo -u $DEPLOY_USER sed -i "s|DB_PASSWORD=$|DB_PASSWORD=$DB_PASSWORD|g" .env
sudo -u $DEPLOY_USER sed -i "s|CORS_ALLOWED_ORIGINS=http://localhost:5173|CORS_ALLOWED_ORIGINS=https://$ADMIN_DOMAIN|g" .env
sudo -u $DEPLOY_USER sed -i "s|SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000|SANCTUM_STATEFUL_DOMAINS=$ADMIN_DOMAIN|g" .env

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
# STEP 10: Build React Frontend
#===============================================================================
print_header "Step 10: Building React Frontend"

ADMIN_DIR="$APP_DIR/admin-dashboard"

if [ -d "$ADMIN_DIR" ]; then
    cd "$ADMIN_DIR"

    # Create production environment
    sudo -u $DEPLOY_USER bash -c "echo 'VITE_API_BASE_URL=https://$API_DOMAIN/api/v1' > .env.production"

    # Install dependencies and build
    sudo -u $DEPLOY_USER npm ci
    sudo -u $DEPLOY_USER npm run build

    # Copy build to public/admin
    mkdir -p "$APP_DIR/public/admin"
    rm -rf "$APP_DIR/public/admin"/*
    cp -r dist/* "$APP_DIR/public/admin/"
    chown -R $DEPLOY_USER:www-data "$APP_DIR/public/admin"

    print_success "React frontend built and deployed"
else
    print_warning "Admin dashboard directory not found - skipping frontend build"
    mkdir -p "$APP_DIR/public/admin"
fi

cd "$APP_DIR"

#===============================================================================
# STEP 11: Optimize Laravel
#===============================================================================
print_header "Step 11: Optimizing Laravel"

sudo -u $DEPLOY_USER php artisan config:cache
sudo -u $DEPLOY_USER php artisan route:cache
sudo -u $DEPLOY_USER php artisan view:cache
sudo -u $DEPLOY_USER php artisan event:cache
print_success "Laravel optimized"

#===============================================================================
# STEP 12: Set Permissions
#===============================================================================
print_header "Step 12: Setting Permissions"

chown -R $DEPLOY_USER:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/storage
chmod -R 775 $APP_DIR/bootstrap/cache
print_success "Permissions set"

#===============================================================================
# STEP 13: Configure Nginx
#===============================================================================
print_header "Step 13: Configuring Nginx"

# API Configuration (api.rindra.org)
cat > /etc/nginx/sites-available/lifestyle-api << EOF
server {
    listen 80;
    server_name $API_DOMAIN;
    root $APP_DIR/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    index index.php;
    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php\$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    client_max_body_size 20M;
}
EOF

# Admin Configuration (lifestyle.rindra.org)
cat > /etc/nginx/sites-available/lifestyle-admin << EOF
server {
    listen 80;
    server_name $ADMIN_DOMAIN;
    root $APP_DIR/public/admin;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.html;
    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
}
EOF

ln -sf /etc/nginx/sites-available/lifestyle-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/lifestyle-admin /etc/nginx/sites-enabled/
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
# STEP 15: Install SSL Certificates
#===============================================================================
print_header "Step 15: Installing SSL Certificates"

certbot --nginx -d $API_DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL --redirect
certbot --nginx -d $ADMIN_DOMAIN --non-interactive --agree-tos -m $ADMIN_EMAIL --redirect
print_success "SSL certificates installed"

(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
print_success "SSL auto-renewal configured"

#===============================================================================
# STEP 16: Copy Deploy Script
#===============================================================================
print_header "Step 16: Setting Up Deploy Script"

cp "$APP_DIR/scripts/deploy.sh" "$APP_DIR/deploy.sh"
chmod +x "$APP_DIR/deploy.sh"
chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR/deploy.sh"
print_success "Deploy script ready"

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
    sharedscripts
    postrotate
        systemctl reload php8.2-fpm
    endscript
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
echo -e "API URL:          ${BLUE}https://$API_DOMAIN${NC}"
echo -e "Admin URL:        ${BLUE}https://$ADMIN_DOMAIN${NC}"
echo -e "App Directory:    ${BLUE}$APP_DIR${NC}"
echo -e "Deploy User:      ${BLUE}$DEPLOY_USER${NC}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create admin user:"
echo "   cd $APP_DIR && php artisan tinker"
echo "   User::create(['name'=>'Admin','email'=>'your@email.com','password'=>Hash::make('password'),'role'=>'admin','is_active'=>true]);"
echo
echo "2. Update API keys in .env:"
echo "   nano $APP_DIR/.env"
echo "   # Add GEMINI_API_KEY and BIBLE_API_KEY"
echo "   php artisan config:cache"
echo
echo -e "${YELLOW}Future Deployments:${NC}"
echo "   ssh $DEPLOY_USER@YOUR_VPS_IP"
echo "   cd $APP_DIR"
echo "   ./deploy.sh           # Deploy both API and frontend"
echo "   ./deploy.sh api       # Deploy API only"
echo "   ./deploy.sh frontend  # Deploy frontend only"
echo
echo -e "${GREEN}Done! Your server is ready.${NC}"
