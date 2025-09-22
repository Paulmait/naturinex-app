# Vercel Environment Variables Configuration

## Required Environment Variables for Production

Add these environment variables to your Vercel project settings:

### 🔐 Firebase Authentication (REQUIRED)
```
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=naturinex-app
REACT_APP_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 🌐 API Configuration (REQUIRED)
```
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com
```

### 💾 Supabase Database (OPTIONAL - if using Supabase)
```
REACT_APP_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 💳 Stripe Payments (OPTIONAL - for payment processing)
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
```

### 🔒 Google OAuth (OPTIONAL - for Google sign-in)
```
REACT_APP_GOOGLE_WEB_CLIENT_ID=your_google_client_id
```

## How to Add to Vercel

1. Go to your Vercel Dashboard
2. Select your project (naturinex-app)
3. Go to Settings → Environment Variables
4. Add each variable with its value
5. Select "Production" environment
6. Click "Save"

## Current Issues and Solutions

### ❌ Payment Error: "Not Found"
**Cause**: Stripe is not configured
**Solution**: Add `REACT_APP_STRIPE_PUBLISHABLE_KEY` or the payment page will show "Payment Processing Unavailable"

### ❌ "Failed to fetch" when searching medications
**Cause**: API expects `medicationName` field
**Status**: Fixed - now sends correct field name

### ❌ Camera not working on Windows
**Cause**: Camera requires HTTPS
**Solution**:
- Access site via HTTPS (https://your-vercel-app.vercel.app)
- Or use file upload instead

## Backend API Endpoints

The app expects these endpoints from the backend (https://naturinex-app-zsga.onrender.com):

- `POST /api/analyze/name` - Analyze medication by name
  - Body: `{ "medicationName": "lisinopril" }`
- `GET /health` - Health check endpoint
- `POST /api/create-payment-intent` - Stripe payment (not implemented yet)

## Testing After Configuration

1. **Test Authentication**: Try signing up/logging in
2. **Test Medication Search**: Search for "lisinopril" or "aspirin"
3. **Test Camera**: Access site via HTTPS and try camera scan
4. **Test Payment**: Will show error message if Stripe not configured

## Support

For issues or questions:
- Email: support@naturinex.com
- GitHub: https://github.com/Paulmait/naturinex-app/issues