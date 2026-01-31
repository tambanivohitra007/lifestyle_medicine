#!/bin/bash
#===============================================================================
# Lifestyle Medicine - Unified Deployment Script
# Run this on your VPS after git pull to update the application
#
# Usage:
#   ./deploy.sh          # Deploy both API and frontend
#   ./deploy.sh api      # Deploy API only
#   ./deploy.sh frontend # Deploy frontend only
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

# Configuration - Edit these if needed
APP_DIR="/var/www/lifestyle-medicine"
API_DOMAIN="api.rindra.org"
ADMIN_DOMAIN="lifestyle.rindra.org"

# Determine what to deploy
DEPLOY_TARGET=${1:-all}

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Lifestyle Medicine Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$APP_DIR"

# Pull latest code
print_info "Pulling latest code from git..."
git pull origin main
print_success "Code updated"

#===============================================================================
# Deploy API (Laravel)
#===============================================================================
deploy_api() {
    echo ""
    print_info "Deploying API..."

    # Install Composer dependencies
    print_info "Installing Composer dependencies..."
    composer install --optimize-autoloader --no-dev --no-interaction
    print_success "Composer dependencies installed"

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

    # Restart PHP-FPM
    print_info "Restarting PHP-FPM..."
    sudo systemctl restart php8.2-fpm 2>/dev/null || sudo systemctl restart php8.3-fpm 2>/dev/null || true
    print_success "PHP-FPM restarted"

    print_success "API deployment complete!"
}

#===============================================================================
# Deploy Frontend (React)
#===============================================================================
deploy_frontend() {
    echo ""
    print_info "Deploying Frontend..."

    ADMIN_DIR="$APP_DIR/admin-dashboard"

    if [ ! -d "$ADMIN_DIR" ]; then
        print_error "Admin dashboard directory not found at $ADMIN_DIR"
        exit 1
    fi

    cd "$ADMIN_DIR"

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

    # Copy build to public/admin directory
    print_info "Deploying build to public directory..."
    rm -rf "$APP_DIR/public/admin"/*
    cp -r dist/* "$APP_DIR/public/admin/"
    print_success "Frontend deployed to public/admin"

    # Set correct permissions
    chown -R $(whoami):www-data "$APP_DIR/public/admin" 2>/dev/null || true

    cd "$APP_DIR"
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
