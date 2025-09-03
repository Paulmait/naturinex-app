/**
 * Tier System and Usage Tracking Module
 * Manages subscription tiers, usage limits, and credit system
 */

const admin = require('firebase-admin');

// Subscription Tier Definitions
const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    dailyScans: 3,
    monthlyScans: 10,
    drugInteractions: false,
    healthProfiles: 1,
    medicationHistory: 7, // days
    pdfExport: false,
    affiliateOffers: true,
    creditsIncluded: 0,
    price: 0
  },
  BASIC: {
    name: 'Basic',
    dailyScans: 10,
    monthlyScans: 50,
    drugInteractions: false,
    healthProfiles: 2,
    medicationHistory: 30, // days
    pdfExport: false,
    affiliateOffers: true,
    creditsIncluded: 5,
    price: 4.99
  },
  PRO: {
    name: 'Professional',
    dailyScans: 30,
    monthlyScans: 200,
    drugInteractions: true,
    healthProfiles: 5,
    medicationHistory: 365, // days
    pdfExport: true,
    affiliateOffers: false, // no ads for pro users
    creditsIncluded: 20,
    price: 9.99
  },
  FAMILY: {
    name: 'Family',
    dailyScans: 50,
    monthlyScans: 500,
    drugInteractions: true,
    healthProfiles: 8,
    familyMembers: 5,
    medicationHistory: 365,
    pdfExport: true,
    affiliateOffers: false,
    creditsIncluded: 50,
    price: 24.99
  },
  ENTERPRISE: {
    name: 'Enterprise',
    dailyScans: 999,
    monthlyScans: 9999,
    drugInteractions: true,
    healthProfiles: 999,
    medicationHistory: 9999,
    pdfExport: true,
    whiteLabel: true,
    apiAccess: true,
    affiliateOffers: false,
    creditsIncluded: 500,
    price: 299.99
  }
};

// Credit costs for various operations
const CREDIT_COSTS = {
  basicScan: 1,
  advancedAnalysis: 2,
  drugInteraction: 3,
  healthCoachSession: 5,
  pdfReport: 5,
  bulkAnalysis: 10
};

// Credit packages for purchase
const CREDIT_PACKAGES = {
  starter: { credits: 10, price: 2.99, bonus: 0 },
  value: { credits: 50, price: 11.99, bonus: 5 },
  bulk: { credits: 200, price: 39.99, bonus: 30 }
};

class TierSystem {
  /**
   * Check if user has reached their usage limits
   */
  static async checkUsageLimits(userId, action = 'scan') {
    try {
      if (!admin.apps.length) {
        // If Firebase not initialized, allow access (for testing)
        return { allowed: true, tier: 'FREE' };
      }

      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        // New user - create with free tier
        await this.createUserProfile(userId);
        return { allowed: true, tier: 'FREE', isNewUser: true };
      }

      const userData = userDoc.data();
      const tier = userData.subscriptionTier || 'FREE';
      const tierLimits = SUBSCRIPTION_TIERS[tier];
      const usage = userData.usage || { daily: 0, monthly: 0 };

      // Reset counters if needed
      const now = new Date();
      const lastReset = userData.lastUsageReset ? userData.lastUsageReset.toDate() : now;
      
      // Reset daily counter
      if (now.getDate() !== lastReset.getDate()) {
        usage.daily = 0;
      }
      
      // Reset monthly counter
      if (now.getMonth() !== lastReset.getMonth()) {
        usage.monthly = 0;
      }

      // Check limits
      if (usage.daily >= tierLimits.dailyScans) {
        return {
          allowed: false,
          reason: 'daily_limit',
          limit: tierLimits.dailyScans,
          current: usage.daily,
          tier,
          upgradeOptions: this.getUpgradeOptions(tier)
        };
      }

      if (usage.monthly >= tierLimits.monthlyScans) {
        return {
          allowed: false,
          reason: 'monthly_limit',
          limit: tierLimits.monthlyScans,
          current: usage.monthly,
          tier,
          upgradeOptions: this.getUpgradeOptions(tier)
        };
      }

      // Check credits for premium features
      if (action === 'drugInteraction' && !tierLimits.drugInteractions) {
        const credits = userData.credits || 0;
        if (credits < CREDIT_COSTS.drugInteraction) {
          return {
            allowed: false,
            reason: 'insufficient_credits',
            required: CREDIT_COSTS.drugInteraction,
            current: credits,
            tier,
            creditPackages: CREDIT_PACKAGES
          };
        }
      }

      return {
        allowed: true,
        tier,
        usage,
        limits: tierLimits,
        credits: userData.credits || 0
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      // On error, allow access but log it
      return { allowed: true, tier: 'FREE', error: error.message };
    }
  }

