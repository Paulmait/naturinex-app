@echo off
echo 🚀 Setting up Expo for Naturinex Medical App...

cd client

REM Step 1: Install Expo CLI and EAS CLI globally
echo 📦 Installing Expo and EAS CLI...
call npm install -g expo-cli eas-cli

REM Step 2: Install Expo SDK and dependencies
echo 📦 Installing Expo SDK...
call npm install expo@~51.0.0

REM Step 3: Install React Native dependencies
echo 📦 Installing React Native dependencies...
call npm install react-native@0.74.5 react-native-web@~0.19.6

REM Step 4: Install navigation
echo 📦 Installing React Navigation...
call npm install @react-navigation/native @react-navigation/native-stack
call npm install react-native-screens react-native-safe-area-context

REM Step 5: Install Expo modules for medical app
echo 📦 Installing Expo modules for medical features...
call npm install expo-camera expo-media-library expo-image-picker expo-file-system
call npm install expo-crypto expo-secure-store expo-updates expo-constants expo-device
call npm install expo-application expo-barcode-scanner

REM Step 6: Install UI components
echo 📦 Installing UI components...
call npm install @expo/vector-icons react-native-elements

REM Step 7: Install Stripe for React Native
echo 📦 Installing Stripe...
call npm install @stripe/stripe-react-native

REM Step 8: Create required directories
echo 📁 Creating directories...
mkdir assets 2>nul
mkdir src\screens 2>nul
mkdir src\components 2>nul
mkdir src\services 2>nul
mkdir src\utils 2>nul

REM Step 9: Create placeholder assets
echo 🎨 Creating placeholder assets notification...
echo Please create the following image files in the assets folder:
echo - icon.png (1024x1024)
echo - splash.png (1284x2778)
echo - adaptive-icon.png (1024x1024)
echo - favicon.png (48x48)

REM Step 10: Initialize EAS
echo 🔧 Initializing EAS...
call eas login
call eas build:configure

echo ✅ Expo setup complete!
echo.
echo Next steps:
echo 1. Run 'npm start' to start the Expo development server
echo 2. Install Expo Go on your iPhone from the App Store
echo 3. Scan the QR code with Expo Go to test on your device
echo 4. Run 'eas build --profile development --platform ios' for a development build
echo.
echo 📱 Happy testing!
pause