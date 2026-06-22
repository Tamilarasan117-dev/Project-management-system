@echo off
setlocal enabledelayedexpansion
title CRM DIGITALIZATION Server

echo =======================================
echo Starting CRM DIGITALIZATION Application
echo =======================================

:: Change to the project directory cleanly
cd /d "D:\CRM Digitalization"

if not exist package.json (
    echo ERROR: package.json not found!
    echo Please check the project path.
    pause
    exit /b
)

echo.
echo ==================================================
echo   NETWORK ACCESS LINKS (Share these with others)
echo ==================================================
echo.
:: Extract IPv4 addresses and format them as HTTP links
for /f "tokens=2 delims=:" %%A in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP Address"') do (
    set "ip=%%A"
    set "ip=!ip: =!"
    echo   Network Link: http://!ip!:3000
)
echo.
echo ==================================================
echo.

:: Wait 3 seconds to ensure the process is ready, then automatically open the browser locally
start "" "http://localhost:3000"

:: Start the application
npm run dev

pause