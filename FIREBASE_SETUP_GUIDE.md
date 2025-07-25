# 🔥 Firebase Setup Guide for Naturinex

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click "Create a project" or "Add project"
   - Name it: "naturinex-app" (or similar)
   - Disable Google Analytics (optional, you can enable later)

2. **Enable Authentication**
   - In Firebase Console, click "Authentication" in left sidebar
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - (Optional) Enable "Google" sign-in method

3. **Create Firestore Database**
   - Click "Firestore Database" in left sidebar
   - Click "Create database"
   - Choose "Start in production mode"
   - Select your region (choose closest to your users)

4. **Get Your Configuration**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click "Web" icon (</>)
   - Register app with nickname "Naturinex Web"
   - Copy the configuration object

## Step 2: Update app.json

Your Firebase config will look like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "naturinex-app.firebaseapp.com",
  projectId: "naturinex-app",
  storageBucket: "naturinex-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

Now update your `app.json` file:

```json
{
  "expo": {
    // ... other config ...
    "extra": {
      "apiUrl": "https://naturinex-app.onrender.com",
      "stripePublishableKey": "pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05",
      "googleExpoClientId": "YOUR_GOOGLE_EXPO_CLIENT_ID",
      "googleIosClientId": "YOUR_GOOGLE_IOS_CLIENT_ID", 
      "googleAndroidClientId": "YOUR_GOOGLE_ANDROID_CLIENT_ID",
      "firebaseApiKey": "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
      "firebaseAuthDomain": "naturinex-app.firebaseapp.com",
      "firebaseProjectId": "naturinex-app",
      "firebaseStorageBucket": "naturinex-app.appspot.com",
      "firebaseMessagingSenderId": "123456789012",
      "firebaseAppId": "1:123456789012:web:xxxxxxxxxxxxx",
      "eas": {
        "projectId": "209a36db-b288-4ad5-80b2-a518c1a33f1a"
      }
    }
  }
}
```

## Step 3: Update firebaseConfig.js

Also update the fallback values in `firebaseConfig.js`:

```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naturinex-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naturinex-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naturinex-app.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789012:web:xxxxxxxxxxxxx"
};
```

## Step 4: Set Firestore Security Rules

In Firebase Console > Firestore Database > Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read products (if you have this collection)
    match /products/{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## Step 5: Enable CORS for your domain

If you're getting CORS errors, add your domains to Firebase:
1. Go to Firebase Console > Authentication > Settings
2. Add authorized domains:
   - localhost
   - naturinex-app.onrender.com
   - Your Expo development URL

## Troubleshooting

If you get "analyizing failed" error, check:
1. ✅ Firebase project is created and active
2. ✅ Firestore database is created
3. ✅ Authentication is enabled
4. ✅ All Firebase config values are copied correctly
5. ✅ No extra spaces or quotes in the config values

## Test Your Setup

```bash
# In your project directory
npm start

# Press 'w' to open in web browser
# Try to sign up with a test email
# Check Firebase Console > Authentication to see if user was created
```

Your Firebase setup is complete! 🎉