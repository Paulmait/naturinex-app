// Stripe Webhook Edge Function
// Handles payment events and subscription updates

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    if (!webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    // Verify webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    // Initialize Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Processing webhook event: ${event.type}`)

    // Handle different event types
    switch (event.type) {
      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer

        // Create or update profile
        await supabaseAdmin
          .from('profiles')
          .upsert({
            email: customer.email,
            stripe_customer_id: customer.id,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'email',
          })

        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)

          // Determine tier based on price
          const priceId = subscription.items.data[0].price.id
          let tier = 'free'

          // Map your Stripe price IDs to tiers
          // PLUS: price_1RpEeKIwUuNq64Np0VUrD3jm (both monthly & yearly)
          // PRO: price_1RpEcUIwUuNq64Np4KLl689G (monthly), price_1RpEeqIwUuNq64NpPculkKkA (yearly)
          if (priceId === 'price_1RpEeKIwUuNq64Np0VUrD3jm') {
            tier = 'plus'
          } else if (priceId === 'price_1RpEcUIwUuNq64Np4KLl689G' ||
                     priceId === 'price_1RpEeqIwUuNq64NpPculkKkA') {
            tier = 'pro'
          }

          // Update user profile
          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: tier,
              subscription_status: 'active',
              subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Determine tier
        const priceId = subscription.items.data[0].price.id
        let tier = 'free'

        if (priceId === 'price_1RpEeKIwUuNq64Np0VUrD3jm') {
          tier = 'plus'
        } else if (priceId === 'price_1RpEcUIwUuNq64Np4KLl689G' ||
                   priceId === 'price_1RpEeqIwUuNq64NpPculkKkA') {
          tier = 'pro'
        }

        // Update subscription in database
        await supabaseAdmin
          .from('profiles')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_tier: tier,
            subscription_status: subscription.status,
            subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Log subscription event
        await supabaseAdmin
          .from('subscription_events')
          .insert({
            user_id: customerId,
            event_type: event.type,
            to_tier: tier,
            to_status: subscription.status,
            stripe_event_id: event.id,
            stripe_subscription_id: subscription.id,
            metadata: { price_id: priceId },
            created_at: new Date().toISOString(),
          })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade to free tier
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            subscription_expires_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Log cancellation
        await supabaseAdmin
          .from('subscription_events')
          .insert({
            user_id: customerId,
            event_type: 'canceled',
            from_tier: 'plus', // Should get from previous state
            to_tier: 'free',
            from_status: 'active',
            to_status: 'canceled',
            stripe_event_id: event.id,
            stripe_subscription_id: subscription.id,
            created_at: new Date().toISOString(),
          })

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Payment successful, ensure subscription is active
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        // Update subscription status
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId)

        // Could send email notification here
        console.log(`Payment failed for customer ${customerId}`)

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})