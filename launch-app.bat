@echo off
echo ========================================
echo   NATURINEX APP LAUNCH SCRIPT
echo ========================================
echo.

echo [1/5] Checking configuration...
call bash test-build.sh
echo.
pause

echo [2/5] Logging in to EAS...
eas whoami
echo.

echo [3/5] Starting production build...
echo This will build for both iOS and Android
echo.
eas build --platform all --profile production
echo.

echo [4/5] Build started! Check status with: eas build:list
echo.

echo [5/5] Once builds complete, submit to stores:
echo   iOS: eas submit --platform ios --profile production
echo   Android: eas submit --platform android --profile production
echo.

pause