# 🚀 Manual Deployment Guide for Stripe Webhook

Since the Firebase CLI deployment is encountering issues, here are alternative ways to deploy your webhook:

## Option 1: Firebase Console (Easiest)

1. **Open Firebase Console**
   - Go to: https://console.firebase.google.com/project/mediscan-b6252/functions

2. **Initialize Functions** (if not already done)
   - Click "Get started"
   - Select "JavaScript" as the language
   - Choose "Do not install dependencies"

3. **Upload Your Code**
   - Download your functions folder as a ZIP
   - In Firebase Console, click "Upload source code"
   - Upload the ZIP file

## Option 2: Using Google Cloud Console

1. **Open Cloud Functions**
   - Go to: https://console.cloud.google.com/functions?project=mediscan-b6252

2. **Create New Function**
   - Click "CREATE FUNCTION"
   - Function name: `api`
   - Region: `us-central1`
   - Trigger type: `HTTP`
   - Authentication: `Allow unauthenticated invocations`

3. **Configure Runtime**
   - Runtime: `Node.js 20`
   - Entry point: `api`
   - Source code: Upload ZIP of your functions folder

## Option 3: Fix Firebase CLI Issue

The issue might be related to Windows path handling. Try:

```bash
# From PowerShell (not Git Bash)
cd naturinex-app
firebase deploy --only functions --project mediscan-b6252
```

Or set the Windows environment variable:
```bash
set FIREBASE_FUNCTIONS_SOURCE=functions
firebase deploy --only functions
```

## 📋 Pre-deployment Checklist

✅ Functions are built (`npm run build` completed)
✅ Environment variables are set in `.env`:
   - `STRIPE_SECRET_KEY`: ✓ Set
   - `STRIPE_WEBHOOK_SECRET`: ✓ Updated to `whsec_0V6107GsHBfGlMEpTH1ooLyWXiVZIsr5`
   - `STRIPE_PUBLISHABLE_KEY`: ✓ Set

✅ Firebase project is selected: `mediscan-b6252`
✅ Webhook endpoint in Stripe Dashboard: `https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe`

## 🧪 Testing After Deployment

Once deployed, test your webhook:

### 1. Quick Test with cURL:
```bash
curl -X POST https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid" \
  -d '{"test": "data"}'
```

Expected response: `400 Bad Request` (signature verification working!)

### 2. Test from Stripe Dashboard:
1. Go to https://dashboard.stripe.com/webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Select `checkout.session.completed`
5. Click "Send test webhook"

Expected: Should see `200 OK` in Stripe logs

### 3. Monitor Logs:
- **Firebase Logs**: https://console.firebase.google.com/project/mediscan-b6252/functions/logs
- **Stripe Logs**: https://dashboard.stripe.com/webhooks/logs

## 🎯 Success Indicators

Your webhook is working when:
1. ✅ Returns 400 for invalid signatures
2. ✅ Returns 200 for valid Stripe events
3. ✅ Updates user premium status in Firestore
4. ✅ Creates payment records
5. ✅ Stripe Dashboard shows successful webhook deliveries

## Need Help?

If deployment continues to fail:
1. Check Firebase project permissions
2. Ensure billing is enabled on the project
3. Try deploying a simple "hello world" function first
4. Contact Firebase support with the error logs