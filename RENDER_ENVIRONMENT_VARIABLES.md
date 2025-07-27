# 🔧 Render Environment Variables to Add

## Missing Variables to Add in Render Dashboard:

### 1. Stripe Webhook Secret
```
STRIPE_WEBHOOK_SECRET=whsec_[get_from_stripe_dashboard]
```
- Go to: https://dashboard.stripe.com/webhooks
- Click your webhook endpoint
- Click "Reveal" under Signing secret
- Copy the value starting with `whsec_`

### 2. Gemini API Key
```
GEMINI_API_KEY=[get_from_google_ai_studio]
```
- Go to: https://aistudio.google.com/apikey
- Create API key
- Copy the key

### 3. Admin Credentials (if not set)
```
ADMIN_SECRET=[generate_secure_password]
JWT_SECRET=[generate_random_32_char_string]
```

## How to Add in Render:

1. Go to: https://dashboard.render.com/
2. Click on your service: `naturinex-app`
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add each variable above
6. Click "Save Changes"
7. Service will auto-redeploy

## Variables You Should Already Have:

✅ MONGODB_URI
✅ FIREBASE_PROJECT_ID
✅ FIREBASE_CLIENT_EMAIL
✅ FIREBASE_PRIVATE_KEY
✅ STRIPE_PUBLISHABLE_KEY
✅ STRIPE_SECRET_KEY
✅ PORT (10000)

## After Adding Variables:

1. Wait for auto-redeploy to complete
2. Check logs for "Server running on port 10000"
3. Test endpoints to ensure everything works