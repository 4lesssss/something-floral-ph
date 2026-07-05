@echo off
title Something Floral PH
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is not installed.
  echo Download it from https://nodejs.org then run this file again.
  pause
  exit /b 1
)

if not exist "client\node_modules\" (
  echo First run: installing dependencies. This may take a few minutes...
  call npm.cmd install --prefix client
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)

echo.
echo ============================================================
echo   Something Floral PH — Development Server
echo ============================================================
echo.
echo   IMPORTANT: You also need PHP + MySQL running separately.
echo   Start XAMPP (Apache + MySQL) before using the website.
echo.
echo   Frontend:  http://localhost:5173
echo   PHP API:   Start via XAMPP or run: php -S localhost:8000 -t .
echo.
echo   Keep this window open. Press Ctrl+C to stop.
echo.

call npm.cmd run dev
pause
