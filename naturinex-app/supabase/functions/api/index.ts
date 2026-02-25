// Supabase Edge Functions - Main API Handler
// Handles all API endpoints with auto-scaling and caching

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno';

// Initialize clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Redis client for caching (using Upstash)
const redis = {
  async get(key: string) {
    const response = await fetch(`${Deno.env.get('UPSTASH_REDIS_REST_URL')}/get/${key}`, {
      headers: {
        Authorization: `Bearer ${Deno.env.get('UPSTASH_REDIS_REST_TOKEN')}`,
      },
    });
    const data = await response.json();
    return data.result;
  },

  async set(key: string, value: any, ex?: number) {
    const url = ex
      ? `${Deno.env.get('UPSTASH_REDIS_REST_URL')}/set/${key}/${JSON.stringify(value)}/ex/${ex}`
      : `${Deno.env.get('UPSTASH_REDIS_REST_URL')}/set/${key}/${JSON.stringify(value)}`;

    await fetch(url, {
      headers: {
        Authorization: `Bearer ${Deno.env.get('UPSTASH_REDIS_REST_TOKEN')}`,
      },
    });
  },

  async incr(key: string) {
    const response = await fetch(`${Deno.env.get('UPSTASH_REDIS_REST_URL')}/incr/${key}`, {
      headers: {
        Authorization: `Bearer ${Deno.env.get('UPSTASH_REDIS_REST_TOKEN')}`,
      },
    });
    const data = await response.json();
    return data.result;
  },
};

// Rate limiting middleware
async function rateLimit(userId: string, endpoint: string, limit: number = 100) {
  const key = `rate:${userId}:${endpoint}:${new Date().getHours()}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.set(key, count, 3600); // Expire after 1 hour
  }

  if (count > limit) {
    throw new Error('Rate limit exceeded');
  }
}

import { getCorsHeaders } from '../_shared/cors.ts'

// CORS headers will be set per-request based on origin

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Get auth token
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    let userId: string | null = null;

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        userId = user.id;
      }
    }

    // Route handlers
    switch (true) {
      // Health check
      case path === '/health':
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date() }), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });

      // Analyze medication
      case path === '/api/analyze' && req.method === 'POST':
        if (!userId) {
          return new Response('Unauthorized', { status: 401, headers: getCorsHeaders(req) });
        }

        await rateLimit(userId, 'analyze', 50); // 50 requests per hour

        const { image, barcode } = await req.json();

        // Check cache first
        const cacheKey = barcode ? `product:${barcode}` : `analysis:${image.slice(0, 50)}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
          return new Response(JSON.stringify(cached), {
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          });
        }

        // Perform analysis (integrate with AI service)
        const analysis = await analyzeProduct({ image, barcode });

        // Cache result
        await redis.set(cacheKey, analysis, 3600); // Cache for 1 hour

        // Store in database
        await supabase.from('scans').insert({
          user_id: userId,
          barcode,
          ...analysis,
        });

        // Update user stats
        await supabase.rpc('increment_scan_count', { p_user_id: userId });

        return new Response(JSON.stringify(analysis), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });

      // Create checkout session
      case path === '/api/create-checkout-session' && req.method === 'POST':
        if (!userId) {
          return new Response('Unauthorized', { status: 401, headers: getCorsHeaders(req) });
        }

        const { priceId, successUrl, cancelUrl } = await req.json();

        // Get or create Stripe customer
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id, email')
          .eq('user_id', userId)
          .single();

        let customerId = profile?.stripe_customer_id;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: profile?.email,
            metadata: { user_id: userId },
          });
          customerId = customer.id;

          await supabase
            .from('profiles')
            .update({ stripe_customer_id: customerId })
            .eq('user_id', userId);
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { user_id: userId },
        });

        return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });

      // Webhook handler
      case path === '/api/webhook' && req.method === 'POST':
        const signature = req.headers.get('Stripe-Signature')!;
        const body = await req.text();

        let event;
        try {
          event = stripe.webhooks.constructEvent(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET')!
          );
        } catch (err) {
          return new Response('Webhook Error', { status: 400, headers: getCorsHeaders(req) });
        }

        // Handle the event
        switch (event.type) {
          case 'checkout.session.completed':
            const session = event.data.object;
            await handleSubscriptionCreated(session);
            break;

          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            const subscription = event.data.object;
            await handleSubscriptionUpdate(subscription);
            break;
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });

      // Get user stats
      case path === '/api/stats' && req.method === 'GET':
        if (!userId) {
          return new Response('Unauthorized', { status: 401, headers: getCorsHeaders(req) });
        }

        // Try cache first
        const statsCacheKey = `stats:${userId}`;
        const cachedStats = await redis.get(statsCacheKey);

        if (cachedStats) {
          return new Response(JSON.stringify(cachedStats), {
            headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          });
        }

        // Get from materialized view
        const { data: stats } = await supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        // Cache for 5 minutes
        await redis.set(statsCacheKey, stats, 300);

        return new Response(JSON.stringify(stats), {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        });

      default:
        return new Response('Not Found', { status: 404, headers: getCorsHeaders(req) });
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
    });
  }
});

// Helper functions
async function analyzeProduct({ image, barcode }: any) {
  // Implement your product analysis logic here
  // This would connect to your AI/ML service

  return {
    product_name: 'Sample Product',
    ingredients: ['ingredient1', 'ingredient2'],
    allergens: [],
    health_analysis: {
      score: 85,
      warnings: [],
      recommendations: ['Safe for most users'],
    },
  };
}

async function handleSubscriptionCreated(session: any) {
  const userId = session.metadata.user_id;
  const subscriptionId = session.subscription;

  await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_tier: 'premium',
      stripe_subscription_id: subscriptionId,
    })
    .eq('user_id', userId);
}

async function handleSubscriptionUpdate(subscription: any) {
  const customerId = subscription.customer;

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        subscription_expires_at: new Date(subscription.current_period_end * 1000),
      })
      .eq('user_id', profile.user_id);
  }
}