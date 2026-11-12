@echo off
echo ================================================
echo Focus Pocus - Production Mode Test
echo ================================================
echo.

echo Checking your production data...
echo.

if exist logs (
    echo [OK] Production logs folder exists
    echo.
    echo Checking for session files:
    dir /b logs\*.json 2>nul
    if errorlevel 1 (
        echo [INFO] No session files found yet
        echo You haven't created any sessions in production mode
    ) else (
        echo.
        echo Checking latest session file:
        for /f "delims=" %%f in ('dir /b /o-d logs\*.json 2^>nul') do (
            echo Latest file: %%f
            type "logs\%%f"
            goto :found
        )
        :found
    )
) else (
    echo [INFO] No logs folder found - you haven't used production mode yet
)

echo.
echo ================================================
echo Let's create a test session!
echo ================================================
echo.
echo Steps:
echo 1. The app will start in production mode
echo 2. Click START button
echo 3. Wait 10 seconds
echo 4. Click STOP button
echo 5. Rate your efficiency (try 85%%)
echo 6. Click Submit
echo 7. Close the app
echo 8. Run this script again to see your data!
echo.
pause
echo.
echo Starting production mode...
npm start
