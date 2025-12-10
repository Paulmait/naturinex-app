# 🚀 Reusable Expo EAS Build Prompt Template

**Purpose**: Use this prompt with Claude Code to successfully build and deploy any Expo React Native app to production using EAS (Expo Application Services).

**Success Rate**: Based on Naturinex Wellness Guide (97/100 security, Build #5 success)

---

## 📋 Copy-Paste Prompt (Customize Before Using)

```
I need your help to build and deploy my Expo React Native app to production using EAS (Expo Application Services).

PROJECT DETAILS:
- App Name: [YOUR_APP_NAME]
- Expo SDK Version: [e.g., 52.0.0]
- Platforms: [iOS / Android / Both]
- App Purpose: [Brief description]

CURRENT STATUS:
- [ ] Code complete and tested locally
- [ ] Backend deployed (if applicable)
- [ ] API keys available
- [ ] Apple Developer account active (for iOS)
- [ ] Google Play account active (for Android)

BUILD REQUIREMENTS:
1. iOS Production Build for App Store
2. Secure all API keys (no client-side exposure)
3. Fix any build errors that occur
4. Ensure 95+ security score
5. Monitor builds in real-time
6. Provide IPA/AAB download links when complete

CRITICAL REQUIREMENTS - FOLLOW THESE EXACTLY:

**Build Configuration**:
- Use `eas build --platform [ios/android] --profile production --non-interactive`
- Monitor builds every minute and report progress
- If build fails, analyze error logs immediately and fix

**Security Standards**:
- NO API keys in client-side code (must be server-side)
- NO console.log statements in production code
- Enable RLS (Row Level Security) for all database tables
- Use JWT authentication for all API calls

**Common Issues to Watch For**:
1. Push notification capability errors → Remove expo-notifications if not needed
2. Sentry configuration errors → Add SENTRY_DISABLE_AUTO_UPLOAD=true
3. Provisioning profile mismatches → Check capabilities in Apple Developer
4. API key exposure → Move to backend/Edge Functions
5. Build timeouts → Large uploads take 5-10 minutes (normal)

BACKEND REQUIREMENTS (if using Supabase):
- Deploy Edge Functions as API proxies
- Set API keys as Supabase secrets (server-side only)
- Apply database migrations with RLS policies
- Enable device tracking for guest mode limits

DELIVERABLES:
1. Successful iOS/Android production build
2. Download link for IPA/AAB file
3. Build logs and error resolution documentation
4. Security audit report (target: 95+/100)
5. Comprehensive markdown documentation for future reference

WORKFLOW:
1. Audit current configuration (eas.json, app.json, package.json)
2. Identify and fix security vulnerabilities
3. Deploy backend infrastructure (if applicable)
4. Run production build with monitoring
5. Fix any build errors immediately
6. Provide download links and next steps
7. Create comprehensive documentation

Please start by:
1. Reading my eas.json, app.json, and package.json
2. Checking for common issues (listed above)
3. Deploying backend if needed
4. Starting the production build
5. Monitoring progress every minute

IMPORTANT LESSONS FROM PREVIOUS BUILDS:
- DO NOT update packages to latest versions without testing (major versions have breaking changes)
- DO add SENTRY_DISABLE_AUTO_UPLOAD=true if using Sentry without full config
- DO remove expo-notifications if push notifications aren't needed
- DO use server-side API proxies (Supabase Edge Functions, Vercel, etc.)
- DO monitor builds continuously (don't leave them unattended)
- DO create comprehensive documentation for future reference

Let's start! Please audit my app and begin the build process.
```

---

## 🎯 Customization Instructions

Before using this prompt, customize the following sections:

### 1. PROJECT DETAILS
Replace with your actual app information:
```
- App Name: Your App Name Here
- Expo SDK Version: Check package.json for "expo" version
- Platforms: iOS, Android, or Both
- App Purpose: 1-2 sentence description
```

### 2. CURRENT STATUS
Check what you have ready:
```
- [ ] Code complete → All features implemented
- [ ] Backend deployed → Supabase/Firebase/custom backend live
- [ ] API keys available → Google AI, Stripe, etc.
- [ ] Apple Developer account → $99/year membership active
- [ ] Google Play account → $25 one-time registration
```

### 3. BUILD REQUIREMENTS
Add or remove based on your needs:
```
- iOS only? Remove Android requirements
- Android only? Remove iOS requirements
- No backend? Remove backend deployment tasks
- No API keys? Remove API security requirements
```

---

## 📚 Key Learnings from Naturinex Build

### Issues We Fixed & How

#### Issue 1: Sentry Configuration Error ✅
**Error**: `An organization ID or slug is required (provide with --org)`

**Solution**: Add to eas.json production env:
```json
"env": {
  "SENTRY_DISABLE_AUTO_UPLOAD": "true"
}
```

**When This Happens**: You have `@sentry/react-native` in plugins but no Sentry organization configured.

---

#### Issue 2: Push Notifications Capability ✅
**Error**: `Provisioning profile doesn't support Push Notifications capability`

**Solution**: Remove expo-notifications if not using push notifications:
```bash
npm uninstall expo-notifications
```

**When This Happens**: expo-notifications adds push notification entitlements automatically, but your Apple provisioning profile doesn't include this capability.

---

#### Issue 3: API Key Exposure ❌ (Security Risk)
**Problem**: API keys in EXPO_PUBLIC_* environment variables are visible in compiled app

**Solution**: Move to server-side:
1. Create Supabase Edge Functions (or similar backend)
2. Set API keys as server-side secrets
3. App calls your Edge Functions instead of external APIs directly

**Verification**:
```bash
# Should return NO results
grep -r "AIzaSy" src/
grep -r "EXPO_PUBLIC_GEMINI" .
```

---

#### Issue 4: Package Version Conflicts ⚠️
**Problem**: Updating to latest versions breaks the app

**Solution**: Stay on current stable versions until after App Store launch
```json
{
  "expo": "~52.0.47",    // Don't update to 54
  "react": "18.3.1",     // Don't update to 19
  "react-native": "0.76.9" // Don't update to 0.82
}
```

**When to Update**: After successful launch, plan for v1.1.0 with thorough testing.

---

## 🔧 Pre-Build Checklist

Before starting the EAS build, verify:

### Configuration Files
- [ ] `eas.json` exists with production profile
- [ ] `app.json` has correct bundle IDs and versions
- [ ] `package.json` has all dependencies installed
- [ ] No `expo-notifications` if not using push notifications
- [ ] `SENTRY_DISABLE_AUTO_UPLOAD=true` if using Sentry without config

### Security
- [ ] No API keys in code (search for "AIzaSy", "sk_", "pk_")
- [ ] No console.log in production code
- [ ] Backend deployed (if needed)
- [ ] API secrets set server-side (Supabase/Vercel)
- [ ] RLS policies enabled on database tables

### Credentials
- [ ] Apple Developer account active ($99/year)
- [ ] Distribution certificate valid (check eas credentials)
- [ ] Provisioning profile active
- [ ] Google Play account (if Android) ($25 one-time)

### Code Quality
- [ ] App runs locally without errors
- [ ] All imports resolve correctly
- [ ] No TypeScript errors (if using TS)
- [ ] Jest tests pass (if applicable)
- [ ] ESLint warnings reviewed

---

## 🚀 Build Monitoring

### Expected Timeline
```
Upload:       4-10 minutes (depends on project size)
Fingerprint:  1-2 minutes
Queue (Free): 2-5 minutes
Build:        15-30 minutes
Total:        25-45 minutes
```

### How to Monitor
```bash
# Check build status
eas build:list --platform ios --limit 5

# View specific build
eas build:view BUILD_ID

# Watch build in real-time (browser)
Visit: https://expo.dev/accounts/YOUR_USERNAME/projects/YOUR_PROJECT/builds/
```

### Build Status Indicators
- ⏳ "Uploading" → Normal, wait 4-10 min
- ⏳ "Queued" → Normal, wait 2-5 min (Free tier)
- 🔄 "Building" → Normal, wait 15-30 min
- ✅ "Finished" → SUCCESS! Download IPA/AAB
- ❌ "Errored" → Check logs, fix issue, rebuild

---

## 📊 Success Metrics

Your build is successful when:

✅ Build status shows "Finished"
✅ IPA/AAB download link provided
✅ No errors in build logs
✅ Security score 95+/100
✅ API keys not exposed in code
✅ App installs and runs on device

---

## 📝 Post-Build Documentation

After successful build, create these files:

1. **BUILD_SUCCESS_REPORT.md**
   - Build details and timeline
   - Issues fixed and solutions
   - Security audit results
   - Backend deployment status

2. **BUILD_QUICK_REFERENCE.md**
   - Quick commands for future builds
   - Configuration snippets
   - Troubleshooting guide

3. **BUILD_STATUS.md**
   - Current production status
   - Build artifacts and links
   - Next steps for submission

---

## 🎓 Pro Tips

### For Faster Builds
1. Upgrade to EAS paid plan for priority queue
2. Use `--resource-class m-large` for faster compilation
3. Pre-configure credentials to skip interactive prompts

### For Better Security
1. Use Supabase Edge Functions for API proxying
2. Enable RLS on all database tables
3. Implement device fingerprinting for guest limits
4. Set up Dependabot for automated security updates

### For Easier Debugging
1. Keep build logs for all attempts
2. Document every error and fix applied
3. Use `eas build:view --json BUILD_ID` for detailed info
4. Enable verbose logging: `DEBUG=* eas build`

---

## ⚠️ Common Pitfalls to Avoid

1. ❌ **Running build without monitoring** → Can't fix errors quickly
2. ❌ **Exposing API keys client-side** → Security vulnerability
3. ❌ **Updating packages before testing** → Breaks the app
4. ❌ **Skipping documentation** → Future you will struggle
5. ❌ **Not testing on real device** → App Store may reject
6. ❌ **Ignoring build warnings** → May cause runtime issues
7. ❌ **Rushing submission** → Incomplete metadata = rejection

---

## 📞 Helpful Resources

### Official Documentation
- **EAS Build**: https://docs.expo.dev/build/introduction/
- **EAS Submit**: https://docs.expo.dev/submit/introduction/
- **Expo Go**: https://docs.expo.dev/get-started/expo-go/

### Community Resources
- **Expo Forums**: https://forums.expo.dev/
- **Discord**: https://discord.gg/expo
- **GitHub Issues**: https://github.com/expo/expo/issues

### Apple Resources
- **App Store Connect**: https://appstoreconnect.apple.com/
- **Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/

### Google Resources
- **Play Console**: https://play.google.com/console/
- **Review Guidelines**: https://play.google.com/about/developer-content-policy/

---

## 🎉 Success Example: Naturinex Wellness Guide

**Final Result**:
- Build #5: ✅ SUCCESS (after 3 failed attempts)
- Security Score: 97/100
- Build Time: 33 minutes
- Issues Fixed: 3 (Sentry config, push notifications, API exposure)
- Status: Ready for App Store submission

**Key Fixes**:
1. Added `SENTRY_DISABLE_AUTO_UPLOAD=true`
2. Removed expo-notifications
3. Moved API keys to Supabase Edge Functions
4. Deployed backend with RLS policies
5. Created comprehensive documentation

**Lessons Learned**:
- Monitor builds continuously
- Fix errors immediately
- Document everything
- Don't update packages unnecessarily
- Security first, always

---

## 🔄 Version History

- **v1.0** (Dec 10, 2025) - Initial template from Naturinex success
- Based on Build #5 success after 3 failed attempts
- Incorporates all lessons learned

---

**Ready to use?** Copy the prompt above, customize it, and paste it into Claude Code!

**Good luck with your build!** 🚀
