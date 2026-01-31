@echo off
REM ===============================================================================
REM Remote Deploy Script - Trigger deployment from Windows
REM Executes deploy.sh on the VPS via SSH
REM
REM Usage:
REM   remote-deploy.bat VPS_IP [target]
REM   remote-deploy.bat VPS_IP          # Deploy everything
REM   remote-deploy.bat VPS_IP api      # Deploy API only
REM   remote-deploy.bat VPS_IP frontend # Deploy frontend only
REM ===============================================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: %0 ^<VPS_IP^> [target]
    echo.
    echo Targets:
    echo   ^(none^)  - Deploy both API and frontend
    echo   api      - Deploy API only
    echo   frontend - Deploy frontend only
    echo.
    echo Example: %0 123.45.67.89
    echo Example: %0 123.45.67.89 api
    exit /b 1
)

set VPS_IP=%~1
set TARGET=%~2
set VPS_USER=deploy

echo.
echo ========================================
echo   Remote Deployment to %VPS_IP%
echo ========================================
echo.

if "%TARGET%"=="" (
    echo Deploying: API + Frontend
    ssh %VPS_USER%@%VPS_IP% "cd /var/www/lifestyle-medicine && ./deploy.sh"
) else (
    echo Deploying: %TARGET%
    ssh %VPS_USER%@%VPS_IP% "cd /var/www/lifestyle-medicine && ./deploy.sh %TARGET%"
)

if errorlevel 1 (
    echo.
    echo [ERROR] Deployment failed!
    exit /b 1
)

echo.
echo ========================================
echo   Deployment Complete!
echo ========================================
echo.
echo API:       https://api.rindra.org
echo Dashboard: https://lifestyle.rindra.org
echo.

endlocal
