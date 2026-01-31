#!/bin/bash
#===============================================================================
# Lifestyle Medicine - HestiaCP Initial Setup Script
#
# Prerequisites:
#   1. HestiaCP installed on your VPS
#   2. User 'rindra' created in HestiaCP
#   3. Domains added in HestiaCP:
#      - api.rindra.org (for Laravel API)
#      - lifestyle.rindra.org (for React Dashboard)
#   4. SSL enabled for both domains (via HestiaCP Let's Encrypt)
#   5. Database created in HestiaCP
#
# Run as the HestiaCP user (rindra), not root:
#   chmod +x setup-hestia.sh
#   ./setup-hestia.sh
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
API_PUBLIC="$WEB_DIR/$API_DOMAIN/public_html"
ADMIN_PUBLIC="$WEB_DIR/$ADMIN_DOMAIN/public_html"

print_header "Lifestyle Medicine - HestiaCP Setup"

# Check we're running as the correct user
if [ "$(whoami)" != "$HESTIA_USER" ]; then
    print_error "Please run as user '$HESTIA_USER', not $(whoami)"
    echo "Use: su - $HESTIA_USER"
    exit 1
fi

# Check HestiaCP directories exist
if [ ! -d "$WEB_DIR" ]; then
    print_error "HestiaCP web directory not found at $WEB_DIR"
    echo "Make sure HestiaCP is properly set up for user $HESTIA_USER"
    exit 1
fi

echo -e "${YELLOW}This script will set up:${NC}"
echo "  - API:       https://$API_DOMAIN"
echo "  - Dashboard: https://$ADMIN_DOMAIN"
echo ""

# Check domains exist in HestiaCP
if [ ! -d "$API_PUBLIC" ]; then
    print_error "Domain $API_DOMAIN not found in HestiaCP"
    echo "Please add the domain in HestiaCP panel first"
    exit 1
fi

if [ ! -d "$ADMIN_PUBLIC" ]; then
    print_error "Domain $ADMIN_DOMAIN not found in HestiaCP"
    echo "Please add the domain in HestiaCP panel first"
    exit 1
fi

print_success "Both domains found in HestiaCP"

# Prompt for configuration
echo ""
read -p "Git Repository URL: " GIT_REPO
read -p "Database Name (created in HestiaCP): " DB_NAME
read -p "Database User (created in HestiaCP): " DB_USER
read -sp "Database Password: " DB_PASSWORD
echo

#===============================================================================
# STEP 1: Clone Repository
#===============================================================================
print_header "Step 1: Cloning Repository"

if [ -d "$REPO_DIR/.git" ]; then
    print_warning "Repository already exists - pulling latest"
    cd "$REPO_DIR"
    git pull origin main
else
    git clone "$GIT_REPO" "$REPO_DIR"
fi
print_success "Repository ready at $REPO_DIR"

#===============================================================================
# STEP 2: Install Composer Dependencies
#===============================================================================
print_header "Step 2: Installing Composer Dependencies"

cd "$REPO_DIR"
composer install --optimize-autoloader --no-dev
print_success "Composer dependencies installed"

#===============================================================================
# STEP 3: Configure Environment
#===============================================================================
print_header "Step 3: Configuring Environment"

cp .env.example .env

# Update .env file
sed -i "s|APP_ENV=local|APP_ENV=production|g" .env
sed -i "s|APP_DEBUG=true|APP_DEBUG=false|g" .env
sed -i "s|APP_URL=http://localhost:8000|APP_URL=https://$API_DOMAIN|g" .env
sed -i "s|APP_URL=http://localhost|APP_URL=https://$API_DOMAIN|g" .env
sed -i "s|DB_CONNECTION=sqlite|DB_CONNECTION=mysql|g" .env
sed -i "s|DB_DATABASE=laravel|DB_DATABASE=$DB_NAME|g" .env
sed -i "s|DB_DATABASE=lifestyle_medicine|DB_DATABASE=$DB_NAME|g" .env
sed -i "s|# DB_HOST=127.0.0.1|DB_HOST=localhost|g" .env
sed -i "s|# DB_PORT=3306|DB_PORT=3306|g" .env
sed -i "s|# DB_USERNAME=root|DB_USERNAME=$DB_USER|g" .env
sed -i "s|# DB_USERNAME=|DB_USERNAME=$DB_USER|g" .env
sed -i "s|DB_USERNAME=root|DB_USERNAME=$DB_USER|g" .env
sed -i "s|# DB_PASSWORD=|DB_PASSWORD=$DB_PASSWORD|g" .env
sed -i "s|DB_PASSWORD=$|DB_PASSWORD=$DB_PASSWORD|g" .env
sed -i "s|CORS_ALLOWED_ORIGINS=http://localhost:5173|CORS_ALLOWED_ORIGINS=https://$ADMIN_DOMAIN|g" .env
sed -i "s|SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,127.0.0.1,127.0.0.1:8000|SANCTUM_STATEFUL_DOMAINS=$ADMIN_DOMAIN|g" .env

