@echo off
REM ===============================================================================
REM Export Local Database for Production Upload
REM ===============================================================================

setlocal

set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=lifestyle_backup_%TIMESTAMP%.sql

echo.
echo ========================================
echo   Export Local Database
echo ========================================
echo.

REM Check if mysqldump exists
where mysqldump >nul 2>nul
if errorlevel 1 (
    echo [ERROR] mysqldump not found in PATH
    echo Please add MySQL bin directory to your PATH or run from MySQL bin folder
    echo Usually: C:\xampp\mysql\bin or C:\Program Files\MySQL\MySQL Server 8.0\bin
    pause
    exit /b 1
)

echo Exporting database 'lifestyle' to %BACKUP_FILE%...
echo.

mysqldump -u admin -padmin --single-transaction --routines --triggers lifestyle > %BACKUP_FILE%

if errorlevel 1 (
    echo [ERROR] Database export failed
    pause
    exit /b 1
)

echo.
echo [OK] Database exported successfully!
echo.
echo File: %CD%\%BACKUP_FILE%
echo Size:
for %%A in (%BACKUP_FILE%) do echo %%~zA bytes
echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Upload to VPS:
echo    scp %BACKUP_FILE% deploy@YOUR_VPS_IP:~/
echo.
echo 2. SSH into VPS:
echo    ssh deploy@YOUR_VPS_IP
echo.
echo 3. Import the database:
echo    mysql -u lifestyle_user -p lifestyle_medicine ^< ~/%BACKUP_FILE%
echo.
echo 4. Clear Laravel cache:
echo    cd /var/www/lifestyle-medicine ^&^& php artisan cache:clear
echo.

pause
