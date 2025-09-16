// Natural Alternatives Service
// Provides natural medication alternatives using AI and verified database

import { supabase } from '../config/supabase';

class NaturalAlternativesService {
  constructor() {
    this.cache = new Map();
    this.apiUrl = process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com';
  }

  // Main function to get natural alternatives
  async getNaturalAlternatives(medicationName, options = {}) {
    const {
      includeAI = true,
      includeSafety = true,
      includeResearch = true,
      userProfile = null,
    } = options;

    // Check cache first
    const cacheKey = `alternatives_${medicationName.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expires > Date.now()) {
        return cached.data;
      }
    }

    try {
      // Get alternatives from multiple sources
      const [dbAlternatives, aiAlternatives] = await Promise.all([
        this.getDatabaseAlternatives(medicationName),
        includeAI ? this.getAIAlternatives(medicationName, userProfile) : null,
      ]);

      // Merge and rank alternatives
      const mergedAlternatives = this.mergeAlternatives(dbAlternatives, aiAlternatives);

      // Add safety information
      if (includeSafety) {
        await this.addSafetyInformation(mergedAlternatives, medicationName);
      }

      // Add research citations
      if (includeResearch) {
        await this.addResearchCitations(mergedAlternatives);
      }

      // Sort by effectiveness and safety
      const rankedAlternatives = this.rankAlternatives(mergedAlternatives, userProfile);

      // Prepare result
      const result = {
        medication: medicationName,
        alternatives: rankedAlternatives,
        warnings: this.generateWarnings(medicationName, rankedAlternatives),
        disclaimer: this.getMedicalDisclaimer(),
        timestamp: new Date(),
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + 30 * 60 * 1000, // 30 minutes
      });

      return result;
    } catch (error) {
      console.error('Error getting natural alternatives:', error);
      throw new Error('Failed to get natural alternatives');
    }
  }

  // Get alternatives from database
  async getDatabaseAlternatives(medicationName) {
    // Common medication to natural alternatives mapping
    const database = {
      'aspirin': [
        {
          name: 'White Willow Bark',
          scientificName: 'Salix alba',
          description: 'Natural source of salicin, similar to aspirin',
          dosage: '240-480mg daily',
          effectiveness: 0.85,
          safety: 0.9,
          uses: ['Pain relief', 'Anti-inflammatory', 'Fever reduction'],
          contraindications: ['Blood thinners', 'Aspirin allergy'],
        },
        {
          name: 'Turmeric',
          scientificName: 'Curcuma longa',
          description: 'Powerful anti-inflammatory compound',
          dosage: '500-2000mg curcumin daily',
          effectiveness: 0.8,
          safety: 0.95,
          uses: ['Inflammation', 'Joint pain', 'Arthritis'],
          contraindications: ['Gallbladder disease', 'Blood thinners'],
        },
        {
          name: 'Ginger',
          scientificName: 'Zingiber officinale',
          description: 'Natural anti-inflammatory and pain reliever',
          dosage: '1-3g daily',
          effectiveness: 0.75,
          safety: 0.95,
          uses: ['Pain', 'Nausea', 'Inflammation'],
          contraindications: ['Blood thinners', 'Gallstones'],
        },
      ],
      'ibuprofen': [
        {
          name: 'Boswellia',
          scientificName: 'Boswellia serrata',
          description: 'Ayurvedic anti-inflammatory herb',
          dosage: '300-500mg 3x daily',
          effectiveness: 0.8,
          safety: 0.9,
          uses: ['Joint pain', 'Arthritis', 'Inflammation'],
          contraindications: ['Pregnancy', 'Auto-immune conditions'],
        },
        {
          name: 'Devils Claw',
          scientificName: 'Harpagophytum procumbens',
          description: 'African herb for pain and inflammation',
          dosage: '600-2400mg daily',
          effectiveness: 0.75,
          safety: 0.85,
          uses: ['Back pain', 'Arthritis', 'Muscle pain'],
          contraindications: ['Stomach ulcers', 'Heart conditions'],
        },
        {
          name: 'Omega-3 Fatty Acids',
          scientificName: 'EPA/DHA',
          description: 'Anti-inflammatory essential fatty acids',
          dosage: '1-3g daily',
          effectiveness: 0.7,
          safety: 0.95,
          uses: ['Inflammation', 'Joint health', 'Heart health'],
          contraindications: ['Blood thinners', 'Fish allergy'],
        },
      ],
      'acetaminophen': [
        {
          name: 'Meadowsweet',
          scientificName: 'Filipendula ulmaria',
          description: 'Natural pain reliever and fever reducer',
          dosage: '2.5-3.5g dried herb daily',
          effectiveness: 0.7,
          safety: 0.9,
          uses: ['Headache', 'Fever', 'Minor pain'],
          contraindications: ['Aspirin allergy', 'Asthma'],
        },
        {
          name: 'Feverfew',
          scientificName: 'Tanacetum parthenium',
          description: 'Traditional headache and fever remedy',
          dosage: '50-100mg daily',
          effectiveness: 0.75,
          safety: 0.85,
          uses: ['Migraine prevention', 'Fever', 'Arthritis'],
          contraindications: ['Pregnancy', 'Blood thinners'],
        },
      ],
      'omeprazole': [
        {
          name: 'Licorice Root (DGL)',
          scientificName: 'Glycyrrhiza glabra',
          description: 'Soothes stomach lining and reduces acid',
          dosage: '380-760mg before meals',
          effectiveness: 0.8,
          safety: 0.85,
          uses: ['Acid reflux', 'Heartburn', 'Ulcers'],
          contraindications: ['High blood pressure', 'Heart disease'],
        },
        {
          name: 'Slippery Elm',
          scientificName: 'Ulmus rubra',
          description: 'Coats and protects digestive tract',
          dosage: '400-500mg 3x daily',
          effectiveness: 0.75,
          safety: 0.95,
          uses: ['GERD', 'IBS', 'Stomach upset'],
          contraindications: ['None known'],
        },
        {
          name: 'Aloe Vera',
          scientificName: 'Aloe barbadensis',
          description: 'Soothes digestive inflammation',
          dosage: '50-200mg aloe latex daily',
          effectiveness: 0.7,
          safety: 0.8,
          uses: ['Acid reflux', 'Digestive health'],
          contraindications: ['Pregnancy', 'Kidney disease'],
        },
      ],
      'metformin': [
        {
          name: 'Berberine',
          scientificName: 'Berberis vulgaris',
          description: 'Natural blood sugar regulator',
          dosage: '500mg 3x daily',
          effectiveness: 0.85,
          safety: 0.8,
          uses: ['Type 2 diabetes', 'Metabolic syndrome'],
          contraindications: ['Pregnancy', 'Low blood pressure'],
        },
        {
          name: 'Cinnamon',
          scientificName: 'Cinnamomum verum',
          description: 'Improves insulin sensitivity',
          dosage: '1-6g daily',
          effectiveness: 0.7,
          safety: 0.9,
          uses: ['Blood sugar control', 'Insulin resistance'],
          contraindications: ['Liver disease', 'Blood thinners'],
        },
        {
          name: 'Gymnema Sylvestre',
          scientificName: 'Gymnema sylvestre',
          description: 'Reduces sugar absorption',
          dosage: '200-400mg daily',
          effectiveness: 0.75,
          safety: 0.85,
          uses: ['Diabetes', 'Sugar cravings'],
          contraindications: ['Hypoglycemia medications'],
        },
      ],
      'atorvastatin': [
        {
          name: 'Red Yeast Rice',
          scientificName: 'Monascus purpureus',
          description: 'Natural statin compound',
          dosage: '1200-2400mg daily',
          effectiveness: 0.8,
          safety: 0.75,
          uses: ['High cholesterol', 'Heart health'],
          contraindications: ['Statin drugs', 'Liver disease'],
        },
        {
          name: 'Plant Sterols',
          scientificName: 'Phytosterols',
          description: 'Blocks cholesterol absorption',
          dosage: '2-3g daily',
          effectiveness: 0.7,
          safety: 0.95,
          uses: ['Cholesterol reduction'],
          contraindications: ['None known'],
        },
        {
          name: 'Niacin (Vitamin B3)',
          scientificName: 'Nicotinic acid',
          description: 'Improves cholesterol profile',
          dosage: '500-2000mg daily',
          effectiveness: 0.75,
          safety: 0.8,
          uses: ['High cholesterol', 'Triglycerides'],
          contraindications: ['Liver disease', 'Gout'],
        },
      ],
      'lisinopril': [
        {
          name: 'Hibiscus',
          scientificName: 'Hibiscus sabdariffa',
          description: 'Natural ACE inhibitor',
          dosage: '1-2 cups tea daily',
          effectiveness: 0.7,
          safety: 0.9,
          uses: ['High blood pressure'],
          contraindications: ['Low blood pressure', 'Pregnancy'],
        },
        {
          name: 'Hawthorn',
          scientificName: 'Crataegus monogyna',
          description: 'Cardiovascular tonic',
          dosage: '160-900mg daily',
          effectiveness: 0.75,
          safety: 0.85,
          uses: ['Blood pressure', 'Heart health'],
          contraindications: ['Heart medications', 'Low blood pressure'],
        },
        {
          name: 'Garlic',
          scientificName: 'Allium sativum',
          description: 'Natural blood pressure reducer',
          dosage: '600-1200mg aged garlic extract',
          effectiveness: 0.65,
          safety: 0.9,
          uses: ['Blood pressure', 'Cholesterol'],
          contraindications: ['Blood thinners', 'Surgery'],
        },
      ],
      'sertraline': [
        {
          name: 'St. Johns Wort',
          scientificName: 'Hypericum perforatum',
          description: 'Natural antidepressant',
          dosage: '300mg 3x daily',
          effectiveness: 0.75,
          safety: 0.7,
          uses: ['Mild to moderate depression', 'Anxiety'],
          contraindications: ['Many drug interactions', 'Birth control pills'],
        },
        {
          name: 'SAM-e',
          scientificName: 'S-Adenosylmethionine',
          description: 'Mood and joint support',
          dosage: '400-1600mg daily',
          effectiveness: 0.8,
          safety: 0.85,
          uses: ['Depression', 'Osteoarthritis'],
          contraindications: ['Bipolar disorder', 'Anxiety'],
        },
        {
          name: 'Rhodiola',
          scientificName: 'Rhodiola rosea',
          description: 'Adaptogenic mood enhancer',
          dosage: '200-600mg daily',
          effectiveness: 0.7,
          safety: 0.9,
          uses: ['Depression', 'Fatigue', 'Stress'],
          contraindications: ['Bipolar disorder', 'Stimulant medications'],
        },
      ],
      'alprazolam': [
        {
          name: 'Passionflower',
          scientificName: 'Passiflora incarnata',
          description: 'Natural anxiolytic',
          dosage: '250-500mg daily',
          effectiveness: 0.7,
          safety: 0.85,
          uses: ['Anxiety', 'Insomnia'],
          contraindications: ['Sedatives', 'MAOIs'],
        },
        {
          name: 'Valerian Root',
          scientificName: 'Valeriana officinalis',
          description: 'Calming and sedative herb',
          dosage: '400-900mg before bed',
          effectiveness: 0.75,
          safety: 0.8,
          uses: ['Anxiety', 'Sleep disorders'],
          contraindications: ['Sedatives', 'Alcohol'],
        },
        {
          name: 'L-Theanine',
          scientificName: 'Camellia sinensis derivative',
          description: 'Promotes calm alertness',
          dosage: '100-400mg daily',
          effectiveness: 0.65,
          safety: 0.95,
          uses: ['Anxiety', 'Focus', 'Sleep'],
          contraindications: ['None known'],
        },
        {
          name: 'Ashwagandha',
          scientificName: 'Withania somnifera',
          description: 'Adaptogenic anxiety reducer',
          dosage: '300-600mg daily',
          effectiveness: 0.8,
          safety: 0.9,
          uses: ['Anxiety', 'Stress', 'Cortisol regulation'],
          contraindications: ['Thyroid medications', 'Autoimmune conditions'],
        },
      ],
    };

    // Find alternatives for the medication
    const normalizedName = medicationName.toLowerCase().trim();

    // Check direct match
    if (database[normalizedName]) {
      return database[normalizedName];
    }

    // Check partial matches
    for (const [med, alternatives] of Object.entries(database)) {
      if (normalizedName.includes(med) || med.includes(normalizedName)) {
        return alternatives;
      }
    }

    // Return empty array if no matches
    return [];
  }

  // Get AI-powered alternatives
  async getAIAlternatives(medicationName, userProfile) {
    try {
      const response = await fetch(`${this.apiUrl}/api/ai/alternatives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication: medicationName,
          userProfile: userProfile ? {
            age: userProfile.age,
            conditions: userProfile.conditions,
            allergies: userProfile.allergies,
            currentMedications: userProfile.currentMedications,
          } : null,
        }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      return data.alternatives || [];
    } catch (error) {
      console.error('AI alternatives error:', error);
      // Return empty array if AI fails
      return [];
    }
  }

  // Merge alternatives from different sources
  mergeAlternatives(dbAlternatives, aiAlternatives) {
    const merged = [...dbAlternatives];

    if (aiAlternatives && aiAlternatives.length > 0) {
      // Add AI alternatives that aren't in the database
      aiAlternatives.forEach(aiAlt => {
        const exists = merged.find(alt =>
          alt.name.toLowerCase() === aiAlt.name.toLowerCase()
        );

        if (!exists) {
          merged.push({
            ...aiAlt,
            source: 'AI',
            confidence: aiAlt.confidence || 0.7,
          });
        }
      });
    }

    return merged;
  }

  // Add safety information
  async addSafetyInformation(alternatives, originalMedication) {
    // Add interaction warnings and safety scores
    alternatives.forEach(alt => {
      // Default safety information
      if (!alt.safetyInfo) {
        alt.safetyInfo = {
          pregnancyCategory: alt.contraindications?.includes('Pregnancy') ? 'X' : 'C',
          childrenSafe: !alt.contraindications?.includes('Children'),
          elderlyConsiderations: alt.name === 'St. Johns Wort' ? 'Use with caution' : 'Generally safe',
          interactionRisk: this.calculateInteractionRisk(alt),
        };
      }

      // Add transition advice
      alt.transitionAdvice = this.getTransitionAdvice(originalMedication, alt.name);
    });
  }

  // Add research citations
  async addResearchCitations(alternatives) {
    // Add PubMed and research links
    const researchDatabase = {
      'White Willow Bark': [
        { title: 'Efficacy of willow bark extract', journal: 'Rheumatology', year: 2001, pmid: '11157533' },
      ],
      'Turmeric': [
        { title: 'Curcumin: A Review of Its Effects', journal: 'Foods', year: 2017, pmid: '29065496' },
      ],
      'Berberine': [
        { title: 'Berberine in the treatment of type 2 diabetes', journal: 'Metabolism', year: 2008, pmid: '18191047' },
      ],
      'St. Johns Wort': [
        { title: 'St Johns wort for depression', journal: 'Cochrane Review', year: 2008, pmid: '18843608' },
      ],
    };

    alternatives.forEach(alt => {
      alt.research = researchDatabase[alt.name] || [];
      alt.evidenceLevel = alt.research.length > 0 ? 'Moderate' : 'Limited';
    });
  }

  // Rank alternatives
  rankAlternatives(alternatives, userProfile) {
    return alternatives.sort((a, b) => {
      // Calculate composite score
      const scoreA = this.calculateScore(a, userProfile);
      const scoreB = this.calculateScore(b, userProfile);

      return scoreB - scoreA;
    });
  }

  // Calculate alternative score
  calculateScore(alternative, userProfile) {
    let score = 0;

    // Base scores
    score += (alternative.effectiveness || 0) * 30;
    score += (alternative.safety || 0) * 30;

    // Evidence bonus
    if (alternative.research && alternative.research.length > 0) {
      score += 10;
    }

    // User profile compatibility
    if (userProfile) {
      // Check contraindications
      const hasContraindication = alternative.contraindications?.some(contra =>
        userProfile.conditions?.includes(contra) ||
        userProfile.currentMedications?.includes(contra)
      );

      if (hasContraindication) {
        score -= 50;
      }

      // Preference bonus
      if (userProfile.preferences?.includes('organic') && alternative.organic) {
        score += 5;
      }
    }

    return score;
  }

  // Calculate interaction risk
  calculateInteractionRisk(alternative) {
    const highRiskIngredients = ['St. Johns Wort', 'Grapefruit', 'Goldenseal'];

    if (highRiskIngredients.includes(alternative.name)) {
      return 'High';
    }

    if (alternative.contraindications?.length > 3) {
      return 'Moderate';
    }

    return 'Low';
  }

  // Get transition advice
  getTransitionAdvice(fromMedication, toAlternative) {
    const advice = {
      'aspirin_to_White Willow Bark': 'Start with low dose and gradually increase. Monitor for stomach upset.',
      'sertraline_to_St. Johns Wort': 'DO NOT combine. Taper off sertraline under medical supervision before starting.',
      'metformin_to_Berberine': 'Can be used together initially. Monitor blood sugar closely.',
      'default': 'Consult healthcare provider before transitioning. Start with low doses.',
    };

    const key = `${fromMedication.toLowerCase()}_to_${toAlternative.replace(' ', '_')}`;
    return advice[key] || advice.default;
  }

  // Generate warnings
  generateWarnings(medication, alternatives) {
    const warnings = [];

    // Always add medical disclaimer
    warnings.push({
      type: 'disclaimer',
      severity: 'info',
      message: 'Always consult healthcare professionals before changing medications.',
    });

    // Check for high-risk medications
    const highRiskMeds = ['warfarin', 'insulin', 'digoxin', 'lithium'];
    if (highRiskMeds.some(med => medication.toLowerCase().includes(med))) {
      warnings.push({
        type: 'critical',
        severity: 'error',
        message: 'This medication requires careful medical supervision. Do not stop or change without doctor approval.',
      });
    }

    // Check for pregnancy/nursing
    if (alternatives.some(alt => alt.contraindications?.includes('Pregnancy'))) {
      warnings.push({
        type: 'pregnancy',
        severity: 'warning',
        message: 'Some alternatives may not be safe during pregnancy or nursing.',
      });
    }

    return warnings;
  }

  // Get medical disclaimer
  getMedicalDisclaimer() {
    return {
      title: 'Medical Disclaimer',
      text: 'The information provided by Naturinex is for educational purposes only and is not intended as medical advice. Always consult with qualified healthcare professionals before making changes to your medication or starting new supplements. Natural alternatives may interact with other medications and may not be appropriate for all individuals.',
      lastUpdated: new Date(),
    };
  }

  // Save search to history
  async saveToHistory(userId, searchData) {
    if (!userId) return;

    try {
      if (supabase) {
        await supabase.from('search_history').insert({
          user_id: userId,
          medication: searchData.medication,
          alternatives_count: searchData.alternatives.length,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }
}

// Create singleton instance
const naturalAlternativesService = new NaturalAlternativesService();

export default naturalAlternativesService;