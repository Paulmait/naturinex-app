# 🚀 SUPER SIMPLE Supabase Migration (10 Minutes)

Since you're already in Supabase, let's do this the EASY way!

## Step 1: Get Your Project Reference (30 seconds)
You're already in Supabase Dashboard, so:
1. Look at your browser URL
2. It shows: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
3. Copy that PROJECT_REF part

**Tell me:** What's your project reference? (looks like: abcdefghijklmnop)

---

## Step 2: Get Your Keys from Render (2 minutes)
Open new tab: https://dashboard.render.com
1. Click your service
2. Go to Environment tab
3. Find and copy these 3 values:
   - GEMINI_API_KEY
   - STRIPE_SECRET_KEY
   - STRIPE_WEBHOOK_SECRET

**Tell me:** Do you have these 3 values copied?

---

## Step 3: Add Secrets in Supabase UI (2 minutes)
Back in Supabase Dashboard:
1. Go to **Settings** → **Edge Functions**
2. Click **Manage Secrets**
3. Click **Add Secret** for each:
   - Name: `GEMINI_API_KEY` → Value: [paste from Render]
   - Name: `STRIPE_SECRET_KEY` → Value: [paste from Render]
   - Name: `STRIPE_WEBHOOK_SECRET` → Value: [paste from Render]
4. Click Save

**Tell me:** Are all 3 secrets added?

---

## Step 4: Deploy Functions via UI (3 minutes)
Still in Supabase Dashboard:
1. Go to **Edge Functions** (left sidebar)
2. Click **Deploy Function**
3. **For Analyze Function:**
   - Name: `analyze`
   - Paste this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { medication } = await req.json()

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Provide natural alternatives for ${medication}. Format as JSON with alternatives array, warnings, and disclaimer.`
            }]
          }]
        })
      }
    )

    const data = await response.json()
    const result = data.candidates[0].content.parts[0].text

    return new Response(
      JSON.stringify({
        success: true,
        medication,
        alternatives: result
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: corsHeaders }
    )
  }
})
```

4. Click **Deploy**

**Tell me:** Is the analyze function deployed?

---

## Step 5: Deploy Webhook Function (2 minutes)
1. Click **Deploy Function** again
2. **For Webhook:**
   - Name: `stripe-webhook`
   - Use the code from: `supabase/functions/stripe-webhook/index.ts`
3. Click **Deploy**

**Tell me:** Is the webhook deployed?

---

## Step 6: Update Vercel (1 minute)
1. Open: https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add:
   - `REACT_APP_API_URL` = `https://YOUR_PROJECT_REF.supabase.co/functions/v1`
5. Click Save
6. Redeploy

**Tell me:** Is Vercel updated?

---

## Step 7: Update Stripe Webhook (1 minute)
1. Open: https://dashboard.stripe.com/webhooks
2. Click your webhook
3. Update URL to: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook`
4. Save

**Tell me:** Is Stripe webhook updated?

---

## ✅ DONE! Test It:
Visit your site and try scanning a medication. It should work instantly with no cold starts!

---

## 🎯 Even EASIER Alternative:

If you want, I can create a single file you can copy-paste into Supabase SQL Editor that will set up everything at once. Want me to do that?