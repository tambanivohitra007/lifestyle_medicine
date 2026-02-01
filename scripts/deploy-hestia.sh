#!/bin/bash
#===============================================================================
# Lifestyle Medicine - HestiaCP Deployment Script
# Run this after git pull to update the application
#
# Structure:
#   /home/rindra/web/
#   ├── lifestyle-medicine/              # Git repository
#   ├── api.rindra.org/
#   │   ├── app/                         # Laravel application
#   │   └── public_html/                 # Laravel's public folder
#   └── lifestyle.rindra.org/
#       └── public_html/                 # React build
#
# Usage:
#   ./scripts/deploy-hestia.sh          # Deploy both API and frontend
#   ./scripts/deploy-hestia.sh api      # Deploy API only
#   ./scripts/deploy-hestia.sh frontend # Deploy frontend only
#===============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${BLUE}→ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

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

# Determine what to deploy
DEPLOY_TARGET=${1:-all}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Lifestyle Medicine Deployment${NC}"
echo -e "${BLUE}  (HestiaCP)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Detect repo directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/../artisan" ]; then
    REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
fi

# Check if repo exists
if [ ! -d "$REPO_DIR/.git" ]; then
    print_error "Repository not found at $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"

# Pull latest code
print_info "Pulling latest code from git..."
git pull origin main
print_success "Code updated"

#===============================================================================
# Ensure server timeout configurations for AI requests
#===============================================================================
ensure_timeout_configs() {
    print_info "Checking server timeout configurations..."

    local NEEDS_APACHE_RESTART=false
    local NEEDS_NGINX_RELOAD=false
    local NEEDS_PHP_RESTART=false

    # 1. Apache global timeout (needs to be 300 for AI requests)
    if grep -q "^Timeout 30$" /etc/apache2/apache2.conf 2>/dev/null; then
        print_info "Updating Apache timeout to 300s..."
        sed -i 's/^Timeout 30$/Timeout 300/' /etc/apache2/apache2.conf
        NEEDS_APACHE_RESTART=true
    fi

    # 2. Nginx timeout config for API domain
    NGINX_TIMEOUT_CONF="/home/$HESTIA_USER/conf/web/$API_DOMAIN/nginx.ssl.conf_timeout"
    if [ ! -f "$NGINX_TIMEOUT_CONF" ] || ! grep -q "proxy_read_timeout 300s" "$NGINX_TIMEOUT_CONF" 2>/dev/null; then
        print_info "Creating Nginx timeout config..."
        cat > "$NGINX_TIMEOUT_CONF" << 'NGINXTIMEOUT'
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
fastcgi_read_timeout 300s;
NGINXTIMEOUT
        NEEDS_NGINX_RELOAD=true
    fi

    # 3. PHP-FPM pool timeout
    PHP_FPM_CONF="/etc/php/8.4/fpm/pool.d/$API_DOMAIN.conf"
    if [ -f "$PHP_FPM_CONF" ] && ! grep -q "request_terminate_timeout" "$PHP_FPM_CONF" 2>/dev/null; then
        print_info "Adding PHP-FPM request_terminate_timeout..."
        echo "request_terminate_timeout = 300" >> "$PHP_FPM_CONF"
        NEEDS_PHP_RESTART=true
    fi

    # 4. PHP max_execution_time
    PHP_INI="/etc/php/8.4/fpm/php.ini"
    if [ -f "$PHP_INI" ] && grep -q "^max_execution_time = 30$" "$PHP_INI" 2>/dev/null; then
        print_info "Updating PHP max_execution_time to 300..."
        sed -i 's/^max_execution_time = 30$/max_execution_time = 300/' "$PHP_INI"
        NEEDS_PHP_RESTART=true
    fi

    # Restart services if needed
    if [ "$NEEDS_APACHE_RESTART" = true ]; then
        print_info "Restarting Apache..."
        systemctl restart apache2
    fi

    if [ "$NEEDS_NGINX_RELOAD" = true ]; then
        print_info "Reloading Nginx..."
        nginx -t && systemctl reload nginx
    fi

    if [ "$NEEDS_PHP_RESTART" = true ]; then
        print_info "Restarting PHP-FPM..."
        systemctl restart php8.4-fpm
    fi

    print_success "Timeout configurations verified"
}

