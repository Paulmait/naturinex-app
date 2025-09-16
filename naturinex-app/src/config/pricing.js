// Pricing Configuration for Naturinex
// Natural Medication Alternatives Platform

export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: {
      scansPerMonth: 5,
      basicAnalysis: true,
      aiInsights: false,
      naturalAlternatives: 3, // Limited to 3 alternatives
      exportReports: false,
      consultations: 0,
      familySharing: false,
      prioritySupport: false,
      affiliateAccess: false,
      historyDays: 7,
    },
    limits: {
      dailyScans: 2,
      savedMedications: 10,
    },
  },
  PLUS: {
    id: 'plus',
    name: 'Naturinex Plus',
    price: {
      monthly: 6.99,
      yearly: 59, // Special "New Year, New You" pricing
    },
    stripePriceIds: {
      monthly: 'price_naturinex_plus_monthly',
      yearly: 'price_naturinex_plus_yearly',
    },
    features: {
      scansPerMonth: -1, // Unlimited
      basicAnalysis: true,
      aiInsights: true,
      naturalAlternatives: -1, // Unlimited alternatives
      exportReports: true,
      consultations: 0,
      familySharing: false,
      prioritySupport: false,
      affiliateAccess: true,
      historyDays: -1, // Unlimited history
      customReports: true,
      dosageCalculator: true,
      interactionChecker: true,
    },
    limits: {
      dailyScans: 50,
      savedMedications: 500,
    },
  },
  PRO: {
    id: 'pro',
    name: 'Naturinex Pro',
    price: {
      monthly: 12.99,
      yearly: 99,
    },
    stripePriceIds: {
      monthly: 'price_naturinex_pro_monthly',
      yearly: 'price_naturinex_pro_yearly',
    },
    features: {
      scansPerMonth: -1,
      basicAnalysis: true,
      aiInsights: true,
      naturalAlternatives: -1,
      exportReports: true,
      consultations: 2, // 2 per month included
      familySharing: true, // Up to 5 accounts
      prioritySupport: true,
      affiliateAccess: true,
      historyDays: -1,
      customReports: true,
      dosageCalculator: true,
      interactionChecker: true,
      apiAccess: true,
      whiteLabel: false,
      bulkExport: true,
      teamCollaboration: true,
    },
    limits: {
      dailyScans: -1, // Unlimited
      savedMedications: -1,
      familyMembers: 5,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: {
      monthly: 'custom',
      yearly: 'custom',
    },
    features: {
      everything: true,
      whiteLabel: true,
      dedicatedSupport: true,
      customIntegrations: true,
      dataInsights: true,
      unlimitedSeats: true,
    },
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
    duration: 30, // minutes
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
    commission: 0.04, // 4% average
    cookieDuration: 24, // hours
    categories: ['supplements', 'herbs', 'natural-remedies'],
    trackingId: 'naturinex-20',
  },
  IHERB: {
    id: 'iherb',
    name: 'iHerb',
    commission: 0.08, // 8%
    cookieDuration: 720, // 30 days
    categories: ['supplements', 'vitamins', 'herbs'],
    referralCode: 'NAT2025',
  },
  VITACOST: {
    id: 'vitacost',
    name: 'Vitacost',
    commission: 0.10, // 10%
    cookieDuration: 168, // 7 days
    categories: ['supplements', 'organic', 'natural'],
  },
  THORNE: {
    id: 'thorne',
    name: 'Thorne Research',
    commission: 0.15, // 15%
    cookieDuration: 720,
    categories: ['professional-supplements'],
    tier: 'professional',
  },
  FULLSCRIPT: {
    id: 'fullscript',
    name: 'Fullscript',
    commission: 0.20, // 20% for practitioners
    cookieDuration: 2160, // 90 days
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
    discount: 0.5, // 50% off first month
  },
  PREMIUM_INSIGHT: {
    trigger: 'ai_analysis_requested',
    message: 'AI-Powered Natural Alternatives Available',
    cta: 'See Premium Recommendations',
    feature: 'Advanced AI insights for safer natural alternatives',
  },
  INTERACTION_WARNING: {
    trigger: 'multiple_medications',
    message: 'Check Drug-Herb Interactions',
    cta: 'Ensure Safety with Pro',
    feature: 'Professional interaction checker',
  },
  FAMILY_SHARING: {
    trigger: 'share_attempted',
    message: 'Share with Family Members',
    cta: 'Get Family Plan',
    feature: 'Up to 5 family members included',
  },
  EXPORT_BLOCKED: {
    trigger: 'export_attempted',
    message: 'Export Your Medication History',
    cta: 'Upgrade to Export',
    feature: 'PDF and CSV exports',
  },
};

