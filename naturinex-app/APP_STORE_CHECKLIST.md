# App Store Deployment Checklist for Naturinex

## 📱 Current Status: 93% Ready for Submission

### ✅ What's Ready:
- [x] App name: Naturinex Wellness Guide
- [x] Bundle identifiers: com.naturinex.app (iOS & Android)
- [x] SDK version: 51.0.0 (Expo SDK 51)
- [x] EAS project ID: 209a36db-b288-4ad5-80b2-a518c1a33f1a
- [x] All permissions properly configured
- [x] Medical compliance (age gate, disclaimers)
- [x] Privacy Policy & Terms of Service
- [x] Debug code removed
- [x] Network error handling
- [x] Firebase configuration centralized
- [x] Stripe Live Key configured
- [x] API URL configured: https://naturinex-app.onrender.com
- [x] Permission descriptions for camera and photo library
- [x] Build configurations for development, preview, and production

### ❌ What Needs Configuration:

## 1. Firebase Configuration

**Location:** `client/app.json` (lines 82-87)

Replace these placeholder values in the `extra` section:
```json
"firebaseApiKey": "YOUR_FIREBASE_API_KEY",
"firebaseAuthDomain": "YOUR_FIREBASE_AUTH_DOMAIN",
"firebaseProjectId": "YOUR_FIREBASE_PROJECT_ID",
"firebaseStorageBucket": "YOUR_FIREBASE_STORAGE_BUCKET",
"firebaseMessagingSenderId": "YOUR_FIREBASE_MESSAGING_SENDER_ID",
"firebaseAppId": "YOUR_FIREBASE_APP_ID"
```

**Also update:** `client/src/firebase.js` to use the same project (currently using mediscan-b6252)

## 2. Google OAuth Configuration

**Location:** `client/app.json` (lines 79-81)

Replace these placeholder values:
```json
"googleExpoClientId": "YOUR_GOOGLE_EXPO_CLIENT_ID",
"googleIosClientId": "YOUR_GOOGLE_IOS_CLIENT_ID",
"googleAndroidClientId": "YOUR_GOOGLE_ANDROID_CLIENT_ID"
```

## 3. Apple App Store Configuration

**Location:** `client/eas.json` (lines 42-44)

Replace these values for iOS submission:
```json
"appleId": "your-apple-id@email.com",
"ascAppId": "your-app-store-connect-app-id",
"appleTeamId": "your-apple-team-id"
```

## 4. Google Play Store Configuration

**Location:** `client/eas.json` (line 47)

You need to:
1. Create a service account in Google Play Console
2. Download the JSON key file
3. Save it as `client/google-play-key.json`
4. Update the path in eas.json if needed

## 5. App Ownership

**Current Issue:** The app owner is set to "guampaul" but should be "pmaitland78"

**Fix:** Update line 5 in `client/app.json`:
```json
"owner": "pmaitland78",
```

## 6. Version Numbers

Before each release, update:
- `client/app.json` line 6: `"version": "1.0.0"` (increment for each release)
- `client/app.json` line 37: `"buildNumber": "1"` (iOS - increment for each build)
- `client/app.json` line 54: `"versionCode": 1` (Android - increment for each build)

## 🚀 Build Commands

After configuration is complete:

### Development Build:
```bash
cd client
eas build --platform all --profile development
```

### Production Build:
```bash
cd client
eas build --platform all --profile production
```

### Submit to Stores:
```bash
# iOS App Store
eas submit --platform ios --profile production

# Google Play Store
eas submit --platform android --profile production
```

## 📋 Pre-submission Checklist:

- [ ] All Firebase credentials configured
- [ ] Google OAuth client IDs configured
- [ ] Apple developer account credentials in eas.json
- [ ] Google Play service account key created and saved
- [ ] App owner updated to pmaitland78
- [ ] Version numbers incremented
- [ ] Test on real devices (iOS and Android)
- [ ] Privacy policy URL added (if required)
- [ ] Terms of service URL added (if required)
- [ ] App screenshots prepared for stores
- [ ] App description written for stores

## 🔒 Security Notes:

1. Never commit real API keys to git
2. Use environment variables or secure storage for sensitive data
3. Enable app signing for both platforms
4. Review all permissions are necessary and justified

## 📱 Asset Requirements:

### iOS App Store:
- App icon: 1024x1024px (no transparency, no rounded corners)
- Screenshots: iPhone 6.5" (1242x2688px) and iPad Pro 12.9" (2048x2732px)

### Google Play Store:
- Feature graphic: 1024x500px
- Screenshots: Various phone sizes
- High-res icon: 512x512px

## 🏗️ Next Steps:

1. Configure all placeholder values
2. Test the app thoroughly on both platforms
3. Run a production build
4. Submit for review

Remember to test payments in both test and production Stripe environments!