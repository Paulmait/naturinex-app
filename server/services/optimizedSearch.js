const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Optimized search service using pre-ingested data
 * This replaces real-time API calls with fast Firestore queries
 */
class OptimizedSearchService {
  constructor() {
    this.substancesCollection = db.collection('substances');
    this.searchIndexCollection = db.collection('searchIndex');
  }

  /**
   * Search for natural alternatives by medication name
   * Uses pre-ingested data for instant results
   */
  async searchByMedication(medicationName) {
    const startTime = Date.now();
    
    try {
      // Map common medications to conditions
      const medicationConditions = {
        'aspirin': ['pain', 'inflammation', 'fever'],
        'ibuprofen': ['pain', 'inflammation', 'arthritis'],
        'acetaminophen': ['pain', 'fever', 'headache'],
        'omeprazole': ['heartburn', 'acid reflux', 'gerd'],
        'cetirizine': ['allergies', 'hay fever', 'hives'],
        'atorvastatin': ['cholesterol', 'cardiovascular'],
        'metformin': ['diabetes', 'blood sugar'],
        'lisinopril': ['blood pressure', 'hypertension'],
        'levothyroxine': ['thyroid', 'hypothyroidism'],
        'amlodipine': ['blood pressure', 'angina']
      };
      
      // Get conditions for this medication
      const conditions = medicationConditions[medicationName.toLowerCase()] || [medicationName.toLowerCase()];
      
      // Search for substances that treat these conditions
      const substances = await this.searchByConditions(conditions);
      
      // Add performance metrics
      const searchTime = Date.now() - startTime;
      
      return {
        medication: medicationName,
        conditions,
        alternatives: substances,
        searchTime,
        dataSource: 'pre-ingested',
        lastUpdated: substances[0]?.lastUpdated || new Date()
      };
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Search by medical conditions
   */
  async searchByConditions(conditions) {
    // Use search index for fast lookup
    const substanceIds = new Set();
    
    // Query search index for each condition
    for (const condition of conditions) {
      const indexQuery = await this.searchIndexCollection
        .where('type', '==', 'condition')
        .where('value', '==', condition.toLowerCase())
        .orderBy('effectiveness', 'desc')
        .limit(10)
        .get();
      
      indexQuery.forEach(doc => {
        substanceIds.add(doc.data().substanceId);
      });
    }
    
    // Fetch full substance data
    const substances = [];
    for (const id of substanceIds) {
      const doc = await this.substancesCollection.doc(id).get();
      if (doc.exists) {
        substances.push({
          id: doc.id,
          ...doc.data()
        });
      }
    }
    
    // Sort by relevance and quality score
    return this.rankResults(substances, conditions);
  }

  /**
   * Advanced search with filters
   */
  async advancedSearch(options) {
    const {
      query,
      type, // 'herb', 'compound', 'vitamin', 'mineral'
      safetyLevel, // 'safe', 'moderate', 'caution'
      effectiveness, // 'high', 'moderate', 'low'
      hasInteractions = null,
      limit = 20
    } = options;
    
    let queryRef = this.substancesCollection;
    
    // Apply filters
    if (type) {
      queryRef = queryRef.where('type', '==', type);
    }
    
    if (safetyLevel) {
      queryRef = queryRef.where('safetyLevel', '==', safetyLevel);
    }
    
    if (effectiveness) {
      queryRef = queryRef.where('effectiveness', 'array-contains', effectiveness);
    }
    
    // Execute query
    const snapshot = await queryRef.limit(limit).get();
    const results = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Text search filter (if query provided)
      if (!query || data.searchText?.includes(query.toLowerCase())) {
        // Interaction filter
        if (hasInteractions === null || 
            (hasInteractions && data.interactions?.length > 0) ||
            (!hasInteractions && !data.interactions?.length)) {
          results.push({
            id: doc.id,
            ...data
          });
        }
      }
    });
    
    return results;
  }

