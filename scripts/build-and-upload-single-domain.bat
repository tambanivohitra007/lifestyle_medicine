@echo off
REM ===============================================================================
REM Build and Upload React Frontend (Single Domain Setup)
REM
REM Usage: build-and-upload-single-domain.bat YOUR_VPS_IP lifestyle.rindra.org
REM ===============================================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: %0 ^<VPS_IP^> ^<DOMAIN^> [VPS_USER]
    echo Example: %0 123.45.67.89 lifestyle.rindra.org deploy
    exit /b 1
)

if "%~2"=="" (
    echo Usage: %0 ^<VPS_IP^> ^<DOMAIN^> [VPS_USER]
    exit /b 1
)

set VPS_IP=%~1
set DOMAIN=%~2
set VPS_USER=%~3
if "%VPS_USER%"=="" set VPS_USER=deploy
set REMOTE_PATH=/var/www/lifestyle-medicine/public/admin

echo.
echo ========================================
echo   Build and Upload (Single Domain)
echo ========================================
echo.
echo Domain: %DOMAIN%
echo API:    https://%DOMAIN%/api/v1
echo.

set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set ADMIN_DIR=%PROJECT_ROOT%\admin-dashboard

if not exist "%ADMIN_DIR%" set ADMIN_DIR=%CD%\admin-dashboard

echo Project: %ADMIN_DIR%
cd /d "%ADMIN_DIR%"

REM Step 1: Create .env.production
echo.
echo [1/4] Creating .env.production...
echo VITE_API_BASE_URL=https://%DOMAIN%/api/v1> .env.production
echo [OK] Created

REM Step 2: Install dependencies
echo.
echo [2/4] Installing dependencies...
call npm ci
if errorlevel 1 (
    echo [ERROR] npm ci failed
    exit /b 1
)
echo [OK] Installed

REM Step 3: Build
echo.
echo [3/4] Building for production...
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed
    exit /b 1
)
echo [OK] Built

REM Step 4: Upload
echo.
echo [4/4] Uploading to VPS...
scp -r dist/* %VPS_USER%@%VPS_IP%:%REMOTE_PATH%/
if errorlevel 1 (
    echo [ERROR] Upload failed
    exit /b 1
)
echo [OK] Uploaded

echo.
echo ========================================
echo   Success!
echo ========================================
echo.
echo Admin Dashboard: https://%DOMAIN%
echo API Endpoint:    https://%DOMAIN%/api/v1
echo.

pause
