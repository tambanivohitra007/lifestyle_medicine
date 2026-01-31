#===============================================================================
# Remote Deploy Script - Trigger deployment from Windows PowerShell
# Executes deploy.sh on the VPS via SSH
#
# Usage:
#   .\remote-deploy.ps1 -VpsIp "YOUR_VPS_IP"
#   .\remote-deploy.ps1 -VpsIp "YOUR_VPS_IP" -Target "api"
#   .\remote-deploy.ps1 -VpsIp "YOUR_VPS_IP" -Target "frontend"
#===============================================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIp,

    [Parameter(Mandatory=$false)]
    [ValidateSet("all", "api", "frontend")]
    [string]$Target = "all",

    [Parameter(Mandatory=$false)]
    [string]$VpsUser = "deploy"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Blue
Write-Host "  Remote Deployment to $VpsIp" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

$deployTarget = if ($Target -eq "all") { "" } else { $Target }

Write-Host "Target: $(if ($Target -eq 'all') { 'API + Frontend' } else { $Target })" -ForegroundColor Yellow

try {
    if ($deployTarget) {
        ssh "${VpsUser}@${VpsIp}" "cd /var/www/lifestyle-medicine && ./deploy.sh $deployTarget"
    } else {
        ssh "${VpsUser}@${VpsIp}" "cd /var/www/lifestyle-medicine && ./deploy.sh"
    }

    if ($LASTEXITCODE -ne 0) {
        throw "SSH command failed with exit code $LASTEXITCODE"
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Deployment Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "API:       https://api.rindra.org" -ForegroundColor Cyan
    Write-Host "Dashboard: https://lifestyle.rindra.org" -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed: $_" -ForegroundColor Red
    exit 1
}
