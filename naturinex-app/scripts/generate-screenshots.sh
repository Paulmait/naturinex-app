#!/bin/bash

# App Store Screenshot Generation Script
# Generates screenshots for iPhone 6.7" and iPad 13"

set -e

echo "=== Naturinex App Store Screenshot Generation ==="
echo ""

# Create output directories
mkdir -p ./artifacts/app-store/iphone-67
mkdir -p ./artifacts/app-store/ipad-13
mkdir -p ./artifacts/app-store/iap-review

# Set environment for demo/screenshot mode
export EXPO_PUBLIC_SCREENSHOT_MODE=1
export EXPO_PUBLIC_REVIEW_MODE=1

echo "Step 1: Building app for iOS..."
npx expo run:ios --configuration Release

echo ""
echo "Step 2: Running iPhone 6.7\" screenshots..."
# iPhone 15 Pro Max = 6.7" display
maestro test \
  --device "iPhone 15 Pro Max" \
  --env EXPO_PUBLIC_SCREENSHOT_MODE=1 \
  .maestro/run_all_screenshots.yaml

echo ""
echo "Step 3: Running iPad 13\" screenshots..."
# iPad Pro 12.9" = ~13" display
maestro test \
  --device "iPad Pro (12.9-inch) (6th generation)" \
  --env EXPO_PUBLIC_SCREENSHOT_MODE=1 \
  .maestro/run_all_screenshots.yaml

# Move iPad screenshots to correct folder
mv ./artifacts/app-store/iphone-67/*.png ./artifacts/app-store/ipad-13/ 2>/dev/null || true

echo ""
echo "Step 4: Generating final App Store images..."
node scripts/generate-appstore-images.js

echo ""
echo "=== Screenshot Generation Complete ==="
echo ""
echo "Screenshots saved to:"
echo "  - ./artifacts/app-store/iphone-67/ (6 screenshots)"
echo "  - ./artifacts/app-store/ipad-13/ (6 screenshots)"
echo "  - ./artifacts/app-store/iap-review/ (2 screenshots)"
echo ""
echo "Next steps:"
echo "1. Review screenshots in artifacts/app-store/"
echo "2. Upload to App Store Connect"
echo "3. Submit for review"
