/**
 * Price Comparison & Savings Engine
 * Integrates with pharmacy APIs to find best prices and save users money
 */

const axios = require('axios');
const admin = require('firebase-admin');

class PriceComparisonEngine {
  constructor() {
    // API configurations (would need real API keys in production)
    this.apis = {
      goodrx: {
        baseUrl: 'https://api.goodrx.com/v1',
        apiKey: process.env.GOODRX_API_KEY
      },
      singlecare: {
        baseUrl: 'https://api.singlecare.com/v1',
        apiKey: process.env.SINGLECARE_API_KEY
      },
      rxsaver: {
        baseUrl: 'https://api.rxsaver.com/v1',
        apiKey: process.env.RXSAVER_API_KEY
      }
    };

    // Major pharmacy chains
    this.pharmacies = [
      { id: 'cvs', name: 'CVS Pharmacy', locations: 9900 },
      { id: 'walgreens', name: 'Walgreens', locations: 9000 },
      { id: 'walmart', name: 'Walmart Pharmacy', locations: 4700 },
      { id: 'riteaid', name: 'Rite Aid', locations: 2500 },
      { id: 'kroger', name: 'Kroger Pharmacy', locations: 2200 },
      { id: 'costco', name: 'Costco Pharmacy', locations: 550, membership: true },
      { id: 'sams', name: "Sam's Club", locations: 600, membership: true },
      { id: 'target', name: 'Target (CVS)', locations: 1900 },
      { id: 'amazon', name: 'Amazon Pharmacy', online: true }
    ];

    // Insurance companies for coverage check
    this.insuranceProviders = [
      'Blue Cross Blue Shield',
      'UnitedHealth',
      'Anthem',
      'Aetna',
      'Cigna',
      'Humana',
      'Kaiser Permanente'
    ];
  }

  /**
   * Compare prices across all pharmacies
   */
  async comparePrices(medicationName, dosage, quantity, location) {
    try {
      const results = {
        medication: medicationName,
        dosage,
        quantity,
        location,
        timestamp: new Date(),
        prices: [],
        savings: {},
        coupons: [],
        generic: null,
        insurance: null
      };

      // Step 1: Check for generic alternatives
      results.generic = await this.findGenericAlternative(medicationName);

      // Step 2: Get prices from all pharmacies
      const pricePromises = this.pharmacies.map(pharmacy => 
        this.getPharmacyPrice(pharmacy, medicationName, dosage, quantity, location)
      );
      
      const prices = await Promise.allSettled(pricePromises);
      
      results.prices = prices
        .filter(p => p.status === 'fulfilled' && p.value)
        .map(p => p.value)
        .sort((a, b) => a.price - b.price);

      // Step 3: Find available coupons
      results.coupons = await this.findCoupons(medicationName, dosage);

      // Step 4: Calculate potential savings
      if (results.prices.length > 0) {
        const lowest = results.prices[0].price;
        const highest = results.prices[results.prices.length - 1].price;
        const average = results.prices.reduce((sum, p) => sum + p.price, 0) / results.prices.length;

        results.savings = {
          potential: highest - lowest,
          percentSaved: Math.round(((highest - lowest) / highest) * 100),
          averagePrice: average,
          lowestPrice: lowest,
          highestPrice: highest,
          bestPharmacy: results.prices[0].pharmacy,
          withCoupon: results.coupons[0] ? lowest * (1 - results.coupons[0].discount / 100) : lowest
        };
      }

      // Step 5: Check insurance coverage
      results.insurance = await this.checkInsuranceCoverage(medicationName, location);

      // Step 6: Add recommendations
      results.recommendations = this.generateSavingsRecommendations(results);

      // Step 7: Track price history
      await this.trackPriceHistory(medicationName, results);

      return {
        success: true,
        ...results
      };
    } catch (error) {
      console.error('Price comparison error:', error);
      return {
        success: false,
        error: error.message,
        fallback: await this.getFallbackPrices(medicationName)
      };
    }
  }

  /**
   * Get price from specific pharmacy
   */
  async getPharmacyPrice(pharmacy, medication, dosage, quantity, location) {
    try {
      // In production, would call actual pharmacy APIs
      // Mock implementation with realistic pricing
      const basePrice = this.calculateBasePrice(medication, dosage, quantity);
      const pharmacyMultiplier = this.getPharmacyMultiplier(pharmacy.id);
      const locationMultiplier = this.getLocationMultiplier(location);
      
      const price = Math.round(basePrice * pharmacyMultiplier * locationMultiplier);
      
      // Find nearest location
      const nearestLocation = await this.findNearestPharmacy(pharmacy, location);

      return {
        pharmacy: pharmacy.name,
        pharmacyId: pharmacy.id,
        price,
        inStock: Math.random() > 0.1, // 90% in stock
        location: nearestLocation,
        distance: nearestLocation?.distance,
        readyTime: pharmacy.online ? 'Ships in 1-2 days' : '20 minutes',
        membership: pharmacy.membership,
        features: this.getPharmacyFeatures(pharmacy.id)
      };
    } catch (error) {
      console.error(`Error getting ${pharmacy.name} price:`, error);
      return null;
    }
  }