#===============================================================================
# Deploy API (Laravel)
#===============================================================================
deploy_api() {
    echo ""
    print_info "Deploying API to $API_DOMAIN..."

    cd "$REPO_DIR"

    # Install Composer dependencies
    print_info "Installing Composer dependencies..."
    composer install --optimize-autoloader --no-dev --no-interaction
    print_success "Composer dependencies installed"

    # Sync Laravel files to app directory
    print_info "Syncing files to $API_APP..."
    rsync -av --delete \
        --exclude='admin-dashboard/node_modules' \
        --exclude='admin-dashboard/dist' \
        --exclude='.git' \
        "$REPO_DIR/" "$API_APP/"

    # Update public_html with Laravel's public folder
    print_info "Updating public_html..."
    rsync -av --delete "$API_APP/public/" "$API_PUBLIC/"

    # Fix index.php paths for HestiaCP structure
    print_info "Fixing index.php paths..."
    cat > "$API_PUBLIC/index.php" << 'INDEXPHP'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../app/storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../app/vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../app/bootstrap/app.php';

// Set correct storage path for HestiaCP structure
$app->useStoragePath(__DIR__.'/../app/storage');

$app->handleRequest(Request::capture());
INDEXPHP

    # Create storage directories if missing
    mkdir -p "$API_APP/storage/logs"
    mkdir -p "$API_APP/storage/framework/cache"
    mkdir -p "$API_APP/storage/framework/sessions"
    mkdir -p "$API_APP/storage/framework/views"
    mkdir -p "$API_APP/bootstrap/cache"

    cd "$API_APP"

    # Run migrations
    print_info "Running database migrations..."
    php artisan migrate --force
    print_success "Migrations completed"

    # Clear and rebuild caches
    print_info "Optimizing Laravel..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
    print_success "Laravel optimized"

    # Fix permissions
    print_info "Setting permissions..."
    chown -R $WEB_USER:$WEB_GROUP "$API_DIR"
    chmod -R 755 "$API_DIR"
    chmod -R 775 "$API_APP/storage"
    chmod -R 775 "$API_APP/bootstrap/cache"

    # Ensure server timeout configs for AI requests
    ensure_timeout_configs

    print_success "API deployment complete!"
}

#===============================================================================
# Deploy Frontend (React)
#===============================================================================
deploy_frontend() {
    echo ""
    print_info "Deploying Frontend to $ADMIN_DOMAIN..."

    ADMIN_SRC="$REPO_DIR/admin-dashboard"

    if [ ! -d "$ADMIN_SRC" ]; then
        print_error "Admin dashboard directory not found at $ADMIN_SRC"
        exit 1
    fi

    cd "$ADMIN_SRC"

    # Create production environment file
    print_info "Creating production environment..."
    echo "VITE_API_BASE_URL=https://$API_DOMAIN/api/v1" > .env.production
    print_success "Environment file created"

    # Install npm dependencies
    print_info "Installing npm dependencies..."
    npm ci --prefer-offline --no-audit
    print_success "NPM dependencies installed"

    # Build for production
    print_info "Building React application..."
    npm run build
    print_success "Build completed"

    # Deploy to admin public directory
    print_info "Deploying build to $ADMIN_PUBLIC..."
    rm -rf "$ADMIN_PUBLIC"/*
    cp -r dist/* "$ADMIN_PUBLIC/"

    # Fix permissions
    chown -R $WEB_USER:$WEB_GROUP "$ADMIN_PUBLIC"
    chmod -R 755 "$ADMIN_PUBLIC"

    print_success "Frontend deployment complete!"
}

#===============================================================================
# Execute deployment based on target
#===============================================================================
case $DEPLOY_TARGET in
    api)
        deploy_api
        ;;
    frontend)
        deploy_frontend
        ;;
    all|*)
        deploy_api
        deploy_frontend
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "API:       ${BLUE}https://$API_DOMAIN${NC}"
echo -e "Dashboard: ${BLUE}https://$ADMIN_DOMAIN${NC}"
echo ""
