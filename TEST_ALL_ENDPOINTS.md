# 🧪 Test All Endpoints After Firebase Setup

## Environment Variables Added ✅
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL  
- FIREBASE_PRIVATE_KEY
- GEMINI_API_KEY
- GOOGLE_VISION_API_KEY

## Test Commands:

### 1. Health Check
```bash
curl https://naturinex-app-zsga.onrender.com/api/health
```

### 2. Test Image Analysis (with Firebase + Gemini)
```bash
# This would need an actual image, but you can test from the app
```

### 3. Test Natural Remedies Search
```bash
curl https://naturinex-app-zsga.onrender.com/api/search/remedies?q=turmeric
```

### 4. Test Pricing Tiers
```bash
curl https://naturinex-app-zsga.onrender.com/api/pricing/tiers
```

### 5. Test Student Verification
```bash
curl -X POST https://naturinex-app-zsga.onrender.com/api/student/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@student.edu"}'
```

## What to Check in Render Logs:

1. **Firebase Initialization**:
   - Look for: "✅ Firebase Admin initialized with service account"
   - Should show: "Project ID: naturinex-app"
   - Should show: "Client Email: firebase-adminsdk-fbsvc@naturinex-app.iam.gserviceaccount.com"

2. **No More Errors**:
   - Should NOT see: "Unable to detect a Project Id"
   - Should NOT see: "No document to update" errors

3. **Gemini API**:
   - Image analysis should work with AI-powered responses
   - Natural remedy suggestions should be enhanced

## Remaining Tasks:

### Still Need:
1. **Stripe Webhook Secret** (from Stripe Dashboard)
   - Go to: https://dashboard.stripe.com/webhooks
   - Click your webhook endpoint
   - Reveal and copy the signing secret
   - Add to Render: `STRIPE_WEBHOOK_SECRET=whsec_...`

2. **Run Full Data Ingestion**:
   After everything is working:
   ```bash
   cd server
   node scripts/ingest-all-remedies.js
   ```

## Next Steps:
1. Monitor Render logs for successful restart
2. Test the analyze endpoint from your app
3. Add Stripe webhook secret
4. Run full data ingestion
5. Configure Apple/Google credentials for app store submission