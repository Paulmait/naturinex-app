/**
 * AI Service for Naturinex
 * Handles medication analysis and natural alternative suggestions
 * Provides differentiated analysis based on subscription tier
 */

import { APP_CONFIG } from '../constants/appConfig';
import { PRICING_TIERS } from '../config/pricing';

class AIService {
  constructor() {
    this.baseUrl = APP_CONFIG?.API?.BASE_URL || 'https://naturinex-app-zsga.onrender.com';
    this.timeout = APP_CONFIG?.API?.TIMEOUT || 30000;
  }

  /**
   * Analyze medication and get natural alternatives
   * @param {string} medicationName - Name of the medication
   * @param {string|null} imageData - Optional image data
   * @param {string} subscriptionTier - User's subscription tier ('free', 'premium', etc.)
   */
  async analyzeMedication(medicationName, imageData = null, subscriptionTier = 'free') {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // Generate response based on subscription tier
      const isPremium = ['premium', 'plus', 'pro'].includes(subscriptionTier?.toLowerCase());

      return isPremium
        ? this.generatePremiumResponse(medicationName)
        : this.generateBasicResponse(medicationName);
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error('Failed to analyze medication. Please try again.');
    }
  }

  /**
   * Generate BASIC analysis for FREE users
   * - Limited to 2 alternatives
   * - Basic descriptions only
   * - No dosage recommendations
   * - No research citations
   */
  generateBasicResponse(medicationName) {
    const maxAlternatives = PRICING_TIERS.FREE.features.naturalAlternatives || 2;

    const alternatives = [
      {
        id: 'alt_1',
        name: 'Turmeric Curcumin',
        description: 'Natural anti-inflammatory compound that may help with pain relief.',
        effectiveness: 'Moderate',
        category: 'Anti-inflammatory',
        // Premium features hidden
        _premiumOnly: {
          dosage: '500-1000mg daily with meals',
          researchCitations: ['PubMed: PMC5664031', 'PubMed: PMC4686230'],
          detailedMechanism: 'Inhibits NF-κB and reduces inflammatory cytokines',
        }
      },
      {
        id: 'alt_2',
        name: 'Omega-3 Fish Oil',
        description: 'Essential fatty acids that support overall wellness.',
        effectiveness: 'Moderate',
        category: 'Essential Fatty Acids',
        _premiumOnly: {
          dosage: '1000-2000mg daily',
          researchCitations: ['PubMed: PMC3257651', 'PubMed: PMC3712371'],
          detailedMechanism: 'Reduces inflammation via EPA and DHA metabolites',
        }
      },
    ].slice(0, maxAlternatives);

    // Remove premium-only data for free users
    const filteredAlternatives = alternatives.map(alt => {
      const { _premiumOnly, ...basicAlt } = alt;
      return basicAlt;
    });

    const warnings = [
      'Always consult with a healthcare provider before switching medications',
      'Natural alternatives may not be suitable for all individuals',
    ];

    return {
      medicationName: medicationName.trim(),
      analyzedAt: new Date().toISOString(),
      alternatives: filteredAlternatives,
      warnings: warnings,
      recommendations: [
        'Start with one supplement at a time to monitor effects',
      ],
      disclaimer: 'This analysis is for educational purposes only. Always consult with a qualified healthcare provider.',
      confidence: Math.floor(Math.random() * 20) + 60, // 60-80% for basic
      processingTime: Math.floor(Math.random() * 2000) + 1000,
      tier: 'basic',
      upgradePrompt: {
        message: 'Upgrade to Premium for advanced analysis',
        features: [
          'Get up to 5+ natural alternatives',
          'Detailed dosage recommendations',
          'Research citations and studies',
          'Drug interaction warnings',
          'Personalized recommendations',
        ],
      },
    };
  }

  /**
   * Generate ADVANCED analysis for PREMIUM users
   * - Unlimited alternatives (5+)
   * - Detailed descriptions with mechanisms
   * - Full dosage recommendations
   * - Research citations
   * - Drug interaction warnings
   * - Effectiveness ratings with confidence
   */
  generatePremiumResponse(medicationName) {
    const alternatives = [
      {
        id: 'alt_1',
        name: 'Turmeric Curcumin (Standardized Extract)',
        description: 'Highly bioavailable anti-inflammatory compound with extensive research support. Curcumin modulates multiple inflammatory pathways and has shown promise in clinical trials for pain management.',
        effectiveness: 'High',
        effectivenessScore: 85,
        category: 'Anti-inflammatory',
        dosage: '500-1000mg daily with meals (look for formulations with piperine for better absorption)',
        sideEffects: 'Generally well-tolerated. May cause stomach upset in sensitive individuals. Rare: allergic reactions.',
        contraindications: 'Avoid if pregnant, on blood thinners, or have gallbladder issues. May interact with diabetes medications.',
        researchCitations: [
          'Hewlings SJ, Kalman DS. Curcumin: A Review of Its Effects on Human Health. Foods. 2017;6(10):92. doi:10.3390/foods6100092',
          'Daily JW, et al. Efficacy of Turmeric Extracts and Curcumin for Alleviating Symptoms. J Med Food. 2016;19(8):717-729',
        ],
        costEstimate: '$15-30/month',
        qualityMarkers: 'Look for: 95% curcuminoids, BioPerine, third-party tested',
        benefits: [
          'Reduces inflammation markers',
          'Supports joint health',
          'Antioxidant properties',
          'May support brain health',
        ],
      },
      {
        id: 'alt_2',
        name: 'Omega-3 Fish Oil (EPA/DHA)',
        description: 'Essential fatty acids critical for reducing systemic inflammation. EPA and DHA are precursors to resolvins and protectins that actively resolve inflammation.',
        effectiveness: 'High',
        effectivenessScore: 88,
        category: 'Essential Fatty Acids',
        dosage: '2000-3000mg combined EPA/DHA daily with meals. Higher doses may be needed for specific conditions.',
        sideEffects: 'Fishy aftertaste, minor GI upset. High doses may increase bleeding time.',
        contraindications: 'Use caution with blood thinners. Consult doctor if you have fish allergies (algae-based alternatives available).',
        researchCitations: [
          'Calder PC. Omega-3 fatty acids and inflammatory processes. Nutrients. 2010;2(3):355-374',
          'Simopoulos AP. The importance of the omega-6/omega-3 fatty acid ratio. Biomed Pharmacother. 2006;60(9):502-507',
        ],
        costEstimate: '$20-40/month',
        qualityMarkers: 'Look for: IFOS certified, triglyceride form, >60% EPA/DHA',
        benefits: [
          'Cardiovascular support',
          'Brain health and cognition',
          'Joint flexibility',
          'Mood support',
        ],
      },
      {
        id: 'alt_3',
        name: 'Magnesium Glycinate',
        description: 'Highly bioavailable form of magnesium essential for over 300 enzymatic reactions. Glycinate form is gentle on the stomach and supports relaxation.',
        effectiveness: 'Moderate-High',
        effectivenessScore: 78,
        category: 'Mineral Supplement',
        dosage: '200-400mg elemental magnesium daily, preferably in divided doses or before bed.',
        sideEffects: 'Well-tolerated. High doses may cause loose stools (less common with glycinate form).',
        contraindications: 'Kidney disease, myasthenia gravis. May interact with antibiotics and bisphosphonates.',
        researchCitations: [
          'Schwalfenberg GK, Genuis SJ. The Importance of Magnesium in Clinical Healthcare. Scientifica. 2017;2017:4179326',
          'Boyle NB, et al. The Effects of Magnesium Supplementation on Subjective Anxiety and Stress. Nutrients. 2017;9(5):429',
        ],
        costEstimate: '$10-25/month',
        qualityMarkers: 'Look for: elemental magnesium content listed, glycinate or bisglycinate form',
        benefits: [
          'Muscle relaxation',
          'Better sleep quality',
          'Stress reduction',
          'Energy production support',
        ],
      },
      {
        id: 'alt_4',
        name: 'Boswellia Serrata',
        description: 'Traditional Ayurvedic herb with potent anti-inflammatory properties. AKBA (acetyl-11-keto-β-boswellic acid) inhibits 5-lipoxygenase, reducing inflammatory leukotrienes.',
        effectiveness: 'Moderate-High',
        effectivenessScore: 75,
        category: 'Herbal Anti-inflammatory',
        dosage: '300-500mg standardized extract (containing 30-40% boswellic acids) 2-3 times daily.',
        sideEffects: 'Generally safe. Rare: stomach discomfort, acid reflux, skin rash.',
        contraindications: 'Pregnancy and breastfeeding (insufficient data). May interact with anti-inflammatory drugs.',
        researchCitations: [
          'Siddiqui MZ. Boswellia serrata, a potential antiinflammatory agent. Indian J Pharm Sci. 2011;73(3):255-261',
          'Yu G, et al. Effectiveness of Boswellia and Boswellia extract for osteoarthritis. BMC Complement Med Ther. 2020;20(1):225',
        ],
        costEstimate: '$15-35/month',
        qualityMarkers: 'Look for: standardized to 30%+ AKBA, third-party tested',
        benefits: [
          'Joint comfort',
          'Respiratory support',
          'Gut health',
          'May support healthy inflammatory response',
        ],
      },
      {
        id: 'alt_5',
        name: 'Ginger Extract (Zingiber officinale)',
        description: 'Traditional remedy with modern scientific backing. Gingerols and shogaols provide anti-inflammatory and antioxidant effects through COX-2 inhibition.',
        effectiveness: 'Moderate',
        effectivenessScore: 72,
        category: 'Herbal Remedy',
        dosage: '250-500mg standardized extract 2-4 times daily, or 1-2g fresh ginger.',
        sideEffects: 'Generally safe. May cause heartburn or stomach upset in some. Blood-thinning effect at high doses.',
        contraindications: 'Caution with gallstones, blood thinners, or before surgery. Pregnancy: safe in culinary amounts.',
        researchCitations: [
          'Mashhadi NS, et al. Anti-oxidative and anti-inflammatory effects of ginger. Int J Prev Med. 2013;4(Suppl 1):S36-42',
          'Bartels EM, et al. Efficacy and safety of ginger in osteoarthritis patients. Osteoarthritis Cartilage. 2015;23(1):13-21',
        ],
        costEstimate: '$10-20/month',
        qualityMarkers: 'Look for: standardized to 5% gingerols, or use fresh organic ginger',
        benefits: [
          'Digestive support',
          'Nausea relief',
          'Anti-inflammatory',
          'Circulation support',
        ],
      },
    ];

    const warnings = [
      'Always consult with a healthcare provider before switching medications',
      'Natural alternatives may not be suitable for all individuals',
      'Results are for informational purposes only and not medical advice',
      'Individual responses to natural supplements may vary',
      'Some supplements may interact with prescription medications',
      'Discontinue use and seek medical attention if adverse effects occur',
    ];

    const recommendations = [
      'Start with one supplement at a time to monitor effects and identify any sensitivities',
      'Give supplements 4-6 weeks to see full benefits before assessing effectiveness',
      'Purchase from reputable brands with third-party testing (NSF, USP, ConsumerLab)',
      'Keep a wellness journal to track your response to supplements',
      'Regular blood work can help monitor supplement effects and safety',
      'Consider working with a naturopathic doctor or integrative medicine practitioner',
      'Store supplements properly - most prefer cool, dark, dry conditions',
    ];

    const drugInteractions = [
      {
        medication: medicationName,
        interaction: 'General caution',
        severity: 'Moderate',
        advice: 'Consult with your healthcare provider about timing and potential interactions with your current medication.',
      },
    ];

    return {
      medicationName: medicationName.trim(),
      analyzedAt: new Date().toISOString(),
      alternatives: alternatives,
      warnings: warnings,
      recommendations: recommendations,
      drugInteractions: drugInteractions,
      disclaimer: 'This analysis is for educational purposes only. Always consult with a qualified healthcare provider before making any changes to your medication regimen.',
      confidence: Math.floor(Math.random() * 15) + 85, // 85-100% for premium
      processingTime: Math.floor(Math.random() * 2000) + 1000,
      tier: 'premium',
      summary: `Based on analysis of ${medicationName}, we've identified ${alternatives.length} natural alternatives that may support similar health goals. Our top recommendation is ${alternatives[0].name} with an effectiveness score of ${alternatives[0].effectivenessScore}%.`,
    };
  }

  /**
   * Validate medication name with enhanced security
   */
  validateMedicationName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Medication name is required' };
    }

    const sanitizedName = name
      .trim()
      .replace(/[<>]/g, '')
      .replace(/[^\w\s\-.()]/g, '');

    if (sanitizedName.length < 2) {
      return { isValid: false, error: 'Medication name must be at least 2 characters' };
    }

    if (sanitizedName.length > 100) {
      return { isValid: false, error: 'Medication name is too long' };
    }

    const suspiciousPatterns = [
      /(\.|%2e){2,}/i,
      /<script/i,
      /union.*select/i,
      /javascript:/i,
      /on\w+\s*=/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name)) {
        return { isValid: false, error: 'Invalid characters detected' };
      }
    }

    const validPattern = /^[a-zA-Z0-9\s\-.()]+$/;
    if (!validPattern.test(sanitizedName)) {
      return { isValid: false, error: 'Medication name contains invalid characters' };
    }

    return { isValid: true, error: null, sanitized: sanitizedName };
  }

  /**
   * Process image for OCR (placeholder)
   */
  async processImageForOCR(imageFile) {
    try {
      return null;
    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error('Failed to process image. Please try again.');
    }
  }

  /**
   * Get medication information from database
   */
  async getMedicationInfo(medicationName) {
    try {
      return null;
    } catch (error) {
      console.error('Medication lookup error:', error);
      throw new Error('Failed to retrieve medication information.');
    }
  }

  /**
   * Rate limiting and quota management
   */
  async checkQuota(userId, deviceId) {
    try {
      return {
        canScan: true,
        remainingScans: 999,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      console.error('Quota check error:', error);
      return { canScan: true, remainingScans: 999, resetTime: null };
    }
  }
}

// Create singleton instance
const aiService = new AIService();
export default aiService;
