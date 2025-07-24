import Stripe from 'stripe';
import { Request, Response } from 'express';
import { getPriceId, PROMO_CODES } from './priceConfig';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

interface CheckoutRequest {
  userId: string;
  userEmail: string;
  plan: 'basic' | 'premium' | 'professional';
  billingCycle: 'monthly' | 'yearly';
  promoCode?: string;
  referralCode?: string;
}

/**
 * Create Stripe checkout session with trials, coupons, and metadata
 */
export async function createCheckoutSession(req: Request, res: Response) {
  try {
    const { 
      userId, 
      userEmail, 
      plan, 
      billingCycle, 
      promoCode,
      referralCode 
    } = req.body as CheckoutRequest;

    // Validate input
    if (!userId || !userEmail || !plan || !billingCycle) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'userEmail', 'plan', 'billingCycle']
      });
    }

    // Get the appropriate price ID
    const priceId = getPriceId(plan, billingCycle);
    
    if (!priceId || priceId === 'price_PENDING') {
      return res.status(400).json({ 
        error: 'Price not configured yet. Please try again later.',
        plan,
        billingCycle 
      });
    }

    // Build checkout session parameters
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${req.headers.origin}/pricing?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        plan,
        billingCycle,
        referralCode: referralCode || '',
      },
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          userId,
          plan,
          billingCycle,
        },
      },
      // Enable promotional codes
      allow_promotion_codes: true,
    };

    // Apply specific promo code if provided
    if (promoCode && PROMO_CODES[promoCode as keyof typeof PROMO_CODES]) {
      const promo = PROMO_CODES[promoCode as keyof typeof PROMO_CODES];
      
      // Validate promo code is valid for this billing type
      if (promo.validFor === 'all' || 
          (promo.validFor === 'annual' && billingCycle === 'yearly') ||
          (promo.validFor === 'monthly' && billingCycle === 'monthly')) {
        
        // Note: You'll need to create these coupons in Stripe Dashboard first
        sessionParams.discounts = [{
          coupon: promo.couponId
        }];
      }
    }

    // Create the session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Return session details
    res.json({ 
      url: session.url, 
      sessionId: session.id,
      message: 'Redirecting to checkout...'
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Apply promo code to existing subscription
 */
export async function applyPromoCode(req: Request, res: Response) {
  try {
    const { subscriptionId, promoCode } = req.body;

    if (!subscriptionId || !promoCode) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['subscriptionId', 'promoCode']
      });
    }

    const promo = PROMO_CODES[promoCode as keyof typeof PROMO_CODES];
    if (!promo) {
      return res.status(400).json({ 
        error: 'Invalid promo code'
      });
    }

    // Apply the coupon to the subscription
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      coupon: promo.couponId
    });

    res.json({ 
      success: true,
      subscription,
      message: `Promo code ${promoCode} applied successfully!`
    });

  } catch (error) {
    console.error('Error applying promo code:', error);
    res.status(500).json({ 
      error: 'Failed to apply promo code',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Create a referral code for a user
 */
export async function createReferralCode(userId: string): Promise<string> {
  // Generate a unique referral code
  const code = `REF${userId.substring(0, 6).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
  
  // In production, you'd store this in your database
  // For now, we'll just return it
  return code;
}

/**
 * Handle referral rewards
 */
export async function processReferralReward(referralCode: string, newUserId: string) {
  // In production:
  // 1. Look up the referral code in your database
  // 2. Find the referring user
  // 3. Apply FRIEND15 coupon to both users' subscriptions
  // 4. Track the referral in your database
  
  console.log(`Processing referral: ${referralCode} for new user: ${newUserId}`);
  
  // This would be implemented with your database
  return {
    referrerId: 'user_who_referred',
    referredId: newUserId,
    rewardApplied: true,
    couponCode: 'FRIEND15'
  };
}