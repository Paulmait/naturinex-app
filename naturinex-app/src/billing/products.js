/**
 * Apple IAP Product Definitions
 *
 * These product IDs MUST match exactly what is configured in App Store Connect.
 *
 * IMPORTANT: Only Premium Monthly and Yearly are launched for v2.0
 * Basic and Professional tiers are reserved for future releases.
 */

// Product IDs - Must match App Store Connect exactly
export const PRODUCT_IDS = {
  // Premium tier subscriptions (ACTIVE - submitted for App Review)
  PREMIUM_MONTHLY: 'naturinex_premium_monthly',
  PREMIUM_YEARLY: 'naturinex_premium_yearly',
};

// All subscription product IDs for fetching from StoreKit
// Only include products that are submitted for App Review
export const ALL_SUBSCRIPTION_IDS = [
  PRODUCT_IDS.PREMIUM_MONTHLY,
  PRODUCT_IDS.PREMIUM_YEARLY,
];

// Product metadata (display info, entitlements)
export const PRODUCT_METADATA = {
  [PRODUCT_IDS.PREMIUM_MONTHLY]: {
    displayName: 'Premium Monthly',
    tier: 'premium',
    period: 'monthly',
    periodDisplay: 'per month',
    entitlement: 'premium',
    popular: true,
    features: [
      'Unlimited scans',
      'Full scan history',
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
    savings: '~17% savings',
  },
};

// Entitlement hierarchy (higher includes lower)
export const ENTITLEMENT_HIERARCHY = {
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
// Only returns premium tier for v2.0 launch
export const getProductsByTier = () => {
  return [{
    tier: 'premium',
    displayName: 'Premium',
    products: getProductsForTier('premium'),
  }];
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
