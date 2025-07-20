# Complete Configuration Guide for Naturinex

## 🚨 Critical Setup Steps (Required)

### 1. Firebase Configuration

**Step 1: Create Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing
3. Enable Authentication (Email/Password and Google)
4. Enable Firestore Database
5. Get your project configuration

**Step 2: Update app.json**
Replace the placeholder values in `app.json`:

```json
"extra": {
  "firebaseApiKey": "your-actual-firebase-api-key",
  "firebaseAuthDomain": "your-project.firebaseapp.com",
  "firebaseProjectId": "your-project-id",
  "firebaseStorageBucket": "your-project.appspot.com",
  "firebaseMessagingSenderId": "123456789",
  "firebaseAppId": "1:123456789:web:abcdef123456"
}
```

**Step 3: Create .env file**
Create a `.env` file in the `client` directory:

```env
REACT_APP_FIREBASE_API_KEY=your-actual-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 2. Google OAuth Setup (Optional but Recommended)

**Step 1: Create Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or use existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials

**Step 2: Configure OAuth Credentials**
1. Create OAuth 2.0 Client ID for Web application
2. Add authorized origins: `https://auth.expo.io`
3. Add authorized redirect URIs: `https://auth.expo.io/@your-expo-username/naturinex`

**Step 3: Update app.json**
```json
"extra": {
  "googleExpoClientId": "your-expo-client-id.apps.googleusercontent.com",
  "googleIosClientId": "your-ios-client-id.apps.googleusercontent.com",
  "googleAndroidClientId": "your-android-client-id.apps.googleusercontent.com"
}
```

### 3. Backend API Configuration

**Step 1: Verify Backend URL**
Ensure your backend server is running and accessible:
- URL: `https://naturinex-app.onrender.com`
- Or update `apiUrl` in `app.json` to your server

**Step 2: Test API Endpoints**
Verify these endpoints work:
- `POST /api/analyze` - Image analysis
- `GET /api/health` - Health check

### 4. Stripe Configuration (For Premium Features)

**Step 1: Create Stripe Account**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your publishable key
3. Set up webhook endpoints

**Step 2: Update app.json**
```json
"extra": {
  "stripePublishableKey": "pk_live_your_actual_stripe_key"
}
```

## 🔧 Development Setup

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Install Expo CLI (if not already installed)
```bash
npm install -g @expo/cli
```

### 3. Start Development Server
```bash
npm start
```

## 📱 Testing Setup

### 1. Install Expo Go on iPhone
- Download from App Store
- Ensure iPhone and computer are on same WiFi

### 2. Test Configuration
Run this test script to verify setup:

```bash
# Test Firebase connection
npm run test:firebase

# Test API connection  
npm run test:api

# Test camera permissions
npm run test:camera
```

## 🛠️ Troubleshooting Common Issues

### Issue 1: Firebase Not Working
**Symptoms**: Authentication fails, "Firebase not initialized"
**Solutions**:
1. Check Firebase configuration in `app.json`
2. Verify Firebase project is active
3. Ensure API keys are correct
4. Check network connectivity

### Issue 2: Camera Not Working
**Symptoms**: Camera permission denied, blank camera view
**Solutions**:
1. Check camera permissions in iPhone Settings
2. Verify `app.json` camera configuration
3. Test with different camera apps first
4. Restart Expo Go app

### Issue 3: API Calls Failing
**Symptoms**: Analysis fails, network errors
**Solutions**:
1. Verify backend server is running
2. Check API URL in `app.json`
3. Test API endpoints manually
4. Check network connectivity

### Issue 4: Google OAuth Not Working
**Symptoms**: Google sign-in fails, redirect errors
**Solutions**:
1. Verify OAuth client IDs in `app.json`
2. Check Google Cloud Console configuration
3. Ensure redirect URIs are correct
4. Test with different Google accounts

## 🔒 Security Checklist

### ✅ Required Security Measures
- [ ] Firebase API keys are secure
- [ ] OAuth client IDs are configured
- [ ] HTTPS is used for all API calls
- [ ] Sensitive data is encrypted
- [ ] User permissions are properly handled

### ✅ Privacy Compliance
- [ ] Camera permissions are requested appropriately
- [ ] Photo library permissions are handled
- [ ] User data is not shared without consent
- [ ] Privacy policy is accessible
- [ ] Data retention policies are clear

## 🚀 Production Deployment Checklist

### ✅ Pre-Deployment
- [ ] All environment variables are set
- [ ] Firebase project is in production mode
- [ ] API endpoints are production-ready
- [ ] Stripe is configured for production
- [ ] Error monitoring is set up

### ✅ App Store Preparation
- [ ] App icons are properly sized
- [ ] Screenshots are ready
- [ ] App description is complete
- [ ] Privacy policy is uploaded
- [ ] Terms of service are ready

## 📋 Configuration Verification

Run this checklist to verify everything is working:

### Firebase Configuration
- [ ] Firebase project is active
- [ ] Authentication is enabled
- [ ] Firestore is enabled
- [ ] API keys are correct
- [ ] Project ID matches

### Google OAuth
- [ ] OAuth client IDs are set
- [ ] Redirect URIs are correct
- [ ] Google+ API is enabled
- [ ] Test sign-in works

### API Configuration
- [ ] Backend server is running
- [ ] API endpoints respond
- [ ] Image upload works
- [ ] Analysis returns results

### Camera & Permissions
- [ ] Camera permissions work
- [ ] Photo library access works
- [ ] Image capture works
- [ ] Image upload works

### App Functionality
- [ ] Login works
- [ ] Navigation works
- [ ] Camera scanning works
- [ ] Analysis displays results
- [ ] Profile management works
- [ ] Subscription features work

## 🆘 Emergency Contacts

If you encounter issues:
1. Check Expo documentation
2. Review Firebase setup guides
3. Test with different devices
4. Check network connectivity
5. Verify all configuration values

## 📞 Support Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Firebase Setup Guide](https://firebase.google.com/docs)
- [React Navigation Docs](https://reactnavigation.org/)
- [Expo Camera Docs](https://docs.expo.dev/versions/latest/sdk/camera/)

---

**⚠️ Important**: Never commit sensitive API keys to version control. Use environment variables and secure configuration management. 