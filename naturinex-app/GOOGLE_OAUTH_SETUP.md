# 🔐 Google OAuth Setup Guide for Naturinex (Optional)

**Note:** Google OAuth requires a development build and won't work in Expo Go. Only set this up if you want Google Sign-In functionality.

## Step 1: Enable Google Auth in Firebase

1. **Firebase Console**
   - Go to Authentication > Sign-in method
   - Click "Google" 
   - Enable it
   - Add your project support email
   - Click "Save"

2. **Get Web Client ID**
   - After enabling, expand the Google provider
   - Copy the "Web client ID" (looks like: 123456789012-abcdefghijklmnop.apps.googleusercontent.com)

## Step 2: Create OAuth Clients in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your Firebase project (or create new)

2. **Enable Google Sign-In API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sign-In"
   - Click and Enable it

3. **Create OAuth Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"

### For Expo Client:
- Application type: Web application
- Name: "Expo Go Client"
- Authorized JavaScript origins:
  - https://auth.expo.io
- Authorized redirect URIs:
  - https://auth.expo.io/@pmaitland78/naturinex
- Copy the Client ID

### For iOS:
- Application type: iOS
- Name: "Naturinex iOS"
- Bundle ID: com.naturinex.app
- Copy the Client ID

### For Android:
- Application type: Android
- Name: "Naturinex Android"
- Package name: com.naturinex.app
- SHA-1 certificate fingerprint: (get this from your keystore)
- Copy the Client ID

## Step 3: Update app.json

```json
{
  "expo": {
    "extra": {
      "googleExpoClientId": "123456789012-expo.apps.googleusercontent.com",
      "googleIosClientId": "123456789012-ios.apps.googleusercontent.com",
      "googleAndroidClientId": "123456789012-android.apps.googleusercontent.com"
    }
  }
}
```

## Step 4: Implement Google Sign-In

In your login component:

```javascript
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

function LoginScreen() {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: Constants.expoConfig?.extra?.googleExpoClientId,
    iosClientId: Constants.expoConfig?.extra?.googleIosClientId,
    androidClientId: Constants.expoConfig?.extra?.googleAndroidClientId,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  return (
    <Button
      disabled={!request}
      title="Sign in with Google"
      onPress={() => promptAsync()}
    />
  );
}
```

## Step 5: Test Google Sign-In

```bash
# Build development client
eas build --platform all --profile development

# Install on your device and test
```

## Troubleshooting

### "Invalid client ID"
- Make sure you're using the correct client ID for each platform
- Web client ID for Expo Go, platform-specific for builds

### "Redirect URI mismatch"
- Check that your redirect URI matches exactly
- For Expo: https://auth.expo.io/@pmaitland78/naturinex

### "SHA-1 mismatch" (Android)
- Get SHA-1 from your keystore:
  ```bash
  keytool -list -v -keystore your-keystore.keystore
  ```

## Important Notes

1. **Expo Go Limitation**: Google Sign-In won't work in Expo Go, only in development/production builds
2. **Privacy Policy**: Required when using Google Sign-In
3. **Branding**: Follow Google's branding guidelines for the sign-in button

If you don't need Google Sign-In immediately, you can skip this setup and add it later!