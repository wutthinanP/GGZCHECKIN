@echo off
title Check-in GGZ - Stop System
echo ===================================================
echo   [Check-in GGZ] Stopping System...
echo ===================================================
echo.

echo Stopping containers...
docker-compose stop

echo.
echo ===================================================
echo   System stopped successfully.
echo   (Database data is preserved)
echo ===================================================
echo.
pause
