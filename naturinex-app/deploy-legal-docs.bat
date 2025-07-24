@echo off
echo ======================================
echo    DEPLOY LEGAL DOCS TO GITHUB
echo ======================================
echo.

REM Check if git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed!
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

REM Get GitHub username
set /p GITHUB_USERNAME="Enter your GitHub username: "
if "%GITHUB_USERNAME%"=="" (
    echo ERROR: GitHub username is required!
    pause
    exit /b 1
)

echo.
echo This script will:
echo 1. Create a local git repository
echo 2. Add your legal documents
echo 3. Help you push to GitHub
echo.
echo Make sure you've created a repository named 'naturinex-legal' on GitHub first!
echo.
pause

REM Create temporary directory for legal docs
if not exist legal-deploy mkdir legal-deploy
cd legal-deploy

REM Initialize git repository
echo.
echo [1/5] Initializing git repository...
git init

REM Copy legal documents
echo.
echo [2/5] Copying legal documents...
copy ..\..\legal\privacy-policy-enhanced.html . >nul
copy ..\..\legal\terms-of-service-enhanced.html . >nul

REM Create index.html for better presentation
echo [3/5] Creating index page...
(
echo ^<!DOCTYPE html^>
echo ^<html lang="en"^>
echo ^<head^>
echo     ^<meta charset="UTF-8"^>
echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
echo     ^<title^>Naturinex Legal Documents^</title^>
echo     ^<style^>
echo         body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
echo         h1 { color: #10B981; }
echo         a { color: #10B981; text-decoration: none; padding: 10px 20px; border: 2px solid #10B981; border-radius: 5px; display: inline-block; margin: 10px; }
echo         a:hover { background-color: #10B981; color: white; }
echo     ^</style^>
echo ^</head^>
echo ^<body^>
echo     ^<h1^>Naturinex Legal Documents^</h1^>
echo     ^<p^>Access our legal documents:^</p^>
echo     ^<a href="privacy-policy-enhanced.html"^>Privacy Policy^</a^>
echo     ^<a href="terms-of-service-enhanced.html"^>Terms of Service^</a^>
echo ^</body^>
echo ^</html^>
) > index.html

REM Add files to git
echo.
echo [4/5] Adding files to git...
git add .
git commit -m "Add legal documents for Naturinex app"

REM Add remote origin
echo.
echo [5/5] Setting up GitHub remote...
git remote add origin https://github.com/%GITHUB_USERNAME%/naturinex-legal.git
git branch -M main

echo.
echo ======================================
echo    READY TO PUSH TO GITHUB
echo ======================================
echo.
echo Your legal documents are ready to deploy!
echo.
echo Next steps:
echo 1. Make sure you've created 'naturinex-legal' repository on GitHub
echo 2. Run this command to push:
echo    git push -u origin main
echo.
echo After pushing, enable GitHub Pages:
echo 1. Go to https://github.com/%GITHUB_USERNAME%/naturinex-legal/settings/pages
echo 2. Source: Deploy from a branch
echo 3. Branch: main, Folder: / (root)
echo 4. Click Save
echo.
echo Your URLs will be:
echo - Privacy Policy: https://%GITHUB_USERNAME%.github.io/naturinex-legal/privacy-policy-enhanced.html
echo - Terms of Service: https://%GITHUB_USERNAME%.github.io/naturinex-legal/terms-of-service-enhanced.html
echo.
echo Would you like to push to GitHub now? (y/n)
set /p PUSH_NOW=

if /i "%PUSH_NOW%"=="y" (
    echo.
    echo Pushing to GitHub...
    git push -u origin main
    if %errorlevel% equ 0 (
        echo.
        echo SUCCESS! Files pushed to GitHub.
        echo.
        echo Now go to: https://github.com/%GITHUB_USERNAME%/naturinex-legal/settings/pages
        echo And enable GitHub Pages as described above.
    ) else (
        echo.
        echo ERROR: Push failed. Make sure:
        echo 1. You've created the repository on GitHub
        echo 2. You're logged in to git
        echo 3. The repository name is correct
    )
)

echo.
pause