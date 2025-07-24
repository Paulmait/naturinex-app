/**
 * Comprehensive Medication Service
 * Provides medication interaction checking, dosage recommendations, and safety information
 */

import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

class MedicationService {
  constructor() {
    // Common medication interactions database (simplified version)
    this.interactionDatabase = {
      'aspirin': {
        interactions: ['warfarin', 'ibuprofen', 'naproxen', 'blood thinners'],
        contraindications: ['bleeding disorders', 'ulcers', 'asthma'],
        naturalAlternatives: ['turmeric', 'ginger', 'willow bark']
      },
      'ibuprofen': {
        interactions: ['aspirin', 'warfarin', 'lithium', 'methotrexate'],
        contraindications: ['kidney disease', 'heart disease', 'pregnancy'],
        naturalAlternatives: ['turmeric', 'boswellia', 'devil\'s claw']
      },
      'acetaminophen': {
        interactions: ['warfarin', 'alcohol', 'isoniazid'],
        contraindications: ['liver disease', 'chronic alcohol use'],
        naturalAlternatives: ['white willow bark', 'capsaicin', 'clove oil']
      },
      'metformin': {
        interactions: ['contrast dye', 'alcohol', 'carbonic anhydrase inhibitors'],
        contraindications: ['kidney disease', 'liver disease', 'heart failure'],
        naturalAlternatives: ['berberine', 'cinnamon', 'bitter melon', 'gymnema']
      },
      'lisinopril': {
        interactions: ['potassium supplements', 'nsaids', 'lithium'],
        contraindications: ['pregnancy', 'angioedema', 'kidney disease'],
        naturalAlternatives: ['hawthorn', 'garlic', 'coq10', 'hibiscus']
      },
      'atorvastatin': {
        interactions: ['grapefruit', 'erythromycin', 'gemfibrozil'],
        contraindications: ['liver disease', 'pregnancy', 'breastfeeding'],
        naturalAlternatives: ['red yeast rice', 'plant sterols', 'psyllium', 'niacin']
      },
      'levothyroxine': {
        interactions: ['calcium', 'iron', 'antacids', 'coffee'],
        contraindications: ['thyrotoxicosis', 'adrenal insufficiency'],
        naturalAlternatives: ['iodine', 'selenium', 'ashwagandha', 'tyrosine']
      },
      'omeprazole': {
        interactions: ['clopidogrel', 'iron', 'vitamin b12'],
        contraindications: ['liver disease', 'osteoporosis risk'],
        naturalAlternatives: ['dgl licorice', 'slippery elm', 'aloe vera', 'probiotics']
      }
    };

    // Dosage recommendations based on condition
    this.dosageGuidelines = {
      'turmeric': {
        general: '500-2000mg curcumin daily',
        inflammation: '1000-2000mg daily with black pepper',
        arthritis: '1500-2000mg daily in divided doses',
        precautions: 'May interact with blood thinners'
      },
      'berberine': {
        general: '500-1500mg daily',
        diabetes: '1000-1500mg daily in divided doses',
        cholesterol: '1000mg daily',
        precautions: 'Take with meals, may lower blood sugar'
      },
      'ashwagandha': {
        general: '300-600mg daily',
        stress: '600-1000mg daily',
        thyroid: '600mg daily',
        precautions: 'May increase thyroid hormones'
      },
      'coq10': {
        general: '100-200mg daily',
        heart: '200-300mg daily',
        statins: '200mg daily',
        precautions: 'Take with fat for absorption'
      }
    };
  }

  // Check for medication interactions
  async checkInteractions(medications) {
    const interactions = [];
    const medicationNames = medications.map(m => m.toLowerCase());

    for (let i = 0; i < medicationNames.length; i++) {
      const med1 = medicationNames[i];
      const med1Data = this.interactionDatabase[med1];

      if (med1Data) {
        // Check interactions with other medications
        for (let j = i + 1; j < medicationNames.length; j++) {
          const med2 = medicationNames[j];
          
          if (med1Data.interactions.includes(med2)) {
            interactions.push({
              severity: 'moderate',
              medications: [med1, med2],
              description: `${med1} may interact with ${med2}. Consult your healthcare provider.`,
              recommendation: 'Monitor for increased side effects'
            });
          }
        }

        // Check natural alternatives interactions
        medicationNames.forEach(med => {
          if (med1Data.naturalAlternatives.includes(med)) {
            interactions.push({
              severity: 'low',
              medications: [med1, med],
              description: `${med} is a natural alternative to ${med1}. Using both may increase effects.`,
              recommendation: 'Consider using one or the other'
            });
          }
        });
      }
    }

    return interactions;
  }

