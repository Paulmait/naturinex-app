// Production AI Service - Real Gemini Integration
// Handles medication analysis with proper safety guardrails

import { APP_CONFIG } from '../constants/appConfig';
import ErrorService from './ErrorService';
import MonitoringService from './MonitoringService';
import Logger from './Logger';

// Medical disclaimers and safety warnings
const LEGAL_DISCLAIMER = `⚠️ IMPORTANT MEDICAL DISCLAIMER ⚠️

This information is for EDUCATIONAL PURPOSES ONLY and is NOT medical advice.

DO NOT make changes to your medication without consulting your healthcare provider.

- Natural alternatives may interact with your medications
- This is not a substitute for professional medical advice
- Individual results vary significantly
- Some conditions require prescription medication
- Stopping medication abruptly can be dangerous

🚨 EMERGENCY: If experiencing severe symptoms, call 911 immediately.

By proceeding, you acknowledge that you understand these limitations and will consult with a qualified healthcare provider before making any changes to your treatment plan.`;

const SAFETY_PROMPT_PREFIX = `You are a medical information assistant providing EDUCATIONAL information about natural alternatives. You must:

CRITICAL SAFETY RULES:
1. ALWAYS emphasize consulting healthcare providers
2. NEVER recommend stopping prescription medication
3. ALWAYS warn about potential drug interactions
4. NEVER diagnose conditions
5. ALWAYS include emergency warnings for serious conditions
6. NEVER guarantee effectiveness
7. ALWAYS mention individual variation in responses
8. NEVER provide dosing for prescription medications
9. ALWAYS prioritize user safety over completeness
10. NEVER contradict established medical guidelines

If the medication is for a life-threatening or serious condition (heart disease, diabetes, cancer, mental health, seizures, infections, blood clots), you MUST:
- Emphasize the critical importance of the medication
- Strongly recommend against unsupervised changes
- Suggest natural alternatives only as COMPLEMENTARY (not replacement)
- Include explicit warnings about discontinuation risks

If unsure about safety, default to recommending medical consultation.`;

class AIServiceProduction {
  constructor() {
    this.baseUrl = APP_CONFIG.API.BASE_URL;
    this.timeout = 30000;
    this.maxRetries = 2;
    this.geminiApiKey = null;
    this.fdaDatabase = new Map(); // Cache for FDA-approved medications
    this.interactionDatabase = new Map(); // Cache for drug interactions
  }

  /**
   * Initialize the AI service with API keys
   */
  async initialize() {
    try {
      // Import unified environment configuration
      const { GEMINI_API_KEY } = await import('../config/env');

      // Get API key from unified config
      this.geminiApiKey = GEMINI_API_KEY;

      if (!this.geminiApiKey) {
        throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GEMINI_API_KEY');
      }

      // Validate API key format
      if (!this.geminiApiKey.startsWith('AIza')) {
        throw new Error('Invalid Gemini API key format');
      }

      await MonitoringService.trackEvent('ai_service_initialized');
      return true;
    } catch (error) {
      await ErrorService.logError(error, 'AIService.initialize');
      throw new Error('Failed to initialize AI service');
    }
  }