php artisan key:generate
print_success "Environment configured"

#===============================================================================
# STEP 4: Deploy API
#===============================================================================
print_header "Step 4: Deploying API"

# Sync Laravel files to API directory
print_info "Syncing Laravel files to $API_PUBLIC..."
rsync -av --delete \
    --exclude='admin-dashboard/node_modules' \
    --exclude='admin-dashboard/dist' \
    --exclude='.git' \
    --exclude='scripts' \
    "$REPO_DIR/" "$API_PUBLIC/"

cd "$API_PUBLIC"

# Create storage link
php artisan storage:link 2>/dev/null || true

# Run migrations
php artisan migrate --force

# Optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Set permissions
chmod -R 755 "$API_PUBLIC"
chmod -R 775 "$API_PUBLIC/storage"
chmod -R 775 "$API_PUBLIC/bootstrap/cache"

print_success "API deployed"

#===============================================================================
# STEP 5: Build and Deploy Frontend
#===============================================================================
print_header "Step 5: Building Frontend"

cd "$REPO_DIR/admin-dashboard"

# Create production environment
echo "VITE_API_BASE_URL=https://$API_DOMAIN/api/v1" > .env.production

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found!"
    echo ""
    echo "To install Node.js on the server, run as root:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    echo "  apt install -y nodejs"
    echo ""
    echo "Or build locally and upload:"
    echo "  cd admin-dashboard"
    echo "  npm run build"
    echo "  scp -r dist/* $HESTIA_USER@YOUR_VPS:$ADMIN_PUBLIC/"
    echo ""
else
    npm ci --prefer-offline --no-audit
    npm run build

    # Deploy to admin public directory
    rm -rf "$ADMIN_PUBLIC"/*
    cp -r dist/* "$ADMIN_PUBLIC/"
    chmod -R 755 "$ADMIN_PUBLIC"

    print_success "Frontend deployed"
fi

#===============================================================================
# STEP 6: Make Deploy Script Executable
#===============================================================================
print_header "Step 6: Setting Up Deploy Script"

chmod +x "$REPO_DIR/scripts/deploy-hestia.sh"

print_success "Deploy script ready at $REPO_DIR/scripts/deploy-hestia.sh"

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
echo -e "${YELLOW}HestiaCP Configuration:${NC}"
echo "Make sure in HestiaCP panel:"
echo "  1. PHP version is set to 8.2+ for $API_DOMAIN"
echo "  2. SSL is enabled for both domains"
echo "  3. Nginx template allows Laravel routing"
echo
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Create admin user:"
echo "   cd $API_PUBLIC && php artisan tinker"
echo "   User::create(['name'=>'Admin','email'=>'your@email.com','password'=>Hash::make('password'),'role'=>'admin','is_active'=>true]);"
echo
echo "2. Update API keys:"
echo "   nano $API_PUBLIC/.env"
echo "   # Add GEMINI_API_KEY and BIBLE_API_KEY"
echo "   cd $API_PUBLIC && php artisan config:cache"
echo
echo -e "${YELLOW}Future Deployments:${NC}"
echo "   cd $REPO_DIR"
echo "   ./scripts/deploy-hestia.sh           # Deploy both"
echo "   ./scripts/deploy-hestia.sh api       # API only"
echo "   ./scripts/deploy-hestia.sh frontend  # Frontend only"
echo
echo -e "${GREEN}Done!${NC}"
