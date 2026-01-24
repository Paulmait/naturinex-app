# App Store Screenshot Generation Script (Windows/EAS)
# For use with Expo EAS on Windows

Write-Host "=== Naturinex App Store Screenshot Guide ===" -ForegroundColor Green
Write-Host ""

# Check if node_modules has sharp for image processing
$sharpInstalled = Test-Path ".\node_modules\sharp"

if (-not $sharpInstalled) {
    Write-Host "Installing sharp for image processing..." -ForegroundColor Yellow
    npm install sharp --save-dev
}

Write-Host "Step 1: Generate placeholder screenshots for testing" -ForegroundColor Cyan
Write-Host ""

# Run the Node.js script to generate placeholders
node scripts/generate-appstore-images.js --placeholders

Write-Host ""
Write-Host "Step 2: Screenshot Options for Windows + EAS" -ForegroundColor Cyan
Write-Host ""
Write-Host "Since you're on Windows with EAS, here are your options:" -ForegroundColor White
Write-Host ""
Write-Host "Option A: TestFlight Screenshots (Recommended)" -ForegroundColor Yellow
Write-Host "  1. Build with: eas build --platform ios --profile production"
Write-Host "  2. Submit to TestFlight via EAS Submit"
Write-Host "  3. Install on your iPhone from TestFlight"
Write-Host "  4. Take screenshots manually on device"
Write-Host "  5. AirDrop/email screenshots to your PC"
Write-Host ""
Write-Host "Option B: Appetize.io (Cloud iOS Simulator)" -ForegroundColor Yellow
Write-Host "  1. Build with: eas build --platform ios --profile preview"
Write-Host "  2. Upload .app to https://appetize.io"
Write-Host "  3. Take screenshots in browser"
Write-Host ""
Write-Host "Option C: Mac Cloud Service" -ForegroundColor Yellow
Write-Host "  1. Use MacStadium, MacInCloud, or similar"
Write-Host "  2. Run iOS Simulator with Maestro"
Write-Host "  3. Execute: maestro test .maestro/run_all_screenshots.yaml"
Write-Host ""

Write-Host "Step 3: Required Screenshots" -ForegroundColor Cyan
Write-Host ""
Write-Host "iPhone 6.7 inch (1290 x 2796):" -ForegroundColor White
Write-Host "  1. Home Dashboard"
Write-Host "  2. Scan Camera"
Write-Host "  3. Analysis Results"
Write-Host "  4. Scan History"
Write-Host "  5. Subscription Paywall"
Write-Host "  6. Settings/Delete Account"
Write-Host ""
Write-Host "iPad 13 inch (2064 x 2752):" -ForegroundColor White
Write-Host "  Same 6 screens as iPhone"
Write-Host ""
Write-Host "IAP Review (attach to app review notes):" -ForegroundColor White
Write-Host "  1. Paywall screen showing all subscription options"
Write-Host "  2. Purchase confirmation (if possible)"
Write-Host ""

Write-Host "Step 4: Demo Account for App Review" -ForegroundColor Cyan
Write-Host ""
Write-Host "Create demo account in Firebase:" -ForegroundColor White
Write-Host "  Email: demo@naturinex.app"
Write-Host "  Password: ReviewDemo2024!"
Write-Host ""
Write-Host "Add to App Store Connect > App Review Information" -ForegroundColor White
Write-Host ""

Write-Host "Step 5: Build Commands" -ForegroundColor Cyan
Write-Host ""
Write-Host "Development build (for testing):" -ForegroundColor White
Write-Host "  eas build --platform ios --profile development" -ForegroundColor Gray
Write-Host ""
Write-Host "Preview build (for screenshots):" -ForegroundColor White
Write-Host "  eas build --platform ios --profile preview" -ForegroundColor Gray
Write-Host ""
Write-Host "Production build (for submission):" -ForegroundColor White
Write-Host "  eas build --platform ios --profile production" -ForegroundColor Gray
Write-Host ""
Write-Host "Submit to App Store:" -ForegroundColor White
Write-Host "  eas submit --platform ios" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Screenshot output will be in: artifacts/app-store/ ===" -ForegroundColor Green
