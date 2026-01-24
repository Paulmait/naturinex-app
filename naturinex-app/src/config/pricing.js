// Pricing Configuration for Naturinex
// Natural Medication Alternatives Platform

export const PRICING_TIERS = {
  // Anonymous users - not shown in pricing
  ANONYMOUS: {
    id: 'anonymous',
    name: 'Anonymous',
    price: 0,
    features: {
      scansPerDay: 3,
      scansPerMonth: null,
      saveHistory: false,
      dataRetention: 'Not saved',
      dataRetentionDays: 0,
      basicAnalysis: true,
      aiInsights: false,
      naturalAlternatives: 2,
      exportReports: false,
      prioritySupport: false,
    },
    limits: {
      dailyScans: 3,
      monthlyScans: null,
      message: '3 scans per day for anonymous users'
    },
  },

  FREE: {
    id: 'free',
    name: 'Free Account',
    price: 0,
    features: {
      scansPerMonth: 5,
      scansPerDay: null,
      saveHistory: false,
      dataRetention: 'Not saved',
      dataRetentionDays: 0,
      basicAnalysis: true,
      aiInsights: false,
      naturalAlternatives: 3,
      exportReports: false,
      consultations: 0,
      familySharing: false,
      prioritySupport: false,
      affiliateAccess: false,
    },
    limits: {
      monthlyScans: 5,
      dailyScans: null,
      message: '5 scans per month, no data saving'
    },
    description: 'Perfect for trying out the service',
    benefits: [
      '5 scans per month',
      'Basic natural alternatives',
      'No account data storage',
    ],
  },

  // Main premium tier - matches mobile "Premium" naming
  PREMIUM: {
    id: 'premium',
    name: 'Naturinex Premium',
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    stripePriceIds: {
      monthly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
      yearly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
    },
    features: {
      scansPerMonth: -1, // Unlimited
      scansPerDay: -1,
      saveHistory: true,
      dataRetention: 'Forever',
      dataRetentionDays: null,
      basicAnalysis: true,
      aiInsights: true,
      naturalAlternatives: -1,
      exportReports: true,
      consultations: 0,
      familySharing: false,
      prioritySupport: true,
      affiliateAccess: true,
      customReports: true,
      dosageCalculator: true,
      interactionChecker: true,
    },
    limits: {
      monthlyScans: -1,
      dailyScans: -1,
      message: 'Unlimited scans, permanent data storage'
    },
    description: 'Unlock the full Naturinex experience',
    benefits: [
      'Unlimited scans',
      'Full scan history',
      'Advanced AI analysis',
      'Export PDF reports',
      'Priority support',
      'No ads',
    ],
    trialDays: 7,
    popular: true,
  },

  // Keep PLUS as alias for backward compatibility
  PLUS: {
    id: 'premium',
    name: 'Naturinex Premium',
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    stripePriceIds: {
      monthly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
      yearly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
    },
    features: {
      scansPerMonth: -1,
      scansPerDay: -1,
      saveHistory: true,
      dataRetention: 'Forever',
      dataRetentionDays: null,
      basicAnalysis: true,
      aiInsights: true,
      naturalAlternatives: -1,
      exportReports: true,
      consultations: 0,
      familySharing: false,
      prioritySupport: true,
      affiliateAccess: true,
      customReports: true,
      dosageCalculator: true,
      interactionChecker: true,
    },
    limits: {
      monthlyScans: -1,
      dailyScans: -1,
      message: 'Unlimited scans, permanent data storage'
    },
    description: 'Unlock the full Naturinex experience',
    benefits: [
      'Unlimited scans',
      'Full scan history',
      'Advanced AI analysis',
      'Export PDF reports',
      'Priority support',
      'No ads',
    ],
    trialDays: 7,
    popular: true,
  },

  // Keep PRO as alias pointing to PREMIUM for backward compatibility
  PRO: {
    id: 'premium',
    name: 'Naturinex Premium',
    price: {
      monthly: 9.99,
      yearly: 99.99,
    },
    stripePriceIds: {
      monthly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
      yearly: 'price_1RpEeKIwUuNq64Np0VUrD3jm',
    },
    features: {
      scansPerMonth: -1,
      scansPerDay: -1,
      saveHistory: true,
      dataRetention: 'Forever',
      dataRetentionDays: null,
      basicAnalysis: true,
      aiInsights: true,
      naturalAlternatives: -1,
      exportReports: true,
      consultations: 0,
      familySharing: false,
      prioritySupport: true,
      affiliateAccess: true,
      customReports: true,
      dosageCalculator: true,
      interactionChecker: true,
    },
    limits: {
      monthlyScans: -1,
      dailyScans: -1,
      message: 'Unlimited scans, permanent data storage'
    },
    description: 'Unlock the full Naturinex experience',
    benefits: [
      'Unlimited scans',
      'Full scan history',
      'Advanced AI analysis',
      'Export PDF reports',
      'Priority support',
      'No ads',
    ],
    trialDays: 7,
    popular: true,
  },
};

