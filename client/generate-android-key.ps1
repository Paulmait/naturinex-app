# 🔧 Android Signing Key Generation Script
# Run this script to create your Android signing key for release builds

Write-Host "🔑 Generating Android Signing Key for Naturinex App" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if keytool is available
if (-not (Get-Command "keytool" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ keytool not found. Please ensure Java JDK is installed and in PATH." -ForegroundColor Red
    Write-Host "💡 Download Java JDK from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
    exit 1
}

# Create android directory if it doesn't exist
$keyDir = "android\app"
if (-not (Test-Path $keyDir)) {
    New-Item -ItemType Directory -Path $keyDir -Force
    Write-Host "📁 Created android/app directory" -ForegroundColor Green
}

# Navigate to android app directory
Set-Location $keyDir

Write-Host "🔐 Creating release signing key..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 You'll be prompted for the following information:" -ForegroundColor Cyan
Write-Host "   - Keystore password (remember this!)" -ForegroundColor White
Write-Host "   - Key alias password (can be same as keystore)" -ForegroundColor White
Write-Host "   - Your name and organization details" -ForegroundColor White
Write-Host ""

# Generate the signing key
$keystoreName = "naturinex-release-key.keystore"
$keyAlias = "naturinex-key"

keytool -genkey -v -keystore $keystoreName -alias $keyAlias -keyalg RSA -keysize 2048 -validity 10000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Signing key created successfully!" -ForegroundColor Green
    Write-Host "📁 Location: android/app/$keystoreName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 IMPORTANT - Save this information:" -ForegroundColor Yellow
    Write-Host "   - Keystore file: $keystoreName" -ForegroundColor White
    Write-Host "   - Key alias: $keyAlias" -ForegroundColor White
    Write-Host "   - Passwords you just entered" -ForegroundColor White
    Write-Host ""
    Write-Host "🔒 Keep your keystore file and passwords secure!" -ForegroundColor Red
    Write-Host "   You'll need them to update your app in the future." -ForegroundColor Red
    Write-Host ""
    Write-Host "🚀 Next steps:" -ForegroundColor Green
    Write-Host "   1. Open Android Studio: npx cap open android" -ForegroundColor White
    Write-Host "   2. Build > Generate Signed Bundle / APK" -ForegroundColor White
    Write-Host "   3. Select your keystore and build release AAB" -ForegroundColor White
} else {
    Write-Host "❌ Failed to create signing key" -ForegroundColor Red
    Write-Host "💡 Please check the error messages above" -ForegroundColor Yellow
}

# Return to original directory
Set-Location ..\..

Write-Host ""
Write-Host "📖 For detailed instructions, see BETA_TESTING_GUIDE.md" -ForegroundColor Cyan
