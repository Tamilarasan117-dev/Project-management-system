@echo off
title CRM DIGITALIZATION

echo ============================
echo Starting CRM DIGITALIZATION
echo ============================

REM Change to project folder
cd /d "D:\CRM Digitalization"

REM Check if package.json exists
if not exist package.json (
    echo ERROR: package.json not found!
    echo Please check the project path.
    pause
    exit /b
)

REM Build and Start the Application for the Network
npm start

pause