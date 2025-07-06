# 📱 Quick App Package Builder
# This script helps you build both Android and iOS packages for store submission

Write-Host "📱 Naturinex App Package Builder" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Path "build")) {
    Write-Host "🔨 Building React app first..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ React build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ React app built successfully!" -ForegroundColor Green
}

Write-Host "🔄 Syncing with native platforms..." -ForegroundColor Yellow
npx cap sync

Write-Host ""
Write-Host "📦 Which platform would you like to build?" -ForegroundColor Cyan
Write-Host "1. Android (Google Play Store)" -ForegroundColor White
Write-Host "2. iOS (Apple App Store) - macOS only" -ForegroundColor White
Write-Host "3. Both platforms" -ForegroundColor White
Write-Host "4. Exit" -ForegroundColor White

$choice = Read-Host "Enter your choice (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🤖 Building Android Package..." -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        
        # Check if signing key exists
        if (-not (Test-Path "android\app\naturinex-release-key.keystore")) {
            Write-Host "⚠️  No signing key found!" -ForegroundColor Yellow
            Write-Host "💡 Run generate-android-key.ps1 first to create your signing key" -ForegroundColor Cyan
            $createKey = Read-Host "Create signing key now? (y/n)"
            if ($createKey -eq "y" -or $createKey -eq "Y") {
                .\generate-android-key.ps1
            } else {
                Write-Host "❌ Cannot build release package without signing key" -ForegroundColor Red
                exit 1
            }
        }
        
        Write-Host "🚀 Opening Android Studio for release build..." -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 In Android Studio:" -ForegroundColor Cyan
        Write-Host "   1. Build → Generate Signed Bundle / APK" -ForegroundColor White
        Write-Host "   2. Choose 'Android App Bundle (AAB)'" -ForegroundColor White
        Write-Host "   3. Select your keystore file: naturinex-release-key.keystore" -ForegroundColor White
        Write-Host "   4. Enter your keystore and key passwords" -ForegroundColor White
        Write-Host "   5. Choose 'release' build variant" -ForegroundColor White
        Write-Host "   6. Build and locate: android/app/release/app-release.aab" -ForegroundColor White
        Write-Host ""
        
        npx cap open android
    }
    "2" {
        if ($env:OS -eq "Windows_NT") {
            Write-Host "❌ iOS builds require macOS and Xcode!" -ForegroundColor Red
            Write-Host "💡 You can only build iOS apps on a Mac computer" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "🍎 Building iOS Package..." -ForegroundColor Green
            Write-Host "==========================" -ForegroundColor Green
            
            Write-Host "🚀 Opening Xcode for archive creation..." -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 In Xcode:" -ForegroundColor Cyan
            Write-Host "   1. Select 'Any iOS Device' as target" -ForegroundColor White
            Write-Host "   2. Product → Archive" -ForegroundColor White
            Write-Host "   3. Wait for build completion" -ForegroundColor White
            Write-Host "   4. In Organizer: Distribute App → App Store Connect" -ForegroundColor White
            Write-Host "   5. Follow upload wizard to TestFlight" -ForegroundColor White
            Write-Host ""
            
            npx cap open ios
        }
    }
    "3" {
        Write-Host ""
        Write-Host "📱 Building Both Platforms..." -ForegroundColor Green
        Write-Host "=============================" -ForegroundColor Green
        
        # Android first
        Write-Host "🤖 Opening Android Studio..." -ForegroundColor Yellow
        npx cap open android
        
        if ($env:OS -ne "Windows_NT") {
            Write-Host "🍎 Opening Xcode..." -ForegroundColor Yellow
            npx cap open ios
        } else {
            Write-Host "⚠️  iOS build skipped (requires macOS)" -ForegroundColor Yellow
        }
    }
    "4" {
        Write-Host "👋 Goodbye!" -ForegroundColor Green
        exit 0
    }
    default {
        Write-Host "❌ Invalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📋 Package Locations:" -ForegroundColor Cyan
Write-Host "   Android AAB: android/app/release/app-release.aab" -ForegroundColor White
Write-Host "   iOS Archive: Handled by Xcode Organizer" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Upload Instructions:" -ForegroundColor Green
Write-Host "   Android: Upload AAB to Google Play Console" -ForegroundColor White
Write-Host "   iOS: Upload via Xcode to App Store Connect/TestFlight" -ForegroundColor White
Write-Host ""
Write-Host "📖 Detailed guide: BETA_TESTING_GUIDE.md" -ForegroundColor Cyan
