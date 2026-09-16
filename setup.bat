@echo off
title Check-in GGZ - First Time Setup
echo ===================================================
echo   [Check-in GGZ] First Time Setup and Start
echo ===================================================
echo.

echo [1/4] Checking Docker status...
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
echo [2/4] Building and starting containers...
docker-compose down -v >nul 2>&1
docker-compose up --build -d
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start containers. Please check Docker Desktop.
    echo.
    pause
    exit /b 1
)

echo.
echo [3/4] Waiting for Database and Backend to be ready (15s)...
timeout /t 15 /nobreak >nul

echo.
echo [4/4] Seeding sample data...
docker-compose exec -T backend node src/seed.js

echo.
echo ===================================================
echo   Setup Complete! System is ready.
echo ===================================================
echo   Frontend : http://localhost:8081
echo   Backend  : http://localhost:3001
echo.
echo   [Test Login Account]
echo   Email    : employee1@company.com
echo   Password : 123456
echo ===================================================
echo.
echo Opening browser...
start http://localhost:8081
pause
