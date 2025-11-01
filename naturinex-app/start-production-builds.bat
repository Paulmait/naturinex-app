@echo off
echo ========================================
echo NATURINEX PRODUCTION BUILDS
echo ========================================
echo.

echo Verifying EAS login...
call eas whoami
if %errorlevel% neq 0 (
    echo ERROR: Not logged in to EAS
    echo Please run: eas login
    pause
    exit /b 1
)
echo.

echo Checking project info...
call eas project:info
echo.

echo ========================================
echo STARTING iOS PRODUCTION BUILD
echo ========================================
echo.
start "iOS Build" cmd /k "eas build --platform ios --profile production"

echo.
echo Waiting 5 seconds before starting Android build...
timeout /t 5 /nobreak
echo.

echo ========================================
echo STARTING ANDROID PRODUCTION BUILD
echo ========================================
echo.
start "Android Build" cmd /k "eas build --platform android --profile production"

echo.
echo ========================================
echo BUILDS STARTED!
echo ========================================
echo.
echo Two new windows have opened:
echo 1. iOS Build - Monitor iOS build progress
echo 2. Android Build - Will prompt to generate keystore
echo.
echo When Android build asks "Generate a new Android Keystore?":
echo   Type: y
echo   Press: Enter
echo.
echo Build URLs will be shown in each window.
echo.
pause