  /**
   * Get substance by ID with full details
   */
  async getSubstanceById(substanceId) {
    const doc = await this.substancesCollection.doc(substanceId).get();
    
    if (!doc.exists) {
      throw new Error('Substance not found');
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  }

  /**
   * Get related substances
   */
  async getRelatedSubstances(substanceId, limit = 5) {
    const substance = await this.getSubstanceById(substanceId);
    
    // Find substances with similar uses
    const conditions = substance.medicalUses?.map(use => use.condition) || [];
    
    if (conditions.length === 0) {
      return [];
    }
    
    const related = await this.searchByConditions(conditions);
    
    // Filter out the original substance and limit results
    return related
      .filter(s => s.id !== substanceId)
      .slice(0, limit);
  }

  /**
   * Rank search results by relevance
   */
  rankResults(substances, conditions) {
    return substances
      .map(substance => {
        let score = substance.metadata?.qualityScore || 0;
        
        // Boost score for matching conditions
        const matchingUses = substance.medicalUses?.filter(use =>
          conditions.some(c => use.condition.toLowerCase().includes(c.toLowerCase()))
        ) || [];
        
        score += matchingUses.length * 10;
        
        // Boost for high effectiveness
        matchingUses.forEach(use => {
          if (use.effectiveness === 'high') score += 5;
          if (use.effectiveness === 'moderate') score += 3;
        });
        
        // Boost for safety
        if (substance.safetyLevel === 'safe') score += 5;
        
        // Penalize for major interactions
        const majorInteractions = substance.interactions?.filter(i => i.severity === 'major').length || 0;
        score -= majorInteractions * 5;
        
        return { ...substance, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Get trending substances (most searched)
   */
  async getTrending(limit = 10) {
    // This would typically use analytics data
    // For now, return high-quality substances
    const snapshot = await this.substancesCollection
      .orderBy('metadata.qualityScore', 'desc')
      .limit(limit)
      .get();
    
    const results = [];
    snapshot.forEach(doc => {
      results.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return results;
  }

  /**
   * Search suggestions (autocomplete)
   */
  async getSuggestions(prefix, limit = 5) {
    const normalizedPrefix = prefix.toLowerCase();
    
    // Search in common names
    const snapshot = await this.substancesCollection
      .where('searchText', '>=', normalizedPrefix)
      .where('searchText', '<=', normalizedPrefix + '\uf8ff')
      .limit(limit)
      .get();
    
    const suggestions = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      suggestions.push({
        id: doc.id,
        name: data.commonName,
        type: data.type,
        scientificName: data.scientificName
      });
    });
    
    return suggestions;
  }

  /**
   * Get statistics about the database
   */
  async getDatabaseStats() {
    const [
      totalSubstances,
      herbCount,
      compoundCount,
      highQualityCount
    ] = await Promise.all([
      this.substancesCollection.get().then(snap => snap.size),
      this.substancesCollection.where('type', '==', 'herb').get().then(snap => snap.size),
      this.substancesCollection.where('type', '==', 'compound').get().then(snap => snap.size),
      this.substancesCollection.where('metadata.qualityScore', '>=', 80).get().then(snap => snap.size)
    ]);
    
    return {
      totalSubstances,
      byType: {
        herb: herbCount,
        compound: compoundCount,
        other: totalSubstances - herbCount - compoundCount
      },
      highQualityCount,
      lastIngestion: await this.getLastIngestionTime(),
      dataCompleteness: Math.round((highQualityCount / totalSubstances) * 100)
    };
  }

  /**
   * Get last ingestion time
   */
  async getLastIngestionTime() {
    const lastLog = await db.collection('ingestionLogs')
      .where('status', '==', 'completed')
      .orderBy('endTime', 'desc')
      .limit(1)
      .get();
    
    if (!lastLog.empty) {
      return lastLog.docs[0].data().endTime;
    }
    
    return null;
  }
}

// Export singleton instance
module.exports = new OptimizedSearchService();