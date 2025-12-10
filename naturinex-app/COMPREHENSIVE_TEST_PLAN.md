# 🧪 Comprehensive Test Plan
## Pre-Deployment Testing Checklist

**Status:** Ready to Execute
**Estimated Time:** 30-45 minutes

---

## 🎯 TEST OBJECTIVES

1. ✅ Verify all security fixes work correctly
2. ✅ Ensure no regressions in existing functionality
3. ✅ Confirm backend integration (Supabase Edge Functions)
4. ✅ Validate guest mode server-side enforcement
5. ✅ Check build succeeds without errors
6. ✅ Verify no API keys exposed in bundle

---

## 📋 PRE-FLIGHT CHECKLIST

Before starting tests, ensure:

- [ ] Node.js v20 active (`node --version` shows v20.x.x)
- [ ] Dependencies installed (`npm install` completed)
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] EAS CLI installed (`eas --version`)
- [ ] Git changes committed
- [ ] Clean working directory

---

## 🧪 TEST SUITE 1: CODE COMPILATION & BUILD

### Test 1.1: Dependencies Install Cleanly
```bash
# Remove and reinstall
rm -rf node_modules package-lock.json
npm install

# Expected: No errors, all packages install
# Pass Criteria: Exit code 0
```

### Test 1.2: TypeScript/JavaScript Compilation
```bash
# Check for syntax errors
npx tsc --noEmit --skipLibCheck

# Expected: No compilation errors
# Pass Criteria: "Found 0 errors"
```

### Test 1.3: Expo Doctor Check
```bash
# Verify Expo configuration
npx expo-doctor

# Expected: All checks pass or minor warnings only
# Pass Criteria: No critical errors
```

### Test 1.4: Metro Bundler Starts
```bash
# Start Metro bundler
npm start

# Expected: Bundler starts without errors
# Pass Criteria: "Metro waiting on exp://..."
# Action: Press Ctrl+C to stop after verifying
```

---

## 🧪 TEST SUITE 2: SECURITY VALIDATION

### Test 2.1: No API Keys in Source Code
```bash
# Search for exposed API keys
grep -r "EXPO_PUBLIC_GEMINI_API_KEY" src/
grep -r "EXPO_PUBLIC_GOOGLE_VISION_API_KEY" src/
grep -r "AIzaSy" src/

# Expected: No matches found (or only in comments/docs)
# Pass Criteria: No hardcoded API keys
```

### Test 2.2: Verify Secure Services Exist
```bash
# Check new secure services exist
ls -la src/services/aiServiceSecure.js
ls -la src/services/deviceFingerprintService.js

# Expected: Files exist
# Pass Criteria: Both files present
```

### Test 2.3: Verify Edge Functions Exist
```bash
# Check Edge Functions created
ls -la supabase/functions/gemini-analyze/index.ts
ls -la supabase/functions/vision-ocr/index.ts

# Expected: Files exist
# Pass Criteria: Both Edge Functions present
```

### Test 2.4: Verify Database Migration Exists
```bash
# Check migration file
ls -la supabase/migrations/20251210_device_tracking.sql

# Expected: File exists
# Pass Criteria: Migration file present
```

---

## 🧪 TEST SUITE 3: BACKEND DEPLOYMENT

### Test 3.1: Supabase Connection
```bash
# Test Supabase CLI connection
supabase projects list

# Expected: Shows your projects including naturinex
# Pass Criteria: Project list displayed
```

### Test 3.2: Deploy Database Migration
```bash
# Apply migration
cd naturinex-app
supabase db push

# Expected: Migration applied successfully
# Pass Criteria: "Finished supabase db push"
```

### Test 3.3: Verify Database Tables Created
```bash
# Check tables exist
supabase db diff

# Run query to verify
echo "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('device_usage', 'api_usage_logs');" | supabase db execute -

# Expected: Both tables exist
# Pass Criteria: device_usage and api_usage_logs listed
```

