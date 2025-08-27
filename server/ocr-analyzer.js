/**
 * OCR-Based Medication Analysis System
 * Production-ready image text extraction and analysis
 */

const axios = require('axios');
const admin = require('firebase-admin');

class OCRAnalyzer {
  constructor(options = {}) {
    this.visionApiKey = process.env.GOOGLE_VISION_API_KEY;
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.maxImageSize = options.maxImageSize || 10 * 1024 * 1024; // 10MB
    this.supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    // Track OCR usage for analytics
    this.stats = {
      totalScans: 0,
      successfulScans: 0,
      failedScans: 0,
      averageConfidence: 0
    };
  }

  /**
   * Main analyze function - extracts text and analyzes medication
   */
  async analyzeImage(imageBuffer, userId, metadata = {}) {
    try {
      this.stats.totalScans++;
      
      // Step 1: Extract text using Google Vision API
      const extractedData = await this.extractTextFromImage(imageBuffer);
      
      if (!extractedData.text) {
        this.stats.failedScans++;
        throw new Error('No text detected in image');
      }

      // Step 2: Parse medication information
      const medicationInfo = this.parseMedicationInfo(extractedData.text);
      
      // Step 3: Get AI analysis
      const analysis = await this.analyzeMedication(medicationInfo);
      
      // Step 4: Store scan record (with privacy compliance)
      const scanRecord = await this.storeScanRecord(userId, {
        ...medicationInfo,
        ...analysis,
        confidence: extractedData.confidence,
        timestamp: new Date().toISOString(),
        metadata
      });

      this.stats.successfulScans++;
      
      return {
        success: true,
        scanId: scanRecord.id,
        medication: medicationInfo,
        analysis,
        confidence: extractedData.confidence
      };
      
    } catch (error) {
      this.stats.failedScans++;
      console.error('OCR Analysis Error:', error);
      throw error;
    }
  }

