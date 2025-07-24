/**
 * Stripe Price Configuration with Promotional Pricing
 * Includes trial periods, coupons, and savings calculations
 */

interface PriceConfig {
  priceId: string;
  amount: number;
  plan: string;
  interval: 'month' | 'year';
  displayName: string;
  trialDays?: number;
  savings?: number;
  savingsPercent?: number;
  popular?: boolean;
}

export const STRIPE_PRICES: Record<string, PriceConfig> = {
  // Monthly Plans
  basic_monthly: {
    priceId: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_1Rn7erIwUuNq64Np5N2Up5TA',
    amount: 799, // $7.99
    plan: 'basic',
    interval: 'month',
    displayName: 'Basic Monthly',
    trialDays: 7
  },
  premium_monthly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_1Rn7frIwUuNq64NpcGXEdiDD',
    amount: 1499, // $14.99
    plan: 'premium',
    interval: 'month',
    displayName: 'Premium Monthly',
    trialDays: 7,
    popular: true
  },
  professional_monthly: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1Rn7gRIwUuNq64NpnqVYDAIF',
    amount: 3999, // $39.99
    plan: 'professional',
    interval: 'month',
    displayName: 'Professional Monthly',
    trialDays: 7
  },
  
  // Annual Plans (Recommended pricing)
  basic_yearly: {
    priceId: process.env.STRIPE_PRICE_BASIC_YEARLY || 'price_PENDING',
    amount: 7999, // $79.99 (was $399.99)
    plan: 'basic',
    interval: 'year',
    displayName: 'Basic Annual',
    trialDays: 7,
    savings: 1589, // Save $15.89
    savingsPercent: 17
  },
  premium_yearly: {
    priceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY || 'price_PENDING',
    amount: 13999, // $139.99 (was $399.99)
    plan: 'premium',
    interval: 'year',
    displayName: 'Premium Annual',
    trialDays: 7,
    savings: 3989, // Save $39.89
    savingsPercent: 22,
    popular: true
  },
  professional_yearly: {
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_PENDING',
    amount: 35999, // $359.99 (was $399.99)
    plan: 'professional',
    interval: 'year',
    displayName: 'Professional Annual',
    trialDays: 7,
    savings: 11989, // Save $119.89
    savingsPercent: 25
  }
};

// Promotional Coupons
export const PROMO_CODES = {
  LAUNCH20: {
    couponId: process.env.STRIPE_COUPON_LAUNCH || 'LAUNCH20',
    description: '20% off first year',
    percentOff: 20,
    duration: 'once',
    validFor: 'annual'
  },
  WELCOME50: {
    couponId: process.env.STRIPE_COUPON_WELCOME || 'WELCOME50',
    description: '50% off first 3 months',
    percentOff: 50,
    duration: 'repeating',
    durationInMonths: 3,
    validFor: 'monthly'
  },
  FRIEND15: {
    couponId: process.env.STRIPE_COUPON_REFERRAL || 'FRIEND15',
    description: '15% off forever (referral)',
    percentOff: 15,
    duration: 'forever',
    validFor: 'all'
  },
  WINBACK50: {
    couponId: process.env.STRIPE_COUPON_WINBACK || 'WINBACK50',
    description: '50% off for 3 months',
    percentOff: 50,
    duration: 'repeating',
    durationInMonths: 3,
    validFor: 'all'
  }
};

// Feature sets for each plan
export const PLAN_FEATURES = {
  basic: [
    '50 AI Health Scans per month',
    'Basic symptom analysis',
    'Health tracking dashboard',
    'Email support',
    '7-day free trial'
  ],
  premium: [
    'Unlimited AI Health Scans',
    'Advanced health insights',
    'Medicine interaction checker',
    'Family sharing (up to 4 members)',
    'Priority support',
    'Export health reports',
    '7-day free trial'
  ],
  professional: [
    'Everything in Premium',
    'Advanced AI diagnostics',
    'Telehealth integration ready',
    'Detailed PDF health reports',
    'API access for integrations',
    'White-glove support',
    'Custom health protocols',
    '7-day free trial'
  ]
};

/**
 * Get price ID based on plan and billing cycle
 */
export function getPriceId(plan: string, billingCycle: string): string | null {
  const key = `${plan}_${billingCycle}`;
  const priceConfig = STRIPE_PRICES[key as keyof typeof STRIPE_PRICES];
  return priceConfig ? priceConfig.priceId : null;
}

/**
 * Get price details by price ID
 */
export function getPriceDetails(priceId: string): PriceConfig | undefined {
  return Object.values(STRIPE_PRICES).find(price => price.priceId === priceId);
}

/**
 * Calculate savings for annual vs monthly
 */
export function calculateAnnualSavings(monthlyPrice: number): {
  annualPrice: number;
  savings: number;
  savingsPercent: number;
} {
  const yearlyIfMonthly = monthlyPrice * 12;
  const annualPrice = monthlyPrice * 10; // 2 months free
  const savings = yearlyIfMonthly - annualPrice;
  const savingsPercent = Math.round((savings / yearlyIfMonthly) * 100);
  
  return {
    annualPrice,
    savings,
    savingsPercent
  };
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get promotional message based on current date
 */
export function getPromoMessage(): string {
  const launchDate = new Date('2025-08-01'); // Adjust to your launch date
  const now = new Date();
  const daysFromLaunch = Math.floor((now.getTime() - launchDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysFromLaunch < 0) {
    return '🎉 Pre-launch Special: 50% off first 3 months!';
  } else if (daysFromLaunch < 30) {
    return '🚀 Launch Special: 20% off annual plans with code LAUNCH20';
  } else if (daysFromLaunch < 90) {
    return '⏰ Limited Time: Save up to 25% with annual billing';
  } else {
    return '💰 Save up to 25% with annual billing';
  }
}