### Test 3.4: Deploy Edge Functions
```bash
# Deploy Gemini function
supabase functions deploy gemini-analyze

# Deploy Vision function
supabase functions deploy vision-ocr

# List functions
supabase functions list

# Expected: Both functions deployed
# Pass Criteria: gemini-analyze and vision-ocr listed
```

### Test 3.5: Set Environment Secrets
```bash
# Set Gemini API key (replace with your actual key)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here

# Set Vision API key (replace with your actual key)
supabase secrets set GOOGLE_VISION_API_KEY=your_vision_api_key_here

# List secrets (won't show values)
supabase secrets list

# Expected: Both secrets set
# Pass Criteria: GEMINI_API_KEY and GOOGLE_VISION_API_KEY listed
```

---

## 🧪 TEST SUITE 4: MOBILE APP TESTING

### Test 4.1: Start Development Server
```bash
# Start Expo
npm start

# Expected: QR code displays, bundler ready
# Pass Criteria: "Metro waiting on exp://..."
```

### Test 4.2: Load on iOS Simulator
```bash
# With npm start running, press 'i' to open iOS simulator
# Or run:
npx expo start --ios

# Expected: App loads in simulator
# Pass Criteria: App opens without crashes
```

### Test 4.3: Load on Android Emulator
```bash
# With npm start running, press 'a' to open Android emulator
# Or run:
npx expo start --android

# Expected: App loads in emulator
# Pass Criteria: App opens without crashes
```

### Test 4.4: Manual App Flow Testing

