# 🚨 URGENT SECURITY ACTIONS REQUIRED

## Exposed API Keys Detected!

### 1. IMMEDIATELY Rotate These Keys:

#### Google/Firebase API Key (EXPOSED in GitHub):
- **Exposed key**: AIzaSyDsTe9-uNbFq4rCJbIjXra7_j9hRCy9Nq4
- **Action**: 
  1. Go to https://console.cloud.google.com
  2. Select project "Mediscan"
  3. APIs & Services → Credentials
  4. DELETE this key
  5. Create NEW API key
  6. Add domain restrictions

#### Gemini API Key (EXPOSED in server .env):
- **Exposed key**: AIzaSyDaOTBBI4fedw9iKAh82pq2TTSclDieAWY
- **Action**:
  1. Go to Google AI Studio
  2. Revoke this key
  3. Generate new key

### 2. Update Your Environment Variables:

#### In Render Dashboard:
1. Go to Environment variables
2. Update `GEMINI_API_KEY` with new key
3. Remove any sensitive data from logs

#### In Your Local `.env.local` file:
```
REACT_APP_FIREBASE_API_KEY=your_NEW_api_key_here
```

### 3. Firebase Security Rules:

Add API key restrictions:
1. Go to Firebase Console
2. Project Settings → General
3. Add your domains:
   - naturinex.com
   - www.naturinex.com
   - naturinex-app.onrender.com

### 4. Additional Security Steps:

1. **Enable GitHub Secret Scanning**:
   - Go to your repo Settings
   - Security & analysis
   - Enable "Secret scanning"

2. **Never commit .env files**:
   - Already fixed in code
   - Use environment variables

3. **Stripe Keys**:
   - Your test keys are fine for now
   - When going live, use restricted keys

### 5. What I've Already Fixed:

✅ Removed hardcoded keys from firebase.js
✅ Updated code to use environment variables
✅ Created .env.local file (not tracked by git)
✅ Pushed fixes to GitHub

### 6. Your Backend is Working!

✅ Backend URL: https://naturinex-app.onrender.com
✅ Health check: https://naturinex-app.onrender.com/health
✅ Webhook ready at: https://naturinex-app.onrender.com/webhooks/stripe

### Next Steps After Rotating Keys:

1. Update Render environment variables with new keys
2. Update local .env.local with new Firebase API key
3. Update Stripe webhook URL in Stripe Dashboard
4. Deploy your React app with new environment variables

## Remember: NEVER commit API keys to GitHub!