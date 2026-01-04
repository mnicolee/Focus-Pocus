@echo off
cd /d "%~dp0"
echo Starting Focus Pocus...
echo.
echo If this is your first time running, please wait while dependencies install...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Launching Focus Pocus...
call npm start
