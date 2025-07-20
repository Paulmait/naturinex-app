#!/bin/bash

# Expo Setup Script for Naturinex Medical App
echo "🚀 Setting up Expo for Naturinex Medical App..."

cd client

# Step 1: Install Expo CLI and EAS CLI globally
echo "📦 Installing Expo and EAS CLI..."
npm install -g expo-cli eas-cli

# Step 2: Install Expo SDK and dependencies
echo "📦 Installing Expo SDK..."
npm install expo@~51.0.0

# Step 3: Install React Native dependencies
echo "📦 Installing React Native dependencies..."
npm install react-native@0.74.5 react-native-web@~0.19.6

# Step 4: Install navigation
echo "📦 Installing React Navigation..."
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# Step 5: Install Expo modules for medical app
echo "📦 Installing Expo modules for medical features..."
npm install expo-camera expo-media-library expo-image-picker expo-file-system
npm install expo-crypto expo-secure-store expo-updates expo-constants expo-device
npm install expo-application expo-barcode-scanner

# Step 6: Install UI components
echo "📦 Installing UI components..."
npm install @expo/vector-icons react-native-elements

# Step 7: Install Stripe for React Native
echo "📦 Installing Stripe..."
npm install @stripe/stripe-react-native

# Step 8: Create required directories
echo "📁 Creating directories..."
mkdir -p assets
mkdir -p src/screens
mkdir -p src/components
mkdir -p src/services
mkdir -p src/utils

# Step 9: Download placeholder assets
echo "🎨 Creating placeholder assets..."
# Create a simple icon placeholder
echo "Creating placeholder icon..."
cat > assets/icon.png.base64 << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF
base64 -d assets/icon.png.base64 > assets/icon.png 2>/dev/null || base64 -D assets/icon.png.base64 > assets/icon.png
rm assets/icon.png.base64

# Copy icon for other uses
cp assets/icon.png assets/splash.png
cp assets/icon.png assets/adaptive-icon.png
cp assets/icon.png assets/favicon.png

# Step 10: Initialize EAS
echo "🔧 Initializing EAS..."
eas login
eas build:configure

# Step 11: Update package.json scripts
echo "📝 Updating package.json scripts..."
node -e "
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts = {
  ...packageJson.scripts,
  'start': 'expo start',
  'android': 'expo start --android',
  'ios': 'expo start --ios',
  'web': 'expo start --web',
  'build:ios': 'eas build -p ios',
  'build:android': 'eas build -p android',
  'build:all': 'eas build -p all',
  'submit:ios': 'eas submit -p ios',
  'submit:android': 'eas submit -p android'
};
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
"

echo "✅ Expo setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start the Expo development server"
echo "2. Install Expo Go on your iPhone from the App Store"
echo "3. Scan the QR code with Expo Go to test on your device"
echo "4. Run 'eas build --profile development --platform ios' for a development build"
echo ""
echo "📱 Happy testing!"