@echo off
cd ..
echo ===================================
echo Focus Pocus Dev Mode Quick Test
echo ===================================
echo.

echo Step 1: Cleaning old dev data...
if exist logs-dev rmdir /s /q logs-dev
echo Done!
echo.

echo Step 2: Running dev mode...
echo Look for these in the console:
echo   - [Main] DEV_MODE: true
echo   - [Focus Pocus] DEV_MODE: true
echo   - [DEV MODE] Dev mode is ACTIVE
echo   - [DEV MODE] Generated fake session data
echo.
echo Press Ctrl+C to stop when you're done testing
echo.

npm run dev
