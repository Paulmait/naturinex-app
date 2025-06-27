# Naturinex Mobile App Build Script for Windows
# PowerShell script to build and package the mobile apps

Write-Host "🚀 Naturinex Mobile App Builder" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function to check if a command exists
function Test-Command($command) {
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npx")) {
    Write-Host "❌ npx is not available. Please update Node.js." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Prerequisites met!" -ForegroundColor Green

# Build the React app
Write-Host "🔨 Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ React build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ React app built successfully!" -ForegroundColor Green

# Sync with Capacitor
Write-Host "🔄 Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Capacitor sync completed!" -ForegroundColor Green

# Ask user what to do next
Write-Host ""
Write-Host "🎯 What would you like to do next?" -ForegroundColor Cyan
Write-Host "1. Open Android Studio for Android build" -ForegroundColor White
Write-Host "2. Open Xcode for iOS build (macOS only)" -ForegroundColor White  
Write-Host "3. Run Android app on connected device" -ForegroundColor White
Write-Host "4. Run iOS app on connected device (macOS only)" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🤖 Opening Android Studio..." -ForegroundColor Green
        npx cap open android
    }
    "2" {
        if ($env:OS -eq "Windows_NT") {
            Write-Host "❌ Xcode is only available on macOS!" -ForegroundColor Red
        } else {
            Write-Host "🍎 Opening Xcode..." -ForegroundColor Green
            npx cap open ios
        }
    }
    "3" {
        Write-Host "🤖 Running Android app..." -ForegroundColor Green
        npx cap run android
    }
    "4" {
        if ($env:OS -eq "Windows_NT") {
            Write-Host "❌ iOS development requires macOS and Xcode!" -ForegroundColor Red
        } else {
            Write-Host "🍎 Running iOS app..." -ForegroundColor Green
            npx cap run ios
        }
    }
    "5" {
        Write-Host "👋 Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📱 Mobile App Packaging Complete!" -ForegroundColor Green
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test the app on physical devices" -ForegroundColor White
Write-Host "   2. Generate signed builds for app stores" -ForegroundColor White
Write-Host "   3. Prepare app store listings and assets" -ForegroundColor White
Write-Host "   4. Submit to Apple App Store and Google Play" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan  
Write-Host "   - MOBILE_APP_DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   - APP_STORE_SUBMISSION_PACKAGE.md" -ForegroundColor White
Write-Host "   - MOBILE_APP_CONFIGURATION.md" -ForegroundColor White