  /**
   * Increment usage counters
   */
  static async incrementUsage(userId, action = 'scan') {
    try {
      if (!admin.apps.length) return;

      const userRef = admin.firestore().collection('users').doc(userId);
      const now = new Date();

      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const usage = userData.usage || { daily: 0, monthly: 0 };
        const lastReset = userData.lastUsageReset ? userData.lastUsageReset.toDate() : now;

        // Reset counters if needed
        if (now.getDate() !== lastReset.getDate()) {
          usage.daily = 0;
        }
        if (now.getMonth() !== lastReset.getMonth()) {
          usage.monthly = 0;
        }

        // Increment counters
        usage.daily++;
        usage.monthly++;
        usage.total = (usage.total || 0) + 1;

        // Deduct credits if needed
        let credits = userData.credits || 0;
        if (CREDIT_COSTS[action]) {
          credits = Math.max(0, credits - CREDIT_COSTS[action]);
        }

        transaction.update(userRef, {
          usage,
          credits,
          lastUsageReset: now,
          lastActivity: now
        });
      });

      return { success: true };
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create user profile with default tier
   */
  static async createUserProfile(userId, data = {}) {
    try {
      if (!admin.apps.length) return;

      const now = new Date();
      const profile = {
        userId,
        subscriptionTier: 'FREE',
        credits: 5, // Welcome bonus
        usage: { daily: 0, monthly: 0, total: 0 },
        lastUsageReset: now,
        createdAt: now,
        healthProfiles: [],
        medicationHistory: [],
        affiliateClicks: [],
        ...data
      };

      await admin.firestore()
        .collection('users')
        .doc(userId)
        .set(profile, { merge: true });

      return profile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return null;
    }
  }

  /**
   * Get upgrade options for current tier
   */
  static getUpgradeOptions(currentTier) {
    const tiers = Object.keys(SUBSCRIPTION_TIERS);
    const currentIndex = tiers.indexOf(currentTier);
    const upgrades = [];

    for (let i = currentIndex + 1; i < tiers.length; i++) {
      const tierKey = tiers[i];
      const tier = SUBSCRIPTION_TIERS[tierKey];
      upgrades.push({
        tier: tierKey,
        name: tier.name,
        price: tier.price,
        benefits: {
          dailyScans: tier.dailyScans,
          monthlyScans: tier.monthlyScans,
          drugInteractions: tier.drugInteractions,
          pdfExport: tier.pdfExport
        }
      });
    }

    return upgrades;
  }

  /**
   * Add credits to user account
   */
  static async addCredits(userId, credits, source = 'purchase') {
    try {
      if (!admin.apps.length) return { success: false };

      const userRef = admin.firestore().collection('users').doc(userId);
      
      await admin.firestore().runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const currentCredits = userDoc.exists ? (userDoc.data().credits || 0) : 0;
        
        transaction.update(userRef, {
          credits: currentCredits + credits,
          creditHistory: admin.firestore.FieldValue.arrayUnion({
            amount: credits,
            source,
            timestamp: new Date(),
            balance: currentCredits + credits
          })
        });
      });

      return { success: true, newBalance: credits };
    } catch (error) {
      console.error('Error adding credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if user has access to specific feature
   */
  static hasFeatureAccess(tier, feature) {
    const tierConfig = SUBSCRIPTION_TIERS[tier] || SUBSCRIPTION_TIERS.FREE;
    return tierConfig[feature] === true;
  }

  /**
   * Get user's remaining scans
   */
  static async getRemainingScans(userId) {
    try {
      const check = await this.checkUsageLimits(userId);
      if (!check.allowed) {
        return {
          daily: 0,
          monthly: 0,
          tier: check.tier
        };
      }

      const tierLimits = SUBSCRIPTION_TIERS[check.tier];
      return {
        daily: tierLimits.dailyScans - (check.usage?.daily || 0),
        monthly: tierLimits.monthlyScans - (check.usage?.monthly || 0),
        tier: check.tier,
        credits: check.credits || 0
      };
    } catch (error) {
      console.error('Error getting remaining scans:', error);
      return { daily: 0, monthly: 0, tier: 'FREE' };
    }
  }
}

module.exports = {
  TierSystem,
  SUBSCRIPTION_TIERS,
  CREDIT_COSTS,
  CREDIT_PACKAGES
};