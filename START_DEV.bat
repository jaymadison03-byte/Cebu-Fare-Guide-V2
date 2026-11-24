@echo off
setlocal
cd /d "%~dp0"
title Cebu Fare Guide - Development Server

echo ==========================================
echo       CEBU FARE GUIDE - START DEV
 echo ==========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Install the current Node.js LTS version, then reopen this file.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Reinstall Node.js with npm included.
  pause
  exit /b 1
)

echo Node version:
node --version
echo npm version:
npm --version
echo.

if not exist "node_modules" (
  echo Installing project dependencies. This may take a few minutes...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation failed. Please copy the error above.
    pause
    exit /b 1
  )
) else (
  echo node_modules already exists. Checking dependencies...
  call npm install
  if errorlevel 1 (
    echo.
    echo Dependency installation/check failed. Please copy the error above.
    pause
    exit /b 1
  )
)

echo.
echo Starting Cebu Fare Guide...
echo When Vite displays the Local URL, open it in your browser.
echo Press Ctrl+C to stop the development server.
echo.
call npm run dev
pause
