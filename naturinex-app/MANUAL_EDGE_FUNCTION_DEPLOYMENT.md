# 🚀 Manual Edge Function Deployment to Supabase

Since GitHub integration isn't deploying the functions, here's how to manually deploy them through the Supabase dashboard:

## Step 1: Deploy Analyze Function

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/hxhbsxzkzarqwksbjpce
2. Click **Edge Functions** in the left sidebar
3. Click **New Function** button
4. Function name: `analyze`
5. Copy and paste this entire code:

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
    const { medication, source = 'manual_input' } = await req.json()

    if (!medication) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = `Analyze the medication "${medication}" and provide natural alternatives.

    Return a JSON response with this structure:
    {
      "alternatives": [
        {
          "name": "Alternative name",
          "description": "Brief description",
          "effectiveness": "How effective it is",
          "dosage": "Recommended dosage",
          "precautions": "Important precautions"
        }
      ],
      "warnings": ["Important warning 1", "Warning 2"],
      "interactions": ["Potential interaction 1"],
      "disclaimer": "Medical disclaimer text"
    }

    Provide 3-5 natural alternatives with scientific backing.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      throw new Error('Failed to analyze medication')
    }

    const data = await response.json()
    const result = data.candidates[0].content.parts[0].text

    // Parse the response
    let parsedResult
    try {
      // Remove markdown code blocks if present
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      parsedResult = JSON.parse(cleanedResult)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      // Return a fallback structure
      parsedResult = {
        alternatives: [{
          name: 'Natural Alternative',
          description: 'Consult with a healthcare provider for natural alternatives to ' + medication,
          effectiveness: 'Varies by individual',
          dosage: 'As recommended by healthcare provider',
          precautions: 'Always consult with a healthcare provider before switching medications'
        }],
        warnings: [
          'Always consult with a healthcare provider before switching medications',
          'Natural alternatives may not be suitable for all conditions',
          'Results are for informational purposes only'
        ],
        disclaimer: 'This information is for educational purposes only and is not medical advice.'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        medication,
        ...parsedResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        alternatives: [],
        warnings: ['Service temporarily unavailable. Please try again later.'],
        disclaimer: 'Unable to process request at this time.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

6. Click **Deploy Function**

## Step 2: Deploy Stripe Webhook Function

1. Click **New Function** button again
2. Function name: `stripe-webhook`
3. Copy and paste this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response(
      JSON.stringify({ error: 'Missing signature or webhook secret' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        // Get customer email from Stripe
        const customer = await stripe.customers.retrieve(customerId)
        const email = (customer as any).email

        if (email) {
          // Update user's subscription status
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_tier: subscription.items.data[0].price.lookup_key || 'plus',
              subscription_status: subscription.status,
              stripe_customer_id: customerId,
              subscription_id: subscription.id,
              updated_at: new Date().toISOString()
            })
            .eq('email', email)

          if (error) {
            console.error('Error updating subscription:', error)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const customerId = subscription.customer as string

        const customer = await stripe.customers.retrieve(customerId)
        const email = (customer as any).email

        if (email) {
          const { error } = await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('email', email)

          if (error) {
            console.error('Error canceling subscription:', error)
          }
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout completed:', session)
        // Additional processing can be added here
        break
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

4. Click **Deploy Function**

## Step 3: Verify Functions are Deployed

1. After deploying both functions, you should see them listed in the Edge Functions page
2. Each function should show a green "Active" status
3. Note the function URLs:
   - Analyze: `https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1/analyze`
   - Webhook: `https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1/stripe-webhook`

## Step 4: Test the Analyze Function

Run this command in your terminal to test:

```bash
curl -X POST https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{"medication": "ibuprofen"}'
```

You should receive a JSON response with natural alternatives.

## Step 5: Update Stripe Webhook URL

1. Go to https://dashboard.stripe.com/webhooks
2. Find your webhook endpoint
3. Click to edit it
4. Update the URL to: `https://hxhbsxzkzarqwksbjpce.supabase.co/functions/v1/stripe-webhook`
5. Save changes

## Step 6: Verify Everything Works

1. Visit your app at the Vercel URL
2. Try scanning a medication
3. It should now use the Supabase Edge Functions with zero cold starts!

## ✅ Success Indicators

- Both functions show as "Active" in Supabase dashboard
- Test curl command returns valid JSON response
- Your app can scan medications without delays
- Stripe webhooks process successfully

## 🔧 Troubleshooting

If functions don't appear or fail:
1. Check that all environment variables are set in Supabase (Settings → Edge Functions → Manage Secrets)
2. Ensure you have: GEMINI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
3. Check function logs in Supabase dashboard for any errors

---

**Need help?** Check the function logs in Supabase Dashboard → Edge Functions → [Function Name] → Logs