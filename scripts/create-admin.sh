#!/bin/bash
#===============================================================================
# Lifestyle Medicine - Create Admin User Script
# Run this on the VPS after initial setup to create an admin user
#
# Usage:
#   chmod +x create-admin.sh
#   ./create-admin.sh
#===============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/var/www/lifestyle-medicine"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  Create Admin User${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Prompt for user details
read -p "Admin Name: " ADMIN_NAME
read -p "Admin Email: " ADMIN_EMAIL
read -sp "Admin Password: " ADMIN_PASSWORD
echo

# Confirm
echo -e "\n${YELLOW}Creating admin user:${NC}"
echo "  Name:  $ADMIN_NAME"
echo "  Email: $ADMIN_EMAIL"
echo

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Aborted."
    exit 1
fi

# Create user via artisan tinker
cd $APP_DIR

php artisan tinker --execute="
use App\Models\User;
use Illuminate\Support\Facades\Hash;

\$user = User::create([
    'name' => '$ADMIN_NAME',
    'email' => '$ADMIN_EMAIL',
    'password' => Hash::make('$ADMIN_PASSWORD'),
    'role' => 'admin',
    'is_active' => true,
]);

echo 'Admin user created with ID: ' . \$user->id . PHP_EOL;
"

echo -e "\n${GREEN}✓ Admin user created successfully!${NC}"
echo -e "You can now login at your admin dashboard.\n"
