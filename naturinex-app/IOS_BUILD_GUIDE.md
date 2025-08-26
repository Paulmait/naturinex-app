# iOS Build Guide for Naturinex

## Build Time Estimates

- **First build**: 20-40 minutes (EAS needs to set up credentials)
- **Subsequent builds**: 15-25 minutes
- **Submission to App Store**: 5-10 minutes after build completes

## Start Your Build

### Option 1: Use the batch file (Recommended)
```bash
build-ios.bat
```

### Option 2: Manual command
```bash
eas build --platform ios --profile production --non-interactive
```

## Monitor Your Build

1. **Web Dashboard**: https://expo.dev/accounts/guampaul/projects/naturinex/builds
2. **Command Line**: 
   ```bash
   eas build:list --platform ios
   ```

## What Happens During Build

1. **Credential Management** (5-10 min)
   - EAS uses your API key to manage certificates
   - Provisioning profiles are created/updated
   - App Store Connect is configured

2. **Build Process** (15-25 min)
   - Dependencies installed
   - Native code compiled
   - App bundle created
   - IPA file generated

3. **Build Output**
   - Download URL for the .ipa file
   - QR code for testing on device
   - Build logs for debugging

## After Build Completes

### Submit to App Store
```bash
eas submit --platform ios --latest
```

Or specify a build ID:
```bash
eas submit --platform ios --id=BUILD_ID
```

### Test on Device (TestFlight)
1. Build will be automatically uploaded to TestFlight
2. Wait 10-30 minutes for Apple processing
3. Install TestFlight app on your iPhone
4. Test your app before public release

## Troubleshooting

### Common Issues:

**"Provisioning profile doesn't match"**
- Solution: Let EAS manage credentials automatically

**"Bundle identifier already exists"**
- Your app is already registered, this is normal

**"Build failed - check logs"**
```bash
eas build:view --platform ios
```

**"Submission failed"**
- Check App Store Connect for missing information
- Ensure app category is set (Education/Health & Fitness)
- Verify screenshots are uploaded

## Build Configuration Details

- **SDK Version**: 51.0.0 (Stable LTS)
- **Bundle ID**: com.naturinex.app
- **Team ID**: LFB9Z5Q3Y9
- **App ID**: 6749164831

## Cost Information

- EAS Build has a free tier (30 builds/month)
- Each iOS build counts as 1 build
- Monitor usage: https://expo.dev/accounts/guampaul/settings/billing

## Next Steps After First Build

1. **Test thoroughly** on real devices
2. **Take App Store screenshots** from the build
3. **Complete App Store listing**:
   - Set category to Education or Health & Fitness
   - Upload screenshots
   - Write description emphasizing wellness education
   - Add privacy policy URL

4. **Submit for review** when ready

Remember: Position app as "Wellness Education" not "Medical Alternative"