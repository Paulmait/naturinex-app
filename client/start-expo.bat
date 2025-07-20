@echo off
echo Starting Expo for iPhone testing...
echo.
echo IMPORTANT: Make sure your iPhone is on the same Wi-Fi network as this computer!
echo.
echo The QR code will appear below in a few seconds...
echo.
cd /d "%~dp0"
call npm start
pause