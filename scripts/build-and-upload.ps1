#===============================================================================
# Lifestyle Medicine - Build and Upload Script (Windows PowerShell)
# Run this on your LOCAL Windows machine to build and upload the React frontend
#
# Usage:
#   .\build-and-upload.ps1 -VpsIp "YOUR_VPS_IP" -ApiDomain "api.yourdomain.com"
#===============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,

    [Parameter(Mandatory=$true)]
    [string]$ApiDomain,

    [string]$VpsUser = "deploy",
    [string]$RemotePath = "/var/www/lifestyle-medicine/public/admin"
)

$ErrorActionPreference = "Stop"

# Colors
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "→ $args" -ForegroundColor Cyan }
function Write-Warning { Write-Host "⚠ $args" -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Build and Upload React Frontend" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Get project root
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$AdminDashboard = Join-Path $ProjectRoot "admin-dashboard"

if (-not (Test-Path $AdminDashboard)) {
    $AdminDashboard = Join-Path (Get-Location) "admin-dashboard"
}

Write-Info "Project directory: $AdminDashboard"

# Change to admin-dashboard directory
Set-Location $AdminDashboard

# Step 1: Create production environment file
Write-Host ""
Write-Info "Step 1: Creating production environment file..."

$envContent = "VITE_API_BASE_URL=https://$ApiDomain/api/v1"
$envContent | Out-File -FilePath ".env.production" -Encoding UTF8 -NoNewline
Write-Success "Created .env.production"

# Step 2: Install dependencies
Write-Host ""
Write-Info "Step 2: Installing dependencies..."

npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed" }
Write-Success "Dependencies installed"

# Step 3: Build for production
Write-Host ""
Write-Info "Step 3: Building for production..."

npm run build
if ($LASTEXITCODE -ne 0) { throw "Build failed" }
Write-Success "Build completed"

# Step 4: Upload to VPS
Write-Host ""
Write-Info "Step 4: Uploading to VPS..."
Write-Warning "You may be prompted for your SSH key passphrase"

$distPath = Join-Path $AdminDashboard "dist\*"

# Use SCP to upload
scp -r $distPath "${VpsUser}@${VpsIp}:${RemotePath}/"
if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
Write-Success "Upload completed"

# Done
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Upload Successful!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Admin dashboard is now available at:" -ForegroundColor Cyan
Write-Host "https://$($ApiDomain -replace 'api\.', 'admin.')" -ForegroundColor Yellow
Write-Host ""
