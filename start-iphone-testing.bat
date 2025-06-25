@echo off
echo.
echo ====================================
echo 📱 NATURINEX IPHONE TESTING SETUP
echo ====================================
echo.
echo Your Computer IP: 10.0.0.74
echo iPhone Testing URL: http://10.0.0.74:3000
echo.
echo ⚡ Starting Naturinex Beta Server...
echo.

cd /d "c:\Users\maito\mediscan-app\client"

echo 🚀 Server starting on multiple ports...
echo.
echo ✅ Primary URL:   http://10.0.0.74:3000
echo ✅ Alternative:  http://10.0.0.74:3003
echo ✅ Local:        http://localhost:3000
echo.
echo 📱 IPHONE INSTRUCTIONS:
echo 1. Connect iPhone to same WiFi
echo 2. Open Safari on iPhone  
echo 3. Go to: http://10.0.0.74:3000
echo 4. Bookmark as "Naturinex Beta"
echo.
echo ⌨️  Press Ctrl+C to stop server
echo.

npm start
