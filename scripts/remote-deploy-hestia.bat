@echo off
REM ===============================================================================
REM Remote Deploy Script for HestiaCP - Trigger deployment from Windows
REM
REM Usage:
REM   remote-deploy-hestia.bat VPS_IP [target]
REM   remote-deploy-hestia.bat VPS_IP          # Deploy everything
REM   remote-deploy-hestia.bat VPS_IP api      # Deploy API only
REM   remote-deploy-hestia.bat VPS_IP frontend # Deploy frontend only
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
set VPS_USER=rindra

echo.
echo ========================================
echo   HestiaCP Remote Deployment
echo   VPS: %VPS_IP%
echo ========================================
echo.

if "%TARGET%"=="" (
    echo Deploying: API + Frontend
    ssh %VPS_USER%@%VPS_IP% "cd ~/web/lifestyle-medicine && ./scripts/deploy-hestia.sh"
) else (
    echo Deploying: %TARGET%
    ssh %VPS_USER%@%VPS_IP% "cd ~/web/lifestyle-medicine && ./scripts/deploy-hestia.sh %TARGET%"
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
