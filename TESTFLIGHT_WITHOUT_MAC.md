# 🚀 Submit to TestFlight Without Mac - Step by Step

## Prerequisites
1. Apple Developer Account ($99/year)
2. Expo account (free at expo.dev)

## Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

## Step 2: Login and Configure
```bash
# Login to Expo
eas login

# Link to your Expo project
eas build:configure
```

## Step 3: Create app.json Build Config
Add to your app.json:
```json
{
  "expo": {
    ...existing config...,
    "ios": {
      ...existing ios config...,
      "buildNumber": "2"  // Increment for each build
    }
  }
}
```

## Step 4: Create eas.json
```bash
# This creates eas.json with build configs
eas build:configure
```

Your eas.json should look like:
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

## Step 5: Build for iOS
```bash
# Build for production/TestFlight
eas build --platform ios --profile production

# EAS will:
# - Ask for Apple credentials
# - Create certificates automatically
# - Build in the cloud
# - Give you a download link
```

## Step 6: Submit to TestFlight
```bash
# After build completes
eas submit --platform ios --latest

# Or with specific build
eas submit --platform ios --id=your-build-id
```

## Step 7: App Store Connect Setup
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+"
3. Create new app:
   - Platform: iOS
   - Name: Naturinex Wellness Guide
   - Primary Language: English
   - Bundle ID: com.naturinex.app
   - SKU: naturinex-wellness-2024

## Step 8: TestFlight Configuration
In App Store Connect:
1. Go to TestFlight tab
2. Add internal testers (yourself)
3. Add external testers (up to 10,000)
4. Submit for review (usually approved in 24h)

## Common Issues & Solutions

### "No bundle ID" error
```bash
# Add to app.json
"ios": {
  "bundleIdentifier": "com.naturinex.app"
}
```

### "Missing privacy policy"
Add to App Store Connect:
- Settings → App Information → Privacy Policy URL

### "Export compliance"
In App Store Connect:
- TestFlight → Export Compliance → No encryption

## Cost Breakdown
- Apple Developer: $99/year
- EAS Build: Free tier includes 30 builds/month
- Total: ~$99/year

## Timeline
1. EAS setup: 30 minutes
2. First build: 20-40 minutes
3. TestFlight review: 24-48 hours
4. Total: 2-3 days to TestFlight

## No Mac Required! 🎉
Everything happens in Expo's cloud. You just need:
- Terminal/Command Prompt
- Apple Developer account
- Internet connection