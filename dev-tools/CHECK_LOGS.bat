@echo off
cd ..
echo ===================================
echo Checking Dev Mode Data
echo ===================================
echo.

echo Checking if logs-dev folder exists...
if exist logs-dev (
    echo [OK] logs-dev folder exists
    echo.
    echo Files in logs-dev:
    dir /b logs-dev
    echo.
    echo Contents of first JSON file:
    for %%f in (logs-dev\*.json) do (
        type "%%f"
        goto :done
    )
    :done
) else (
    echo [ERROR] logs-dev folder NOT FOUND
    echo This means DEV_MODE is not working properly
)
echo.

echo.
echo Checking if logs folder exists (production)...
if exist logs (
    echo [OK] logs folder exists
    echo Files in logs:
    dir /b logs
) else (
    echo [INFO] logs folder does not exist (normal if you haven't used production mode)
)
echo.

pause
