# 🚀 Deploy to Apple App Store - Step by Step

## Prerequisites ✅
- [x] EAS CLI installed
- [x] Logged in as: guampaul
- [x] App ID: 6749164831
- [x] Team ID: LFB9Z5Q3Y9
- [x] App is 98% ready

## Step 1: Build for iOS Production

Open Command Prompt and run:

```bash
cd C:\Users\maito\mediscan-app\naturinex-app
eas build --platform ios --profile production
```

### What will happen:
1. **Credentials Setup** (first time only)
   - Choose: "Log in to Apple Developer account"
   - Enter Apple ID: crazya1c@hotmail.com
   - Enter password (may need 2FA code)
   - Select team: LFB9Z5Q3Y9

2. **Build Process**
   - EAS will package your app
   - Upload to Expo servers
   - Build takes ~30 minutes
   - You'll get an email when done

## Step 2: Monitor Build Progress

```bash
eas build:list --platform ios
```

Or visit: https://expo.dev/accounts/guampaul/projects/naturinex/builds

## Step 3: Submit to App Store

After build completes:

```bash
eas submit --platform ios --profile production
```

### What you'll need:
- App Store Connect password
- 2FA code from your device

## Step 4: Complete App Store Connect

1. Go to: https://appstoreconnect.apple.com
2. Select your app: Naturinex Wellness Guide
3. Complete these sections:
   - App Information ✅
   - Pricing (Free) ✅
   - App Privacy (questionnaire)
   - Screenshots (use templates we created)
   - Description (from checklist)

## Step 5: Submit for Review

1. Click "Submit for Review"
2. Answer questions:
   - Export Compliance: No
   - Content Rights: Yes
   - Advertising ID: No

## Timeline
- Build: ~30 minutes
- Submission: ~15 minutes
- Review: 24-72 hours

## Common Issues & Solutions

### Issue: Credentials Error
```bash
expo credentials:manager -p ios
```
Select "Remove All" then rebuild

### Issue: Build Fails
Check logs at: https://expo.dev

### Issue: Provisioning Profile
Let EAS handle it automatically (recommended)

## After Submission
1. Monitor status in App Store Connect
2. Respond to any reviewer feedback
3. Once approved, release to App Store!

## Support
- Expo Discord: https://discord.gg/expo
- Apple Developer Forums: https://developer.apple.com/forums/