// Stripe Checkout Session Creation
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13.5.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { priceId, successUrl, cancelUrl, metadata } = await req.json()

    // Define price IDs with test/live mapping
    const priceMapping = {
      // Test prices
      'price_test_basic_monthly': 'price_1RpEcUIwUuNq64Np4KLl689G',
      'price_test_basic_yearly': 'price_1RpEeqIwUuNq64NpPculkKkA',
      'price_test_premium_monthly': 'price_1Rn7frIwUuNq64NpcGXEdiDD',
      'price_test_premium_yearly': 'price_1Rn7jbIwUuNq64NpooI9IPsF',
      'price_test_professional_monthly': 'price_1Rn7gRIwUuNq64NpnqVYDAIF',
      'price_test_professional_yearly': 'price_1Rn7jwIwUuNq64NpDIgCKq2G',
      
      // Live prices (use same for now - update with real live IDs)
      'price_basic_monthly': 'price_1RpEcUIwUuNq64Np4KLl689G',
      'price_basic_yearly': 'price_1RpEeqIwUuNq64NpPculkKkA',
      'price_premium_monthly': 'price_1Rn7frIwUuNq64NpcGXEdiDD',
      'price_premium_yearly': 'price_1Rn7jbIwUuNq64NpooI9IPsF',
      'price_professional_monthly': 'price_1Rn7gRIwUuNq64NpnqVYDAIF',
      'price_professional_yearly': 'price_1Rn7jwIwUuNq64NpDIgCKq2G',
    }

    const finalPriceId = priceMapping[priceId] || priceId

    // Check if customer exists
    let customerId = null
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      customerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/subscription`,
      metadata: {
        user_id: user.id,
        ...metadata,
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id: user.id,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
    })

    // Log checkout attempt
    await supabase.from('subscription_events').insert({
      user_id: user.id,
      event_type: 'checkout_started',
      event_data: {
        session_id: session.id,
        price_id: finalPriceId,
      },
    })

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Checkout session error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})