/**
 * Pricing Tier Enforcement Middleware
 * Ensures users only access features they're paying for
 */

const admin = require('firebase-admin');

class TierManager {
  constructor() {
    // Define feature access by tier
    this.tierFeatures = {
      free: {
        scansPerDay: 3,
        basicAnalysis: true,
        naturalAlternatives: false,
        interactions: false,
        detailedWarnings: false,
        exportData: false,
        prioritySupport: false,
        apiAccess: false
      },
      basic: {
        scansPerDay: 10,
        basicAnalysis: true,
        naturalAlternatives: true,
        interactions: false,
        detailedWarnings: true,
        exportData: false,
        prioritySupport: false,
        apiAccess: false
      },
      premium: {
        scansPerDay: 50,
        basicAnalysis: true,
        naturalAlternatives: true,
        interactions: true,
        detailedWarnings: true,
        exportData: true,
        prioritySupport: true,
        apiAccess: false
      },
      professional: {
        scansPerDay: -1, // Unlimited
        basicAnalysis: true,
        naturalAlternatives: true,
        interactions: true,
        detailedWarnings: true,
        exportData: true,
        prioritySupport: true,
        apiAccess: true
      }
    };
  }

  /**
   * Get user tier from Firebase
   */
  async getUserTier(userId) {
    if (!userId) return 'free';
    
    try {
      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) return 'free';
      
      const userData = userDoc.data();
      
      // Check subscription status
      if (userData.subscriptionStatus === 'active') {
        return userData.subscriptionTier || 'premium';
      }
      
      // Check if premium flag is set (legacy)
      if (userData.isPremium) {
        return 'premium';
      }
      
      return 'free';
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return 'free';
    }
  }

  /**
   * Check if user has access to a feature
   */
  hasAccess(tier, feature) {
    const tierConfig = this.tierFeatures[tier] || this.tierFeatures.free;
    return tierConfig[feature] || false;
  }

  /**
   * Check daily scan limit
   */
  async checkScanLimit(userId, tier) {
    const limit = this.tierFeatures[tier].scansPerDay;
    
    // Unlimited for professional
    if (limit === -1) return true;
    
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const scansQuery = await db.collection('scans')
      .where('userId', '==', userId)
      .where('createdAt', '>=', today)
      .count()
      .get();
    
    return scansQuery.data().count < limit;
  }

  /**
   * Filter response based on tier
   */
  filterResponseByTier(response, tier) {
    const filtered = { ...response };
    
    // Remove features not available in tier
    if (!this.hasAccess(tier, 'naturalAlternatives')) {
      delete filtered.naturalAlternatives;
      delete filtered.alternativeDetails;
    }
    
    if (!this.hasAccess(tier, 'interactions')) {
      delete filtered.interactions;
      delete filtered.drugInteractions;
    }
    
    if (!this.hasAccess(tier, 'detailedWarnings')) {
      // Simplify warnings
      if (filtered.warnings) {
        filtered.warnings = filtered.warnings.slice(0, 2).map(w => 
          typeof w === 'string' ? w : w.title || w.description
        );
      }
      delete filtered.detailedSideEffects;
      delete filtered.contraindications;
    }
    
    // Add tier information to response
    filtered.userTier = tier;
    filtered.tierLimits = {
      scansRemaining: tier === 'professional' ? 'unlimited' : 
        await this.getRemainingScans(userId, tier),
      upgradeMessage: this.getUpgradeMessage(tier)
    };
    
    return filtered;
  }

  /**
   * Get remaining scans for today
   */
  async getRemainingScans(userId, tier) {
    const limit = this.tierFeatures[tier].scansPerDay;
    if (limit === -1) return 'unlimited';
    
    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const scansQuery = await db.collection('scans')
      .where('userId', '==', userId)
      .where('createdAt', '>=', today)
      .count()
      .get();
    
    return Math.max(0, limit - scansQuery.data().count);
  }

  /**
   * Get upgrade message based on tier
   */
  getUpgradeMessage(tier) {
    const messages = {
      free: 'Upgrade to Basic for natural alternatives and 10 daily scans!',
      basic: 'Upgrade to Premium for drug interactions and unlimited exports!',
      premium: 'Upgrade to Professional for unlimited scans and API access!',
      professional: null
    };
    return messages[tier];
  }
}

/**
 * Middleware to enforce tier restrictions
 */
const tierMiddleware = (requiredFeature = null) => {
  const tierManager = new TierManager();
  
  return async (req, res, next) => {
    try {
      // Get user ID from auth token or session
      let userId = null;
      
      if (req.headers.authorization) {
        const token = req.headers.authorization.split('Bearer ')[1];
        if (token) {
          try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            userId = decodedToken.uid;
          } catch (error) {
            console.log('Invalid token, treating as guest');
          }
        }
      }
      
      // Get user tier
      const tier = await tierManager.getUserTier(userId);
      req.userTier = tier;
      req.userId = userId;
      
      // Check specific feature access if required
      if (requiredFeature && !tierManager.hasAccess(tier, requiredFeature)) {
        return res.status(403).json({
          error: 'Feature not available in your plan',
          requiredFeature,
          currentTier: tier,
          upgradeUrl: '/subscription',
          message: tierManager.getUpgradeMessage(tier)
        });
      }
      
      // Check scan limit for analysis endpoints
      if (req.path.includes('/analyze') && userId) {
        const canScan = await tierManager.checkScanLimit(userId, tier);
        if (!canScan) {
          const remaining = await tierManager.getRemainingScans(userId, tier);
          return res.status(429).json({
            error: 'Daily scan limit reached',
            currentTier: tier,
            scansRemaining: remaining,
            resetTime: 'midnight',
            upgradeMessage: tierManager.getUpgradeMessage(tier)
          });
        }
      }
      
      // Attach tier manager to request for use in routes
      req.tierManager = tierManager;
      
      next();
    } catch (error) {
      console.error('Tier middleware error:', error);
      // Default to free tier on error
      req.userTier = 'free';
      next();
    }
  };
};

/**
 * Verify premium status (legacy compatibility)
 */
const requirePremium = tierMiddleware('premium');

/**
 * Verify professional status
 */
const requireProfessional = tierMiddleware('apiAccess');

module.exports = {
  TierManager,
  tierMiddleware,
  requirePremium,
  requireProfessional
};