  /**
   * Extract text from image using Google Vision API
   */
  async extractTextFromImage(imageBuffer) {
    try {
      // Convert buffer to base64
      const imageBase64 = imageBuffer.toString('base64');
      
      // Call Google Vision API
      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.visionApiKey}`,
        {
          requests: [{
            image: { content: imageBase64 },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 50 },
              { type: 'DOCUMENT_TEXT_DETECTION' }
            ]
          }]
        }
      );

      const result = response.data.responses[0];
      
      // Get full text and confidence
      const fullText = result.fullTextAnnotation?.text || '';
      const confidence = this.calculateConfidence(result);
      
      // Extract structured data
      return {
        text: fullText,
        confidence,
        blocks: result.textAnnotations || [],
        language: result.fullTextAnnotation?.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode
      };
      
    } catch (error) {
      console.error('Vision API Error:', error.response?.data || error.message);
      
      // Fallback to mock data if API fails (for testing)
      if (process.env.NODE_ENV === 'development') {
        return this.getMockOCRData();
      }
      
      throw new Error('Failed to extract text from image');
    }
  }

  /**
   * Parse medication information from extracted text
   */
  parseMedicationInfo(text) {
    // Normalize text
    const normalizedText = text.replace(/\n/g, ' ').toLowerCase();
    
    // Common medication patterns
    const patterns = {
      // Brand names followed by generic names in parentheses
      brandGeneric: /([a-z]+(?:\s+[a-z]+)*)\s*\(([a-z]+(?:\s+[a-z]+)*)\)/i,
      // Medication with dosage
      withDosage: /([a-z]+(?:\s+[a-z]+)*)\s+(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g|%)/i,
      // Active ingredient
      activeIngredient: /active\s+ingredient[s]?:\s*([a-z]+(?:\s+[a-z]+)*)/i,
      // Drug facts section
      drugFacts: /drug\s+facts[\s\S]*?([a-z]+(?:\s+[a-z]+)*)/i,
      // Simple medication name
      simple: /([a-z]{4,}(?:\s+[a-z]+)*)/i
    };

    let medicationName = 'Unknown Medication';
    let dosage = null;
    let genericName = null;
    let activeIngredients = [];

    // Try each pattern
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        switch(key) {
          case 'brandGeneric':
            medicationName = match[1].trim();
            genericName = match[2].trim();
            break;
          case 'withDosage':
            medicationName = match[1].trim();
            dosage = `${match[2]}${match[3]}`;
            break;
          case 'activeIngredient':
            activeIngredients.push(match[1].trim());
            if (!medicationName || medicationName === 'Unknown Medication') {
              medicationName = match[1].trim();
            }
            break;
          case 'drugFacts':
          case 'simple':
            if (!medicationName || medicationName === 'Unknown Medication') {
              medicationName = match[1].trim();
            }
            break;
        }
      }
    }

    // Extract additional info
    const warnings = this.extractWarnings(text);
    const usage = this.extractUsage(text);

    return {
      name: this.capitalizeWords(medicationName),
      genericName: genericName ? this.capitalizeWords(genericName) : null,
      dosage,
      activeIngredients,
      warnings,
      usage,
      rawText: text.substring(0, 500) // Store partial raw text for reference
    };
  }

  /**
   * Analyze medication using AI
   */
  async analyzeMedication(medicationInfo) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(this.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
      Analyze the medication "${medicationInfo.name}" and provide comprehensive information.
      ${medicationInfo.genericName ? `Generic name: ${medicationInfo.genericName}` : ''}
      ${medicationInfo.dosage ? `Dosage: ${medicationInfo.dosage}` : ''}
      
      Provide:
      1. Natural alternatives with scientific backing
      2. Safety considerations
      3. Potential interactions
      4. Lifestyle modifications
      5. When to consult healthcare provider
      
      Format as JSON with these fields:
      {
        "category": "string (pain relief, antibiotic, etc)",
        "primaryUse": "string",
        "alternatives": [
          {
            "name": "string",
            "scientificEvidence": "strong/moderate/limited",
            "effectiveness": "high/moderate/low",
            "description": "string",
            "dosage": "string",
            "precautions": ["string"]
          }
        ],
        "interactions": ["string"],
        "lifestyle": ["string"],
        "warnings": ["string"],
        "consultProvider": "string (when to seek medical advice)"
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to structured response
      return {
        category: 'General',
        primaryUse: 'Various conditions',
        alternatives: [{
          name: 'Consult healthcare provider',
          scientificEvidence: 'strong',
          effectiveness: 'high',
          description: 'Professional medical advice recommended',
          dosage: 'As prescribed',
          precautions: ['Always consult before changing medications']
        }],
        warnings: ['AI analysis is for educational purposes only']
      };
      
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error('Failed to analyze medication');
    }
  }

  /**
   * Store scan record with privacy compliance
   */
  async storeScanRecord(userId, scanData) {
    try {
      const db = admin.firestore();
      
      // Privacy-compliant storage
      const scanRecord = {
        userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        medicationName: scanData.name,
        category: scanData.category,
        confidence: scanData.confidence,
        // Don't store raw image or full text for privacy
        hasAlternatives: scanData.alternatives?.length > 0,
        // Anonymized metadata for analytics
        metadata: {
          source: scanData.metadata?.source || 'camera',
          platform: scanData.metadata?.platform || 'unknown',
          appVersion: scanData.metadata?.appVersion
        },
        // Auto-delete after 30 days for privacy
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };

      const docRef = await db.collection('scans').add(scanRecord);
      
      // Update user stats
      await this.updateUserStats(userId, scanData);
      
      return { id: docRef.id, ...scanRecord };
      
    } catch (error) {
      console.error('Storage Error:', error);
      // Don't fail the scan if storage fails
      return { id: 'temp-' + Date.now() };
    }
  }

  /**
   * Update user statistics
   */
  async updateUserStats(userId, scanData) {
    try {
      const db = admin.firestore();
      const userRef = db.collection('users').doc(userId);
      
      await userRef.update({
        'stats.totalScans': admin.firestore.FieldValue.increment(1),
        'stats.lastScanDate': admin.firestore.FieldValue.serverTimestamp(),
        'stats.medicationCategories': admin.firestore.FieldValue.arrayUnion(scanData.category || 'unknown')
      });
    } catch (error) {
      console.error('Stats update error:', error);
    }
  }

  /**
   * Helper functions
   */
  calculateConfidence(visionResult) {
    if (!visionResult.fullTextAnnotation) return 0;
    
    const pages = visionResult.fullTextAnnotation.pages || [];
    if (pages.length === 0) return 0;
    
    const confidences = pages[0].blocks?.map(block => block.confidence || 0) || [];
    const average = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    
    return Math.round(average * 100) / 100;
  }

  extractWarnings(text) {
    const warningPatterns = [
      /warning[s]?:\s*([^.!]+)/i,
      /caution[s]?:\s*([^.!]+)/i,
      /do not use if:\s*([^.!]+)/i,
      /contraindication[s]?:\s*([^.!]+)/i
    ];
    
    const warnings = [];
    for (const pattern of warningPatterns) {
      const match = text.match(pattern);
      if (match) {
        warnings.push(match[1].trim());
      }
    }
    
    return warnings;
  }

  extractUsage(text) {
    const usagePatterns = [
      /direction[s]?:\s*([^.!]+)/i,
      /use[s]?:\s*([^.!]+)/i,
      /dosage:\s*([^.!]+)/i,
      /take\s+(\d+\s+[a-z]+\s+[^.!]+)/i
    ];
    
    for (const pattern of usagePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  }

  /**
   * Mock OCR data for testing
   */
  getMockOCRData() {
    const mockMedications = [
      'Ibuprofen 200mg',
      'Acetaminophen 500mg',
      'Aspirin 81mg',
      'Amoxicillin 250mg',
      'Lisinopril 10mg'
    ];
    
    const randomMed = mockMedications[Math.floor(Math.random() * mockMedications.length)];
    
    return {
      text: `Drug Facts\nActive ingredient: ${randomMed}\nUses: Pain relief\nWarnings: Do not exceed recommended dose`,
      confidence: 0.95,
      blocks: [],
      language: 'en'
    };
  }

  /**
   * Get OCR statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalScans > 0 
        ? ((this.stats.successfulScans / this.stats.totalScans) * 100).toFixed(2) + '%'
        : '0%'
    };
  }
}

module.exports = OCRAnalyzer;