# 🚀 COPY-PASTE Supabase Deployment Commands

## 📋 Your Specific Commands (Ready to Copy)

Based on your setup, here are the EXACT commands to run:

### Step 1: Install Supabase CLI (Windows)

#### Option A: Using Scoop (Recommended)
```powershell
# Install Scoop if not installed
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

#### Option B: Direct Download
Download from: https://github.com/supabase/cli/releases/latest
- Download: `supabase_windows_amd64.zip`
- Extract to a folder
- Add to PATH

### Step 2: Login to Supabase
```bash
supabase login
```
This will open your browser. Login and return to terminal.

### Step 3: Get Your Project Reference
1. Go to: https://app.supabase.com
2. Click on your project
3. Go to Settings → General
4. Copy "Reference ID" (looks like: abcdefghijklmnop)

### Step 4: Link Your Project
Replace `YOUR_PROJECT_REF` with the ID from Step 3:
```bash
cd C:\Users\maito\mediscan-app\naturinex-app
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 5: Set ALL Environment Variables
Copy and paste these commands ONE BY ONE.
Replace the values with your actual keys from Render:

```bash
# From Render Dashboard - CRITICAL
supabase secrets set GEMINI_API_KEY="paste_your_gemini_key_here"
supabase secrets set STRIPE_SECRET_KEY="paste_your_stripe_secret_key"
supabase secrets set STRIPE_WEBHOOK_SECRET="paste_your_webhook_secret"

# Additional from Render (if you have them)
supabase secrets set FIREBASE_PROJECT_ID="naturinex-app"
supabase secrets set FIREBASE_CLIENT_EMAIL="paste_from_render"
supabase secrets set FIREBASE_PRIVATE_KEY="paste_from_render"
supabase secrets set JWT_SECRET="paste_from_render"
supabase secrets set ADMIN_SECRET="paste_from_render"
supabase secrets set GOOGLE_VISION_API_KEY="paste_from_render"
supabase secrets set MONGODB_URI="paste_from_render"

# Stripe Price IDs (optional but recommended)
supabase secrets set STRIPE_PRICE_PLUS_MONTHLY="price_xxxxx"
supabase secrets set STRIPE_PRICE_PLUS_YEARLY="price_xxxxx"
supabase secrets set STRIPE_PRICE_PRO_MONTHLY="price_xxxxx"
supabase secrets set STRIPE_PRICE_PRO_YEARLY="price_xxxxx"
```

### Step 6: Deploy Edge Functions
```bash
# Deploy the analyze function
supabase functions deploy analyze --no-verify-jwt

# Deploy the Stripe webhook
supabase functions deploy stripe-webhook --no-verify-jwt
```

### Step 7: Get Your Function URLs
After deployment, your URLs will be:
```
Analyze API: https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze
Stripe Webhook: https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

### Step 8: Update Vercel Environment Variables
Go to: https://vercel.com/dashboard

Add these variables:
```
REACT_APP_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
NEXT_PUBLIC_API_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
```

### Step 9: Update Stripe Webhook
1. Go to: https://dashboard.stripe.com/webhooks
2. Click on your current webhook
3. Update Endpoint URL to:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```
4. Keep the same signing secret

### Step 10: Test Your Functions
```bash
# Test analyze endpoint
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d "{\"medication\": \"aspirin\"}"

# Check function logs
supabase functions logs analyze --tail
supabase functions logs stripe-webhook --tail
```

---

## 🔥 Quick All-In-One Script

Save this as `deploy.ps1` and run in PowerShell:

```powershell
# Replace these values
$PROJECT_REF = "YOUR_PROJECT_REF"
$GEMINI_KEY = "your_gemini_key"
$STRIPE_SECRET = "sk_live_xxx"
$STRIPE_WEBHOOK = "whsec_xxx"

# Link project
supabase link --project-ref $PROJECT_REF

# Set secrets
supabase secrets set GEMINI_API_KEY=$GEMINI_KEY
supabase secrets set STRIPE_SECRET_KEY=$STRIPE_SECRET
supabase secrets set STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK

# Deploy functions
supabase functions deploy analyze --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt

Write-Host "Deployment complete!"
Write-Host "Analyze URL: https://$PROJECT_REF.supabase.co/functions/v1/analyze"
Write-Host "Webhook URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
```

---

## ⚠️ IMPORTANT NOTES

1. **Get values from Render**:
   - Go to https://dashboard.render.com
   - Click your service
   - Go to Environment tab
   - Copy each value

2. **Supabase Project Ref**:
   - Found in Supabase Dashboard → Settings → General
   - Looks like: `abcdefghijklmnop`

3. **After deployment**:
   - Test both web and mobile apps
   - Verify Stripe payments work
   - Then turn off Render

---

## 🆘 Troubleshooting

### "Command not found: supabase"
- Make sure Supabase CLI is installed and in PATH
- Try: `scoop install supabase` or download directly

### "Project not linked"
- Run: `supabase link --project-ref YOUR_PROJECT_REF`

### "Unauthorized" errors
- Make sure you're logged in: `supabase login`

### Functions not working
- Check logs: `supabase functions logs analyze --tail`
- Verify secrets are set: `supabase secrets list`

---

## ✅ Success Checklist

- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] Environment variables set
- [ ] Functions deployed
- [ ] Vercel updated
- [ ] Stripe webhook updated
- [ ] Apps tested
- [ ] Render turned off

---

*Ready? Start with Step 1 above!*