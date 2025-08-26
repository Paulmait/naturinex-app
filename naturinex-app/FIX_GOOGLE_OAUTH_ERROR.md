# 🔧 Fix Google OAuth "Access Blocked" Error

## The Problem
You're getting "Error 400: invalid_request" because the OAuth client IDs in your app are placeholders or misconfigured. Google is blocking the authentication because the OAuth consent screen and client IDs aren't properly set up.

## Quick Fix Guide (15-20 minutes)

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (it should match your Firebase project)
   - If you don't have one, create a new project

### Step 2: Configure OAuth Consent Screen

1. In the left menu, go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for users outside your organization)
3. Fill in the required fields:
   - **App name**: Naturinex
   - **User support email**: Your email
   - **App logo**: Upload your app icon (optional)
   - **Application home page**: https://naturinex.com (or your website)
   - **Application privacy policy**: https://raw.githubusercontent.com/Paulmait/naturinex-legal/main/privacy-policy-enhanced.html
   - **Application terms of service**: https://raw.githubusercontent.com/Paulmait/naturinex-legal/main/terms-of-service-enhanced.html
   - **Authorized domains**: Add `naturinex.com` (if you have a domain)
   - **Developer contact email**: Your email
4. Click **Save and Continue**

### Step 3: Add Scopes

1. Click **Add or Remove Scopes**
2. Select these scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click **Update** and then **Save and Continue**

### Step 4: Add Test Users (if in testing mode)

1. Click **Add Users**
2. Add your email and any test emails
3. Click **Save and Continue**

### Step 5: Create OAuth Client IDs

Go to **APIs & Services** → **Credentials**

#### For Expo Development (REQUIRED):
1. Click **Create Credentials** → **OAuth client ID**
2. Application type: **Web application**
3. Name: **Expo Development Client**
4. Authorized JavaScript origins:
   ```
   https://auth.expo.io
   ```
5. Authorized redirect URIs:
   ```
   https://auth.expo.io/@guampaul/naturinex
   ```
   (Note: Use your Expo username, check app.json for "owner": "guampaul")
6. Click **Create**
7. Copy the Client ID (save this as `googleExpoClientId`)

#### For iOS (for production):
1. Click **Create Credentials** → **OAuth client ID**
2. Application type: **iOS**
3. Name: **Naturinex iOS**
4. Bundle ID: `com.naturinex.app`
5. Click **Create**
6. Copy the Client ID (save this as `googleIosClientId`)

#### For Android (for production):
1. First, get your SHA-1 fingerprint:
   ```bash
   # For debug keystore (development)
   cd android/app
   keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # Copy the SHA-1 fingerprint
   ```
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Android**
4. Name: **Naturinex Android**
5. Package name: `com.naturinex.app`
6. SHA-1 certificate fingerprint: (paste your SHA-1)
7. Click **Create**
8. Copy the Client ID (save this as `googleAndroidClientId`)

### Step 6: Update Your app.json

Replace the placeholder values in your `app.json`:

```json
{
  "expo": {
    "extra": {
      "googleExpoClientId": "YOUR_ACTUAL_EXPO_CLIENT_ID",
      "googleIosClientId": "YOUR_ACTUAL_IOS_CLIENT_ID", 
      "googleAndroidClientId": "YOUR_ACTUAL_ANDROID_CLIENT_ID"
    }
  }
}
```

### Step 7: Enable Required APIs

1. Go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - Google Sign-In API
   - Google+ API (if available)
   - Identity Toolkit API

### Step 8: Update Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Go to **Authentication** → **Sign-in method**
3. Click on **Google**
4. Make sure it's enabled
5. Update the Web SDK configuration with your web client ID
6. Add your authorized domains (if not already there)

## Testing the Fix

### For Expo Go (Development):
```bash
# Clear cache and restart
npx expo start -c
```

### For Production Build:
```bash
# Build for testing
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

## Common Issues and Solutions

### Still Getting "Access Blocked"?
1. **Wrong redirect URI**: Make sure it's exactly `https://auth.expo.io/@your-expo-username/your-app-slug`
2. **OAuth consent not published**: If ready for production, submit for verification
3. **Client ID mismatch**: Ensure you're using the web client ID for Expo

### "Invalid client ID"
- You're using a placeholder ID
- The client ID doesn't match the platform
- The OAuth client was deleted or disabled

### "Redirect URI mismatch"
- Check your Expo username in app.json ("owner" field)
- Verify the app slug matches

## Temporary Workaround

If you need to test immediately without Google Sign-In:

1. Comment out the Google Sign-In button temporarily
2. Use email/password authentication
3. Or use the "Skip for Now" option

## Final Configuration

Your app.json should look like this after the fix:

```json
{
  "expo": {
    "name": "Naturinex Wellness Guide",
    "slug": "naturinex",
    "owner": "guampaul",
    "extra": {
      "googleExpoClientId": "123456789-abcdefg.apps.googleusercontent.com",
      "googleIosClientId": "123456789-hijklmn.apps.googleusercontent.com",
      "googleAndroidClientId": "123456789-opqrstu.apps.googleusercontent.com"
    }
  }
}
```

## Verification Steps

1. Check OAuth consent screen is configured
2. Verify all client IDs are created
3. Ensure redirect URIs match exactly
4. Test in Expo Go after updating app.json
5. Clear Expo cache if needed: `npx expo start -c`

Once you complete these steps, Google Sign-In will work properly!