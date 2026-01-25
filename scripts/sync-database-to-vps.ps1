#===============================================================================
# Sync Local Database to VPS (PowerShell)
# Exports local DB, uploads to VPS, and imports into production
#
# Usage:
#   .\sync-database-to-vps.ps1 -VpsIp "YOUR_VPS_IP"
#===============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,

    [string]$VpsUser = "deploy",
    [string]$RemoteDb = "lifestyle_medicine",
    [string]$RemoteDbUser = "lifestyle_user",
    [string]$LocalDb = "lifestyle",
    [string]$LocalDbUser = "admin",
    [string]$LocalDbPass = "admin"
)

$ErrorActionPreference = "Stop"

function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Info { Write-Host "→ $args" -ForegroundColor Cyan }
function Write-Step { Write-Host "`n[$($args[0])] $($args[1])" -ForegroundColor Yellow }

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Sync Database to VPS" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Local DB:      $LocalDb"
Write-Host "  VPS:           $VpsIp"
Write-Host "  Remote DB:     $RemoteDb"
Write-Host "  Remote User:   $RemoteDbUser"
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "lifestyle_backup_$timestamp.sql"

# Find mysqldump
$mysqlPaths = @(
    "C:\xampp\mysql\bin\mysqldump.exe",
    "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
    "mysqldump"  # Try PATH
)

$mysqldump = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path -ErrorAction SilentlyContinue) {
        $mysqldump = $path
        break
    }
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $mysqldump = $path
        break
    }
}

if (-not $mysqldump) {
    Write-Host "ERROR: mysqldump not found!" -ForegroundColor Red
    Write-Host "Please install MySQL or add it to PATH" -ForegroundColor Red
    exit 1
}

Write-Info "Using mysqldump: $mysqldump"

# Step 1: Export
Write-Step "1/4" "Exporting local database..."

$exportCmd = "& `"$mysqldump`" -u $LocalDbUser -p$LocalDbPass --single-transaction --routines --triggers $LocalDb"
Invoke-Expression $exportCmd | Out-File -FilePath $backupFile -Encoding UTF8

$fileSize = (Get-Item $backupFile).Length
Write-Success "Exported to $backupFile ($([math]::Round($fileSize/1KB, 2)) KB)"

# Step 2: Upload
Write-Step "2/4" "Uploading to VPS..."

scp $backupFile "${VpsUser}@${VpsIp}:~/"
if ($LASTEXITCODE -ne 0) { throw "Upload failed" }
Write-Success "Uploaded to VPS"

# Step 3: Import
Write-Step "3/4" "Importing on VPS..."
Write-Host "You will be prompted for the REMOTE database password." -ForegroundColor Yellow

$importCmd = "mysql -u $RemoteDbUser -p $RemoteDb < ~/$backupFile && rm ~/$backupFile"
ssh "${VpsUser}@${VpsIp}" $importCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Import may have failed. Check manually:" -ForegroundColor Yellow
    Write-Host "  ssh $VpsUser@$VpsIp" -ForegroundColor Gray
    Write-Host "  mysql -u $RemoteDbUser -p $RemoteDb < ~/$backupFile" -ForegroundColor Gray
}
Write-Success "Database imported"

# Step 4: Clear cache
Write-Step "4/4" "Clearing Laravel cache..."

ssh "${VpsUser}@${VpsIp}" "cd /var/www/lifestyle-medicine && php artisan cache:clear && php artisan config:cache"
Write-Success "Cache cleared"

# Cleanup
Remove-Item $backupFile -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Database Sync Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
