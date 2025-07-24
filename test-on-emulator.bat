@echo off
echo ======================================
echo    NATURINEX ANDROID EMULATOR TEST
echo ======================================
echo.

REM Check if emulator is running
echo Checking for running Android emulator...
adb devices | findstr "emulator" >nul
if %errorlevel% neq 0 (
    echo.
    echo No Android emulator detected!
    echo.
    echo Please start your Android emulator from Android Studio:
    echo 1. Open Android Studio
    echo 2. Click "Tools" - "AVD Manager"
    echo 3. Click the play button on your emulator
    echo 4. Wait for it to fully boot
    echo 5. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Android emulator detected!
echo.

REM Check environment setup
echo Checking environment configuration...
if not exist .env (
    echo ❌ ERROR: .env file not found!
    echo Please create .env file with Firebase credentials first.
    pause
    exit /b 1
)

findstr /C:"YOUR_ACTUAL_API_KEY_HERE" .env >nul
if %errorlevel% equ 0 (
    echo ❌ ERROR: Firebase not configured!
    echo Please add your Firebase credentials to .env file.
    pause
    exit /b 1
)

echo ✅ Environment configured!
echo.

REM Start Metro bundler
echo Starting Metro bundler...
start cmd /k "npx expo start --clear"

echo.
echo Waiting for Metro bundler to start...
timeout /t 10 /nobreak >nul

echo.
echo ======================================
echo    TESTING INSTRUCTIONS
echo ======================================
echo.
echo 1. In the Metro Bundler window that opened:
echo    - Press 'a' to run on Android emulator
echo    - Wait for app to build and install
echo.
echo 2. Test these critical features:
echo    ✓ App launches without errors
echo    ✓ Login/Register screens work
echo    ✓ Camera permission request appears
echo    ✓ Info button shows legal documents
echo    ✓ Medical disclaimer is visible
echo    ✓ Can navigate between screens
echo.
echo 3. Check for these issues:
echo    × Any crash on startup
echo    × Firebase connection errors
echo    × Missing images or icons
echo    × Navigation failures
echo.
echo ======================================
echo    TEST CHECKLIST
echo ======================================
echo.
echo [ ] App launches successfully
echo [ ] No Firebase errors in console
echo [ ] Camera permission dialog appears
echo [ ] Legal documents accessible via Info button
echo [ ] Medical disclaimer shows
echo [ ] Navigation works properly
echo [ ] Stripe test mode works
echo [ ] No console errors in Metro bundler
echo.
echo Press any key when testing is complete...
pause >nul

echo.
echo ======================================
echo    POST-TEST ACTIONS
echo ======================================
echo.
echo If all tests passed:
echo 1. Build for production: eas build --platform android
echo 2. Submit to Play Store: eas submit --platform android
echo.
echo If tests failed:
echo 1. Check Metro bundler console for errors
echo 2. Run: adb logcat *:E (to see device errors)
echo 3. Fix issues and test again
echo.
pause