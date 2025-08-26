# SDK 51 Migration & App Store Deployment Guide

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Install SDK 51 Dependencies
```bash
# Clean install to avoid conflicts
rm -rf node_modules package-lock.json
npm install

# If you get errors, try:
npm install --legacy-peer-deps
```

### 2. Fix Critical EAS Configuration

Update `eas.json` with your actual credentials:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_ACTUAL_APPLE_ID@email.com",
        "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "LFB9Z5Q3Y9"
      },
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-key.json",
        "track": "production",
        "releaseStatus": "completed"
      }
    }
  }
}
```

### 3. Add Privacy Manifest for iOS (Required by May 2025)

Add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "privacyManifests": {
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": ["C617.1"]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
            "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
          }
        ],
        "NSPrivacyCollectedDataTypes": [
          {
            "NSPrivacyCollectedDataType": "NSPrivacyCollectedDataTypePhotosorVideos",
            "NSPrivacyCollectedDataTypeLinked": false,
            "NSPrivacyCollectedDataTypeTracking": false,
            "NSPrivacyCollectedDataTypePurposes": ["NSPrivacyCollectedDataTypePurposeAppFunctionality"]
          }
        ]
      }
    }
  }
}
```

### 4. Fix Medical App Positioning

Change in `app.json`:
```json
"name": "Naturinex Wellness Guide"  // ✅ Keep this
```

Update App Store metadata:
- Category: Education or Reference (NOT Medical)
- Keywords: wellness, education, supplement information, health learning

### 5. Required Legal Documents

Host your privacy policy and terms of service:

Option A - GitHub Pages (Free):
```bash
# In your repo root
mkdir docs
cp legal/privacy-policy.html docs/index.html
cp legal/terms-of-service.html docs/terms.html

# Push to GitHub and enable Pages in repo settings
```

Option B - Use your domain:
- Upload to https://naturinex.com/privacy
- Upload to https://naturinex.com/terms

### 6. App Store Assets Checklist

**iOS Requirements:**
- [ ] App Icon 1024x1024 (no transparency, no rounded corners)
- [ ] iPhone Screenshots: 6.7" (1290x2796), 6.5" (1284x2778), 5.5" (1242x2208)
- [ ] iPad Screenshots (if supporting tablets): 12.9" (2048x2732)
- [ ] App Preview Video (optional but recommended)

**Android Requirements:**
- [ ] Feature Graphic: 1024x500
- [ ] Icon: 512x512
- [ ] Screenshots: min 2, max 8 (various sizes)
- [ ] Short Description: max 80 characters
- [ ] Full Description: max 4000 characters

### 7. Build Commands

```bash
# First, clear caches
npx expo prebuild --clear
npx expo start --clear

# Build for both platforms
eas build --platform all --profile production

# Or build separately
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 8. Test Checklist Before Submission

- [ ] Test on real devices (not just simulator)
- [ ] Verify camera permissions work
- [ ] Check all API endpoints point to production
- [ ] Ensure no console.log statements in production
- [ ] Test subscription flow with real Stripe
- [ ] Verify medical disclaimers show on first launch
- [ ] Check offline functionality

### 9. Submission Commands

```bash
# After successful builds
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## Common SDK 51 Migration Issues

### Issue 1: React Native Version Conflicts
If you see peer dependency warnings about React 19:
```bash
npm install --force
```

### Issue 2: Stripe SDK Compatibility
SDK 51 requires Stripe React Native 0.37.0 (already updated in package.json)

### Issue 3: Camera Plugin Issues
The camera permissions in app.json are already correct for SDK 51

## Final Pre-Submission Checklist

1. **Medical Compliance**
   - [ ] No "alternative to medication" language
   - [ ] Disclaimers on every health screen
   - [ ] "Educational purposes only" prominent

2. **Technical Requirements**
   - [ ] SDK 51 installed and building
   - [ ] EAS credentials configured
   - [ ] Privacy manifest added
   - [ ] All API URLs point to production

3. **Store Assets**
   - [ ] Screenshots ready (no medical claims)
   - [ ] App description emphasizes education
   - [ ] Privacy/Terms URLs active

4. **Testing**
   - [ ] Tested on iOS 17+ device
   - [ ] Tested on Android 13+ device
   - [ ] Subscription flow working
   - [ ] No crashes or errors

## Estimated Timeline

- SDK Migration: 2-3 hours
- Asset Preparation: 4-6 hours
- Testing: 1-2 days
- Submission Review: 2-7 days

**Total: 5-10 days to live in stores**

## Support

If you encounter issues:
1. Check EAS Build logs: `eas build:list`
2. Review submission errors: `eas submit:list`
3. Test locally: `expo start --dev-client`