  /**
   * Analyze medication and get natural alternatives with full safety checks
   */
  async analyzeMedication(medicationName, options = {}) {
    const startTime = Date.now();

    try {
      // 1. Validate input
      const validation = this.validateMedicationName(medicationName);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const sanitizedName = validation.sanitized;

      // 2. Check if medication is known/FDA approved
      const medicationInfo = await this.validateMedicationDatabase(sanitizedName);
      if (!medicationInfo.found) {
        return {
          success: false,
          error: 'Medication not found in database',
          suggestion: 'Please verify the spelling or try a different medication name',
          requiresConsultation: true,
        };
      }

      // 3. Get AI analysis with safety guardrails
      const aiAnalysis = await this.getGeminiAnalysis(sanitizedName, medicationInfo);

      // 4. Check drug interactions
      const interactions = await this.checkDrugInteractions(sanitizedName);

      // 5. Add safety warnings based on medication category
      const safetyWarnings = this.generateSafetyWarnings(medicationInfo, interactions);

      // 6. Compile final response
      const response = {
        success: true,
        medicationName: sanitizedName,
        medicationInfo: {
          genericName: medicationInfo.genericName,
          brandNames: medicationInfo.brandNames,
          category: medicationInfo.category,
          fdaApproved: medicationInfo.fdaApproved,
        },
        alternatives: aiAnalysis.alternatives || [],
        warnings: [...safetyWarnings, ...aiAnalysis.warnings],
        recommendations: aiAnalysis.recommendations || [],
        interactions: interactions,
        disclaimer: LEGAL_DISCLAIMER,
        requiresConsultation: true,
        emergencyWarning: this.getEmergencyWarning(medicationInfo),
        confidence: aiAnalysis.confidence || 0.7,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      // 7. Log for audit trail (HIPAA compliant - no PII)
      await this.logAnalysis(sanitizedName, response, options.userId);

      // 8. Track performance metrics
      await MonitoringService.trackPerformanceMetric(
        'medication_analysis',
        Date.now() - startTime,
        { category: medicationInfo.category }
      );

      return response;
    } catch (error) {
      await ErrorService.logError(error, 'AIService.analyzeMedication', {
        medication: medicationName.substring(0, 3) + '***',
      });

      // Return safe fallback response
      return {
        success: false,
        error: 'Unable to analyze medication at this time',
        disclaimer: LEGAL_DISCLAIMER,
        requiresConsultation: true,
        emergencyWarning: '🚨 If you are experiencing a medical emergency, call 911 immediately.',
      };
    }
  }

  /**
   * Get analysis from Gemini AI with safety guardrails
   */
  async getGeminiAnalysis(medicationName, medicationInfo) {
    try {
      const prompt = this.buildSafePrompt(medicationName, medicationInfo);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3, // Low temperature for more consistent, conservative responses
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_MEDICAL',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ],
          }),
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // Extract and parse response
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Empty response from Gemini');
      }

      // Parse JSON response
      const parsed = this.parseAIResponse(textResponse);

      // Validate AI response for safety
      this.validateAIResponse(parsed);