  /**
   * Find generic alternatives
   */
  async findGenericAlternative(brandName) {
    try {
      // FDA Orange Book API for generic equivalents
      const response = await axios.get(
        `https://api.fda.gov/drug/ndc.json?search=brand_name:"${brandName}"&limit=5`
      );

      if (response.data.results) {
        const generics = response.data.results
          .filter(drug => drug.generic_name && drug.generic_name !== brandName)
          .map(drug => ({
            name: drug.generic_name,
            manufacturer: drug.labeler_name,
            savings: Math.round(Math.random() * 70 + 30), // 30-100% savings
            bioequivalent: true,
            fdaApproved: true
          }));

        return generics[0] || null;
      }

      return null;
    } catch (error) {
      // Fallback to common generic mappings
      const genericMappings = {
        'Lipitor': 'Atorvastatin',
        'Zoloft': 'Sertraline',
        'Prilosec': 'Omeprazole',
        'Synthroid': 'Levothyroxine',
        'Prozac': 'Fluoxetine'
      };

      return genericMappings[brandName] ? {
        name: genericMappings[brandName],
        savings: 75,
        bioequivalent: true
      } : null;
    }
  }

  /**
   * Find available coupons
   */
  async findCoupons(medication, dosage) {
    const coupons = [];

    // GoodRx coupon
    coupons.push({
      provider: 'GoodRx',
      code: `GRX${Math.random().toString(36).substring(7).toUpperCase()}`,
      discount: Math.round(Math.random() * 50 + 20), // 20-70% off
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      restrictions: 'Not valid with insurance',
      pharmacies: ['CVS', 'Walgreens', 'Walmart']
    });

    // Manufacturer coupon
    if (Math.random() > 0.5) {
      coupons.push({
        provider: 'Manufacturer',
        code: `MFG${Math.random().toString(36).substring(7).toUpperCase()}`,
        discount: Math.round(Math.random() * 30 + 10), // 10-40% off
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        restrictions: 'With insurance only',
        maxSavings: 100
      });
    }

    // Pharmacy-specific coupons
    coupons.push({
      provider: 'Walmart',
      code: '$4 Generic List',
      fixedPrice: 4,
      validUntil: null,
      restrictions: '30-day supply of eligible generics',
      eligible: Math.random() > 0.7
    });

    return coupons.sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }

  /**
   * Check insurance coverage
   */
  async checkInsuranceCoverage(medication, userInsurance) {
    if (!userInsurance) {
      return {
        covered: false,
        message: 'Add insurance information for coverage details'
      };
    }

    // Mock insurance coverage check
    const tierLevels = {
      1: { name: 'Generic', copay: 10, coverage: 0.9 },
      2: { name: 'Preferred Brand', copay: 35, coverage: 0.75 },
      3: { name: 'Non-Preferred Brand', copay: 60, coverage: 0.6 },
      4: { name: 'Specialty', copay: 150, coverage: 0.5 }
    };

    const tier = Math.ceil(Math.random() * 4);
    const coverage = tierLevels[tier];

    return {
      covered: true,
      insurance: userInsurance,
      tier,
      tierName: coverage.name,
      copay: coverage.copay,
      coverage: coverage.coverage * 100,
      deductible: {
        met: Math.random() > 0.5,
        remaining: Math.round(Math.random() * 1000)
      },
      priorAuth: tier >= 3 && Math.random() > 0.5,
      quantityLimit: tier >= 2 ? 30 : 90,
      alternatives: tier >= 3 ? ['Generic option available', 'Consider therapeutic alternative'] : []
    };
  }

  /**
   * Find nearest pharmacy location
   */
  async findNearestPharmacy(pharmacy, userLocation) {
    if (pharmacy.online) {
      return {
        type: 'online',
        shipping: 'Free shipping on orders over $35',
        delivery: '1-2 business days'
      };
    }

    // Mock nearest location - in production would use Google Maps API
    return {
      address: `${Math.round(Math.random() * 999) + 1} Main St`,
      city: userLocation?.city || 'Your City',
      distance: (Math.random() * 5 + 0.5).toFixed(1) + ' miles',
      phone: `(555) ${Math.round(Math.random() * 900) + 100}-${Math.round(Math.random() * 9000) + 1000}`,
      hours: '8 AM - 10 PM',
      driveThru: Math.random() > 0.5
    };
  }

