@echo off
REM ===============================================================================
REM Sync Local Database to VPS
REM Exports local DB, uploads to VPS, and imports into production
REM
REM Usage: sync-database-to-vps.bat YOUR_VPS_IP
REM ===============================================================================

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo Usage: %0 ^<VPS_IP^> [VPS_USER] [REMOTE_DB_NAME] [REMOTE_DB_USER]
    echo Example: %0 123.45.67.89 deploy lifestyle_medicine lifestyle_user
    exit /b 1
)

set VPS_IP=%~1
set VPS_USER=%~2
set REMOTE_DB=%~3
set REMOTE_DB_USER=%~4

if "%VPS_USER%"=="" set VPS_USER=deploy
if "%REMOTE_DB%"=="" set REMOTE_DB=lifestyle_medicine
if "%REMOTE_DB_USER%"=="" set REMOTE_DB_USER=lifestyle_user

set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%
set BACKUP_FILE=lifestyle_backup_%TIMESTAMP%.sql

echo.
echo ========================================
echo   Sync Database to VPS
echo ========================================
echo.
echo VPS:           %VPS_IP%
echo VPS User:      %VPS_USER%
echo Remote DB:     %REMOTE_DB%
echo Remote User:   %REMOTE_DB_USER%
echo.

REM Check if mysqldump exists
where mysqldump >nul 2>nul
if errorlevel 1 (
    echo [ERROR] mysqldump not found in PATH
    echo.
    echo Add MySQL to PATH or specify full path. Common locations:
    echo   - C:\xampp\mysql\bin
    echo   - C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo   - C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin
    echo.
    pause
    exit /b 1
)

REM Step 1: Export local database
echo.
echo [Step 1/4] Exporting local database...
mysqldump -u admin -padmin --single-transaction --routines --triggers lifestyle > %BACKUP_FILE%
if errorlevel 1 (
    echo [ERROR] Export failed
    exit /b 1
)
echo [OK] Exported to %BACKUP_FILE%

REM Get file size
for %%A in (%BACKUP_FILE%) do set FILESIZE=%%~zA
echo     Size: %FILESIZE% bytes

REM Step 2: Upload to VPS
echo.
echo [Step 2/4] Uploading to VPS...
scp %BACKUP_FILE% %VPS_USER%@%VPS_IP%:~/
if errorlevel 1 (
    echo [ERROR] Upload failed
    exit /b 1
)
echo [OK] Uploaded to VPS

REM Step 3: Import on VPS
echo.
echo [Step 3/4] Importing database on VPS...
echo You will be prompted for the REMOTE database password.
echo.

ssh %VPS_USER%@%VPS_IP% "mysql -u %REMOTE_DB_USER% -p %REMOTE_DB% < ~/%BACKUP_FILE% && rm ~/%BACKUP_FILE%"
if errorlevel 1 (
    echo [ERROR] Import failed
    echo.
    echo Manual import instructions:
    echo   ssh %VPS_USER%@%VPS_IP%
    echo   mysql -u %REMOTE_DB_USER% -p %REMOTE_DB% ^< ~/%BACKUP_FILE%
    exit /b 1
)
echo [OK] Database imported

REM Step 4: Clear Laravel cache
echo.
echo [Step 4/4] Clearing Laravel cache...
ssh %VPS_USER%@%VPS_IP% "cd /var/www/lifestyle-medicine && php artisan cache:clear && php artisan config:cache"
echo [OK] Cache cleared

REM Cleanup local backup
del %BACKUP_FILE%

echo.
echo ========================================
echo   Database Sync Complete!
echo ========================================
echo.
echo Your local database has been uploaded to production.
echo.

pause