// In-App Purchases
export const IN_APP_PURCHASES = {
  DETAILED_REPORT: {
    id: 'detailed_report',
    name: 'Detailed Medication Report',
    price: 0.99,
    stripePriceId: 'price_detailed_report',
    description: 'Comprehensive PDF report with all natural alternatives, research citations, and dosage recommendations',
  },
  EXPERT_CONSULTATION: {
    id: 'expert_consultation',
    name: 'Expert Naturopath Consultation',
    price: 19.99,
    stripePriceId: 'price_expert_consultation',
    description: '30-minute video consultation with certified naturopath',
    duration: 30,
  },
  CUSTOM_PROTOCOL: {
    id: 'custom_protocol',
    name: 'Personalized Natural Protocol',
    price: 9.99,
    stripePriceId: 'price_custom_protocol',
    description: 'Custom natural medication protocol based on your health profile',
  },
  PRIORITY_ANALYSIS: {
    id: 'priority_analysis',
    name: 'Priority AI Analysis',
    price: 2.99,
    stripePriceId: 'price_priority_analysis',
    description: 'Skip the queue - get instant AI analysis',
  },
  INTERACTION_CHECK: {
    id: 'interaction_check',
    name: 'Drug-Herb Interaction Check',
    price: 1.99,
    stripePriceId: 'price_interaction_check',
    description: 'Check interactions between medications and natural supplements',
  },
};

// Affiliate Programs
export const AFFILIATE_PROGRAMS = {
  AMAZON: {
    id: 'amazon',
    name: 'Amazon Associates',
    commission: 0.04,
    cookieDuration: 24,
    categories: ['supplements', 'herbs', 'natural-remedies'],
    trackingId: 'naturinex-20',
  },
  IHERB: {
    id: 'iherb',
    name: 'iHerb',
    commission: 0.08,
    cookieDuration: 720,
    categories: ['supplements', 'vitamins', 'herbs'],
    referralCode: 'NAT2025',
  },
  VITACOST: {
    id: 'vitacost',
    name: 'Vitacost',
    commission: 0.10,
    cookieDuration: 168,
    categories: ['supplements', 'organic', 'natural'],
  },
  THORNE: {
    id: 'thorne',
    name: 'Thorne Research',
    commission: 0.15,
    cookieDuration: 720,
    categories: ['professional-supplements'],
    tier: 'professional',
  },
  FULLSCRIPT: {
    id: 'fullscript',
    name: 'Fullscript',
    commission: 0.20,
    cookieDuration: 2160,
    categories: ['practitioner-grade'],
    requiresCertification: true,
  },
};

// Conversion Triggers
export const CONVERSION_TRIGGERS = {
  SCAN_LIMIT: {
    threshold: 5,
    message: 'You\'ve reached your free scan limit',
    cta: 'Unlock Unlimited Scans',
    discount: 0.5,
  },
  PREMIUM_INSIGHT: {
    trigger: 'ai_analysis_requested',
    message: 'AI-Powered Natural Alternatives Available',
    cta: 'Go Premium',
    feature: 'Advanced AI insights for safer natural alternatives',
  },
  INTERACTION_WARNING: {
    trigger: 'multiple_medications',
    message: 'Check Drug-Herb Interactions',
    cta: 'Go Premium',
    feature: 'Professional interaction checker',
  },
  FAMILY_SHARING: {
    trigger: 'share_attempted',
    message: 'Share with Family Members',
    cta: 'Go Premium',
    feature: 'Share your wellness discoveries',
  },
  EXPORT_BLOCKED: {
    trigger: 'export_attempted',
    message: 'Export Your Medication History',
    cta: 'Go Premium',
    feature: 'PDF and CSV exports',
  },
};

// Promotional Campaigns
export const CAMPAIGNS = {
  NEW_YEAR_NEW_YOU: {
    id: 'new_year_2025',
    name: 'New Year, New You',
    discount: 0.40,
    validUntil: new Date('2025-02-01'),
    code: 'NATURAL2025',
    applicableTo: ['yearly'],
  },
  FIRST_TIME: {
    id: 'first_time_user',
    name: 'Welcome Offer',
    discount: 0.50,
    validFor: 30,
    code: 'WELCOME50',
    applicableTo: ['monthly'],
  },
  REFERRAL: {
    id: 'referral',
    name: 'Friend Referral',
    discount: 1.00,
    code: 'FRIEND',
    bothGetReward: true,
  },
};

// Pricing Utilities
export const PricingUtils = {
  hasAccess(userTier, feature) {
    const tier = PRICING_TIERS[userTier.toUpperCase()];
    if (!tier) return false;
    return tier.features[feature] === true || tier.features[feature] > 0;
  },

  getRemainingScans(userTier, usedScans) {
    const tier = PRICING_TIERS[userTier.toUpperCase()];
    if (!tier) return 0;
    if (tier.features.scansPerMonth === -1) return 'Unlimited';
    return Math.max(0, tier.features.scansPerMonth - usedScans);
  },

  formatPrice(price) {
    if (price === 0) return 'Free';
    if (price === 'custom') return 'Contact Sales';
    if (price === -1) return 'Unlimited';
    return `$${price.toFixed(2)}`;
  },

  getUpgradePath(currentTier) {
    const tiers = ['FREE', 'PREMIUM'];
    const currentIndex = tiers.indexOf(currentTier.toUpperCase());
    if (currentIndex === -1 || currentIndex === tiers.length - 1) {
      return null;
    }
    return PRICING_TIERS[tiers[currentIndex + 1]];
  },
};

export default {
  PRICING_TIERS,
  IN_APP_PURCHASES,
  AFFILIATE_PROGRAMS,
  CONVERSION_TRIGGERS,
  CAMPAIGNS,
  PricingUtils,
};