**Test A: Guest Mode - First 3 Scans**
1. ☐ Open app (don't sign in)
2. ☐ Click "Continue as Guest"
3. ☐ Navigate to camera screen
4. ☐ **Scan 1:** Enter "aspirin" manually
   - Expected: Analysis works
   - Expected: Remaining scans: 2/3
5. ☐ **Scan 2:** Enter "ibuprofen" manually
   - Expected: Analysis works
   - Expected: Remaining scans: 1/3
6. ☐ **Scan 3:** Enter "tylenol" manually
   - Expected: Analysis works
   - Expected: Remaining scans: 0/3
7. ☐ **Scan 4:** Try to scan again
   - Expected: "Free Scans Used" alert
   - Expected: Prompted to sign up
   - ✅ **CRITICAL:** Cannot bypass by clearing app data

**Test B: Guest Mode - Bypass Prevention**
1. ☐ After using all 3 scans (from Test A)
2. ☐ Close app completely
3. ☐ Go to device settings → Apps → Naturinex
4. ☐ Clear app data / Clear storage
5. ☐ Reopen app
6. ☐ Try to scan as guest
   - Expected: Still shows 0/3 scans remaining
   - Expected: Cannot scan (server remembers device)
   - ✅ **CRITICAL TEST:** If this works, guest mode is secure!

**Test C: Camera Functionality**
1. ☐ Open camera screen
2. ☐ Take photo with camera
   - Expected: Camera opens
   - Expected: Can capture image
   - Expected: Image sent for analysis
3. ☐ Select image from gallery
   - Expected: Gallery opens
   - Expected: Can select image
   - Expected: Image sent for analysis

**Test D: API Integration** (Requires Supabase deployed)
1. ☐ Sign in as user (or use guest mode)
2. ☐ Enter medication name: "aspirin"
3. ☐ Submit for analysis
   - Expected: Processing indicator shows
   - Expected: Results appear within 5-10 seconds
   - Expected: No "API key" errors
   - Expected: Analysis results display correctly
   - ✅ **CRITICAL:** Edge Function working

**Test E: Error Handling**
1. ☐ Turn off WiFi/mobile data
2. ☐ Try to scan medication
   - Expected: Offline error message
   - Expected: Graceful handling
3. ☐ Turn WiFi/data back on
4. ☐ Try again
   - Expected: Works normally

---

## 🧪 TEST SUITE 5: PRODUCTION BUILD

### Test 5.1: Preview Build for Android
```bash
# Create preview build (faster than production)
eas build --platform android --profile preview

# Expected: Build succeeds
# Pass Criteria: "Build finished"
# Time: ~10-15 minutes
```

### Test 5.2: Download and Install Preview Build
```bash
# After build completes:
# 1. Download APK from Expo dashboard
# 2. Install on physical Android device
# 3. Test guest mode flow again
# 4. Verify no API key errors

# Expected: App works on physical device
# Pass Criteria: All features functional
```

### Test 5.3: Production iOS Build (Simulation)
```bash
# Don't run yet - just verify command works
eas build --platform ios --profile production --dry-run

# Expected: Configuration validated
# Pass Criteria: "Dry run successful"
```

---

## 🧪 TEST SUITE 6: SECURITY VERIFICATION

### Test 6.1: Inspect Build Bundle (No API Keys)
```bash
# After preview build completes, download APK
# Unzip and search for API keys
unzip app-preview.apk -d app-extracted/
grep -r "AIzaSy" app-extracted/
grep -r "GEMINI_API_KEY" app-extracted/

# Expected: No API keys found
# Pass Criteria: No matches
```

### Test 6.2: Network Traffic Inspection
```bash
# While app is running:
# 1. Open Charles Proxy or similar
# 2. Run app
# 3. Perform scan
# 4. Check network requests

# Expected requests:
# - ${SUPABASE_URL}/functions/v1/gemini-analyze
# - ${SUPABASE_URL}/functions/v1/vision-ocr
# - Authorization headers present

# NOT expected:
# - Direct calls to googleapis.com from client
# - API keys in request headers/body

# Pass Criteria: All API calls go through Edge Functions
```

### Test 6.3: Database RLS Verification
```bash
# Connect to Supabase and try unauthorized access
psql $DATABASE_URL

# Try to read device_usage without auth (should fail)
SELECT * FROM device_usage LIMIT 1;

# Expected: Permission denied
# Pass Criteria: RLS blocks unauthorized access
```

---

## 🧪 TEST SUITE 7: PERFORMANCE & STABILITY

### Test 7.1: App Launch Time
```bash
# Time how long app takes to load
# 1. Close app completely
# 2. Start timer
# 3. Open app
# 4. Stop when home screen appears

# Expected: < 5 seconds
# Pass Criteria: Reasonable launch time
```

### Test 7.2: Memory Usage
```bash
# While app is running, check memory:
# iOS: Xcode → Debug Navigator → Memory
# Android: Android Studio → Profiler → Memory

# Expected: < 200MB for typical usage
# Pass Criteria: No memory leaks
```

### Test 7.3: Crash Testing
```bash
# Stress test the app:
# 1. Rapid button presses
# 2. Quick screen transitions
# 3. Background/foreground cycling
# 4. Airplane mode toggle

# Expected: No crashes
# Pass Criteria: App remains stable
```

---

## 📊 TEST RESULTS TEMPLATE

```markdown
## Test Execution Results

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [iOS/Android] [Version]
**Node Version:** [VERSION]

### Suite 1: Code Compilation & Build
- [ ] 1.1 Dependencies Install: PASS / FAIL
- [ ] 1.2 TypeScript Compilation: PASS / FAIL
- [ ] 1.3 Expo Doctor: PASS / FAIL
- [ ] 1.4 Metro Bundler: PASS / FAIL

### Suite 2: Security Validation
- [ ] 2.1 No API Keys in Code: PASS / FAIL
- [ ] 2.2 Secure Services Exist: PASS / FAIL
- [ ] 2.3 Edge Functions Exist: PASS / FAIL
- [ ] 2.4 Migration Exists: PASS / FAIL

### Suite 3: Backend Deployment
- [ ] 3.1 Supabase Connection: PASS / FAIL
- [ ] 3.2 Database Migration: PASS / FAIL
- [ ] 3.3 Tables Created: PASS / FAIL
- [ ] 3.4 Edge Functions Deployed: PASS / FAIL
- [ ] 3.5 Secrets Set: PASS / FAIL

### Suite 4: Mobile App Testing
- [ ] 4.1 Dev Server Starts: PASS / FAIL
- [ ] 4.2 iOS Simulator: PASS / FAIL
- [ ] 4.3 Android Emulator: PASS / FAIL
- [ ] 4.4A Guest Mode (3 scans): PASS / FAIL
- [ ] 4.4B Bypass Prevention: PASS / FAIL ← CRITICAL
- [ ] 4.4C Camera Functionality: PASS / FAIL
- [ ] 4.4D API Integration: PASS / FAIL ← CRITICAL
- [ ] 4.4E Error Handling: PASS / FAIL

### Suite 5: Production Build
- [ ] 5.1 Preview Build: PASS / FAIL
- [ ] 5.2 Physical Device Test: PASS / FAIL
- [ ] 5.3 Dry Run: PASS / FAIL

### Suite 6: Security Verification
- [ ] 6.1 No API Keys in Bundle: PASS / FAIL ← CRITICAL
- [ ] 6.2 Network Traffic: PASS / FAIL ← CRITICAL
- [ ] 6.3 Database RLS: PASS / FAIL

### Suite 7: Performance
- [ ] 7.1 Launch Time: PASS / FAIL
- [ ] 7.2 Memory Usage: PASS / FAIL
- [ ] 7.3 Crash Testing: PASS / FAIL

**Overall Result:** PASS / FAIL
**Blocker Issues:** [List any blockers]
**Ready for Production:** YES / NO
```

---

## ✅ PASS CRITERIA FOR DEPLOYMENT

App is ready for production deployment when:

**MUST PASS (Critical):**
- ✅ Suite 1: All tests pass (builds without errors)
- ✅ Suite 2: All tests pass (security files present)
- ✅ Suite 3: All tests pass (backend deployed)
- ✅ Test 4.4B: Guest mode bypass prevention works
- ✅ Test 4.4D: API integration works (Edge Functions)
- ✅ Test 6.1: No API keys in bundle
- ✅ Test 6.2: All API calls through Edge Functions

**SHOULD PASS (Important):**
- ✅ Test 4.4A: Guest mode 3-scan limit works
- ✅ Test 4.4C: Camera functionality works
- ✅ Test 5.1: Preview build succeeds
- ✅ Test 6.3: Database RLS working

**NICE TO PASS (Performance):**
- ✅ Suite 7: Performance acceptable
- ✅ No major memory leaks
- ✅ No frequent crashes

---

## 🚨 BLOCKER CRITERIA

Do NOT deploy if:
- ❌ API keys still exposed in client bundle
- ❌ Guest mode can be bypassed by clearing data
- ❌ Edge Functions not deployed or failing
- ❌ Database migration not applied
- ❌ App crashes on launch
- ❌ Cannot build production version

---

## 📝 NOTES

- **Backend Required:** Tests 4.4D, 6.2, 6.3 require Supabase deployed
- **API Keys Required:** Need real Gemini & Vision API keys for Test 4.4D
- **Physical Device:** Test 5.2 requires physical Android device
- **Time Required:** Allow 30-45 minutes for full test suite
- **Network:** Some tests require internet connection

---

## 🎯 QUICK TEST (5 Minutes)

If short on time, run this minimal test:

```bash
# 1. Verify build works
npm start
# Press Ctrl+C after Metro starts

# 2. Check no API keys exposed
grep -r "AIzaSy" src/

# 3. Verify files exist
ls src/services/aiServiceSecure.js
ls supabase/functions/gemini-analyze/index.ts

# 4. Test on simulator
npx expo start --ios
# Test guest mode: 3 scans then blocked

# If all pass → Likely safe to build
```

---

**Ready to start testing? Let's go! 🚀**
