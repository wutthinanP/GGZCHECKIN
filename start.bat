@echo off
title Check-in GGZ - Start System
echo ===================================================
echo   [Check-in GGZ] Starting System...
echo ===================================================
echo.

echo [1/2] Checking Docker status...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker Desktop is not running!
    echo Please start Docker Desktop first and try again.
    echo.
    pause
    exit /b 1
)
echo Docker is running.

echo.
echo [2/2] Starting containers...
docker-compose up -d

echo.
echo ===================================================
echo   System Started Successfully!
echo   Frontend : http://localhost:8080
echo   Backend  : http://localhost:3000
echo ===================================================
echo.
echo Opening browser...
start http://localhost:8080
pause
