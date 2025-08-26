@echo off
echo Uploading index.html to GitHub...

cd /d "%TEMP%"
if exist naturinex-legal rmdir /s /q naturinex-legal
git clone https://github.com/Paulmait/naturinex-legal.git
cd naturinex-legal

copy /Y "C:\Users\maito\mediscan-app\naturinex-app\legal\index.html" .

git add index.html
git commit -m "Fix blank index page with proper formatting"
git push origin main

if %errorlevel% eq 0 (
    echo.
    echo SUCCESS! Index page uploaded.
    echo Check: https://paulmait.github.io/naturinex-legal/
) else (
    echo ERROR: Failed to push. Check GitHub credentials.
)

pause