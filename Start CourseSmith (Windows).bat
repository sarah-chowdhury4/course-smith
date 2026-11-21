@echo off
title CourseSmith
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required. Opening the download page...
  start "" https://nodejs.org/en/download
  pause
  exit /b 1
)
node server.js --open
pause
