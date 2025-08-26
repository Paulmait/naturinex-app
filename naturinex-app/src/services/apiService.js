import networkHandler from '../utils/networkHandler';
import appConfig from '../config/appConfig';

// Get the config by calling the function
const config = appConfig();

const API_URL = config.API_URL;

class ApiService {
  async analyzeMedication(medicationName) {
    return networkHandler.makeRequest(
      `${API_URL}/api/analyze/name`,
      {
        method: 'POST',
        body: JSON.stringify({ medicationName })
      },
      {
        cacheKey: `medication_${medicationName.toLowerCase().replace(/\s+/g, '_')}`,
        cacheExpiry: 86400000, // 24 hours
        showOfflineAlert: true,
        fallbackData: this.getOfflineFallbackData(medicationName)
      }
    );
  }

  async analyzeImage(imageBase64) {
    const formData = new FormData();
    formData.append('image', {
      uri: imageBase64,
      type: 'image/jpeg',
      name: 'medication.jpg'
    });

    return networkHandler.makeRequest(
      `${API_URL}/api/analyze`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      },
      {
        showOfflineAlert: true,
        queueIfOffline: true // Queue image analysis for when back online
      }
    );
  }

  async searchProducts(query) {
    return networkHandler.makeRequest(
      `${API_URL}/api/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET'
      },
      {
        cacheKey: `search_${query.toLowerCase().replace(/\s+/g, '_')}`,
        cacheExpiry: 3600000, // 1 hour
        showOfflineAlert: false,
        fallbackData: { results: [] }
      }
    );
  }

  async getPricingTiers() {
    return networkHandler.makeRequest(
      `${API_URL}/api/pricing/tiers`,
      {
        method: 'GET'
      },
      {
        cacheKey: 'pricing_tiers',
        cacheExpiry: 86400000, // 24 hours
        showOfflineAlert: false,
        fallbackData: this.getDefaultPricingTiers()
      }
    );
  }

  async createCheckoutSession(priceId, userId) {
    return networkHandler.makeRequest(
      `${API_URL}/create-checkout-session`,
      {
        method: 'POST',
        body: JSON.stringify({ priceId, userId })
      },
      {
        showOfflineAlert: true,
        queueIfOffline: false // Don't queue payment requests
      }
    );
  }

  getOfflineFallbackData(medicationName) {
    // Basic offline data for common medications
    const offlineDatabase = {
      'aspirin': {
        medicationName: 'Aspirin',
        medicationType: 'Pain Relief/Anti-inflammatory',
        wellness_info: [
          {
            name: 'Turmeric',
            effectiveness: 'Moderate',
            description: 'Natural anti-inflammatory compound',
            benefits: ['Anti-inflammatory properties', 'Antioxidant effects']
          }
        ],
        warnings: [
          'This is offline cached data. Please connect to internet for latest information.',
          'Always consult your healthcare provider before making changes to medications.'
        ],
        isOfflineData: true
      },
      'ibuprofen': {
        medicationName: 'Ibuprofen',
        medicationType: 'NSAID Pain Reliever',
        wellness_info: [
          {
            name: 'Ginger',
            effectiveness: 'Moderate',
            description: 'Natural pain relief and anti-inflammatory',
            benefits: ['Reduces inflammation', 'May help with pain']
          }
        ],
        warnings: [
          'This is offline cached data. Please connect to internet for latest information.',
          'Always consult your healthcare provider before making changes to medications.'
        ],
        isOfflineData: true
      }
    };

    const normalized = medicationName.toLowerCase().trim();
    return offlineDatabase[normalized] || {
      medicationName: medicationName,
      medicationType: 'Unknown',
      wellness_info: [],
      warnings: [
        'Offline mode - Unable to analyze this medication.',
        'Please connect to internet for medication analysis.',
        'Always consult your healthcare provider.'
      ],
      isOfflineData: true,
      error: 'Medication not available offline'
    };
  }

  getDefaultPricingTiers() {
    return {
      tiers: [
        {
          id: 'free',
          name: 'Free',
          price: 0,
          features: ['5 scans per day', 'Basic wellness info']
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 9.99,
          features: ['Unlimited scans', 'Detailed analysis', 'Export reports']
        }
      ],
      isOfflineData: true
    };
  }
}

export default new ApiService();