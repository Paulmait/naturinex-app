# 🚀 IMMEDIATE DEPLOYMENT STEPS

## Step 1: Fix Expo SDK (15 minutes)
```bash
# Update to stable SDK
npm install expo@~52.0.0
npx expo install --fix

# Verify
npx expo doctor
```

## Step 2: Host Legal Documents (30 minutes)

### Option A: Netlify Drop (Fastest)
1. Create two HTML files:
```html
<!-- privacy-policy.html -->
<!DOCTYPE html>
<html>
<head><title>Naturinex Privacy Policy</title></head>
<body>
  <h1>Privacy Policy</h1>
  <!-- Copy content from PrivacyPolicyScreen.js -->
</body>
</html>
```

2. Drag both files to https://app.netlify.com/drop
3. Get URLs like: https://amazing-site-123.netlify.app/privacy-policy.html

### Option B: GitHub Pages
1. Create repo: naturinex-legal
2. Add privacy-policy.md and terms.md
3. Enable GitHub Pages
4. URLs: https://[username].github.io/naturinex-legal/

## Step 3: Apple Developer Setup (1-2 hours)

### Create Developer Account
1. Go to https://developer.apple.com
2. Enroll ($99/year)
3. Wait for approval (instant to 48 hours)

### Create App in App Store Connect
1. Login to https://appstoreconnect.apple.com
2. Click "+" → New App
3. Fill in:
   - Platform: iOS
   - Name: Naturinex Wellness Guide
   - Primary Language: English
   - Bundle ID: com.naturinex.app
   - SKU: naturinex-001

### Generate API Key
1. Users and Access → Keys → App Store Connect API
2. Generate key with "Admin" role
3. Download .p8 file
4. Save as `secrets/appstore-connect-key.json`:
```json
{
  "key": "-----BEGIN PRIVATE KEY-----\n[YOUR KEY HERE]\n-----END PRIVATE KEY-----",
  "keyId": "ABCD1234",
  "issuerId": "12345678-1234-1234-1234-123456789012"
}
```

## Step 4: Update eas.json (5 minutes)
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-actual@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "LFB9Z5Q3Y9"
      }
    }
  }
}
```

## Step 5: Google Play Setup (30 minutes)

1. Create developer account: https://play.google.com/console ($25 one-time)
2. Create app → Fill details
3. Create service account:
   - Google Cloud Console → Create service account
   - Download JSON key
   - Save as `secrets/google-play-key.json`

## Step 6: Build & Submit (1 hour)

```bash
# Create production build
eas build --platform all --profile production

# Once built, submit
eas submit --platform ios
eas submit --platform android
```

## Emergency Checklist

If you need to launch TODAY:
- [ ] Host legal docs on Netlify Drop (30 min)
- [ ] Update eas.json with Apple ID (5 min)
- [ ] Use TestFlight for iOS beta (no review needed)
- [ ] Use Internal Testing for Android (instant)

## Beta Testing Path (Fastest)

### iOS TestFlight (No Review)
```bash
eas build --platform ios --profile preview
eas submit --platform ios --track testflight
```

### Android Internal Track (Instant)
```bash
eas build --platform android --profile preview
# Upload APK to Play Console → Internal Testing
```

## Contact for Help

- EAS Discord: https://chat.expo.dev
- Apple Developer Support: 1-800-633-2152
- Google Play Support: In console → Help

## Final Note

Your app is technically solid with excellent medical disclaimers and privacy compliance. The only blockers are administrative (credentials) and minor technical updates (SDK version). Once these are fixed, you should have smooth approval.