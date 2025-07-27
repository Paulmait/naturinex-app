@echo off
echo ========================================
echo Uploading Legal Documents to GitHub
echo ========================================
echo.

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

:: Navigate to temp directory
cd /d "%TEMP%"

:: Remove old clone if exists
if exist naturinex-legal (
    echo Removing old repository clone...
    rmdir /s /q naturinex-legal
)

:: Clone the repository
echo Cloning GitHub repository...
git clone https://github.com/Paulmait/naturinex-legal.git
if %errorlevel% neq 0 (
    echo ERROR: Failed to clone repository
    pause
    exit /b 1
)

:: Navigate to repo
cd naturinex-legal

:: Copy the legal files
echo.
echo Copying updated legal documents...
copy /Y "C:\Users\maito\mediscan-app\naturinex-app\legal\privacy-policy-enhanced.html" . >nul
copy /Y "C:\Users\maito\mediscan-app\naturinex-app\legal\terms-of-service-enhanced.html" . >nul

:: Create index.html if it doesn't exist
if not exist index.html (
    echo Creating index.html...
    (
        echo ^<!DOCTYPE html^>
        echo ^<html lang="en"^>
        echo ^<head^>
        echo     ^<meta charset="UTF-8"^>
        echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
        echo     ^<title^>Naturinex Legal Documents^</title^>
        echo     ^<style^>
        echo         body {
        echo             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        echo             max-width: 600px;
        echo             margin: 50px auto;
        echo             padding: 20px;
        echo             text-align: center;
        echo         }
        echo         .logo { font-size: 72px; margin-bottom: 30px; }
        echo         h1 { color: #2c5530; }
        echo         .links {
        echo             margin-top: 40px;
        echo             display: flex;
        echo             flex-direction: column;
        echo             gap: 20px;
        echo         }
        echo         a {
        echo             display: inline-block;
        echo             padding: 15px 30px;
        echo             background-color: #10B981;
        echo             color: white;
        echo             text-decoration: none;
        echo             border-radius: 8px;
        echo             font-weight: 600;
        echo         }
        echo         a:hover { background-color: #059669; }
        echo     ^</style^>
        echo ^</head^>
        echo ^<body^>
        echo     ^<div class="logo"^>🌿^</div^>
        echo     ^<h1^>Naturinex Legal Documents^</h1^>
        echo     ^<p^>Access our legal documents below:^</p^>
        echo     ^<div class="links"^>
        echo         ^<a href="privacy-policy-enhanced.html"^>Privacy Policy^</a^>
        echo         ^<a href="terms-of-service-enhanced.html"^>Terms of Service^</a^>
        echo     ^</div^>
        echo ^</body^>
        echo ^</html^>
    ) > index.html
)

:: Check if files were copied
if not exist privacy-policy-enhanced.html (
    echo ERROR: Failed to copy privacy-policy-enhanced.html
    pause
    exit /b 1
)
if not exist terms-of-service-enhanced.html (
    echo ERROR: Failed to copy terms-of-service-enhanced.html
    pause
    exit /b 1
)

:: Add files to git
echo.
echo Adding files to git...
git add index.html privacy-policy-enhanced.html terms-of-service-enhanced.html

:: Commit changes
echo.
echo Committing changes...
git commit -m "Update legal documents with medical disclaimers, AI notices, and GDPR compliance"

:: Push to GitHub
echo.
echo Pushing to GitHub...
git push origin main

if %errorlevel% eq 0 (
    echo.
    echo ========================================
    echo SUCCESS! Files uploaded to GitHub
    echo ========================================
    echo.
    echo Your legal documents will be available at:
    echo - https://paulmait.github.io/naturinex-legal/
    echo - https://paulmait.github.io/naturinex-legal/privacy-policy-enhanced.html
    echo - https://paulmait.github.io/naturinex-legal/terms-of-service-enhanced.html
    echo.
    echo Note: GitHub Pages may take 1-5 minutes to update
    echo.
) else (
    echo.
    echo ERROR: Failed to push to GitHub
    echo Please check your GitHub credentials
)

pause