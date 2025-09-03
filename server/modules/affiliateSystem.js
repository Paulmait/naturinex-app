/**
 * Affiliate Revenue System
 * Tracks and manages affiliate partnerships and commissions
 */

const admin = require('firebase-admin');

// Affiliate partner configurations
const AFFILIATE_PARTNERS = {
  'iherb': {
    name: 'iHerb',
    baseUrl: 'https://www.iherb.com',
    affiliateId: 'NAT8392',
    commission: 0.10, // 10%
    categories: ['supplements', 'vitamins', 'herbs'],
    trackingParam: 'rcode'
  },
  'vitacost': {
    name: 'Vitacost',
    baseUrl: 'https://www.vitacost.com',
    affiliateId: 'NTRX2024',
    commission: 0.08, // 8%
    categories: ['supplements', 'organic', 'natural'],
    trackingParam: 'affid'
  },
  'amazon': {
    name: 'Amazon',
    baseUrl: 'https://www.amazon.com',
    affiliateId: 'naturinex-20',
    commission: 0.04, // 4%
    categories: ['books', 'devices', 'general'],
    trackingParam: 'tag'
  },
  'gnc': {
    name: 'GNC',
    baseUrl: 'https://www.gnc.com',
    affiliateId: 'NX4523',
    commission: 0.12, // 12%
    categories: ['supplements', 'protein', 'fitness'],
    trackingParam: 'affid'
  }
};

// Product recommendations database (can be expanded)
const PRODUCT_RECOMMENDATIONS = {
  'turmeric': [
    {
      partner: 'iherb',
      productId: 'NOW-04754',
      name: 'NOW Foods Turmeric Curcumin',
      price: 19.99,
      rating: 4.5,
      reviews: 2341,
      benefits: 'Anti-inflammatory, Joint support',
      dosage: '500mg',
      url: '/pr/now-foods-turmeric-curcumin/4754'
    },
    {
      partner: 'vitacost',
      productId: 'VC-3243',
      name: 'Organic Turmeric Root Powder',
      price: 14.99,
      rating: 4.7,
      reviews: 892,
      benefits: 'Pure organic, Cooking & supplements',
      dosage: 'Powder form',
      url: '/products/organic-turmeric-powder'
    }
  ],
  'ginger': [
    {
      partner: 'iherb',
      productId: 'NAT-02156',
      name: "Nature's Way Ginger Root",
      price: 9.99,
      rating: 4.6,
      reviews: 1523,
      benefits: 'Digestive support, Nausea relief',
      dosage: '550mg',
      url: '/pr/natures-way-ginger-root/2156'
    }
  ],
  'echinacea': [
    {
      partner: 'gnc',
      productId: 'GNC-198234',
      name: 'GNC Herbal Plus Echinacea',
      price: 16.99,
      rating: 4.4,
      reviews: 673,
      benefits: 'Immune support, Cold prevention',
      dosage: '400mg',
      url: '/products/herbal-plus-echinacea'
    }
  ]
};

class AffiliateSystem {
  /**
   * Generate affiliate links for natural alternatives
   */
  static generateAffiliateLinks(alternatives, userId) {
    const affiliateLinks = [];
    
    // Parse alternatives to find matching products
    const keywords = this.extractKeywords(alternatives);
    
    keywords.forEach(keyword => {
      const products = PRODUCT_RECOMMENDATIONS[keyword.toLowerCase()];
      if (products) {
        products.forEach(product => {
          const partner = AFFILIATE_PARTNERS[product.partner];
          if (partner) {
            const affiliateUrl = this.buildAffiliateUrl(
              partner,
              product,
              userId
            );
            
            affiliateLinks.push({
              ...product,
              affiliateUrl,
              commission: partner.commission,
              partnerName: partner.name,
              tracking: {
                userId,
                keyword,
                timestamp: new Date().toISOString()
              }
            });
          }
        });
      }
    });
    
    return affiliateLinks;
  }

  /**
   * Build affiliate URL with tracking
   */
  static buildAffiliateUrl(partner, product, userId) {
    const baseUrl = `${partner.baseUrl}${product.url}`;
    const trackingId = `${partner.affiliateId}_${userId}_${Date.now()}`;
    
    // Add affiliate tracking parameter
    const separator = baseUrl.includes('?') ? '&' : '?';
    const affiliateUrl = `${baseUrl}${separator}${partner.trackingParam}=${partner.affiliateId}&utm_source=naturinex&utm_medium=app&utm_campaign=alternatives&uid=${userId}`;
    
    return affiliateUrl;
  }

  /**
   * Track affiliate click
   */
  static async trackAffiliateClick(userId, productData) {
    try {
      if (!admin.apps.length) {
        return { success: false };
      }

      const clickData = {
        userId,
        productId: productData.productId,
        productName: productData.name,
        partner: productData.partner,
        commission: productData.commission,
        price: productData.price,
        timestamp: new Date(),
        converted: false,
        revenue: 0
      };

      // Save click data
      const clickRef = await admin.firestore()
        .collection('affiliateClicks')
        .add(clickData);

      // Update user's affiliate activity
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          affiliateClicks: admin.firestore.FieldValue.arrayUnion({
            clickId: clickRef.id,
            productId: productData.productId,
            timestamp: new Date()
          }),
          lastAffiliateClick: new Date()
        });

