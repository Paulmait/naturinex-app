#!/bin/bash

echo "=== Naturinex App Build Test ==="
echo "Testing app configuration and build readiness..."
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: app.json not found. Please run this script from the client directory."
    exit 1
fi

echo "✅ Found app.json"

# Check bundle identifiers
echo ""
echo "📱 Bundle Identifiers:"
echo "iOS: com.naturinex.app"
echo "Android: com.naturinex.app"

# Check EAS configuration
if [ -f "eas.json" ]; then
    echo "✅ EAS configuration found"
else
    echo "❌ EAS configuration missing"
fi

# Check for required dependencies
echo ""
echo "📦 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Dependencies not installed. Run: npm install"
fi

# Check for assets
echo ""
echo "🎨 Checking assets..."
for asset in "icon.png" "splash.png" "adaptive-icon.png" "favicon.png"; do
    if [ -f "assets/$asset" ]; then
        echo "✅ $asset found"
    else
        echo "❌ $asset missing"
    fi
done

# Check Firebase configuration
echo ""
echo "🔥 Checking Firebase configuration..."
if grep -q "YOUR_FIREBASE_API_KEY" app.json; then
    echo "⚠️  Firebase credentials need to be configured in app.json"
else
    echo "✅ Firebase credentials appear to be configured"
fi

# Check Google OAuth configuration
echo ""
echo "🔐 Checking Google OAuth configuration..."
if grep -q "YOUR_GOOGLE_EXPO_CLIENT_ID" app.json; then
    echo "⚠️  Google OAuth credentials need to be configured in app.json"
else
    echo "✅ Google OAuth credentials appear to be configured"
fi

# Check Apple submission config
echo ""
echo "🍎 Checking iOS submission configuration..."
if grep -q "your-apple-id@email.com" eas.json; then
    echo "⚠️  Apple credentials need to be configured in eas.json"
else
    echo "✅ Apple credentials appear to be configured"
fi

# Check Android submission config
echo ""
echo "🤖 Checking Android submission configuration..."
if [ -f "google-play-key.json" ]; then
    echo "✅ Google Play service account key found"
else
    echo "⚠️  Google Play service account key missing (google-play-key.json)"
fi

echo ""
echo "=== Summary ==="
echo "Please review the checklist above and fix any ❌ or ⚠️ items before building."
echo ""
echo "To build for production:"
echo "  eas build --platform all --profile production"
echo ""
echo "To submit to stores:"
echo "  eas submit --platform ios --profile production"
echo "  eas submit --platform android --profile production"