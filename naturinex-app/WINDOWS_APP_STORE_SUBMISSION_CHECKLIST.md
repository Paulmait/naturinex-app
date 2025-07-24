# 🚨 CRITICAL: Windows App Store Submission Checklist

## ⚠️ IMMEDIATE ACTION REQUIRED BEFORE SUBMISSION

### 🔴 CRITICAL ISSUE #1: Firebase Configuration
**STATUS: NOT CONFIGURED** 
Your Firebase configuration is using placeholder values. The app WILL NOT WORK without proper Firebase credentials.

**REQUIRED ACTION:**
1. Create a `.env` file in the client directory
2. Copy the contents from `env.example`
3. Fill in your actual Firebase credentials:
   - Firebase API Key
   - Firebase Auth Domain
   - Firebase Project ID
   - Firebase Storage Bucket
   - Firebase Messaging Sender ID
   - Firebase App ID

### 🔴 CRITICAL ISSUE #2: Google OAuth Configuration
**STATUS: NOT CONFIGURED**
Google Sign-In will not work without proper OAuth client IDs.

**REQUIRED ACTION:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client IDs for:
   - iOS application (com.naturinex.app)
   - Android application (com.naturinex.app)
   - Expo client
3. Add these to your `.env` file

### 🟡 WARNING: Icon Size Verification Needed
**STATUS: NEEDS VERIFICATION**
- Your app icon must be exactly 1024x1024 pixels
- No transparency allowed
- No rounded corners (Apple adds them)

**VERIFICATION STEPS:**
1. Right-click on `assets/icon.png`
2. Select Properties → Details
3. Verify dimensions are 1024x1024

## ✅ PRE-SUBMISSION CHECKLIST

### 1. Environment Configuration
- [ ] Create `.env` file from `env.example`
- [ ] Add Firebase credentials to `.env`
- [ ] Add Google OAuth credentials to `.env`
- [ ] Verify Stripe key is correct in app.json

### 2. Asset Requirements
- [ ] Verify icon.png is 1024x1024 pixels
- [ ] Verify splash.png is high resolution (min 2436x1125)
- [ ] Ensure all images are PNG format
- [ ] No transparency in app icon

### 3. Legal Documents
- [ ] Host Privacy Policy HTML file
- [ ] Host Terms of Service HTML file
- [ ] Update URLs in app submission forms
- [ ] Verify legal documents are accessible in app

### 4. App Configuration
- [ ] Bundle ID: com.naturinex.app ✅
- [ ] Version: 1.0.0 ✅
- [ ] Build Number: 1 ✅
- [ ] SDK Version: 53.0.0 ✅

### 5. Permissions (iOS)
- [ ] Camera usage description ✅
- [ ] Photo library usage description ✅
- [ ] Photo library add usage description ✅

## 🛠️ WINDOWS BUILD INSTRUCTIONS

### Prerequisites
1. **Install Required Software:**
   ```cmd
   # Install Node.js from https://nodejs.org
   # Install Git from https://git-scm.com
   # Install Expo CLI
   npm install -g expo-cli eas-cli
   ```

2. **Apple Developer Account:**
   - Active Apple Developer Program membership ($99/year)
   - Access to App Store Connect

### Building for iOS on Windows

**IMPORTANT:** You cannot build iOS apps directly on Windows. You have three options:

#### Option 1: EAS Build (Recommended) ✅
```cmd
# Navigate to client directory
cd C:\Users\maito\mediscan-app\client

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios
```

#### Option 2: Cloud Build Services
- Use services like:
  - Expo Application Services (EAS)
  - Codemagic
  - Bitrise
  - AppCenter

#### Option 3: Mac Access Required
- Rent a Mac in the cloud (MacStadium, MacInCloud)
- Use a friend's Mac
- Use a Mac at work/school

### Pre-Build Steps (Do These First!)

1. **Create Environment File:**
   ```cmd
   # In client directory
   copy env.example .env
   # Edit .env with your actual values
   ```

2. **Install Dependencies:**
   ```cmd
   npm install
   ```

3. **Update Credentials:**
   ```cmd
   node update-credentials.js
   ```

4. **Test Locally:**
   ```cmd
   npm start
   # Scan QR code with Expo Go app
   ```

## 📱 SUBMISSION PROCESS

### Step 1: Build the App
```cmd
# Using EAS Build
eas build --platform ios --auto-submit
```

### Step 2: App Store Connect
1. Log in to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app with Bundle ID: com.naturinex.app
3. Fill in all required information
4. Upload screenshots (you'll need iOS device/simulator)

### Step 3: Submit for Review
1. Select your build
2. Add review notes about app functionality
3. Submit for review

## 🚨 FINAL CHECKS BEFORE SUBMISSION

### Functionality Testing
- [ ] App launches without crashes
- [ ] Camera scanning works
- [ ] Legal documents accessible via Info button
- [ ] Medical disclaimers show properly
- [ ] Premium features behind paywall

### Security Checks
- [ ] No hardcoded API keys in code ✅
- [ ] Environment variables properly configured
- [ ] Secure data handling implemented ✅

### App Store Requirements
- [ ] Privacy policy URL hosted and accessible
- [ ] Terms of service URL hosted and accessible
- [ ] App description ready
- [ ] Keywords selected
- [ ] Screenshots prepared

## 🔧 TROUBLESHOOTING

### Common Issues on Windows:

1. **"Cannot build iOS on Windows"**
   - Use EAS Build or cloud services
   - You cannot use Xcode on Windows

2. **"Firebase not working"**
   - Ensure `.env` file exists
   - Verify all Firebase values are filled in
   - Check firebase.js is reading from Constants.expoConfig

3. **"Build failing"**
   - Clear cache: `expo start -c`
   - Delete node_modules and reinstall
   - Check all dependencies are installed

## 📞 SUPPORT CONTACTS

- **Email**: support@naturinex.com
- **Developer**: [Your contact]
- **Emergency**: [Your phone]

## ⏰ ESTIMATED TIME

- Environment setup: 30 minutes
- Build process: 45-60 minutes
- App Store submission: 30 minutes
- Total: ~2 hours

## 🎯 READY INDICATORS

Your app is ready when:
- ✅ All environment variables configured
- ✅ Assets verified (1024x1024 icon)
- ✅ Legal documents hosted
- ✅ Build completed successfully
- ✅ Local testing passed

**CRITICAL:** Do not submit until all items are checked!