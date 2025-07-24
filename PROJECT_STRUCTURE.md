# 📁 Naturinex App - Complete Project Structure

## 🏗️ Directory Overview

All necessary files have been consolidated into the `naturinex-app` directory for easier management and deployment.

```
naturinex-app/
├── 📱 Mobile App (Expo/React Native)
│   ├── App.js                    # Main app entry point
│   ├── app.json                  # Expo configuration
│   ├── package.json              # App dependencies
│   ├── src/                      # Source code
│   │   ├── components/           # React components
│   │   ├── screens/              # App screens
│   │   ├── navigation/           # Navigation setup
│   │   ├── services/             # API services
│   │   ├── firebase.js           # Firebase configuration
│   │   └── stripe.js             # Stripe integration
│   └── assets/                   # Images, fonts, etc.
│
├── 🔥 Firebase Functions (Backend)
│   └── functions/
│       ├── src/
│       │   ├── index.ts          # Express server & API
│       │   ├── stripeWebhook.ts  # Stripe webhook handler
│       │   └── testWebhook.ts    # Testing utilities
│       ├── .env                  # API keys (not in git)
│       ├── .env.example          # Example environment variables
│       ├── package.json          # Function dependencies
│       └── tsconfig.json         # TypeScript configuration
│
├── 📄 Legal Documents
│   └── legal/
│       ├── privacy-policy-enhanced.html
│       └── terms-of-service-enhanced.html
│
└── 📋 Documentation
    ├── APP_STORE_CHECKLIST.md
    ├── APPLE_REVIEW_CHECKLIST.md
    ├── FINAL_LAUNCH_CHECKLIST.md
    └── WEBHOOK_IMPLEMENTATION_SUMMARY.md
```

## 🔑 Configuration Files Location

### 1. **Environment Variables** (.env file)
Location: `naturinex-app/functions/.env`

Add your keys here:
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_ACTUAL_KEY
```

### 2. **Firebase Configuration**
Location: `naturinex-app/app.json` (in the `extra` section)

Update with your Firebase project details:
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "YOUR_API_KEY",
      "firebaseAuthDomain": "YOUR_AUTH_DOMAIN",
      "firebaseProjectId": "YOUR_PROJECT_ID",
      // ... other Firebase config
    }
  }
}
```

### 3. **App Configuration**
- **app.json**: Expo and app metadata
- **eas.json**: EAS Build configuration
- **firebase.json**: Firebase project settings

## 🚀 Quick Start Commands

### Run the Mobile App:
```bash
cd naturinex-app
npm install
npm start
```

### Run Firebase Functions Locally:
```bash
cd naturinex-app/functions
npm install
npm run serve
```

### Deploy Firebase Functions:
```bash
cd naturinex-app/functions
npm run deploy
```

### Build for App Stores:
```bash
cd naturinex-app
eas build --platform ios
eas build --platform android
```

## 📱 Webhook Endpoint

After deployment, your Stripe webhook will be available at:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/webhooks/stripe
```

## ✅ Next Steps

1. **Add your API keys** to `functions/.env`
2. **Update Firebase config** in `app.json`
3. **Deploy Firebase Functions**
4. **Configure Stripe webhook** in Stripe Dashboard
5. **Test the complete flow**
6. **Submit to app stores**

Everything is now consolidated in one location for easier management! 🎉