  /**
   * Generate savings recommendations
   */
  generateSavingsRecommendations(results) {
    const recommendations = [];

    // Generic recommendation
    if (results.generic) {
      recommendations.push({
        type: 'generic',
        priority: 'high',
        savings: `Save ${results.generic.savings}% with generic ${results.generic.name}`,
        action: 'Ask your doctor about generic alternatives'
      });
    }

    // Best price pharmacy
    if (results.prices.length > 0) {
      recommendations.push({
        type: 'pharmacy',
        priority: 'high',
        savings: `Save $${results.savings.potential} at ${results.savings.bestPharmacy}`,
        action: `Switch to ${results.savings.bestPharmacy}`
      });
    }

    // Coupon recommendation
    if (results.coupons.length > 0) {
      const bestCoupon = results.coupons[0];
      recommendations.push({
        type: 'coupon',
        priority: 'medium',
        savings: `Additional ${bestCoupon.discount}% off with ${bestCoupon.provider}`,
        action: 'Show coupon code at pharmacy'
      });
    }

    // 90-day supply recommendation
    recommendations.push({
      type: 'quantity',
      priority: 'medium',
      savings: 'Save 10-20% with 90-day supply',
      action: 'Ask for 3-month prescription'
    });

    // Mail order recommendation
    const mailOrderPharmacy = results.prices.find(p => p.pharmacyId === 'amazon');
    if (mailOrderPharmacy) {
      recommendations.push({
        type: 'mail_order',
        priority: 'low',
        savings: 'Convenient home delivery',
        action: 'Consider mail-order pharmacy'
      });
    }

    return recommendations;
  }

  /**
   * Track price history for alerts
   */
  async trackPriceHistory(medication, priceData) {
    try {
      if (!admin.apps.length) return;

      await admin.firestore()
        .collection('priceHistory')
        .add({
          medication,
          prices: priceData.prices,
          lowestPrice: priceData.savings?.lowestPrice,
          timestamp: new Date(),
          location: priceData.location
        });

      // Check for price drops
      const history = await admin.firestore()
        .collection('priceHistory')
        .where('medication', '==', medication)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      if (history.docs.length > 1) {
        const previousPrice = history.docs[1].data().lowestPrice;
        const currentPrice = priceData.savings?.lowestPrice;

        if (currentPrice < previousPrice * 0.9) {
          // Price dropped by 10% or more - trigger alert
          await this.sendPriceDropAlert(medication, previousPrice, currentPrice);
        }
      }
    } catch (error) {
      console.error('Price tracking error:', error);
    }
  }

  /**
   * Send price drop alert
   */
  async sendPriceDropAlert(medication, oldPrice, newPrice) {
    const savings = oldPrice - newPrice;
    const percentSaved = Math.round((savings / oldPrice) * 100);

    console.log(`PRICE ALERT: ${medication} dropped ${percentSaved}% ($${savings})`);
    // In production, send push notification or email
  }

  /**
   * Helper methods
   */
  calculateBasePrice(medication, dosage, quantity) {
    // Mock base price calculation
    const basePrices = {
      generic: 20,
      brand: 100,
      specialty: 500
    };

    const type = medication.toLowerCase().includes('atorvastatin') ? 'generic' : 'brand';
    const base = basePrices[type];
    const quantityMultiplier = quantity / 30;
    
    return base * quantityMultiplier;
  }

  getPharmacyMultiplier(pharmacyId) {
    const multipliers = {
      walmart: 0.8,
      costco: 0.75,
      sams: 0.78,
      kroger: 0.85,
      amazon: 0.82,
      target: 0.9,
      walgreens: 1.1,
      cvs: 1.15,
      riteaid: 1.05
    };

    return multipliers[pharmacyId] || 1.0;
  }

  getLocationMultiplier(location) {
    // Adjust prices based on location cost of living
    // In production, would use actual cost of living data
    return 0.9 + Math.random() * 0.3; // 0.9 to 1.2
  }

  getPharmacyFeatures(pharmacyId) {
    const features = {
      cvs: ['24-hour locations', 'MinuteClinic', 'ExtraCare rewards'],
      walgreens: ['24-hour locations', 'Balance Rewards', 'Healthcare clinics'],
      walmart: ['$4 generics', 'Low prices', 'One-stop shopping'],
      costco: ['Members only', 'Bulk discounts', 'Low prices'],
      amazon: ['Home delivery', 'PillPack service', 'Auto-refill']
    };

    return features[pharmacyId] || [];
  }

  async getFallbackPrices(medication) {
    // Fallback pricing when APIs unavailable
    return {
      message: 'Live pricing temporarily unavailable',
      estimatedRange: {
        low: 20,
        high: 200
      },
      tip: 'Generic medications typically cost 80% less than brand names'
    };
  }
}

module.exports = PriceComparisonEngine;