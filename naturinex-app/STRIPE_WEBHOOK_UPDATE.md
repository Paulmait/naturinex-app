# 🔄 Stripe Webhook Migration Guide

## Current Setup (Render - NOT scalable)
- **Current URL**: `https://naturinex-app.onrender.com/webhook`
- **Issues**:
  - Free tier spins down after 15 mins
  - Will miss webhook events
  - Can't handle high volume
  - No retry mechanism

## New Enterprise Setup Options

### Option 1: Supabase Edge Function (RECOMMENDED) ✅
**New Webhook URL**: `https://YOUR_PROJECT.supabase.co/functions/v1/api/webhook`

**Advantages:**
- Auto-scales to millions of requests
- Never sleeps
- Built-in retry logic
- Lower latency (edge deployed)
- Integrated with your database

### Option 2: Vercel Serverless Function
**New Webhook URL**: `https://naturinex.com/api/stripe-webhook`

**Advantages:**
- Deployed with your main app
- Serverless (auto-scales)
- Good for moderate traffic

### Option 3: Dedicated Webhook Service (Hookdeck/Svix)
**New Webhook URL**: Via webhook proxy service

**Advantages:**
- Professional webhook management
- Retry logic
- Event replay
- Monitoring dashboard

---

## 🚀 Migration Steps

### Step 1: Deploy New Webhook Handler

Create file: `supabase/functions/stripe-webhook/index.ts`
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      { status: 400 }
    );
  }
});
```

### Step 2: Deploy to Supabase
```bash
cd supabase
supabase functions deploy stripe-webhook --project-ref YOUR_PROJECT_REF
```

### Step 3: Update Stripe Dashboard

1. Go to https://dashboard.stripe.com/webhooks
2. Click on your current webhook endpoint
3. Click "Update endpoint"
4. Change URL to: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
5. Keep the same events selected
6. Save changes

### Step 4: Get New Webhook Secret

1. After updating, click "Reveal" under Signing secret
2. Copy the new webhook secret
3. Update your environment:

```bash
# Add to Supabase Edge Function secrets
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET --project-ref YOUR_PROJECT_REF
```

### Step 5: Test New Webhook

```bash
# Use Stripe CLI to test
stripe listen --forward-to https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook

# In another terminal, trigger test event
stripe trigger checkout.session.completed
```

---

## 📊 Webhook Events to Handle

Essential events for your app:
- ✅ `checkout.session.completed` - New subscription
- ✅ `customer.subscription.updated` - Plan changes
- ✅ `customer.subscription.deleted` - Cancellation
- ✅ `invoice.payment_failed` - Failed payments
- ✅ `invoice.payment_succeeded` - Successful renewal

---

## 🔒 Security Best Practices

1. **Always verify webhook signatures**
2. **Use webhook secrets from environment variables**
3. **Implement idempotency** - Handle duplicate events
4. **Log all events** for audit trail
5. **Set up alerts** for failed webhooks

---

## 🎯 Benefits of Migration

| Metric | Old (Render) | New (Supabase) |
|--------|--------------|----------------|
| Uptime | ~95% | 99.99% |
| Latency | 500-2000ms | 50-200ms |
| Concurrent Webhooks | 10-50 | 10,000+ |
| Auto-scaling | ❌ | ✅ |
| Global Distribution | ❌ | ✅ |
| Cost | Free (unreliable) | ~$5-20/month |

---

## ⚠️ IMPORTANT NOTES

1. **Keep old webhook active** during transition (Stripe supports multiple endpoints)
2. **Test thoroughly** before removing old endpoint
3. **Monitor both endpoints** for 24-48 hours
4. **Set up webhook alerts** in Stripe dashboard

---

## 🚨 Immediate Action Required

Your current Render webhook is NOT suitable for production. It will:
- Miss payments when server is sleeping
- Cause subscription sync issues
- Lead to customer complaints

**Deploy the new webhook handler TODAY to avoid revenue loss!**