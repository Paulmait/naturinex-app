# 🚀 2-Hour App Launch Guide for Naturinex

## ⏱️ Timeline Overview
- **30 min**: Firebase & Google OAuth Setup
- **30 min**: Apple Developer Setup
- **30 min**: Google Play Setup  
- **15 min**: Update configurations
- **15 min**: Build and submit

---

## 📋 Step 1: Firebase Setup (15 minutes)

### Create Firebase Project:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name: `naturinex-app`
4. Enable Google Analytics (optional)
5. Wait for project creation

### Get Firebase Credentials:
1. Click the gear icon → Project Settings
2. Under "Your apps", click "</>" (Web app)
3. App nickname: `Naturinex Web`
4. Register app
5. Copy the configuration values:

```javascript
// Save these values:
apiKey: "...",
authDomain: "naturinex-app.firebaseapp.com",
projectId: "naturinex-app",
storageBucket: "naturinex-app.appspot.com",
messagingSenderId: "...",
appId: "..."
```

### Enable Services:
1. **Authentication**: 
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google (configure OAuth below)
   
2. **Firestore**:
   - Go to Firestore Database
   - Click "Create database"
   - Start in production mode
   - Choose location (us-central)

3. **Storage**:
   - Go to Storage
   - Click "Get started"
   - Start in production mode

---

## 🔐 Step 2: Google OAuth Setup (15 minutes)

### In Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project (naturinex-app)
3. Go to "APIs & Services" → "Credentials"

### Create OAuth Client IDs:
1. Click "Create Credentials" → "OAuth client ID"
2. Configure consent screen if needed:
   - App name: Naturinex
   - User support email: your email
   - Developer contact: your email

3. Create THREE OAuth clients:

**Web Client (for Expo):**
- Application type: Web application
- Name: Naturinex Expo
- Authorized redirect URIs: 
  - `https://auth.expo.io/@pmaitland78/naturinex`
- Copy the Client ID

**iOS Client:**
- Application type: iOS
- Name: Naturinex iOS
- Bundle ID: `com.naturinex.app`
- Copy the Client ID

**Android Client:**
- Application type: Android  
- Name: Naturinex Android
- Package name: `com.naturinex.app`
- SHA-1 certificate: (get from `eas credentials` later)
- Copy the Client ID

---

## 🍎 Step 3: Apple Developer Setup (30 minutes)

### Prerequisites:
- Apple Developer Account ($99/year)
- Access to [App Store Connect](https://appstoreconnect.apple.com)

### Create App ID:
1. Go to [Apple Developer](https://developer.apple.com)
2. Certificates, IDs & Profiles → Identifiers
3. Click "+" → App IDs → Continue
4. Select "App" → Continue
5. Description: Naturinex
6. Bundle ID: Explicit → `com.naturinex.app`
7. Capabilities: Check any needed (Push Notifications, etc.)
8. Register

### Create App in App Store Connect:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → "+" → New App
3. Platform: iOS
4. Name: Naturinex
5. Primary Language: English (US)
6. Bundle ID: Select `com.naturinex.app`
7. SKU: naturinex-app
8. Create

### Get Credentials:
- Apple ID: Your Apple ID email
- Team ID: In Membership section
- App Store Connect App ID: In App Information

---

## 🤖 Step 4: Google Play Setup (30 minutes)

### Create Google Play Developer Account:
1. Go to [Google Play Console](https://play.google.com/console)
2. Pay one-time $25 fee if not already registered

### Create App:
1. All apps → Create app
2. App name: Naturinex
3. Default language: English (US)
4. App or game: App
5. Free or paid: Free
6. Create app

### Set up Service Account:
1. Go to Setup → API access
2. Link existing Google Cloud project (select naturinex-app)
3. Create new service account:
   - Go to Google Cloud Console
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Name: naturinex-play-publisher
   - Grant role: Service Account User
   - Create key → JSON
   - Download the JSON file
4. Back in Play Console: Grant access to the service account
5. Add permissions: Admin (all permissions)

### Save the JSON key:
Save the downloaded JSON as `client/google-play-key.json`

---

## 🔧 Step 5: Update Configurations (15 minutes)

### 1. Update `client/app.json`:

```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "YOUR_ACTUAL_API_KEY",
      "firebaseAuthDomain": "naturinex-app.firebaseapp.com",
      "firebaseProjectId": "naturinex-app",
      "firebaseStorageBucket": "naturinex-app.appspot.com",
      "firebaseMessagingSenderId": "YOUR_SENDER_ID",
      "firebaseAppId": "YOUR_APP_ID",
      "googleExpoClientId": "YOUR_WEB_CLIENT_ID",
      "googleIosClientId": "YOUR_IOS_CLIENT_ID",
      "googleAndroidClientId": "YOUR_ANDROID_CLIENT_ID"
    }
  }
}
```

### 2. Update `client/eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### 3. Update `client/src/firebase.js`:

Replace `mediscan-b6252` references with your new Firebase project values.

---

## 🏗️ Step 6: Build & Submit (15 minutes)

### 1. Verify Configuration:
```bash
cd client
bash test-build.sh
```

### 2. Login to EAS:
```bash
eas login
```

### 3. Build for Both Platforms:
```bash
eas build --platform all --profile production
```

### 4. Submit to Stores:
```bash
# iOS
eas submit --platform ios --profile production

# Android  
eas submit --platform android --profile production
```

---

## 📱 Quick Commands Cheatsheet:

```bash
# Test configuration
cd client && bash test-build.sh

# Build production
eas build --platform all --profile production

# Submit iOS
eas submit --platform ios --profile production

# Submit Android
eas submit --platform android --profile production

# Check build status
eas build:list

# Download builds
eas build:download --platform ios
eas build:download --platform android
```

---

## ⚡ Troubleshooting:

1. **SHA-1 for Android OAuth**: Run `eas credentials` and select Android → Keystore → Show credentials

2. **Apple Sign In**: May need to enable in Apple Developer portal

3. **Build Errors**: Check `eas build:list` and view logs

4. **Submission Errors**: Ensure all app store metadata is complete

---

## 🎯 Final Checklist:
- [ ] Firebase project created and configured
- [ ] All OAuth client IDs created
- [ ] Apple Developer app created
- [ ] Google Play app created  
- [ ] All credentials in app.json
- [ ] Service account key saved
- [ ] Test build passes
- [ ] Production build completed
- [ ] Submitted to both stores

Good luck with your launch! 🚀