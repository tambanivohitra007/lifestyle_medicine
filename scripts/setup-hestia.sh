#!/bin/bash
#===============================================================================
# Lifestyle Medicine - HestiaCP Initial Setup Script
#
# Prerequisites (do these in HestiaCP panel FIRST):
#   1. Create user 'rindra'
#   2. Add domain 'api.rindra.org' with PHP 8.4
#   3. Add domain 'lifestyle.rindra.org'
#   4. Enable SSL for both domains
#   5. Create database (e.g., rindra_lifestyle_medicine)
#
# Then clone repo and run this script:
#   cd /home/rindra/web
#   git clone YOUR_REPO_URL lifestyle-medicine
#   cd lifestyle-medicine
#   ./scripts/setup-hestia.sh
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
print_info() { echo -e "${BLUE}→ $1${NC}"; }

#===============================================================================
# CONFIGURATION
#===============================================================================
HESTIA_USER="rindra"
WEB_DIR="/home/$HESTIA_USER/web"
REPO_DIR="$WEB_DIR/lifestyle-medicine"
API_DOMAIN="api.rindra.org"
ADMIN_DOMAIN="lifestyle.rindra.org"
API_DIR="$WEB_DIR/$API_DOMAIN"
ADMIN_DIR="$WEB_DIR/$ADMIN_DOMAIN"
API_PUBLIC="$API_DIR/public_html"
ADMIN_PUBLIC="$ADMIN_DIR/public_html"
API_APP="$API_DIR/app"

# Web server user (for permissions)
WEB_USER="$HESTIA_USER"
WEB_GROUP="www-data"

# PHP version
PHP_VERSION="8.4"

print_header "Lifestyle Medicine - HestiaCP Setup"

# Check we're running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    echo "Use: sudo ./scripts/setup-hestia.sh"
    exit 1
fi

# Check HestiaCP directories exist
if [ ! -d "$WEB_DIR" ]; then
    print_error "HestiaCP web directory not found at $WEB_DIR"
    exit 1
fi

echo -e "${YELLOW}This script will set up:${NC}"
echo "  - API:       https://$API_DOMAIN"
echo "  - Dashboard: https://$ADMIN_DOMAIN"
echo ""

# Check domains exist in HestiaCP
if [ ! -d "$API_DIR" ]; then
    print_error "Domain $API_DOMAIN not found in HestiaCP"
    echo "Please add the domain in HestiaCP panel first"
    exit 1
fi

if [ ! -d "$ADMIN_DIR" ]; then
    print_error "Domain $ADMIN_DOMAIN not found in HestiaCP"
    echo "Please add the domain in HestiaCP panel first"
    exit 1
fi

print_success "Both domains found in HestiaCP"

#===============================================================================
# STEP 1: Verify Repository
#===============================================================================
print_header "Step 1: Verifying Repository"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/../artisan" ]; then
    REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
    print_success "Running from repository at $REPO_DIR"
elif [ -d "$REPO_DIR/.git" ]; then
    print_success "Repository found at $REPO_DIR"
else
    print_error "Repository not found!"
    echo ""
    echo "Please clone the repository first:"
    echo "  cd $WEB_DIR"
    echo "  git clone YOUR_REPO_URL lifestyle-medicine"
    echo "  cd lifestyle-medicine"
    echo "  ./scripts/setup-hestia.sh"
    exit 1
fi

cd "$REPO_DIR"
git pull origin main
print_success "Repository up to date"

#===============================================================================
# STEP 2: Prompt for Configuration
#===============================================================================
print_header "Step 2: Database Configuration"

read -p "Database Name (created in HestiaCP): " DB_NAME
read -p "Database User (created in HestiaCP): " DB_USER
read -sp "Database Password: " DB_PASSWORD
echo

#===============================================================================
# STEP 3: Install Composer Dependencies
#===============================================================================
print_header "Step 3: Installing Composer Dependencies"

cd "$REPO_DIR"
composer install --optimize-autoloader --no-dev
print_success "Composer dependencies installed"

#===============================================================================
# STEP 4: Configure Environment
#===============================================================================
print_header "Step 4: Configuring Environment"

cp .env.example .env

# Update .env file - App settings
sed -i "s|APP_ENV=local|APP_ENV=production|g" .env
sed -i "s|APP_DEBUG=true|APP_DEBUG=false|g" .env
sed -i "s|APP_URL=http://localhost:8000|APP_URL=https://$API_DOMAIN|g" .env

# Database: Change from SQLite to MySQL
sed -i "s|DB_CONNECTION=sqlite|DB_CONNECTION=mysql|g" .env

# Remove commented MySQL lines and add fresh ones
sed -i '/# DB_CONNECTION=mysql/d' .env
sed -i '/# DB_HOST=/d' .env
sed -i '/# DB_PORT=/d' .env
sed -i '/# DB_DATABASE=/d' .env
sed -i '/# DB_USERNAME=/d' .env
sed -i '/# DB_PASSWORD=/d' .env

# Add database config after DB_CONNECTION line
sed -i "/^DB_CONNECTION=mysql/a DB_HOST=localhost\nDB_PORT=3306\nDB_DATABASE=$DB_NAME\nDB_USERNAME=$DB_USER\nDB_PASSWORD=$DB_PASSWORD" .env

# CORS and Sanctum
sed -i "s|CORS_ALLOWED_ORIGINS=http://localhost:5173|CORS_ALLOWED_ORIGINS=https://$ADMIN_DOMAIN|g" .env
sed -i "s|SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000|SANCTUM_STATEFUL_DOMAINS=$ADMIN_DOMAIN|g" .env

