# 🚀 Supabase Edge Functions Deployment Guide

## ✅ Migration Status
Edge Functions are created and ready to deploy!

## 📋 Step-by-Step Deployment Instructions

### Step 1: Install Supabase CLI (if not installed)
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Your Project
```bash
cd naturinex-app
supabase link --project-ref [YOUR_PROJECT_REF]
```

To find your project ref:
1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → General
4. Copy the "Reference ID"

### Step 4: Set Edge Function Secrets
```bash
# Set your secrets (these are already in Render)
supabase secrets set GEMINI_API_KEY=[your-gemini-key]
supabase secrets set STRIPE_SECRET_KEY=[your-stripe-secret]
supabase secrets set STRIPE_WEBHOOK_SECRET=[your-webhook-secret]

# Optional: Set Stripe price IDs
supabase secrets set STRIPE_PRICE_PLUS_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_PLUS_YEARLY=price_xxxxx
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
supabase secrets set STRIPE_PRICE_PRO_YEARLY=price_xxxxx
```

### Step 5: Deploy Edge Functions
```bash
# Deploy analyze function
supabase functions deploy analyze

# Deploy stripe webhook
supabase functions deploy stripe-webhook

# Deploy subscription function (if created)
supabase functions deploy subscription
```

### Step 6: Get Your Edge Function URLs
After deployment, your URLs will be:
```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/analyze
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/stripe-webhook
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/subscription
```

---

## 🔄 Update Your Applications

### 1. Update Vercel Environment Variables
Add/Update in Vercel Dashboard:
```
REACT_APP_API_URL=https://[YOUR_PROJECT_REF].supabase.co/functions/v1
NEXT_PUBLIC_API_URL=https://[YOUR_PROJECT_REF].supabase.co/functions/v1
```

### 2. Update Stripe Webhook
1. Go to https://dashboard.stripe.com/webhooks
2. Find your current webhook (pointing to Render)
3. Click on it and update the URL to:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/functions/v1/stripe-webhook
   ```
4. Keep the same signing secret

### 3. Update Mobile App (if needed)
In your React Native app, update the API URL:
```javascript
// In your config file or .env
API_URL=https://[YOUR_PROJECT_REF].supabase.co/functions/v1
```

---

## 🧪 Testing Your Edge Functions

### Test 1: Analyze Endpoint
```bash
curl -X POST https://[YOUR_PROJECT_REF].supabase.co/functions/v1/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"medication": "aspirin"}'
```

### Test 2: Stripe Webhook
Use Stripe CLI to test:
```bash
stripe trigger payment_intent.succeeded
```

### Test 3: Check Function Logs
```bash
supabase functions logs analyze
supabase functions logs stripe-webhook
```

---

## 📊 Monitoring

### View Function Metrics
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. View invocations, errors, and latency

### Set Up Alerts (Optional)
```sql
-- Create alert for failed payments
CREATE OR REPLACE FUNCTION alert_payment_failed()
RETURNS trigger AS $$
BEGIN
  IF NEW.subscription_status = 'past_due' THEN
    -- Send alert (implement your notification logic)
    PERFORM pg_notify('payment_failed', NEW.email);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_alert
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION alert_payment_failed();
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Analyze function responds to requests
- [ ] Stripe webhook receives events
- [ ] Web app can scan medications
- [ ] Mobile app can scan medications
- [ ] Subscriptions update correctly
- [ ] No more cold starts!

---

## 🔄 Rollback Plan (If Needed)

If you need to rollback to Render:
1. Change `REACT_APP_API_URL` back to `https://naturinex-app.onrender.com`
2. Update Stripe webhook URL back to Render
3. Redeploy Vercel

---

## 🎯 Next Steps After Deployment

1. **Monitor for 24 hours** - Check logs and metrics
2. **Test all features** - Scan, subscribe, cancel
3. **Turn off Render** - Once confirmed working
4. **Update documentation** - New API endpoints

---

## 📞 Troubleshooting

### Function not responding?
```bash
# Check deployment status
supabase functions list

# Check logs
supabase functions logs analyze --tail
```

### CORS errors?
Already handled in the functions with proper headers

### Authentication issues?
Make sure to pass Authorization header with anon key

---

## 🎉 Success Metrics

After migration, you should see:
- **Response time**: <200ms (was 15-30 seconds)
- **Uptime**: 100% (was ~95%)
- **Cost**: $0 (was $7-25/month)
- **Global latency**: <100ms (edge network)

---

## 💡 Pro Tips

1. **Use environment variables** in Supabase Dashboard for easy updates
2. **Enable GitHub Actions** for CI/CD deployment
3. **Set up monitoring** with Supabase Logs
4. **Use caching** for frequently accessed data

---

*Ready to deploy? Start with Step 1 above!*