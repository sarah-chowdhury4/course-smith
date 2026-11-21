@echo off
rem Double-click once to install everything CourseSmith needs: Python packages, the Devin CLI, and the Devin + Notion sign-ins.
setlocal
cd /d "%~dp0"
title CourseSmith setup
rem Devin Desktop terminals set ACP_BACKEND, which makes the Devin CLI ignore its own sign-in.
set "ACP_BACKEND="
echo == CourseSmith setup ==
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 or newer is required. Opening the download page...
  start "" "https://nodejs.org/en/download"
  goto fail
)
echo [ok] Node.js found

set "PY="
where py >nul 2>nul && set "PY=py -3"
if not defined PY where python >nul 2>nul && set "PY=python"
if not defined PY (
  echo Python 3 is required. Opening the download page...
  start "" "https://www.python.org/downloads/"
  goto fail
)
echo Installing Python packages...
%PY% -m pip install --user --quiet -r requirements.txt
if errorlevel 1 goto fail
echo [ok] Python packages installed

where devin >nul 2>nul
if errorlevel 1 (
  echo Installing the Devin CLI...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "irm https://static.devin.ai/cli/setup.ps1 | iex"
  for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path','User') + ';' + [Environment]::GetEnvironmentVariable('Path','Machine')"`) do set "PATH=%%p;%PATH%"
)
where devin >nul 2>nul
if errorlevel 1 (
  echo The Devin CLI was installed but is not on PATH yet. Close this window and run the setup again.
  goto fail
)
echo [ok] Devin CLI found

echo.
echo Sign in to Devin. A browser window will open...
call devin auth login
echo.
echo Connect Notion. Allow access to your copy of the Student OS dashboard...
call devin mcp login notion

echo.
echo Setup complete. Double-click "Start CourseSmith (Windows).bat" to open the app.
pause
exit /b 0

:fail
echo.
echo Setup did not finish. Fix the problem above, then run this again.
pause
exit /b 1
