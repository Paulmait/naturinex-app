# 🚀 Ready to Build for TestFlight!

## Current Status
✅ EAS CLI installed and configured
✅ Project owner fixed (guampaul)
✅ Build number incremented to 2
✅ API URLs updated to production

## Next Steps

### 1. Create App in App Store Connect
Before building, you need to create your app:

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - **Name**: Naturinex Wellness Guide
   - **Primary Language**: English (U.S.)
   - **Bundle ID**: com.naturinex.app (create new)
   - **SKU**: naturinex-wellness-2024
   - **Category**: Education or Reference

### 2. Build for iOS
Run this command:
```bash
eas build --platform ios --profile production
```

During the build, EAS will ask you:
- **Apple ID**: Enter your Apple Developer email
- **Apple Team ID**: Enter your team ID (see below)
- **Push Notifications**: Select "No" if not using
- **App Store Connect API Key**: Can skip (use username/password)

### 3. Find Your Apple Team ID
1. Go to https://developer.apple.com/account
2. Sign in
3. Look for "Team ID" under Membership

### 4. Submit to TestFlight
After build completes (~30-40 minutes):
```bash
eas submit --platform ios --latest
```

## Important Notes

### Privacy & Compliance
Make sure in App Store Connect you:
- Add Privacy Policy URL
- Select "No" for encryption (unless using custom encryption)
- Choose age rating 17+ (medical information)

### TestFlight Review
- Takes 24-48 hours
- Add clear test instructions
- Mention "Educational wellness app only"
- Provide test account if needed

### Build Monitoring
- Watch progress at: https://expo.dev/accounts/guampaul/projects/naturinex/builds
- You'll get email when complete

## Quick Reference
```bash
# Build
eas build --platform ios --profile production

# Check build status
eas build:list --platform ios

# Submit to TestFlight
eas submit --platform ios --latest

# View in Expo dashboard
open https://expo.dev/accounts/guampaul/projects/naturinex
```

## Need Help?
- EAS Docs: https://docs.expo.dev/build/introduction
- TestFlight Guide: https://docs.expo.dev/submit/ios/

Your app is ready to build! Just need to create it in App Store Connect first.