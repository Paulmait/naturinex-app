@echo off
echo ================================
echo Naturinex Deployment Script
echo ================================
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
)

echo Checking environment variables...
if not exist server\.env (
    echo.
    echo WARNING: server\.env file not found!
    echo Please create server\.env with the following variables:
    echo - GEMINI_API_KEY
    echo - STRIPE_SECRET_KEY
    echo - STRIPE_WEBHOOK_SECRET
    echo.
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
call npm install
cd server
call npm install
cd ..

echo.
echo Deployment Options:
echo 1. Deploy to Vercel (Recommended)
echo 2. Deploy to Render
echo 3. Test locally
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Deploying to Vercel...
    vercel --prod
    echo.
    echo Deployment complete! Don't forget to:
    echo 1. Set environment variables in Vercel dashboard
    echo 2. Update API_URL in naturinex-app\src\config\appConfig.js
    echo 3. Test the deployment at your-domain.vercel.app/health
) else if "%choice%"=="2" (
    echo.
    echo For Render deployment:
    echo 1. Push code to GitHub
    echo 2. Create new Web Service on render.com
    echo 3. Connect GitHub repository
    echo 4. Set build command: cd server ^&^& npm install
    echo 5. Set start command: node server/index.js
    echo 6. Add environment variables
    echo 7. Deploy
) else if "%choice%"=="3" (
    echo.
    echo Starting local server...
    cd server
    npm start
) else (
    echo Exiting...
    exit /b 0
)

pause