  // Get dosage recommendations
  getDosageRecommendations(naturalRemedy, condition = 'general') {
    const remedy = naturalRemedy.toLowerCase();
    const dosageInfo = this.dosageGuidelines[remedy];

    if (!dosageInfo) {
      return {
        available: false,
        message: 'No specific dosage guidelines available. Consult product label or healthcare provider.'
      };
    }

    return {
      available: true,
      general: dosageInfo.general,
      specific: dosageInfo[condition] || dosageInfo.general,
      precautions: dosageInfo.precautions,
      timing: this.getTimingRecommendations(remedy)
    };
  }

  getTimingRecommendations(remedy) {
    const timingGuide = {
      'turmeric': 'Take with meals containing fat for better absorption',
      'berberine': 'Take with meals to reduce stomach upset',
      'ashwagandha': 'Take in the morning for energy or evening for sleep',
      'coq10': 'Take with breakfast or lunch (may cause insomnia if taken late)',
      'probiotics': 'Take on empty stomach or before bed',
      'omega-3': 'Take with meals to reduce fishy burps'
    };

    return timingGuide[remedy] || 'Follow product instructions';
  }

  // Save medication scan to history
  async saveMedicationScan(userId, scanData) {
    try {
      const scanId = `scan_${Date.now()}`;
      const scanRecord = {
        id: scanId,
        userId,
        timestamp: new Date().toISOString(),
        medicationName: scanData.medicationName,
        naturalAlternatives: scanData.alternatives,
        interactions: scanData.interactions || [],
        dosageInfo: scanData.dosageInfo || null,
        scanMethod: scanData.scanMethod || 'manual',
        processed: true
      };

      await setDoc(doc(db, 'scan_history', scanId), scanRecord);
      
      // Update user's scan count
      await this.updateUserScanCount(userId);

      return { success: true, scanId };
    } catch (error) {
      console.error('Error saving scan:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserScanCount(userId) {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentCount = userDoc.data().totalScans || 0;
      await setDoc(userRef, {
        totalScans: currentCount + 1,
        lastScanDate: new Date().toISOString()
      }, { merge: true });
    }
  }

  // Get user's medication history
  async getMedicationHistory(userId, limit = 10) {
    try {
      const historyQuery = query(
        collection(db, 'scan_history'),
        where('userId', '==', userId),
        limit(limit)
      );

      const snapshot = await getDocs(historyQuery);
      const history = [];

      snapshot.forEach(doc => {
        history.push({ id: doc.id, ...doc.data() });
      });

      // Sort by timestamp (newest first)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return history;
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }

  // Get personalized recommendations based on history
  async getPersonalizedRecommendations(userId) {
    const history = await this.getMedicationHistory(userId, 20);
    
    if (history.length === 0) {
      return {
        hasRecommendations: false,
        message: 'Start scanning medications to get personalized recommendations'
      };
    }

    // Analyze patterns in user's medication history
    const medicationFrequency = {};
    const conditionPatterns = [];

    history.forEach(scan => {
      const med = scan.medicationName.toLowerCase();
      medicationFrequency[med] = (medicationFrequency[med] || 0) + 1;
      
      // Identify condition patterns
      if (this.interactionDatabase[med]) {
        conditionPatterns.push(...this.identifyConditions(med));
      }
    });

    // Get most frequently scanned medications
    const topMedications = Object.entries(medicationFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([med]) => med);

    // Generate recommendations
    const recommendations = {
      hasRecommendations: true,
      topConcerns: topMedications,
      suggestedProtocols: this.getSuggestedProtocols(topMedications, conditionPatterns),
      lifestyleRecommendations: this.getLifestyleRecommendations(conditionPatterns),
      warningCombinations: await this.checkInteractions(topMedications)
    };

    return recommendations;
  }

  identifyConditions(medication) {
    const conditionMap = {
      'aspirin': ['pain', 'inflammation', 'cardiovascular'],
      'ibuprofen': ['pain', 'inflammation', 'arthritis'],
      'metformin': ['diabetes', 'blood sugar'],
      'lisinopril': ['hypertension', 'cardiovascular'],
      'atorvastatin': ['cholesterol', 'cardiovascular'],
      'levothyroxine': ['thyroid', 'metabolism'],
      'omeprazole': ['digestive', 'acid reflux']
    };

    return conditionMap[medication] || [];
  }

  getSuggestedProtocols(medications, conditions) {
    const protocols = [];

    // Check for cardiovascular medications
    if (medications.some(m => ['aspirin', 'lisinopril', 'atorvastatin'].includes(m))) {
      protocols.push({
        name: 'Heart Health Protocol',
        supplements: ['CoQ10', 'Omega-3', 'Magnesium', 'Hawthorn'],
        lifestyle: ['Mediterranean diet', 'Regular exercise', 'Stress management']
      });
    }

    // Check for diabetes medications
    if (medications.includes('metformin')) {
      protocols.push({
        name: 'Blood Sugar Support Protocol',
        supplements: ['Berberine', 'Chromium', 'Alpha-lipoic acid', 'Cinnamon'],
        lifestyle: ['Low glycemic diet', 'Regular meal timing', 'Weight management']
      });
    }

    // Check for pain/inflammation
    if (medications.some(m => ['aspirin', 'ibuprofen'].includes(m))) {
      protocols.push({
        name: 'Natural Anti-Inflammatory Protocol',
        supplements: ['Turmeric with black pepper', 'Boswellia', 'Omega-3', 'Ginger'],
        lifestyle: ['Anti-inflammatory diet', 'Gentle exercise', 'Adequate sleep']
      });
    }

    return protocols;
  }

  getLifestyleRecommendations(conditions) {
    const recommendations = [];

    if (conditions.includes('cardiovascular')) {
      recommendations.push({
        category: 'Diet',
        suggestions: ['Increase omega-3 rich foods', 'Reduce sodium intake', 'Add more fiber']
      });
    }

    if (conditions.includes('inflammation')) {
      recommendations.push({
        category: 'Anti-inflammatory',
        suggestions: ['Avoid processed foods', 'Increase antioxidant-rich foods', 'Consider Mediterranean diet']
      });
    }

    if (conditions.includes('diabetes')) {
      recommendations.push({
        category: 'Blood Sugar Management',
        suggestions: ['Monitor carbohydrate intake', 'Eat protein with each meal', 'Regular exercise']
      });
    }

    return recommendations;
  }

  // Calculate safety score for natural alternatives
  calculateSafetyScore(naturalRemedy, userMedications = []) {
    let safetyScore = 100;
    const remedy = naturalRemedy.toLowerCase();

    // Check for interactions
    userMedications.forEach(med => {
      const medData = this.interactionDatabase[med.toLowerCase()];
      if (medData && medData.naturalAlternatives.includes(remedy)) {
        safetyScore -= 10; // Reduce score if using both conventional and natural for same purpose
      }
    });

    // Check for specific safety concerns
    const safetyConcerns = {
      'turmeric': ['blood thinners', 'gallbladder issues'],
      'ginger': ['blood thinners', 'gallstones'],
      'st johns wort': ['antidepressants', 'birth control'],
      'ginkgo': ['blood thinners', 'seizure medications']
    };

    if (safetyConcerns[remedy]) {
      safetyScore -= 5 * safetyConcerns[remedy].length;
    }

    return {
      score: Math.max(0, safetyScore),
      level: safetyScore >= 80 ? 'High' : safetyScore >= 60 ? 'Moderate' : 'Low',
      recommendations: this.getSafetyRecommendations(safetyScore)
    };
  }

  getSafetyRecommendations(score) {
    if (score >= 80) {
      return 'Generally safe for most people. Start with lower doses.';
    } else if (score >= 60) {
      return 'Use with caution. Consult healthcare provider if taking medications.';
    } else {
      return 'Significant interaction potential. Professional consultation strongly recommended.';
    }
  }
}

// Export singleton instance
const medicationService = new MedicationService();
export default medicationService;