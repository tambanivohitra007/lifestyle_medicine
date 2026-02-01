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

    # Ensure index.php has correct paths
    sed -i "s|require __DIR__.'/../vendor/autoload.php'|require __DIR__.'/../app/vendor/autoload.php'|g" "$API_PUBLIC/index.php"
    sed -i "s|require_once __DIR__.'/../bootstrap/app.php'|require_once __DIR__.'/../app/bootstrap/app.php'|g" "$API_PUBLIC/index.php"

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
