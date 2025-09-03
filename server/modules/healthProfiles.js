/**
 * Health Profiles and Medication History Module
 * Manages user health data and medication tracking
 */

const admin = require('firebase-admin');
const PDFDocument = require('pdfkit');
const { SUBSCRIPTION_TIERS } = require('./tierSystem');

class HealthProfileManager {
  /**
   * Create or update health profile
   */
  static async createHealthProfile(userId, profileData) {
    try {
      if (!admin.apps.length) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const profile = {
        userId,
        name: profileData.name || 'Primary Profile',
        age: profileData.age,
        gender: profileData.gender,
        weight: profileData.weight,
        height: profileData.height,
        bloodType: profileData.bloodType,
        conditions: profileData.conditions || [],
        allergies: profileData.allergies || [],
        currentMedications: profileData.currentMedications || [],
        familyHistory: profileData.familyHistory || [],
        lifestyle: {
          smoking: profileData.smoking || false,
          alcohol: profileData.alcohol || 'none',
          exercise: profileData.exercise || 'moderate',
          diet: profileData.diet || 'balanced'
        },
        preferences: {
          avoidGMO: profileData.avoidGMO || false,
          preferOrganic: profileData.preferOrganic || false,
          veganOnly: profileData.veganOnly || false,
          kosher: profileData.kosher || false,
          halal: profileData.halal || false
        },
        emergencyContact: profileData.emergencyContact || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check tier limits for multiple profiles
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.exists ? userDoc.data() : {};
      const tier = userData.subscriptionTier || 'FREE';
      const tierLimits = SUBSCRIPTION_TIERS[tier];
      
      const existingProfiles = userData.healthProfiles || [];
      if (existingProfiles.length >= tierLimits.healthProfiles) {
        return {
          success: false,
          error: 'Profile limit reached',
          limit: tierLimits.healthProfiles,
          current: existingProfiles.length,
          upgradeRequired: true
        };
      }

      // Save profile
      const profileRef = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('healthProfiles')
        .add(profile);

      // Update user document with profile reference
      await admin.firestore()
        .collection('users')
        .doc(userId)
        .update({
          healthProfiles: admin.firestore.FieldValue.arrayUnion({
            id: profileRef.id,
            name: profile.name,
            isPrimary: existingProfiles.length === 0
          }),
          hasHealthProfile: true
        });

      return {
        success: true,
        profileId: profileRef.id,
        profile
      };
    } catch (error) {
      console.error('Error creating health profile:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get user's health profiles
   */
  static async getHealthProfiles(userId) {
    try {
      if (!admin.apps.length) {
        return { success: false, profiles: [] };
      }

      const profilesSnapshot = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('healthProfiles')
        .orderBy('createdAt', 'desc')
        .get();

      const profiles = [];
      profilesSnapshot.forEach(doc => {
        profiles.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        profiles,
        count: profiles.length
      };
    } catch (error) {
      console.error('Error getting health profiles:', error);
      return {
        success: false,
        profiles: [],
        error: error.message
      };
    }
  }

  /**
   * Add medication to user's history
   */
  static async addMedicationToHistory(userId, medicationData) {
    try {
      if (!admin.apps.length) {
        return { success: false };
      }

      const historyEntry = {
        userId,
        medicationName: medicationData.medicationName,
        dosage: medicationData.dosage,
        frequency: medicationData.frequency,
        startDate: medicationData.startDate || new Date(),
        endDate: medicationData.endDate,
        prescribedBy: medicationData.prescribedBy,
        prescribedFor: medicationData.prescribedFor,
        sideEffects: medicationData.sideEffects || [],
        effectiveness: medicationData.effectiveness,
        notes: medicationData.notes,
        scanData: medicationData.scanData, // OCR/manual entry data
        analysis: medicationData.analysis, // AI analysis
        naturalAlternatives: medicationData.naturalAlternatives,
        timestamp: new Date(),
        active: medicationData.active !== false
      };

      // Check tier limits for history retention
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.exists ? userDoc.data() : {};
      const tier = userData.subscriptionTier || 'FREE';
      const retentionDays = SUBSCRIPTION_TIERS[tier].medicationHistory;

      // Add to medication history
      const historyRef = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('medicationHistory')
        .add(historyEntry);

      // Update current medications if active
      if (historyEntry.active) {
        await admin.firestore()
          .collection('users')
          .doc(userId)
          .update({
            currentMedications: admin.firestore.FieldValue.arrayUnion(medicationData.medicationName)
          });
      }

      // Clean up old entries based on tier
      await this.cleanupOldHistory(userId, retentionDays);

      return {
        success: true,
        historyId: historyRef.id,
        entry: historyEntry
      };
    } catch (error) {
      console.error('Error adding medication to history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get medication history with filtering
   */
  static async getMedicationHistory(userId, options = {}) {
    try {
      if (!admin.apps.length) {
        return { success: false, history: [] };
      }

      const { 
        limit = 50, 
        startDate, 
        endDate, 
        medicationName,
        active 
      } = options;

      let query = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('medicationHistory')
        .orderBy('timestamp', 'desc');

      if (startDate) {
        query = query.where('timestamp', '>=', startDate);
      }
      if (endDate) {
        query = query.where('timestamp', '<=', endDate);
      }
      if (medicationName) {
        query = query.where('medicationName', '==', medicationName);
      }
      if (active !== undefined) {
        query = query.where('active', '==', active);
      }

      query = query.limit(limit);

      const historySnapshot = await query.get();
      const history = [];

      historySnapshot.forEach(doc => {
        history.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Generate insights
      const insights = this.generateMedicationInsights(history);

      return {
        success: true,
        history,
        count: history.length,
        insights
      };
    } catch (error) {
      console.error('Error getting medication history:', error);
      return {
        success: false,
        history: [],
        error: error.message
      };
    }
  }

  /**
   * Generate medication insights and trends
   */
  static generateMedicationInsights(history) {
    if (!history || history.length === 0) {
      return null;
    }

    const insights = {
      totalMedications: new Set(history.map(h => h.medicationName)).size,
      mostFrequent: this.getMostFrequent(history),
      averageDuration: this.calculateAverageDuration(history),
      commonConditions: this.extractCommonConditions(history),
      sideEffectTrends: this.analyzeSideEffects(history),
      naturalAlternativesUsed: history.filter(h => h.naturalAlternatives).length
    };

    return insights;
  }

  /**
   * Generate PDF report of medication history
   */
  static async generatePDFReport(userId, options = {}) {
    try {
      // Get user data
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Check if user has PDF export access
      const tier = userData.subscriptionTier || 'FREE';
      if (!SUBSCRIPTION_TIERS[tier].pdfExport) {
        return {
          success: false,
          error: 'PDF export requires Pro subscription or higher',
          upgradeRequired: true
        };
      }

      // Get medication history
      const historyResult = await this.getMedicationHistory(userId, options);
      const history = historyResult.history;

      // Get health profiles
      const profilesResult = await this.getHealthProfiles(userId);
      const profiles = profilesResult.profiles;

      // Create PDF document
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));

      // Add content to PDF
      doc.fontSize(20).text('Medication History Report', { align: 'center' });
      doc.moveDown();

      // User information
      doc.fontSize(14).text('Patient Information', { underline: true });
      doc.fontSize(12);
      if (profiles.length > 0) {
        const primaryProfile = profiles[0];
        doc.text(`Name: ${primaryProfile.name}`);
        doc.text(`Age: ${primaryProfile.age}`);
        doc.text(`Conditions: ${primaryProfile.conditions.join(', ') || 'None'}`);
        doc.text(`Allergies: ${primaryProfile.allergies.join(', ') || 'None'}`);
      }
      doc.moveDown();

      // Medication history
      doc.fontSize(14).text('Medication History', { underline: true });
      doc.fontSize(10);
      
      history.forEach(entry => {
        doc.moveDown();
        doc.fontSize(12).text(`${entry.medicationName}`, { bold: true });
        doc.fontSize(10);
        doc.text(`Dosage: ${entry.dosage || 'Not specified'}`);
        doc.text(`Prescribed for: ${entry.prescribedFor || 'Not specified'}`);
        doc.text(`Date: ${new Date(entry.timestamp).toLocaleDateString()}`);
        if (entry.sideEffects && entry.sideEffects.length > 0) {
          doc.text(`Side Effects: ${entry.sideEffects.join(', ')}`);
        }
      });

      // Insights
      if (historyResult.insights) {
        doc.addPage();
        doc.fontSize(14).text('Medication Insights', { underline: true });
        doc.fontSize(10);
        doc.text(`Total unique medications: ${historyResult.insights.totalMedications}`);
        doc.text(`Most frequently used: ${historyResult.insights.mostFrequent || 'N/A'}`);
        doc.text(`Natural alternatives explored: ${historyResult.insights.naturalAlternativesUsed}`);
      }

      // Disclaimer
      doc.moveDown();
      doc.fontSize(8).text(
        'This report is for informational purposes only. Always consult with your healthcare provider.',
        { align: 'center' }
      );

      doc.end();

      return new Promise((resolve) => {
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve({
            success: true,
            pdf: pdfBuffer,
            filename: `medication-report-${userId}-${Date.now()}.pdf`
          });
        });
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old history based on tier limits
   */
  static async cleanupOldHistory(userId, retentionDays) {
    try {
      if (!admin.apps.length) return;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldEntries = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('medicationHistory')
        .where('timestamp', '<', cutoffDate)
        .get();

      const batch = admin.firestore().batch();
      oldEntries.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldEntries.size} old history entries for user ${userId}`);
    } catch (error) {
      console.error('Error cleaning up history:', error);
    }
  }

  // Helper methods
  static getMostFrequent(history) {
    const counts = {};
    history.forEach(h => {
      counts[h.medicationName] = (counts[h.medicationName] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? sorted[0][0] : null;
  }

  static calculateAverageDuration(history) {
    const durations = history
      .filter(h => h.startDate && h.endDate)
      .map(h => {
        const start = new Date(h.startDate);
        const end = new Date(h.endDate);
        return (end - start) / (1000 * 60 * 60 * 24); // days
      });
    
    if (durations.length === 0) return 0;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  static extractCommonConditions(history) {
    const conditions = {};
    history.forEach(h => {
      if (h.prescribedFor) {
        conditions[h.prescribedFor] = (conditions[h.prescribedFor] || 0) + 1;
      }
    });
    return Object.entries(conditions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([condition]) => condition);
  }

  static analyzeSideEffects(history) {
    const sideEffects = {};
    history.forEach(h => {
      if (h.sideEffects) {
        h.sideEffects.forEach(effect => {
          sideEffects[effect] = (sideEffects[effect] || 0) + 1;
        });
      }
    });
    return Object.entries(sideEffects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }
}

module.exports = HealthProfileManager;