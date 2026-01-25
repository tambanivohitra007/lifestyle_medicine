@echo off
REM ===============================================================================
REM Lifestyle Medicine - Build and Upload Script (Windows Batch)
REM Run this on your LOCAL Windows machine to build and upload the React frontend
REM
REM Usage:
REM   build-and-upload.bat YOUR_VPS_IP api.yourdomain.com [deploy]
REM ===============================================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: %0 ^<VPS_IP^> ^<API_DOMAIN^> [VPS_USER]
    echo Example: %0 123.45.67.89 api.yourdomain.com deploy
    exit /b 1
)

if "%~2"=="" (
    echo Usage: %0 ^<VPS_IP^> ^<API_DOMAIN^> [VPS_USER]
    echo Example: %0 123.45.67.89 api.yourdomain.com deploy
    exit /b 1
)

set VPS_IP=%~1
set API_DOMAIN=%~2
set VPS_USER=%~3
if "%VPS_USER%"=="" set VPS_USER=deploy
set REMOTE_PATH=/var/www/lifestyle-medicine/public/admin

echo.
echo ========================================
echo   Build and Upload React Frontend
echo ========================================
echo.

REM Find admin-dashboard directory
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set ADMIN_DIR=%PROJECT_ROOT%\admin-dashboard

if not exist "%ADMIN_DIR%" (
    set ADMIN_DIR=%CD%\admin-dashboard
)

echo Project directory: %ADMIN_DIR%
cd /d "%ADMIN_DIR%"

REM Step 1: Create production environment file
echo.
echo Step 1: Creating production environment file...
echo VITE_API_BASE_URL=https://%API_DOMAIN%/api/v1> .env.production
echo [OK] Created .env.production

REM Step 2: Install dependencies
echo.
echo Step 2: Installing dependencies...
call npm ci
if errorlevel 1 (
    echo [ERROR] npm ci failed
    exit /b 1
)
echo [OK] Dependencies installed

REM Step 3: Build for production
echo.
echo Step 3: Building for production...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)
echo [OK] Build completed

REM Step 4: Upload to VPS
echo.
echo Step 4: Uploading to VPS...
echo You may be prompted for your SSH key passphrase

scp -r dist/* %VPS_USER%@%VPS_IP%:%REMOTE_PATH%/
if errorlevel 1 (
    echo [ERROR] Upload failed
    exit /b 1
)
echo [OK] Upload completed

REM Done
echo.
echo ========================================
echo   Upload Successful!
echo ========================================
echo.

REM Calculate admin domain
set ADMIN_DOMAIN=%API_DOMAIN:api.=admin.%
echo Admin dashboard is now available at:
echo https://%ADMIN_DOMAIN%
echo.

endlocal
