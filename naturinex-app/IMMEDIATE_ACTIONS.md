# 🚨 IMMEDIATE ACTIONS FOR APP STORE SUBMISSION

## Step 1: Install SDK 51 Dependencies (5 minutes)
```bash
cd C:\Users\maito\mediscan-app\naturinex-app
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Step 2: Fix EAS Submission Config (2 minutes)

Edit `eas.json` line 58-61 and replace with your actual Apple credentials:
```json
"appleId": "your.real.email@gmail.com",
"ascAppId": "1234567890",  // Get from App Store Connect
"appleTeamId": "LFB9Z5Q3Y9"  // Already correct
```

## Step 3: Create Required Directories (1 minute)
```bash
mkdir secrets
```

## Step 4: Get Your App Store Connect API Key

1. Go to https://appstoreconnect.apple.com
2. Users and Access → Keys → App Store Connect API
3. Create a new key with "Admin" role
4. Download the .p8 file
5. Create `secrets/appstore-connect-key.json`:

```json
{
  "keyId": "YOUR_KEY_ID",
  "issuerId": "YOUR_ISSUER_ID",
  "privateKey": "-----BEGIN PRIVATE KEY-----\nYOUR_KEY_CONTENT\n-----END PRIVATE KEY-----"
}
```

## Step 5: Get Your Google Play Service Account Key

1. Go to https://console.cloud.google.com
2. Create service account with "Service Account User" role
3. Download JSON key
4. Save as `secrets/google-play-key.json`

## Step 6: Add Privacy Manifest to app.json

Add this to the "ios" section in app.json:
```json
"privacyManifests": {
  "NSPrivacyAccessedAPITypes": [
    {
      "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
      "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
    }
  ]
}
```

## Step 7: Test Your Build Locally
```bash
npx expo prebuild --clear
npx expo start --clear
```

## Step 8: Build for Stores
```bash
# Build both platforms
eas build --platform all --profile production

# Or separately
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Step 9: Submit to Stores
```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## Critical Reminders:

1. **NEVER** use words like "medication alternative" or "replace prescription"
2. **ALWAYS** emphasize "educational wellness information"
3. **ENSURE** privacy policy and terms are hosted online
4. **TEST** on real devices before submission

## Common Build Errors:

**Error: "No bundle ID set"**
→ Your bundle ID is already set: `com.naturinex.app`

**Error: "Provisioning profile doesn't match"**
→ EAS handles this automatically

**Error: "SDK version mismatch"**
→ Run `npm install --legacy-peer-deps` again

## Next Steps After Build:

1. Download builds from EAS
2. Test on real devices
3. Take screenshots for stores
4. Submit through EAS CLI

**Estimated time to live: 5-7 days after submission**