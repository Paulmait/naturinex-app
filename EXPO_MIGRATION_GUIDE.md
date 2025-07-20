# Expo Migration Guide for Naturinex Medical App

## 🚀 Quick Setup for iPhone Testing

This guide will help you migrate from Capacitor to Expo for seamless iPhone testing and app store deployment.

## Prerequisites
- Node.js 18+ installed
- Expo account (free at expo.dev)
- EAS account (same as Expo account)
- iPhone with Expo Go app installed

## Step 1: Install Expo CLI and EAS CLI

```bash
# Install globally
npm install -g expo-cli eas-cli

# Verify installation
expo --version
eas --version
```

## Step 2: Initialize Expo in Your Project

```bash
cd client

# Create Expo app configuration
npx create-expo-app . --template blank

# Install Expo SDK
npm install expo@~51.0.0

# Install React Native dependencies
npm install react-native@0.74.5 react-native-web@~0.19.6 react-dom@18.2.0

# Install Expo modules
npm install expo-camera expo-media-library expo-image-picker expo-file-system expo-crypto expo-secure-store expo-updates expo-constants expo-device expo-application
```

## Step 3: Configure app.json for Medical App

Create `app.json` in the client directory:

```json
{
  "expo": {
    "name": "Naturinex",
    "slug": "naturinex",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.naturinex.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Naturinex needs camera access to scan medication labels and analyze ingredients",
        "NSPhotoLibraryUsageDescription": "Naturinex needs photo library access to select medication images",
        "NSPhotoLibraryAddUsageDescription": "Naturinex needs permission to save analysis results to your photos"
      },
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.naturinex.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Naturinex needs camera access to scan medication labels"
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Naturinex needs access to your photos to analyze medication images",
          "savePhotosPermission": "Naturinex needs permission to save analysis results"
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

## Step 4: Configure EAS Build

```bash
# Login to EAS
eas login

# Configure your project
eas build:configure

# This creates eas.json
```

Update `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-key.json",
        "track": "production"
      }
    }
  }
}
```

## Step 5: Update Package.json Scripts

Add these scripts to your package.json:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "build:ios": "eas build -p ios",
    "build:android": "eas build -p android",
    "build:all": "eas build -p all",
    "submit:ios": "eas submit -p ios",
    "submit:android": "eas submit -p android"
  }
}
```

## Step 6: Convert React Web Components to React Native

Example conversion for camera functionality:

```javascript
// Before (React Web)
import React from 'react';

const CameraCapture = () => {
  return <input type="file" accept="image/*" capture="camera" />;
};

// After (React Native with Expo)
import React from 'react';
import { View, Button, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const CameraCapture = () => {
  const [image, setImage] = React.useState(null);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      // Process image for medication analysis
    }
  };

  return (
    <View>
      <Button title="Scan Medication" onPress={takePicture} />
      {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
    </View>
  );
};
```

## Step 7: Testing on Your iPhone

### Option A: Using Expo Go (Fastest)
```bash
# Start development server
npm start

# Scan QR code with Expo Go app on iPhone
```

### Option B: Development Build (Full Features)
```bash
# Create development build
eas build --profile development --platform ios

# Install on iPhone via TestFlight or direct link
```

## Step 8: Security Configuration for Medical Data

```javascript
// Secure storage for sensitive data
import * as SecureStore from 'expo-secure-store';

// Store encrypted data
await SecureStore.setItemAsync('user_medical_data', JSON.stringify(data));

// Retrieve encrypted data
const data = await SecureStore.getItemAsync('user_medical_data');
```

## Step 9: Build for App Stores

```bash
# Build for iOS App Store
eas build --platform ios --profile production

# Build for Google Play Store
eas build --platform android --profile production

# Submit to stores
eas submit -p ios
eas submit -p android
```

## Testing Checklist

- [ ] Camera functionality for medication scanning
- [ ] Image analysis with AI
- [ ] Secure data storage
- [ ] Offline functionality
- [ ] Push notifications (if implemented)
- [ ] In-app purchases via Stripe
- [ ] Performance on older devices
- [ ] Accessibility features

## Common Issues & Solutions

### Issue: Camera not working
```javascript
// Ensure permissions in app.json
"plugins": [
  ["expo-camera", {
    "cameraPermission": "Allow Naturinex to access camera for medication scanning"
  }]
]
```

### Issue: API calls failing
```javascript
// Use environment variables
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig.extra.apiUrl || 'https://naturinex-app.onrender.com';
```

### Issue: Stripe integration
```javascript
// Use Stripe for React Native
import { StripeProvider } from '@stripe/stripe-react-native';

<StripeProvider
  publishableKey={Constants.expoConfig.extra.stripePublishableKey}
  merchantIdentifier="merchant.com.naturinex.app"
>
  {/* Your app */}
</StripeProvider>
```

## Next Steps

1. Run `npm install` to install all dependencies
2. Create required assets (icon.png, splash.png)
3. Configure your EAS project ID
4. Test on iPhone using Expo Go
5. Create development build for full testing
6. Submit to app stores when ready

## Support

- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction
- React Native: https://reactnative.dev