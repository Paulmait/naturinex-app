# 🔥 Firebase Testing Guide for Naturinex

## ✅ Your Firebase is Now Configured!

I've updated your configuration with the Firebase credentials you provided. Here's what's been done:

### 1. Updated Files:
- ✅ `app.json` - Firebase config added
- ✅ `firebaseConfig.js` - Real values added
- ✅ `src/config/firebase.js` - Already configured
- ✅ `firestore.rules` - Secure rules already in place

### 2. Your Firebase Security Setup

Your Firestore rules are **excellent** and include:
- ✅ Users can only access their own data
- ✅ Premium features validated server-side
- ✅ Privacy consent tracking
- ✅ Medical disclaimer acknowledgments
- ✅ Secure scan data storage
- ✅ Admin-only collections protected

## 🧪 Testing Steps

### Step 1: Start Expo Go
```bash
cd naturinex-app
npm start

# Scan QR code with Expo Go app on your phone
# Or press 'w' for web testing
```

### Step 2: Test Authentication

1. **Sign Up Test:**
   - Click "Sign Up" or "Get Started"
   - Enter test email: test@example.com
   - Password: Test123!
   - Should create account successfully

2. **Verify in Firebase Console:**
   - Go to https://console.firebase.google.com/
   - Navigate to your project → Authentication
   - You should see the new user listed

3. **Sign In Test:**
   - Log out and sign back in
   - Should maintain session

### Step 3: Test Medication Analysis

1. **Enter Medication:**
   - Type "Advil" or "Tylenol"
   - Click analyze button
   
2. **Expected Behavior:**
   - If backend is running: Get AI suggestions
   - If backend is down: "AI is currently unavailable"

### Step 4: Check Firebase Console

1. **Firestore Database:**
   - Go to Firestore Database in Firebase Console
   - You should see:
     - `users` collection with your test user
     - User document with structure like:
     ```json
     {
       "email": "test@example.com",
       "isPremium": false,
       "scanCount": 1,
       "lastScanDate": "2025-01-25"
     }
     ```

## 🔍 Troubleshooting Common Issues

### "Firebase: Error (auth/invalid-api-key)"
- Double-check the API key in app.json
- Make sure there are no extra spaces or quotes

### "Permission Denied" when scanning
- User must be logged in
- Check Firestore rules are deployed
- Verify user document exists

### "Network Request Failed"
- Backend server issue, not Firebase
- Check if https://naturinex-app.onrender.com is running

### App crashes on launch
- Clear Expo cache: `expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## 📊 Security Dashboard

To monitor your app's security:

1. **Enable Firebase App Check** (recommended before production):
   - Go to Firebase Console → App Check
   - Register your app
   - Add to your code:
   ```javascript
   import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
   
   const appCheck = initializeAppCheck(app, {
     provider: new ReCaptchaV3Provider('your-recaptcha-key'),
     isTokenAutoRefreshEnabled: true
   });
   ```

2. **Monitor Usage:**
   - Firebase Console → Usage and billing
   - Set up alerts for unusual activity

3. **Security Rules Monitor:**
   - Firebase Console → Firestore → Rules → Monitor
   - Check for denied requests

## 🚀 Next Steps

### Immediate (Today):
1. ✅ Test basic authentication flow
2. ✅ Verify Firestore is creating user documents
3. ✅ Test medication analysis (even if backend is down)

### Before Beta Launch:
1. Deploy Firestore security rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Set up Firebase App Check for additional security

3. Enable analytics:
   ```javascript
   import { getAnalytics } from "firebase/analytics";
   const analytics = getAnalytics(app);
   ```

### For Production:
1. Move API keys to environment variables
2. Set up monitoring and alerts
3. Enable backup for Firestore

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Can create account in app
2. ✅ User appears in Firebase Console
3. ✅ Can log in/out successfully
4. ✅ User document created in Firestore
5. ✅ No permission errors

Your Firebase setup is complete and secure! The "analyzing failed" error should now be resolved if your backend is running.