# 🚨 CRITICAL FIXES FOR APP STORE DEPLOYMENT

## 1. ✅ Firebase Authentication Error (FIXED)
**Issue**: Server was throwing "Unable to detect a Project Id" error
**Fix Applied**: Created firebase-init.js with proper error handling
**Status**: ✅ FIXED - Server will now work without Firebase credentials

### What you need to do:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Add these to server/.env:
```
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 2. 🔧 Google Sign-In Not Working
**Issue**: Google OAuth might be misconfigured
**Possible Causes**:
- OAuth consent screen not configured
- Wrong client IDs in app.json
- Missing Android SHA-1 fingerprint

### Fix Steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (naturinex-app)
3. Go to APIs & Services > Credentials
4. Check OAuth 2.0 Client IDs:
   - Web client ID: Should match googleExpoClientId
   - iOS client ID: Should match googleIosClientId
   - Android client ID: Should match googleAndroidClientId

### For Expo Development:
```bash
# Get your development SHA-1
eas credentials
# Select Android > production > Keystore > View
# Add the SHA-1 to Google Console
```

## 3. 📸 Photo Capture Error
**Likely Issue**: Camera permissions or image processing
**Debug Steps**:
1. Check if camera permissions are properly requested
2. Verify image upload size limits
3. Check FormData configuration

## 4. 💳 Subscription Cancellation Error
**Issue**: POST /api/subscription/portal failing
**Fix**: Update the subscription portal endpoint

### Add to server/index.js:
```javascript
app.post('/api/subscription/portal', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // Get user's Stripe customer ID
    const userDoc = await getFirestore()?.collection('users').doc(userId).get();
    const stripeCustomerId = userDoc?.data()?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      return res.status(404).json({ error: 'No subscription found' });
    }
    
    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${Constants.expoConfig?.extra?.apiUrl}/subscription`,
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});
```

## 5. 📱 Expo SDK Update (v53 → v52)
**Critical for App Store**:
```bash
# Update Expo SDK
npm install expo@~52.0.0
npx expo install --fix

# Verify
npx expo doctor
```

## 6. 🔐 App Store Credentials
**Update eas.json**:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

## 7. 📄 Legal Documents
**Host on GitHub Pages**:
1. Create repo: `github.com/YOUR_USERNAME/naturinex-legal`
2. Add privacy-policy.html and terms.html
3. Enable GitHub Pages
4. Update app with URLs

## DEPLOYMENT CHECKLIST

### Server Fixes (Do First):
- [ ] Add Firebase service account credentials to server/.env
- [ ] Deploy server changes to Render
- [ ] Test all endpoints work

### Client Fixes:
- [ ] Update Expo SDK to v52
- [ ] Fix Google Sign-In configuration
- [ ] Test camera functionality
- [ ] Verify subscription flow

### App Store Prep:
- [ ] Host legal documents
- [ ] Update eas.json with real credentials
- [ ] Create app icon (1024x1024)
- [ ] Take screenshots for stores

## Quick Test Commands:
```bash
# Test server locally
cd server
npm start

# Test client
cd ..
npx expo start

# Build for testing
eas build --platform ios --profile preview
```

## Emergency Contacts:
- Expo Discord: https://chat.expo.dev
- Firebase Support: https://firebase.google.com/support
- Stripe Support: support@stripe.com