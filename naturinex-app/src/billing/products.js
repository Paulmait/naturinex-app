/**
 * Apple IAP Product Definitions
 *
 * These product IDs MUST match exactly what is configured in App Store Connect.
 * Update these when you create the IAP products in App Store Connect.
 */

// Product IDs - Must match App Store Connect exactly
export const PRODUCT_IDS = {
  // Basic tier subscriptions
  BASIC_MONTHLY: 'naturinex_basic_monthly',
  BASIC_YEARLY: 'naturinex_basic_yearly',

  // Premium tier subscriptions
  PREMIUM_MONTHLY: 'naturinex_premium_monthly',
  PREMIUM_YEARLY: 'naturinex_premium_yearly',

  // Professional tier subscriptions
  PROFESSIONAL_MONTHLY: 'naturinex_professional_monthly',
  PROFESSIONAL_YEARLY: 'naturinex_professional_yearly',
};

// All subscription product IDs for fetching from StoreKit
export const ALL_SUBSCRIPTION_IDS = [
  PRODUCT_IDS.BASIC_MONTHLY,
  PRODUCT_IDS.BASIC_YEARLY,
  PRODUCT_IDS.PREMIUM_MONTHLY,
  PRODUCT_IDS.PREMIUM_YEARLY,
  PRODUCT_IDS.PROFESSIONAL_MONTHLY,
  PRODUCT_IDS.PROFESSIONAL_YEARLY,
];

// Product metadata (display info, entitlements)
export const PRODUCT_METADATA = {
  [PRODUCT_IDS.BASIC_MONTHLY]: {
    displayName: 'Basic Monthly',
    tier: 'basic',
    period: 'monthly',
    periodDisplay: 'per month',
    entitlement: 'basic',
    features: [
      '10 scans per month',
      '30-day scan history',
      'Basic wellness insights',
      'Email support',
    ],
    trialDays: 7,
  },
  [PRODUCT_IDS.BASIC_YEARLY]: {
    displayName: 'Basic Yearly',
    tier: 'basic',
    period: 'yearly',
    periodDisplay: 'per year',
    entitlement: 'basic',
    features: [
      'All Basic Monthly features',
      '2 months free',
      'Priority email support',
    ],
    trialDays: 7,
    savings: '~17% savings',
  },
  [PRODUCT_IDS.PREMIUM_MONTHLY]: {
    displayName: 'Premium Monthly',
    tier: 'premium',
    period: 'monthly',
    periodDisplay: 'per month',
    entitlement: 'premium',
    popular: true,
    features: [
      '50 scans per month',
      'Permanent scan history',
      'Advanced AI analysis',
      'Export PDF reports',
      'Share discoveries',
      'Priority support',
      'No ads',
    ],
    trialDays: 7,
  },
  [PRODUCT_IDS.PREMIUM_YEARLY]: {
    displayName: 'Premium Yearly',
    tier: 'premium',
    period: 'yearly',
    periodDisplay: 'per year',
    entitlement: 'premium',
    popular: true,
    features: [
      'All Premium Monthly features',
      '2+ months free',
      'Early access to new features',
    ],
    trialDays: 7,
    savings: '~22% savings',
  },
  [PRODUCT_IDS.PROFESSIONAL_MONTHLY]: {
    displayName: 'Professional Monthly',
    tier: 'professional',
    period: 'monthly',
    periodDisplay: 'per month',
    entitlement: 'professional',
    features: [
      '200 scans per month',
      'API access',
      'Bulk analysis tools',
      'Custom integrations',
      'Dedicated support',
      'Team collaboration',
      'Advanced analytics',
    ],
    trialDays: 7,
  },
  [PRODUCT_IDS.PROFESSIONAL_YEARLY]: {
    displayName: 'Professional Yearly',
    tier: 'professional',
    period: 'yearly',
    periodDisplay: 'per year',
    entitlement: 'professional',
    features: [
      'All Pro Monthly features',
      '3+ months free',
      'White-label options',
      'SLA guarantee',
    ],
    trialDays: 7,
    savings: '~25% savings',
  },
};

// Entitlement hierarchy (higher includes lower)
export const ENTITLEMENT_HIERARCHY = {
  professional: ['professional', 'premium', 'basic'],
  premium: ['premium', 'basic'],
  basic: ['basic'],
  free: [],
};

// Check if an entitlement grants access to a feature level
export const hasEntitlement = (userEntitlement, requiredLevel) => {
  if (!userEntitlement) return false;
  const grants = ENTITLEMENT_HIERARCHY[userEntitlement] || [];
  return grants.includes(requiredLevel);
};

// Get product metadata by ID
export const getProductMetadata = (productId) => {
  return PRODUCT_METADATA[productId] || null;
};

// Get all products for a tier
export const getProductsForTier = (tier) => {
  return Object.entries(PRODUCT_METADATA)
    .filter(([, meta]) => meta.tier === tier)
    .map(([id, meta]) => ({ id, ...meta }));
};

// Group products by tier for display
export const getProductsByTier = () => {
  const tiers = ['basic', 'premium', 'professional'];
  return tiers.map(tier => ({
    tier,
    displayName: tier.charAt(0).toUpperCase() + tier.slice(1),
    products: getProductsForTier(tier),
  }));
};

export default {
  PRODUCT_IDS,
  ALL_SUBSCRIPTION_IDS,
  PRODUCT_METADATA,
  ENTITLEMENT_HIERARCHY,
  hasEntitlement,
  getProductMetadata,
  getProductsForTier,
  getProductsByTier,
};
