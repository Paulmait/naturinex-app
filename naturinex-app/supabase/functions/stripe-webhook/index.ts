// Stripe Webhook Handler - Supabase Edge Function
// Handles all Stripe events for Naturinex subscriptions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Initialize Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400, headers: corsHeaders });
  }

  try {
    const body = await req.text();
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`Processing event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleOneTimePayment(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Handle checkout session completed
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier || 'PLUS';
  const billing = session.metadata?.billing || 'monthly';

  if (!userId) {
    console.error('No user_id in session metadata');
    return;
  }

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  );

  // Update user profile in database
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_tier: tier.toLowerCase(),
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscription.id,
      subscription_expires_at: new Date(subscription.current_period_end * 1000),
      updated_at: new Date(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating profile:', error);
  }

  // Log successful subscription
  await logEvent('subscription_created', {
    userId,
    tier,
    billing,
    amount: session.amount_total,
    subscriptionId: subscription.id,
  });

  // Send welcome email
  await sendSubscriptionEmail(userId, 'welcome', { tier });
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user by Stripe customer ID
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError || !profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Determine tier from price
  const priceId = subscription.items.data[0]?.price.id;
  const tier = getTierFromPriceId(priceId);

  // Update subscription status
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_tier: tier,
      subscription_expires_at: new Date(subscription.current_period_end * 1000),
      updated_at: new Date(),
    })
    .eq('user_id', profile.user_id);

  if (error) {
    console.error('Error updating subscription:', error);
  }

  await logEvent('subscription_updated', {
    userId: profile.user_id,
    status: subscription.status,
    tier,
  });
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user by Stripe customer ID
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError || !profile) {
    console.error('Profile not found for customer:', customerId);
    return;
  }

  // Update to free tier
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_tier: 'free',
      subscription_expires_at: new Date(subscription.current_period_end * 1000),
      updated_at: new Date(),
    })
    .eq('user_id', profile.user_id);

  if (error) {
    console.error('Error canceling subscription:', error);
  }

  // Send cancellation email
  await sendSubscriptionEmail(profile.user_id, 'canceled', {});

  await logEvent('subscription_canceled', {
    userId: profile.user_id,
  });
}

// Handle successful payments
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Get user
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Log payment
  await supabase
    .from('payments')
    .insert({
      user_id: profile.user_id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: 'succeeded',
      invoice_id: invoice.id,
      created_at: new Date(),
    });

  await sendSubscriptionEmail(profile.user_id, 'payment_success', {
    amount: (invoice.amount_paid / 100).toFixed(2),
  });
}

// Handle failed payments
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Get user
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, email')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) return;

  // Update subscription status
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date(),
    })
    .eq('user_id', profile.user_id);

  // Send payment failed email
  await sendSubscriptionEmail(profile.user_id, 'payment_failed', {
    amount: (invoice.amount_due / 100).toFixed(2),
    retryDate: new Date(invoice.next_payment_attempt! * 1000).toLocaleDateString(),
  });

  await logEvent('payment_failed', {
    userId: profile.user_id,
    amount: invoice.amount_due,
  });
}

// Handle one-time payments (in-app purchases)
async function handleOneTimePayment(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.user_id;
  const purchaseType = paymentIntent.metadata?.purchase_type;

  if (!userId || !purchaseType) return;

  // Record purchase
  await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      type: purchaseType,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'completed',
      payment_intent_id: paymentIntent.id,
      created_at: new Date(),
    });

  // Grant access based on purchase type
  switch (purchaseType) {
    case 'DETAILED_REPORT':
      await grantReportAccess(userId);
      break;
    case 'EXPERT_CONSULTATION':
      await scheduleConsultation(userId);
      break;
    case 'CUSTOM_PROTOCOL':
      await generateProtocol(userId);
      break;
  }

  await logEvent('one_time_purchase', {
    userId,
    purchaseType,
    amount: paymentIntent.amount / 100,
  });
}

// Helper functions
function getTierFromPriceId(priceId: string): string {
  // Map your actual Stripe price IDs to tiers
  const priceTierMap: Record<string, string> = {
    // Add your actual price IDs here
    'price_basic_a_monthly': 'plus',
    'price_basic_a_yearly': 'plus',
    'price_basic_b_monthly': 'pro',
    'price_basic_b_yearly': 'pro',
    // New price IDs if you create them
    'price_naturinex_plus_monthly': 'plus',
    'price_naturinex_plus_yearly': 'plus',
    'price_naturinex_pro_monthly': 'pro',
    'price_naturinex_pro_yearly': 'pro',
  };

  return priceTierMap[priceId] || 'free';
}

async function logEvent(eventType: string, data: any) {
  await supabase
    .from('webhook_events')
    .insert({
      event_type: eventType,
      data,
      created_at: new Date(),
    });
}

async function sendSubscriptionEmail(userId: string, type: string, data: any) {
  // Implement email sending via Resend or your email service
  console.log(`Sending ${type} email to user ${userId}`, data);
}

async function grantReportAccess(userId: string) {
  // Grant access to generate detailed report
  await supabase
    .from('user_permissions')
    .insert({
      user_id: userId,
      permission: 'generate_detailed_report',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
}

async function scheduleConsultation(userId: string) {
  // Create consultation booking
  await supabase
    .from('consultations')
    .insert({
      user_id: userId,
      status: 'pending_scheduling',
      created_at: new Date(),
    });
}

async function generateProtocol(userId: string) {
  // Trigger protocol generation
  await supabase
    .from('protocol_requests')
    .insert({
      user_id: userId,
      status: 'pending',
      created_at: new Date(),
    });
}