      // Generate redirect URL
      const partner = AFFILIATE_PARTNERS[productData.partner];
      const redirectUrl = this.buildAffiliateUrl(partner, productData, userId);

      return {
        success: true,
        clickId: clickRef.id,
        redirectUrl,
        estimatedCommission: productData.price * productData.commission
      };
    } catch (error) {
      console.error('Error tracking affiliate click:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track affiliate conversion (webhook from partner)
   */
  static async trackConversion(clickId, orderData) {
    try {
      if (!admin.apps.length) {
        return { success: false };
      }

      const clickRef = admin.firestore()
        .collection('affiliateClicks')
        .doc(clickId);

      const clickDoc = await clickRef.get();
      if (!clickDoc.exists) {
        return { success: false, error: 'Click not found' };
      }

      const clickData = clickDoc.data();
      const commission = orderData.amount * clickData.commission;

      // Update click record
      await clickRef.update({
        converted: true,
        conversionDate: new Date(),
        orderAmount: orderData.amount,
        orderId: orderData.orderId,
        revenue: commission
      });

      // Update user's affiliate revenue
      await admin.firestore()
        .collection('users')
        .doc(clickData.userId)
        .update({
          affiliateRevenue: admin.firestore.FieldValue.increment(commission),
          totalAffiliateOrders: admin.firestore.FieldValue.increment(1)
        });

      // Track monthly revenue
      await this.updateMonthlyRevenue(commission);

      return {
        success: true,
        commission,
        userId: clickData.userId
      };
    } catch (error) {
      console.error('Error tracking conversion:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get affiliate performance stats
   */
  static async getAffiliateStats(options = {}) {
    try {
      if (!admin.apps.length) {
        return { success: false };
      }

      const { startDate, endDate, partner } = options;
      
      let query = admin.firestore()
        .collection('affiliateClicks');

      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
      if (endDate) {
        query = query.where('timestamp', '<=', endDate);
      }
      if (partner) {
        query = query.where('partner', '==', partner);
      }

      const clicksSnapshot = await query.get();
      
      let totalClicks = 0;
      let totalConversions = 0;
      let totalRevenue = 0;
      const partnerStats = {};

      clicksSnapshot.forEach(doc => {
        const data = doc.data();
        totalClicks++;
        
        if (data.converted) {
          totalConversions++;
          totalRevenue += data.revenue || 0;
        }

        // Partner-specific stats
        if (!partnerStats[data.partner]) {
          partnerStats[data.partner] = {
            clicks: 0,
            conversions: 0,
            revenue: 0
          };
        }
        
        partnerStats[data.partner].clicks++;
        if (data.converted) {
          partnerStats[data.partner].conversions++;
          partnerStats[data.partner].revenue += data.revenue || 0;
        }
      });

      const conversionRate = totalClicks > 0 ? 
        (totalConversions / totalClicks * 100).toFixed(2) : 0;

      return {
        success: true,
        stats: {
          totalClicks,
          totalConversions,
          conversionRate: `${conversionRate}%`,
          totalRevenue: totalRevenue.toFixed(2),
          averageCommission: totalConversions > 0 ? 
            (totalRevenue / totalConversions).toFixed(2) : 0,
          partnerStats,
          topProducts: await this.getTopProducts()
        }
      };
    } catch (error) {
      console.error('Error getting affiliate stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get top performing products
   */
  static async getTopProducts(limit = 10) {
    try {
      if (!admin.apps.length) return [];

      const productsSnapshot = await admin.firestore()
        .collection('affiliateClicks')
        .where('converted', '==', true)
        .orderBy('revenue', 'desc')
        .limit(limit)
        .get();

      const products = [];
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        products.push({
          productName: data.productName,
          partner: data.partner,
          revenue: data.revenue,
          orderId: data.orderId
        });
      });

      return products;
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  /**
   * Update monthly revenue tracking
   */
  static async updateMonthlyRevenue(amount) {
    try {
      if (!admin.apps.length) return;

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      const revenueRef = admin.firestore()
        .collection('revenue')
        .doc(monthKey);

      await revenueRef.set({
        affiliate: admin.firestore.FieldValue.increment(amount),
        lastUpdated: now
      }, { merge: true });
    } catch (error) {
      console.error('Error updating monthly revenue:', error);
    }
  }

  /**
   * Extract keywords from AI alternatives response
   */
  static extractKeywords(text) {
    if (!text) return [];
    
    // Common natural alternatives keywords
    const keywords = [
      'turmeric', 'ginger', 'garlic', 'echinacea', 'ginseng',
      'valerian', 'chamomile', 'peppermint', 'lavender', 'ashwagandha',
      'elderberry', 'probiotics', 'omega-3', 'vitamin d', 'vitamin c',
      'zinc', 'magnesium', 'melatonin', 'glucosamine', 'coq10'
    ];

    const found = [];
    const textLower = text.toLowerCase();
    
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        found.push(keyword);
      }
    });

    return found;
  }

  /**
   * Check if user should see affiliate offers
   */
  static shouldShowAffiliateOffers(userTier) {
    // Don't show ads to premium users
    const noAdsTiers = ['PRO', 'FAMILY', 'ENTERPRISE'];
    return !noAdsTiers.includes(userTier);
  }
}

module.exports = AffiliateSystem;