// Promotional Campaigns
export const CAMPAIGNS = {
  NEW_YEAR_NEW_YOU: {
    id: 'new_year_2025',
    name: 'New Year, New You',
    discount: 0.40, // 40% off
    validUntil: new Date('2025-02-01'),
    code: 'NATURAL2025',
    applicableTo: ['yearly'],
  },
  FIRST_TIME: {
    id: 'first_time_user',
    name: 'Welcome Offer',
    discount: 0.50, // 50% off first month
    validFor: 30, // days after signup
    code: 'WELCOME50',
    applicableTo: ['monthly'],
  },
  REFERRAL: {
    id: 'referral',
    name: 'Friend Referral',
    discount: 1.00, // 1 month free
    code: 'FRIEND',
    bothGetReward: true,
  },
};

// Data Insights Packages (B2B)
export const DATA_INSIGHTS = {
  BASIC_REPORT: {
    id: 'basic_trend_report',
    name: 'Monthly Trend Report',
    price: 5000,
    frequency: 'monthly',
    includes: [
      'Top 100 searched medications',
      'Natural alternative preferences',
      'Regional trends',
      'Basic demographics',
    ],
  },
  ADVANCED_ANALYTICS: {
    id: 'advanced_analytics',
    name: 'Quarterly Analytics Package',
    price: 15000,
    frequency: 'quarterly',
    includes: [
      'Comprehensive medication trends',
      'User behavior analysis',
      'Conversion patterns',
      'Competitive insights',
      'Custom queries (5)',
    ],
  },
  ENTERPRISE_INSIGHTS: {
    id: 'enterprise_insights',
    name: 'Enterprise Research Partnership',
    price: 50000,
    frequency: 'custom',
    includes: [
      'Real-time data access',
      'Custom dashboards',
      'API access',
      'Dedicated analyst',
      'White-label reports',
    ],
  },
};

// Pricing Utilities
export const PricingUtils = {
  // Check if user has access to feature
  hasAccess(userTier, feature) {
    const tier = PRICING_TIERS[userTier.toUpperCase()];
    if (!tier) return false;

    return tier.features[feature] === true || tier.features[feature] > 0;
  },

  // Get remaining scans for user
  getRemainingScans(userTier, usedScans) {
    const tier = PRICING_TIERS[userTier.toUpperCase()];
    if (!tier) return 0;

    if (tier.features.scansPerMonth === -1) return 'Unlimited';
    return Math.max(0, tier.features.scansPerMonth - usedScans);
  },

  // Calculate affiliate commission
  calculateCommission(program, saleAmount) {
    const affiliate = AFFILIATE_PROGRAMS[program.toUpperCase()];
    if (!affiliate) return 0;

    return (saleAmount * affiliate.commission).toFixed(2);
  },

  // Get active campaign discount
  getActiveDiscount(campaignId, userSignupDate) {
    const campaign = CAMPAIGNS[campaignId];
    if (!campaign) return 0;

    // Check if campaign is still valid
    if (campaign.validUntil && new Date() > campaign.validUntil) {
      return 0;
    }

    // Check if user is eligible
    if (campaign.id === 'first_time_user') {
      const daysSinceSignup = Math.floor((new Date() - userSignupDate) / (1000 * 60 * 60 * 24));
      if (daysSinceSignup > campaign.validFor) {
        return 0;
      }
    }

    return campaign.discount;
  },

  // Format price for display
  formatPrice(price) {
    if (price === 0) return 'Free';
    if (price === 'custom') return 'Contact Sales';
    if (price === -1) return 'Unlimited';

    return `$${price.toFixed(2)}`;
  },

  // Get upgrade path
  getUpgradePath(currentTier) {
    const tiers = ['FREE', 'PLUS', 'PRO', 'ENTERPRISE'];
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
  DATA_INSIGHTS,
  PricingUtils,
};