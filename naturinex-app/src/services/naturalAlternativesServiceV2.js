// Natural Alternatives Service V2 - Supabase Integration
// Comprehensive medical database with natural alternatives, versioning, and clinical evidence
// Replaces hardcoded data with Supabase-powered medical database

import { supabase } from '../config/supabase';

class NaturalAlternativesServiceV2 {
  constructor() {
    this.cache = new Map();
    this.apiUrl = process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com';
    this.cacheDuration = 30 * 60 * 1000; // 30 minutes
  }

  // ============================================================================
  // MAIN SEARCH AND RECOMMENDATION ENGINE
  // ============================================================================

  /**
   * Main function to get natural alternatives with enhanced Supabase integration
   */
  async getNaturalAlternatives(medicationName, options = {}) {
    const {
      includeAI = true,
      includeSafety = true,
      includeResearch = true,
      includeUserFeedback = true,
      includeProfessionalReviews = true,
      userProfile = null,
      maxResults = 10
    } = options;

    // Check cache first
    const cacheKey = `alternatives_v2_${medicationName.toLowerCase()}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expires > Date.now()) {
        return cached.data;
      }
    }

    try {
      // Get alternatives from database and AI
      const [dbAlternatives, aiAlternatives] = await Promise.all([
        this.getDatabaseAlternatives(medicationName, { maxResults }),
        includeAI ? this.getAIAlternatives(medicationName, userProfile) : null,
      ]);

      // Enhance alternatives with additional data
      const enhancedAlternatives = await this.enhanceAlternatives(
        dbAlternatives,
        {
          includeSafety,
          includeResearch,
          includeUserFeedback,
          includeProfessionalReviews,
          userProfile
        }
      );

      // Merge with AI alternatives if available
      const mergedAlternatives = this.mergeAlternatives(enhancedAlternatives, aiAlternatives);

      // Rank and sort alternatives
      const rankedAlternatives = this.rankAlternatives(mergedAlternatives, userProfile);

      // Prepare comprehensive result
      const result = {
        medication: medicationName,
        alternatives: rankedAlternatives.slice(0, maxResults),
        metadata: {
          totalFound: rankedAlternatives.length,
          evidenceLevels: this.getEvidenceSummary(rankedAlternatives),
          safetyProfile: this.getSafetyProfile(rankedAlternatives, userProfile),
          dataSource: 'supabase_v2',
          searchTimestamp: new Date(),
          cacheExpiry: new Date(Date.now() + this.cacheDuration)
        },
        warnings: this.generateWarnings(medicationName, rankedAlternatives, userProfile),
        disclaimer: this.getMedicalDisclaimer(),
        timestamp: new Date(),
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        expires: Date.now() + this.cacheDuration,
      });

      return result;
    } catch (error) {
      console.error('Error getting natural alternatives:', error);
      // Fallback to basic search if enhanced search fails
      try {
        return await this.getBasicAlternatives(medicationName);
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        throw new Error('Failed to get natural alternatives');
      }
    }
  }

  // ============================================================================
  // DATABASE SEARCH METHODS
  // ============================================================================

  /**
   * Get alternatives from Supabase database with comprehensive search
   */
  async getDatabaseAlternatives(medicationName, options = {}) {
    const { maxResults = 20 } = options;

    try {
      // First, find the medication in our database
      const medication = await this.findMedication(medicationName);

      if (!medication) {
        // If medication not found, perform fuzzy search
        return await this.performFuzzySearch(medicationName, maxResults);
      }

      // Get medication-alternative mappings
      const { data: mappings, error: mappingsError } = await supabase
        .from('medication_alternatives')
        .select(`
          *,
          alternative:alternative_id (
            *,
            effectiveness_summary:get_effectiveness_summary(id)
          ),
          medication:medication_id (
            name,
            generic_name,
            drug_class
          )
        `)
        .eq('medication_id', medication.id)
        .eq('is_active', true)
        .not('approved_at', 'is', null)
        .order('effectiveness_rating', { ascending: false })
        .limit(maxResults);

      if (mappingsError) throw mappingsError;

      // Format the results
      return mappings.map(mapping => this.formatAlternativeFromMapping(mapping));

    } catch (error) {
      console.error('Database search error:', error);
      // Return empty array if database search fails
      return [];
    }
  }

  /**
   * Find medication by name with fuzzy matching
   */
  async findMedication(medicationName) {
    try {
      const { data: medications, error } = await supabase
        .rpc('search_medications_and_alternatives', {
          search_term: medicationName,
          limit_count: 5
        });

      if (error) throw error;

      // Return the best medication match
      const medicationMatch = medications.find(item => item.type === 'medication');

      if (medicationMatch) {
        // Get full medication details
        const { data: fullMedication, error: medError } = await supabase
          .from('medications')
          .select('*')
          .eq('id', medicationMatch.id)
          .single();

        if (medError) throw medError;
        return fullMedication;
      }

      return null;
    } catch (error) {
      console.error('Medication search error:', error);
      return null;
    }
  }

  /**
   * Perform fuzzy search when exact medication not found
   */
  async performFuzzySearch(searchTerm, limit = 10) {
    try {
      const { data: searchResults, error } = await supabase
        .rpc('search_medications_and_alternatives', {
          search_term: searchTerm,
          limit_count: limit * 2 // Get more to filter alternatives
        });

      if (error) throw error;

      // Filter for alternatives and get their details
      const alternativeIds = searchResults
        .filter(item => item.type === 'alternative')
        .slice(0, limit)
        .map(item => item.id);

      if (alternativeIds.length === 0) return [];

      const { data: alternatives, error: altError } = await supabase
        .from('natural_alternatives')
        .select('*')
        .in('id', alternativeIds)
        .eq('is_active', true);

      if (altError) throw altError;

      return alternatives.map(alt => this.formatBasicAlternative(alt, searchTerm));

    } catch (error) {
      console.error('Fuzzy search error:', error);
      return [];
    }
  }

  // ============================================================================
  // ALTERNATIVE ENHANCEMENT METHODS
  // ============================================================================

  /**
   * Enhance alternatives with additional data
   */
  async enhanceAlternatives(alternatives, options) {
    const {
      includeSafety = true,
      includeResearch = true,
      includeUserFeedback = true,
      includeProfessionalReviews = true,
      userProfile = null
    } = options;

    return await Promise.all(alternatives.map(async alternative => {
      const enhanced = { ...alternative };

      try {
        // Get research citations
        if (includeResearch && alternative.id) {
          enhanced.research = await this.getResearchCitations(alternative.id);
        }

        // Get user feedback summary
        if (includeUserFeedback && alternative.mappingId) {
          enhanced.userFeedback = await this.getUserFeedbackSummary(alternative.mappingId);
        }

        // Get professional reviews
        if (includeProfessionalReviews && alternative.mappingId) {
          enhanced.professionalReviews = await this.getProfessionalReviews(alternative.mappingId);
        }

        // Enhanced safety assessment
        if (includeSafety) {
          enhanced.safetyAssessment = this.assessSafety(alternative, userProfile);
        }

        // Calculate composite score
        enhanced.compositeScore = this.calculateCompositeScore(enhanced);

      } catch (error) {
        console.error(`Error enhancing alternative ${alternative.name}:`, error);
        // Continue with basic alternative data
      }

      return enhanced;
    }));
  }

  /**
   * Get research citations for an alternative
   */
  async getResearchCitations(alternativeId) {
    try {
      const { data: citations, error } = await supabase
        .from('study_evidence')
        .select(`
          *,
          study:study_id (
            *
          )
        `)
        .eq('alternative_id', alternativeId)
        .eq('is_active', true)
        .order('relevance_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      return citations.map(citation => ({
        title: citation.study.title,
        authors: citation.study.authors,
        journal: citation.study.journal,
        year: citation.study.publication_date?.getFullYear(),
        pubmedId: citation.study.pubmed_id,
        studyType: citation.study.study_type,
        participantCount: citation.study.participant_count,
        evidenceLevel: citation.study.evidence_level,
        relevanceScore: citation.relevance_score,
        supportsEfficacy: citation.supports_efficacy,
        supportsSafety: citation.supports_safety,
        resultsSummary: citation.study.results_summary
      }));

    } catch (error) {
      console.error('Research citations error:', error);
      return [];
    }
  }

  /**
   * Get user feedback summary
   */
  async getUserFeedbackSummary(medicationAlternativeId) {
    try {
      const { data: feedback, error } = await supabase
        .from('user_feedback')
        .select(`
          effectiveness_rating,
          safety_rating,
          overall_satisfaction,
          would_recommend,
          condition_improved,
          duration_used,
          side_effects_experienced
        `)
        .eq('medication_alternative_id', medicationAlternativeId)
        .eq('moderation_status', 'approved')
        .eq('is_active', true);

      if (error) throw error;

      if (feedback.length === 0) return null;

      // Calculate summary statistics
      const summary = {
        totalReviews: feedback.length,
        averageEffectiveness: this.calculateAverage(feedback, 'effectiveness_rating'),
        averageSafety: this.calculateAverage(feedback, 'safety_rating'),
        averageSatisfaction: this.calculateAverage(feedback, 'overall_satisfaction'),
        recommendationRate: feedback.filter(f => f.would_recommend).length / feedback.length,
        improvementRate: feedback.filter(f => f.condition_improved).length / feedback.length,
        commonSideEffects: this.getCommonSideEffects(feedback),
        durationDistribution: this.getDurationDistribution(feedback)
      };

      return summary;

    } catch (error) {
      console.error('User feedback error:', error);
      return null;
    }
  }

  /**
   * Get professional reviews
   */
  async getProfessionalReviews(medicationAlternativeId) {
    try {
      const { data: reviews, error } = await supabase
        .from('professional_reviews')
        .select(`
          *,
          reviewer:reviewer_id (
            profession,
            specialty,
            verification_status
          )
        `)
        .eq('medication_alternative_id', medicationAlternativeId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return reviews.map(review => ({
        recommendation: review.recommendation,
        evidenceAssessment: review.evidence_assessment,
        clinicalExperience: review.clinical_experience_rating,
        profession: review.reviewer.profession,
        specialty: review.reviewer.specialty,
        clinicalRationale: review.clinical_rationale,
        patientsTotal: review.patients_treated,
        successRate: review.success_rate_observed,
        reviewDate: review.created_at
      }));

    } catch (error) {
      console.error('Professional reviews error:', error);
      return [];
    }
  }

  // ============================================================================
  // AI INTEGRATION METHODS
  // ============================================================================

  /**
   * Get AI-powered alternatives (enhanced version)
   */
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
            preferences: userProfile.preferences
          } : null,
          includeEvidence: true,
          includeSafety: true
        }),
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      return data.alternatives || [];
    } catch (error) {
      console.error('AI alternatives error:', error);
      return [];
    }
  }

  // ============================================================================
  // RANKING AND SCORING METHODS
  // ============================================================================

  /**
   * Advanced ranking algorithm
   */
  rankAlternatives(alternatives, userProfile) {
    return alternatives.sort((a, b) => {
      const scoreA = this.calculateCompositeScore(a, userProfile);
      const scoreB = this.calculateCompositeScore(b, userProfile);
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate composite effectiveness score
   */
  calculateCompositeScore(alternative, userProfile = null) {
    let score = 0;
    let weights = {
      effectiveness: 0.3,
      safety: 0.25,
      evidence: 0.2,
      userFeedback: 0.15,
      professionalEndorsement: 0.1
    };

    // Base effectiveness score
    score += (alternative.effectiveness_rating || alternative.effectiveness || 0) * weights.effectiveness * 100;

    // Safety score
    score += (alternative.safety_rating || alternative.safety || 0) * weights.safety * 100;

    // Evidence level bonus
    const evidenceBonus = this.getEvidenceLevelScore(alternative.evidence_level);
    score += evidenceBonus * weights.evidence;

    // User feedback bonus
    if (alternative.userFeedback) {
      const userScore = (
        (alternative.userFeedback.averageEffectiveness || 0) * 0.4 +
        (alternative.userFeedback.averageSafety || 0) * 0.3 +
        (alternative.userFeedback.recommendationRate || 0) * 0.3
      ) * 20; // Scale to 0-20
      score += userScore * weights.userFeedback;
    }

    // Professional endorsement bonus
    if (alternative.professionalReviews && alternative.professionalReviews.length > 0) {
      const professionalScore = this.calculateProfessionalScore(alternative.professionalReviews);
      score += professionalScore * weights.professionalEndorsement;
    }

    // User profile compatibility
    if (userProfile) {
      score += this.calculateProfileCompatibility(alternative, userProfile);
    }

    return Math.min(100, Math.max(0, score)); // Clamp between 0-100
  }

  /**
   * Get evidence level numerical score
   */
  getEvidenceLevelScore(evidenceLevel) {
    const scores = {
      'strong': 25,
      'moderate': 15,
      'limited': 10,
      'insufficient': 5
    };
    return scores[evidenceLevel] || 5;
  }

  /**
   * Calculate professional review score
   */
  calculateProfessionalScore(reviews) {
    if (!reviews || reviews.length === 0) return 0;

    const recommendationScores = {
      'strongly_recommend': 20,
      'recommend': 15,
      'neutral': 10,
      'caution': 5,
      'not_recommend': 0
    };

    const avgScore = reviews.reduce((sum, review) => {
      return sum + (recommendationScores[review.recommendation] || 10);
    }, 0) / reviews.length;

    return avgScore;
  }

  /**
   * Calculate user profile compatibility
   */
  calculateProfileCompatibility(alternative, userProfile) {
    let compatibilityScore = 0;

    // Check contraindications
    if (alternative.contraindications && userProfile.conditions) {
      const hasContraindication = alternative.contraindications.some(contra =>
        userProfile.conditions.some(condition =>
          condition.toLowerCase().includes(contra.toLowerCase()) ||
          contra.toLowerCase().includes(condition.toLowerCase())
        )
      );

      if (hasContraindication) {
        compatibilityScore -= 30; // Major penalty
      } else {
        compatibilityScore += 5; // Bonus for no contraindications
      }
    }

    // Age appropriateness
    if (userProfile.age) {
      if (userProfile.age < 18 && alternative.safety_profile?.children === 'not recommended') {
        compatibilityScore -= 25;
      } else if (userProfile.age >= 65 && alternative.safety_profile?.elderly === 'generally safe') {
        compatibilityScore += 5;
      }
    }

    // Pregnancy safety
    if (userProfile.isPregnant && alternative.safety_profile?.pregnancy === 'avoid') {
      compatibilityScore -= 40;
    }

    // User preferences
    if (userProfile.preferences) {
      if (userProfile.preferences.includes('organic') && alternative.organic_available) {
        compatibilityScore += 3;
      }
      if (userProfile.preferences.includes('evidence_based') && alternative.evidence_level === 'strong') {
        compatibilityScore += 5;
      }
    }

    return compatibilityScore;
  }

  // ============================================================================
  // UTILITY AND FORMATTING METHODS
  // ============================================================================

  /**
   * Format alternative from medication mapping
   */
  formatAlternativeFromMapping(mapping) {
    const alternative = mapping.alternative;

    return {
      id: alternative.id,
      mappingId: mapping.id,
      name: alternative.name,
      scientificName: alternative.scientific_name,
      description: alternative.description,
      effectiveness_rating: mapping.effectiveness_rating,
      confidence_level: mapping.confidence_level,
      evidence_grade: mapping.evidence_grade,
      evidence_level: alternative.evidence_level,

      // Clinical information
      indication: mapping.indication,
      dosage: alternative.standard_dosage,
      safety_profile: alternative.safety_profile,
      contraindications: alternative.contraindications,
      side_effects: alternative.side_effects,

      // Usage information
      uses: alternative.therapeutic_uses,
      dosage_forms: alternative.dosage_forms,
      preparation_methods: alternative.preparation_methods,

      // Quality information
      quality_standards: alternative.quality_standards,
      organic_available: alternative.organic_available,

      // Clinical notes
      clinical_notes: mapping.clinical_notes,
      transition_protocol: mapping.transition_protocol,
      monitoring_requirements: mapping.monitoring_requirements,

      // Study information
      study_count: mapping.study_count,
      rct_count: mapping.rct_count,

      // Source information
      source: 'database',
      last_updated: alternative.updated_at
    };
  }

  /**
   * Format basic alternative (for fuzzy search results)
   */
  formatBasicAlternative(alternative, searchTerm) {
    return {
      id: alternative.id,
      name: alternative.name,
      scientificName: alternative.scientific_name,
      description: alternative.description,
      evidence_level: alternative.evidence_level,
      uses: alternative.therapeutic_uses,
      dosage: alternative.standard_dosage,
      safety_profile: alternative.safety_profile,
      contraindications: alternative.contraindications,
      effectiveness_rating: 0.7, // Default for fuzzy matches
      confidence_level: 'low',
      source: 'fuzzy_search',
      searchRelevance: this.calculateSearchRelevance(alternative, searchTerm)
    };
  }

  /**
   * Calculate search relevance score
   */
  calculateSearchRelevance(alternative, searchTerm) {
    const term = searchTerm.toLowerCase();
    let score = 0;

    // Name matches
    if (alternative.name.toLowerCase().includes(term)) score += 10;
    if (alternative.scientific_name?.toLowerCase().includes(term)) score += 8;

    // Use matches
    if (alternative.therapeutic_uses?.some(use => use.toLowerCase().includes(term))) score += 6;

    // Description matches
    if (alternative.description?.toLowerCase().includes(term)) score += 4;

    return Math.min(10, score);
  }

  /**
   * Merge database and AI alternatives
   */
  mergeAlternatives(dbAlternatives, aiAlternatives) {
    const merged = [...dbAlternatives];

    if (aiAlternatives && aiAlternatives.length > 0) {
      aiAlternatives.forEach(aiAlt => {
        const exists = merged.find(alt =>
          alt.name.toLowerCase() === aiAlt.name.toLowerCase()
        );

        if (!exists) {
          merged.push({
            ...aiAlt,
            source: 'AI',
            confidence_level: aiAlt.confidence || 'medium',
          });
        }
      });
    }

    return merged;
  }

  // ============================================================================
  // SAFETY AND WARNING METHODS
  // ============================================================================

  /**
   * Assess safety for user profile
   */
  assessSafety(alternative, userProfile) {
    const assessment = {
      overallRisk: 'low',
      specificWarnings: [],
      recommendations: []
    };

    if (!userProfile) return assessment;

    // Check contraindications
    if (alternative.contraindications) {
      alternative.contraindications.forEach(contra => {
        if (userProfile.conditions?.some(cond =>
          cond.toLowerCase().includes(contra.toLowerCase())
        )) {
          assessment.overallRisk = 'high';
          assessment.specificWarnings.push(`Contraindicated due to ${contra}`);
        }
      });
    }

    // Age-specific warnings
    if (userProfile.age < 18 && alternative.safety_profile?.children === 'not recommended') {
      assessment.overallRisk = 'high';
      assessment.specificWarnings.push('Not recommended for children');
    }

    // Pregnancy warnings
    if (userProfile.isPregnant && alternative.safety_profile?.pregnancy === 'avoid') {
      assessment.overallRisk = 'high';
      assessment.specificWarnings.push('Avoid during pregnancy');
    }

    // Drug interactions
    if (userProfile.currentMedications && alternative.drug_interactions) {
      const interactions = userProfile.currentMedications.filter(med =>
        alternative.drug_interactions.some(interaction =>
          interaction.toLowerCase().includes(med.toLowerCase())
        )
      );

      if (interactions.length > 0) {
        assessment.overallRisk = 'moderate';
        assessment.specificWarnings.push(`May interact with: ${interactions.join(', ')}`);
      }
    }

    // Generate recommendations
    if (assessment.overallRisk === 'low') {
      assessment.recommendations.push('Consult healthcare provider before starting');
    } else {
      assessment.recommendations.push('Requires medical supervision');
      assessment.recommendations.push('Discuss alternatives with healthcare provider');
    }

    return assessment;
  }

  /**
   * Generate comprehensive warnings
   */
  generateWarnings(medication, alternatives, userProfile) {
    const warnings = [];

    // Always add medical disclaimer
    warnings.push({
      type: 'disclaimer',
      severity: 'info',
      message: 'Always consult healthcare professionals before changing medications.',
    });

    // Check for high-risk medications
    const highRiskMeds = ['warfarin', 'insulin', 'digoxin', 'lithium', 'chemotherapy'];
    if (highRiskMeds.some(med => medication.toLowerCase().includes(med))) {
      warnings.push({
        type: 'critical',
        severity: 'error',
        message: 'This medication requires careful medical supervision. Do not stop or change without doctor approval.',
      });
    }

    // Profile-specific warnings
    if (userProfile) {
      if (userProfile.isPregnant) {
        warnings.push({
          type: 'pregnancy',
          severity: 'warning',
          message: 'Special precautions needed during pregnancy. Many alternatives may not be safe.',
        });
      }

      if (userProfile.age < 18) {
        warnings.push({
          type: 'pediatric',
          severity: 'warning',
          message: 'Pediatric dosing and safety considerations apply.',
        });
      }

      if (userProfile.currentMedications?.length > 0) {
        warnings.push({
          type: 'interactions',
          severity: 'warning',
          message: 'Check for drug interactions with current medications.',
        });
      }
    }

    // Alternative-specific warnings
    const highInteractionAlts = alternatives.filter(alt =>
      alt.name === 'St. Johns Wort' ||
      alt.drug_interactions?.length > 5
    );

    if (highInteractionAlts.length > 0) {
      warnings.push({
        type: 'interactions',
        severity: 'warning',
        message: `Some alternatives (${highInteractionAlts.map(a => a.name).join(', ')}) have significant interaction potential.`,
      });
    }

    return warnings;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate average of a numeric field
   */
  calculateAverage(array, field) {
    if (!array || array.length === 0) return 0;
    const sum = array.reduce((total, item) => total + (item[field] || 0), 0);
    return Math.round((sum / array.length) * 100) / 100;
  }

  /**
   * Get common side effects from feedback
   */
  getCommonSideEffects(feedback) {
    const allEffects = feedback
      .filter(f => f.side_effects_experienced)
      .flatMap(f => f.side_effects_experienced);

    const effectCounts = {};
    allEffects.forEach(effect => {
      effectCounts[effect] = (effectCounts[effect] || 0) + 1;
    });

    return Object.entries(effectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([effect, count]) => ({ effect, count }));
  }

  /**
   * Get duration distribution from feedback
   */
  getDurationDistribution(feedback) {
    const durations = feedback
      .map(f => f.duration_used)
      .filter(Boolean);

    const distribution = {};
    durations.forEach(duration => {
      distribution[duration] = (distribution[duration] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Get evidence summary
   */
  getEvidenceSummary(alternatives) {
    const levels = alternatives.reduce((acc, alt) => {
      const level = alt.evidence_level || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    return levels;
  }

  /**
   * Get safety profile summary
   */
  getSafetyProfile(alternatives, userProfile) {
    const profile = {
      lowRisk: 0,
      moderateRisk: 0,
      highRisk: 0,
      contraindicated: 0
    };

    alternatives.forEach(alt => {
      const safety = this.assessSafety(alt, userProfile);
      switch (safety.overallRisk) {
        case 'low': profile.lowRisk++; break;
        case 'moderate': profile.moderateRisk++; break;
        case 'high': profile.highRisk++; break;
      }
    });

    return profile;
  }

  /**
   * Fallback to basic alternatives search
   */
  async getBasicAlternatives(medicationName) {
    try {
      const { data: alternatives, error } = await supabase
        .from('natural_alternatives')
        .select('*')
        .or(`name.ilike.%${medicationName}%,therapeutic_uses.cs.{${medicationName}}`)
        .eq('is_active', true)
        .limit(5);

      if (error) throw error;

      return {
        medication: medicationName,
        alternatives: alternatives.map(alt => this.formatBasicAlternative(alt, medicationName)),
        warnings: [{ type: 'limited', severity: 'info', message: 'Limited search results. Database connection issues.' }],
        disclaimer: this.getMedicalDisclaimer(),
        timestamp: new Date(),
      };

    } catch (error) {
      console.error('Basic search failed:', error);
      throw error;
    }
  }

  /**
   * Get medical disclaimer
   */
  getMedicalDisclaimer() {
    return {
      title: 'Medical Disclaimer',
      text: 'The information provided by NaturineX is for educational purposes only and is not intended as medical advice. This comprehensive database includes clinical evidence and professional reviews, but natural alternatives may interact with other medications and may not be appropriate for all individuals. Always consult with qualified healthcare professionals before making changes to your medication or starting new supplements.',
      lastUpdated: new Date(),
      version: '2.0'
    };
  }

  // ============================================================================
  // USER ACTIVITY TRACKING
  // ============================================================================

  /**
   * Save search to history with enhanced tracking
   */
  async saveToHistory(userId, searchData) {
    if (!userId) return;

    try {
      if (supabase) {
        await supabase.from('search_history').insert({
          user_id: userId,
          medication: searchData.medication,
          alternatives_count: searchData.alternatives.length,
          search_options: searchData.options || {},
          evidence_levels: searchData.metadata?.evidenceLevels || {},
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }

  /**
   * Record user interaction
   */
  async recordInteraction(userId, interactionData) {
    if (!userId) return;

    try {
      await supabase.from('user_interactions').insert({
        user_id: userId,
        interaction_type: interactionData.type,
        alternative_id: interactionData.alternativeId,
        medication: interactionData.medication,
        details: interactionData.details || {},
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const naturalAlternativesServiceV2 = new NaturalAlternativesServiceV2();

export default naturalAlternativesServiceV2;