php artisan key:generate
print_success "Environment configured"

#===============================================================================
# STEP 5: Deploy API (Laravel)
#===============================================================================
print_header "Step 5: Deploying API"

# Create app directory and move Laravel there
print_info "Setting up Laravel structure..."
mkdir -p "$API_APP"

# Copy Laravel files to app directory (excluding public folder contents)
rsync -av --delete \
    --exclude='admin-dashboard/node_modules' \
    --exclude='admin-dashboard/dist' \
    --exclude='.git' \
    "$REPO_DIR/" "$API_APP/"

# Remove existing public_html and recreate with Laravel's public folder
rm -rf "$API_PUBLIC"
cp -r "$API_APP/public" "$API_PUBLIC"

# Update index.php to point to ../app/
print_info "Updating index.php paths..."
sed -i "s|require __DIR__.'/../vendor/autoload.php'|require __DIR__.'/../app/vendor/autoload.php'|g" "$API_PUBLIC/index.php"
sed -i "s|require_once __DIR__.'/../bootstrap/app.php'|require_once __DIR__.'/../app/bootstrap/app.php'|g" "$API_PUBLIC/index.php"

# Create storage directories
mkdir -p "$API_APP/storage/logs"
mkdir -p "$API_APP/storage/framework/cache"
mkdir -p "$API_APP/storage/framework/sessions"
mkdir -p "$API_APP/storage/framework/views"
mkdir -p "$API_APP/bootstrap/cache"

# Set permissions
chown -R $WEB_USER:$WEB_GROUP "$API_DIR"
chmod -R 755 "$API_DIR"
chmod -R 775 "$API_APP/storage"
chmod -R 775 "$API_APP/bootstrap/cache"

# Run Laravel setup
cd "$API_APP"
php artisan storage:link 2>/dev/null || true
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

print_success "API deployed"

#===============================================================================
# STEP 6: Update PHP-FPM open_basedir
#===============================================================================
print_header "Step 6: Configuring PHP-FPM"

PHP_FPM_CONF="/etc/php/$PHP_VERSION/fpm/pool.d/$API_DOMAIN.conf"

if [ -f "$PHP_FPM_CONF" ]; then
    # Check if app directory is already in open_basedir
    if grep -q "$API_APP" "$PHP_FPM_CONF"; then
        print_warning "open_basedir already includes app directory"
    else
        # Add app directory to open_basedir
        sed -i "s|php_admin_value\[open_basedir\] = |php_admin_value[open_basedir] = $API_APP:|g" "$PHP_FPM_CONF"
        print_success "Added $API_APP to open_basedir"
    fi

    systemctl restart php$PHP_VERSION-fpm
    print_success "PHP-FPM restarted"
else
    print_warning "PHP-FPM config not found at $PHP_FPM_CONF"
    echo "You may need to manually add $API_APP to open_basedir"
fi

#===============================================================================
# STEP 7: Build and Deploy Frontend
#===============================================================================
print_header "Step 7: Building Frontend"

cd "$REPO_DIR/admin-dashboard"

# Create production environment
echo "VITE_API_BASE_URL=https://$API_DOMAIN/api/v1" > .env.production

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found!"
    echo ""
    echo "Install Node.js:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    echo "  apt install -y nodejs"
    echo ""
else
    npm ci --prefer-offline --no-audit
    npm run build

    # Deploy to admin public directory
    rm -rf "$ADMIN_PUBLIC"/*
    cp -r dist/* "$ADMIN_PUBLIC/"
    chown -R $WEB_USER:$WEB_GROUP "$ADMIN_PUBLIC"
    chmod -R 755 "$ADMIN_PUBLIC"

    print_success "Frontend deployed"
fi

#===============================================================================
# STEP 8: Configure SPA Routing for Frontend
#===============================================================================
print_header "Step 8: Configuring SPA Routing"

NGINX_SPA_CONF="/home/$HESTIA_USER/conf/web/$ADMIN_DOMAIN/nginx.ssl.conf_spa"

echo 'error_page 404 /index.html;' > "$NGINX_SPA_CONF"

nginx -t && systemctl restart nginx
print_success "SPA routing configured"

#===============================================================================
# STEP 9: Make Deploy Script Executable
#===============================================================================
print_header "Step 9: Setting Up Deploy Script"

chmod +x "$REPO_DIR/scripts/deploy-hestia.sh"
print_success "Deploy script ready"

#===============================================================================
# COMPLETE
#===============================================================================
print_header "Setup Complete!"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     Installation Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "API:       ${BLUE}https://$API_DOMAIN${NC}"
echo -e "Dashboard: ${BLUE}https://$ADMIN_DOMAIN${NC}"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create admin user:"
echo "   cd $API_APP && php artisan tinker"
echo "   User::create(['name'=>'Admin','email'=>'your@email.com','password'=>Hash::make('password'),'role'=>'admin','is_active'=>true]);"
echo
echo "2. Update API keys:"
echo "   nano $API_APP/.env"
echo "   # Add GEMINI_API_KEY and BIBLE_API_KEY"
echo "   cd $API_APP && php artisan config:cache"
echo
echo -e "${YELLOW}Future Deployments:${NC}"
echo "   cd $REPO_DIR"
echo "   ./scripts/deploy-hestia.sh           # Deploy both"
echo "   ./scripts/deploy-hestia.sh api       # API only"
echo "   ./scripts/deploy-hestia.sh frontend  # Frontend only"
echo
echo -e "${GREEN}Done!${NC}"
