/**
 * Drug Interaction Checker Module
 * Premium feature for checking medication interactions
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const admin = require('firebase-admin');

class DrugInteractionChecker {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
  }

  /**
   * Check interactions between multiple medications
   */
  async checkInteractions(medications, userProfile = null) {
    try {
      if (!medications || medications.length < 2) {
        return {
          success: false,
          error: 'At least 2 medications required for interaction check'
        };
      }

      // Build comprehensive prompt
      let prompt = `As a pharmaceutical expert, analyze potential drug interactions between the following medications:

Medications: ${medications.join(', ')}

${userProfile ? `
Patient Profile:
- Age: ${userProfile.age || 'Unknown'}
- Conditions: ${userProfile.conditions?.join(', ') || 'None specified'}
- Allergies: ${userProfile.allergies?.join(', ') || 'None specified'}
` : ''}

Provide a detailed analysis including:
1. SEVERITY LEVELS (Critical/Major/Moderate/Minor/None)
2. Specific interactions between each medication pair
3. Clinical significance and symptoms to watch for
4. Recommended actions or alternatives
5. Special precautions for elderly or specific conditions

Format the response clearly with sections for each interaction level.
Include warnings about alcohol, food, and supplement interactions.
Emphasize the importance of consulting healthcare providers.`;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      // Parse severity levels from response
      const severityLevels = this.parseSeverityLevels(analysis);
      
      return {
        success: true,
        medications,
        analysis,
        severityLevels,
        timestamp: new Date().toISOString(),
        disclaimer: 'This information is for educational purposes only. Always consult your healthcare provider before making medication changes.'
      };
    } catch (error) {
      console.error('Drug interaction check error:', error);
      return {
        success: false,
        error: 'Failed to check drug interactions',
        message: error.message
      };
    }
  }

  /**
   * Check interactions with user's current medications
   */
  async checkWithCurrentMedications(userId, newMedication) {
    try {
      // Get user's current medications from profile
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        return {
          success: false,
          error: 'User profile not found'
        };
      }

      const userData = userDoc.data();
      const currentMedications = userData.currentMedications || [];
      
      if (currentMedications.length === 0) {
        return {
          success: true,
          message: 'No current medications on file',
          analysis: 'No interactions to check'
        };
      }

      // Check interactions with all current medications
      const allMedications = [...currentMedications, newMedication];
      const result = await this.checkInteractions(allMedications, userData.healthProfile);

      // Save interaction check to history
      await this.saveInteractionHistory(userId, {
        newMedication,
        currentMedications,
        result
      });

      return result;
    } catch (error) {
      console.error('Error checking with current medications:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse severity levels from AI response
   */
  parseSeverityLevels(analysis) {
    const levels = {
      critical: [],
      major: [],
      moderate: [],
      minor: [],
      none: []
    };

    // Simple parsing - can be enhanced with better NLP
    const lines = analysis.split('\n');
    let currentLevel = 'none';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('critical') || lowerLine.includes('severe')) {
        currentLevel = 'critical';
      } else if (lowerLine.includes('major')) {
        currentLevel = 'major';
      } else if (lowerLine.includes('moderate')) {
        currentLevel = 'moderate';
      } else if (lowerLine.includes('minor')) {
        currentLevel = 'minor';
      }

      // Extract medication pairs (simplified)
      if (lowerLine.includes('interaction') && line.includes('-')) {
        levels[currentLevel].push(line.trim());
      }
    }

    // Calculate overall risk score
    const riskScore = 
      levels.critical.length * 10 +
      levels.major.length * 5 +
      levels.moderate.length * 2 +
      levels.minor.length * 1;

    return {
      levels,
      riskScore,
      highestSeverity: levels.critical.length > 0 ? 'critical' :
                       levels.major.length > 0 ? 'major' :
                       levels.moderate.length > 0 ? 'moderate' :
                       levels.minor.length > 0 ? 'minor' : 'none'
    };
  }

  /**
   * Save interaction check to user's history
   */
  async saveInteractionHistory(userId, data) {
    try {
      if (!admin.apps.length) return;

      await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('interactionHistory')
        .add({
          ...data,
          timestamp: new Date(),
          viewed: false
        });
    } catch (error) {
      console.error('Error saving interaction history:', error);
    }
  }

  /**
   * Get common drug interaction warnings
   */
  static getCommonWarnings(medications) {
    const warnings = [];
    const medsLower = medications.map(m => m.toLowerCase());

    // Check for common dangerous combinations
    if (medsLower.some(m => m.includes('warfarin'))) {
      warnings.push({
        type: 'critical',
        message: 'Warfarin detected - Many medications and foods interact with warfarin'
      });
    }

    if (medsLower.some(m => m.includes('aspirin')) && 
        medsLower.some(m => m.includes('ibuprofen'))) {
      warnings.push({
        type: 'major',
        message: 'Multiple NSAIDs detected - Increased risk of bleeding'
      });
    }

    if (medsLower.some(m => m.includes('statin'))) {
      warnings.push({
        type: 'moderate',
        message: 'Statin detected - Avoid grapefruit juice'
      });
    }

    return warnings;
  }

  /**
   * Generate interaction report (PDF-ready)
   */
  async generateInteractionReport(userId, medications) {
    try {
      const interactions = await this.checkInteractions(medications);
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.exists ? userDoc.data() : {};

      return {
        reportType: 'Drug Interaction Analysis',
        generatedAt: new Date().toISOString(),
        patient: {
          userId,
          profile: userData.healthProfile || {},
          tier: userData.subscriptionTier || 'FREE'
        },
        medications,
        interactions: interactions.analysis,
        severityLevels: interactions.severityLevels,
        recommendations: this.generateRecommendations(interactions.severityLevels),
        disclaimer: 'This report is for informational purposes only. Consult your healthcare provider.'
      };
    } catch (error) {
      console.error('Error generating interaction report:', error);
      throw error;
    }
  }

  /**
   * Generate recommendations based on severity
   */
  generateRecommendations(severityLevels) {
    const recommendations = [];

    if (severityLevels.highestSeverity === 'critical') {
      recommendations.push('⚠️ URGENT: Contact your healthcare provider immediately');
      recommendations.push('Do not start or stop medications without medical supervision');
    } else if (severityLevels.highestSeverity === 'major') {
      recommendations.push('Schedule an appointment with your healthcare provider');
      recommendations.push('Monitor for adverse effects closely');
    } else if (severityLevels.highestSeverity === 'moderate') {
      recommendations.push('Discuss with your pharmacist or doctor at next visit');
      recommendations.push('Be aware of potential side effects');
    } else {
      recommendations.push('Current medications appear to have minimal interactions');
      recommendations.push('Continue to monitor your health and report any concerns');
    }

    recommendations.push('Keep an updated list of all medications and supplements');
    recommendations.push('Inform all healthcare providers about all medications you take');

    return recommendations;
  }
}

module.exports = DrugInteractionChecker;