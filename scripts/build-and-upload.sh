#!/bin/bash
#===============================================================================
# Lifestyle Medicine - Build and Upload Script (Mac/Linux)
# Run this on your LOCAL machine to build and upload the React frontend
#
# Usage:
#   chmod +x build-and-upload.sh
#   ./build-and-upload.sh YOUR_VPS_IP api.yourdomain.com
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

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <VPS_IP> <API_DOMAIN> [VPS_USER]"
    echo "Example: $0 123.45.67.89 api.yourdomain.com deploy"
    exit 1
fi

VPS_IP=$1
API_DOMAIN=$2
VPS_USER=${3:-deploy}
REMOTE_PATH="/var/www/lifestyle-medicine/public/admin"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Build and Upload React Frontend${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Find admin-dashboard directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ADMIN_DIR="$PROJECT_ROOT/admin-dashboard"

if [ ! -d "$ADMIN_DIR" ]; then
    ADMIN_DIR="$(pwd)/admin-dashboard"
fi

print_info "Project directory: $ADMIN_DIR"
cd "$ADMIN_DIR"

# Step 1: Create production environment file
echo ""
print_info "Step 1: Creating production environment file..."
echo "VITE_API_BASE_URL=https://$API_DOMAIN/api/v1" > .env.production
print_success "Created .env.production"

# Step 2: Install dependencies
echo ""
print_info "Step 2: Installing dependencies..."
npm ci
print_success "Dependencies installed"

# Step 3: Build for production
echo ""
print_info "Step 3: Building for production..."
npm run build
print_success "Build completed"

# Step 4: Upload to VPS
echo ""
print_info "Step 4: Uploading to VPS..."
print_warning "You may be prompted for your SSH key passphrase"

scp -r dist/* "${VPS_USER}@${VPS_IP}:${REMOTE_PATH}/"
print_success "Upload completed"

# Done
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Upload Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
ADMIN_DOMAIN=$(echo "$API_DOMAIN" | sed 's/api\./admin./')
echo -e "Admin dashboard is now available at:"
echo -e "${YELLOW}https://$ADMIN_DOMAIN${NC}"
echo ""
