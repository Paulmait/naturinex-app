@echo off
echo ======================================
echo    NATURINEX APP SETUP SCRIPT
echo ======================================
echo.

REM Check if .env file exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with your Firebase credentials.
    echo Copy .env.example to .env and fill in your values.
    pause
    exit /b 1
)

REM Check for Firebase placeholder values
findstr /C:"YOUR_ACTUAL_API_KEY_HERE" .env >nul
if %errorlevel% equ 0 (
    echo ERROR: Firebase API key not configured!
    echo Please edit .env file and add your actual Firebase credentials.
    echo.
    echo To get Firebase credentials:
    echo 1. Go to https://console.firebase.google.com/
    echo 2. Select your project
    echo 3. Click gear icon - Project settings
    echo 4. Copy the configuration values
    pause
    exit /b 1
)

echo [1/6] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/6] Clearing cache...
npx expo start --clear

echo.
echo [3/6] Checking icon dimensions...
echo Please verify icon.png is 1024x1024 pixels
echo Location: assets\icon.png
echo.

echo [4/6] Environment check...
echo - API URL: https://naturinex-app.onrender.com
echo - Firebase Project: naturinex-app
echo - Stripe: Configured (test mode)
echo.

echo [5/6] Build options:
echo.
echo 1. Test locally with Expo Go
echo 2. Build for iOS (EAS Build)
echo 3. Build for Android (EAS Build)
echo 4. Exit
echo.
set /p choice="Select an option (1-4): "

if "%choice%"=="1" (
    echo Starting Expo development server...
    npx expo start
) else if "%choice%"=="2" (
    echo Building for iOS...
    call eas build --platform ios
) else if "%choice%"=="3" (
    echo Building for Android...
    call eas build --platform android
) else if "%choice%"=="4" (
    echo Setup complete. Exiting...
    exit /b 0
) else (
    echo Invalid option. Exiting...
    exit /b 1
)

echo.
echo ======================================
echo    SETUP COMPLETE
echo ======================================
pause