      return parsed;
    } catch (error) {
      await ErrorService.logError(error, 'AIService.getGeminiAnalysis');

      // Return safe fallback
      return {
        alternatives: [],
        warnings: [
          'AI analysis temporarily unavailable',
          'Please consult your healthcare provider for personalized advice',
        ],
        recommendations: [
          'Speak with your doctor or pharmacist',
          'Do not make medication changes without medical supervision',
        ],
        confidence: 0,
      };
    }
  }

  /**
   * Build safe prompt with medical guardrails
   */
  buildSafePrompt(medicationName, medicationInfo) {
    const isCriticalMedication = this.isCriticalMedication(medicationInfo.category);

    return `${SAFETY_PROMPT_PREFIX}

Medication Information:
- Name: ${medicationName}
- Category: ${medicationInfo.category}
- Critical Medication: ${isCriticalMedication ? 'YES - Extra caution required' : 'No'}

Task: Provide educational information about natural alternatives for ${medicationName}.

${isCriticalMedication ? `
🚨 CRITICAL MEDICATION ALERT 🚨
This medication treats a serious condition. Your response MUST:
- Emphasize that alternatives should ONLY be complementary, never replacements
- Warn about serious risks of stopping medication
- Strongly recommend medical supervision
- Include explicit discontinuation warnings
` : ''}

Format your response as valid JSON with this EXACT structure:
{
  "alternatives": [
    {
      "name": "Alternative name",
      "description": "Brief description",
      "scientificEvidence": "Evidence level (Strong/Moderate/Limited/Insufficient)",
      "effectiveness": "High/Moderate/Low as COMPLEMENT (not replacement)",
      "dosage": "General guidance - consult healthcare provider for personalized dosing",
      "sideEffects": "Potential side effects",
      "interactions": "Potential interactions with ${medicationName}",
      "contraindications": "Who should avoid this",
      "cost": "Estimated monthly cost range"
    }
  ],
  "warnings": [
    "Critical safety warnings",
    "Interaction warnings",
    "Contraindication warnings"
  ],
  "recommendations": [
    "Consultation recommendations",
    "Monitoring recommendations",
    "Lifestyle recommendations"
  ],
  "confidence": 0.0-1.0
}

Provide 2-4 alternatives maximum. Quality and safety over quantity.`;
  }

  /**
   * Validate medication name with security checks
   */
  validateMedicationName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Medication name is required' };
    }

    // Aggressive sanitization
    const sanitized = name
      .trim()
      .replace(/[<>'"`;(){}[\]\\|&$]/g, '') // Remove dangerous characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Hard limit

    if (sanitized.length < 2) {
      return { isValid: false, error: 'Medication name too short' };
    }

    // Whitelist approach - only allow letters, numbers, hyphens, spaces
    if (!/^[a-zA-Z0-9\s\-]+$/.test(sanitized)) {
      return { isValid: false, error: 'Invalid characters in medication name' };
    }

    // Check for injection attempts
    const injectionPatterns = [
      /union.*select/i,
      /insert.*into/i,
      /delete.*from/i,
      /drop.*table/i,
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(name)) {
        return { isValid: false, error: 'Invalid input detected' };
      }
    }

    return { isValid: true, sanitized, error: null };
  }

  /**
   * Validate against medication database using OpenFDA and RxNorm APIs
   */
  async validateMedicationDatabase(medicationName) {
    // Check cache first
    const cacheKey = medicationName.toLowerCase().trim();
    if (this.fdaDatabase.has(cacheKey)) {
      return this.fdaDatabase.get(cacheKey);
    }

    try {
      // Try multiple sources for comprehensive validation
      let result = null;

      // 1. Try OpenFDA API first (comprehensive, includes brand/generic names)
      result = await this.queryOpenFDA(medicationName);

      // 2. If not found, try RxNorm API
      if (!result || !result.found) {
        result = await this.queryRxNorm(medicationName);
      }

      // 3. If still not found, return not found
      if (!result || !result.found) {
        return { found: false, searchedTerm: medicationName };
      }

      // Cache successful result for 1 hour
      this.fdaDatabase.set(cacheKey, result);
      setTimeout(() => {
        this.fdaDatabase.delete(cacheKey);
      }, 60 * 60 * 1000);

      return result;
    } catch (error) {
      await ErrorService.logError(error, 'AIService.validateMedicationDatabase');
      // Return soft failure - allow analysis to continue with warnings
      return {
        found: true, // Allow analysis to proceed
        genericName: medicationName,
        brandNames: [],
        category: 'Unknown',
        fdaApproved: false,
        seriousCondition: false,
        validationWarning: 'Unable to verify medication in database',
      };
    }
  }

  /**
   * Query OpenFDA Drug API
   */
  async queryOpenFDA(medicationName) {
    try {
      const encodedName = encodeURIComponent(medicationName);
      const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodedName}"+openfda.generic_name:"${encodedName}"&limit=1`;

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { found: false };
        }
        throw new Error(`OpenFDA API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return { found: false };
      }

      const drug = data.results[0];
      const openfda = drug.openfda || {};

      // Determine category and seriousness
      const category = this.determineDrugCategory(drug);
      const isCritical = this.isCriticalMedication(category);

      return {
        found: true,
        genericName: openfda.generic_name?.[0] || medicationName,
        brandNames: openfda.brand_name || [],
        category: category,
        fdaApproved: true,
        seriousCondition: isCritical,
        manufacturer: openfda.manufacturer_name?.[0] || 'Unknown',
        route: openfda.route?.[0] || 'Unknown',
        productType: openfda.product_type?.[0] || 'Unknown',
        warnings: drug.warnings?.[0] || null,
        source: 'OpenFDA',
      };
    } catch (error) {
      if (error.message.includes('404')) {
        return { found: false };
      }
      throw error;
    }
  }

  /**
   * Query RxNorm API (NIH/NLM)
   */
  async queryRxNorm(medicationName) {
    try {
      const encodedName = encodeURIComponent(medicationName);
      const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodedName}`;

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`RxNorm API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.idGroup || !data.idGroup.rxnormId || data.idGroup.rxnormId.length === 0) {
        return { found: false };
      }

      const rxcui = data.idGroup.rxnormId[0];

      // Get detailed information
      const detailUrl = `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/properties.json`;
      const detailResponse = await fetch(detailUrl, {
        signal: AbortSignal.timeout(5000),
      });

      if (!detailResponse.ok) {
        return { found: false };
      }

      const detailData = await detailResponse.json();
      const properties = detailData.properties;

      if (!properties) {
        return { found: false };
      }

      // Determine category from RxNorm class
      const category = properties.rxnormDoseForm || 'General';

      return {
        found: true,
        genericName: properties.name || medicationName,
        brandNames: [],
        category: category,
        fdaApproved: true,
        seriousCondition: false,
        rxcui: rxcui,
        synonym: properties.synonym || null,
        source: 'RxNorm',
      };
    } catch (error) {
      return { found: false };
    }
  }

  /**
   * Determine drug category from OpenFDA data
   */
  determineDrugCategory(drugData) {
    const openfda = drugData.openfda || {};
    const pharmacologicClass = openfda.pharm_class_epc || openfda.pharm_class_moa || [];

    // Map pharmacologic classes to categories
    if (pharmacologicClass.some(c => c.toLowerCase().includes('cardiovascular'))) {
      return 'cardiovascular';
    }
    if (pharmacologicClass.some(c => c.toLowerCase().includes('anticoagulant'))) {
      return 'anticoagulant';
    }
    if (pharmacologicClass.some(c => c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('insulin'))) {
      return 'diabetes';
    }
    if (pharmacologicClass.some(c => c.toLowerCase().includes('antidepressant') || c.toLowerCase().includes('ssri'))) {
      return 'antidepressant';
    }
    if (pharmacologicClass.some(c => c.toLowerCase().includes('antipsychotic'))) {
      return 'antipsychotic';
    }
    if (pharmacologicClass.some(c => c.toLowerCase().includes('antibiotic'))) {
      return 'antibiotic';
    }

    // Check product type
    const productType = openfda.product_type?.[0] || '';
    if (productType.toLowerCase().includes('vaccine')) {
      return 'vaccine';
    }

    return 'General';
  }

  /**
   * Check for drug interactions using RxNorm Interaction API
   */
  async checkDrugInteractions(medicationName, rxcui = null) {
    try {
      // If rxcui not provided, look it up first
      let drugRxcui = rxcui;
      if (!drugRxcui) {
        const rxnormResult = await this.queryRxNorm(medicationName);
        if (!rxnormResult || !rxnormResult.found) {
          return {
            hasInteractions: false,
            interactions: [],
            severity: 'unknown',
            note: 'Unable to check interactions - drug not found in database',
          };
        }
        drugRxcui = rxnormResult.rxcui;
      }

      // Query RxNorm Interaction API
      const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${drugRxcui}`;

      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`RxNorm Interaction API error: ${response.status}`);
      }

      const data = await response.json();

      // Parse interaction data
      if (!data.interactionTypeGroup || data.interactionTypeGroup.length === 0) {
        return {
          hasInteractions: false,
          interactions: [],
          severity: 'none',
          note: 'No known drug interactions found',
        };
      }

      const interactions = [];
      let maxSeverity = 'minor';

      // Process all interaction groups
      for (const typeGroup of data.interactionTypeGroup) {
        if (!typeGroup.interactionType) continue;

        for (const interactionType of typeGroup.interactionType) {
          if (!interactionType.interactionPair) continue;

          for (const pair of interactionType.interactionPair) {
            const interaction = {
              interactsWith: pair.interactionConcept?.[1]?.minConceptItem?.name || 'Unknown drug',
              severity: pair.severity || 'unknown',
              description: pair.description || 'No description available',
            };

            interactions.push(interaction);

            // Track highest severity
            if (pair.severity === 'high' || pair.severity === 'critical') {
              maxSeverity = 'high';
            } else if (pair.severity === 'moderate' && maxSeverity !== 'high') {
              maxSeverity = 'moderate';
            }
          }
        }
      }

      return {
        hasInteractions: interactions.length > 0,
        interactions: interactions.slice(0, 10), // Limit to top 10 for performance
        severity: maxSeverity,
        totalInteractions: interactions.length,
        note: interactions.length > 10 ? `Showing 10 of ${interactions.length} interactions` : null,
      };
    } catch (error) {
      await ErrorService.logError(error, 'AIService.checkDrugInteractions');

      // Return safe fallback
      return {
        hasInteractions: false,
        interactions: [],
        severity: 'unknown',
        note: 'Unable to check interactions at this time - consult your pharmacist',
      };
    }
  }

  /**
   * Generate safety warnings based on medication info
   */
  generateSafetyWarnings(medicationInfo, interactions) {
    const warnings = [];

    // Always include base warning
    warnings.push('⚠️ Consult your healthcare provider before making any medication changes');

    // Critical medication warnings
    if (this.isCriticalMedication(medicationInfo.category)) {
      warnings.push(
        '🚨 This medication treats a serious condition - DO NOT stop without medical supervision',
        '⚠️ Natural alternatives should ONLY be used as complementary therapy, not replacements'
      );
    }

    // Interaction warnings
    if (interactions.hasInteractions) {
      warnings.push('⚠️ This medication has known drug interactions - discuss with your pharmacist');
    }

    // General safety warnings
    warnings.push(
      '⚠️ Natural supplements can have side effects and interactions',
      '⚠️ Quality and potency of supplements vary by manufacturer',
      '⚠️ Some supplements are not safe during pregnancy or breastfeeding'
    );

    return warnings;
  }

  /**
   * Check if medication is for critical/serious condition
   */
  isCriticalMedication(category) {
    const criticalCategories = [
      'cardiovascular',
      'anticoagulant',
      'diabetes',
      'cancer',
      'mental health',
      'antipsychotic',
      'antidepressant',
      'seizure',
      'epilepsy',
      'immunosuppressant',
      'hiv',
      'antibiotic',
      'hormone',
      'thyroid',
    ];

    return criticalCategories.some(critical =>
      category.toLowerCase().includes(critical)
    );
  }

  /**
   * Get emergency warning based on medication type
   */
  getEmergencyWarning(medicationInfo) {
    if (this.isCriticalMedication(medicationInfo.category)) {
      return '🚨 EMERGENCY: If you experience chest pain, difficulty breathing, severe bleeding, or other serious symptoms, call 911 immediately. Do not wait.';
    }

    return '🚨 If you are experiencing a medical emergency, call 911 immediately.';
  }

  /**
   * Parse AI response safely
   */
  parseAIResponse(textResponse) {
    try {
      // Try to extract JSON from response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback parsing
      return {
        alternatives: [],
        warnings: ['Unable to parse AI response'],
        recommendations: ['Please consult your healthcare provider'],
        confidence: 0.3,
      };
    } catch (error) {
      return {
        alternatives: [],
        warnings: ['Response parsing error'],
        recommendations: ['Please consult your healthcare provider'],
        confidence: 0,
      };
    }
  }

  /**
   * Validate AI response for safety
   */
  validateAIResponse(response) {
    // Ensure alternatives don't make dangerous claims
    if (response.alternatives) {
      response.alternatives = response.alternatives.map(alt => {
        // Ensure effectiveness is appropriately qualified
        if (alt.effectiveness === 'High' || alt.effectiveness === 'Guaranteed') {
          alt.effectiveness = 'Moderate (as complement)';
        }
        return alt;
      });
    }

    return true;
  }

  /**
   * Log analysis for audit trail (HIPAA compliant)
   */
  async logAnalysis(medicationName, response, userId) {
    try {
      // Log without PII
      await MonitoringService.trackEvent('medication_analyzed', {
        medicationCategory: response.medicationInfo?.category,
        alternativesCount: response.alternatives?.length,
        hasInteractions: response.interactions?.hasInteractions,
        confidence: response.confidence,
        // DO NOT log actual medication name or user ID in production
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Silent fail - don't break analysis if logging fails
      Logger.error('Audit logging failed', error, { context: 'aiServiceProduction.logAnalysis' });
    }
  }

  /**
   * Process image for OCR (placeholder - implement separately)
   */
  async processImageForOCR(imageFile) {
    throw new Error('OCR not yet implemented - use dedicated OCR service');
  }
}

// Create singleton instance
const aiService = new AIServiceProduction();

export default aiService;
