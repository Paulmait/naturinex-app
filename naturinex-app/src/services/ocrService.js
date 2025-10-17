// OCR Service - Google Vision API Integration
// Extracts medication names from images with confidence scoring

import ErrorService from './ErrorService';
import MonitoringService from './MonitoringService';

class OCRService {
  constructor() {
    this.visionApiKey = null;
    this.baseUrl = 'https://vision.googleapis.com/v1';
    this.maxImageSize = 10 * 1024 * 1024; // 10MB
    this.timeout = 15000; // 15 seconds
    this.initialized = false;
  }

  /**
   * Initialize OCR service
   */
  async initialize() {
    if (this.initialized) return true;

    try {
      // Get API key from environment
      this.visionApiKey = process.env.GOOGLE_VISION_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

      if (!this.visionApiKey) {
        throw new Error('Google Vision API key not configured');
      }

      this.initialized = true;
      await MonitoringService.trackEvent('ocr_service_initialized');
      return true;
    } catch (error) {
      await ErrorService.logError(error, 'OCRService.initialize');
      throw new Error('Failed to initialize OCR service');
    }
  }

  /**
   * Process image and extract medication information
   */
  async processImage(imageFile) {
    const startTime = Date.now();

    try {
      // Ensure initialized
      if (!this.initialized) {
        await this.initialize();
      }

      // 1. Validate image
      const validation = await this.validateImage(imageFile);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 2. Preprocess image
      const processedImage = await this.preprocessImage(imageFile);

      // 3. Convert to base64
      const base64Image = await this.imageToBase64(processedImage);

      // 4. Call Google Vision API
      const visionResponse = await this.callVisionAPI(base64Image);

      // 5. Extract text from response
      const extractedText = this.extractText(visionResponse);

      // 6. Parse medication information
      const medicationInfo = await this.parseMedicationInfo(extractedText);

      // 7. Calculate confidence score
      const confidence = this.calculateConfidence(visionResponse, medicationInfo);

      // 8. Track performance
      await MonitoringService.trackPerformanceMetric(
        'ocr_processing_time',
        Date.now() - startTime,
        { confidence }
      );

      return {
        success: true,
        medicationName: medicationInfo.name,
        confidence: confidence,
        alternativeNames: medicationInfo.alternatives,
        rawText: extractedText,
        detectedLanguage: visionResponse.textAnnotations?.[0]?.locale || 'en',
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      await ErrorService.logError(error, 'OCRService.processImage');

      return {
        success: false,
        error: this.getUserFriendlyError(error),
        confidence: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Validate image file
   */
  async validateImage(imageFile) {
    // Check if file exists
    if (!imageFile) {
      return { valid: false, error: 'No image provided' };
    }

    // Check file size
    if (imageFile.size > this.maxImageSize) {
      return {
        valid: false,
        error: `Image too large. Maximum size is ${this.maxImageSize / 1024 / 1024}MB`,
      };
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (imageFile.type && !validTypes.includes(imageFile.type.toLowerCase())) {
      return {
        valid: false,
        error: 'Invalid image type. Please use JPEG, PNG, or WebP',
      };
    }

    return { valid: true };
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imageFile) {
    try {
      // For now, return original image
      // TODO: Implement image preprocessing:
      // - Resize if too large
      // - Convert to grayscale
      // - Increase contrast
      // - Denoise
      // - Deskew

      return imageFile;
    } catch (error) {
      // If preprocessing fails, return original
      return imageFile;
    }
  }

  /**
   * Convert image to base64
   */
  async imageToBase64(imageFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        // Remove data URL prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };

      reader.readAsDataURL(imageFile);
    });
  }

  /**
   * Call Google Vision API
   */
  async callVisionAPI(base64Image) {
    try {
      const response = await fetch(
        `${this.baseUrl}/images:annotate?key=${this.visionApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  content: base64Image,
                },
                features: [
                  {
                    type: 'TEXT_DETECTION',
                    maxResults: 50,
                  },
                  {
                    type: 'DOCUMENT_TEXT_DETECTION',
                    maxResults: 50,
                  },
                  {
                    type: 'LABEL_DETECTION',
                    maxResults: 10,
                  },
                ],
                imageContext: {
                  languageHints: ['en'],
                },
              },
            ],
          }),
          signal: AbortSignal.timeout(this.timeout),
        }
      );

      if (!response.ok) {
        throw new Error(`Vision API error: ${response.status}`);
      }

      const data = await response.json();

      // Check for errors in response
      if (data.responses?.[0]?.error) {
        throw new Error(data.responses[0].error.message);
      }

      return data.responses[0];
    } catch (error) {
      throw new Error(`OCR API call failed: ${error.message}`);
    }
  }

  /**
   * Extract text from Vision API response
   */
  extractText(visionResponse) {
    // Get full text annotation (most complete)
    const fullText = visionResponse.fullTextAnnotation?.text || '';

    // Also get individual text annotations for backup
    const textAnnotations = visionResponse.textAnnotations || [];
    const alternativeText = textAnnotations
      .slice(1) // Skip first one (it's the full text)
      .map(annotation => annotation.description)
      .join(' ');

    return fullText || alternativeText || '';
  }

  /**
   * Parse medication information from extracted text
   */
  async parseMedicationInfo(text) {
    try {
      // Clean and normalize text
      const cleaned = text
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Common medication name patterns
      const patterns = [
        // Generic format: "Generic Name (Brand Name)"
        /([A-Z][a-z]+(?:ine|ol|pril|tan|ide|cin|mab|pam|pine|prazole|tidine|floxacin))\s*(?:\(([A-Z][a-z]+)\))?/gi,

        // Brand names (usually capitalized)
        /\b([A-Z][a-z]+(?:[A-Z][a-z]+)?)\b/g,

        // Drug strength patterns (e.g., "500mg", "10mg")
        /(\d+\s*(?:mg|mcg|g|ml))/gi,
      ];

      const candidates = new Set();

      // Extract potential medication names
      for (const pattern of patterns) {
        const matches = cleaned.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) candidates.add(match[1].trim());
          if (match[2]) candidates.add(match[2].trim());
        }
      }

      // Filter out common non-medication words
      const stopWords = new Set([
        'Take', 'Tablet', 'Capsule', 'Oral', 'Pill', 'Medication', 'Drug',
        'Prescription', 'Only', 'Rx', 'Refill', 'Doctor', 'Pharmacy', 'Label',
        'Instructions', 'Warnings', 'Keep', 'Store', 'Use', 'Before', 'After',
      ]);

      const filtered = Array.from(candidates).filter(
        name => name.length >= 3 && !stopWords.has(name)
      );

      // Score each candidate based on likelihood
      const scored = filtered.map(name => ({
        name,
        score: this.scoreMedicationName(name, cleaned),
      }));

      // Sort by score
      scored.sort((a, b) => b.score - a.score);

      // Return top candidate and alternatives
      return {
        name: scored[0]?.name || null,
        alternatives: scored.slice(1, 4).map(item => item.name),
        allCandidates: scored.map(item => item.name),
      };
    } catch (error) {
      await ErrorService.logError(error, 'OCRService.parseMedicationInfo');

      return {
        name: null,
        alternatives: [],
        allCandidates: [],
      };
    }
  }

  /**
   * Score medication name based on patterns and context
   */
  scoreMedicationName(name, fullText) {
    let score = 0;

    // Length bonus (medication names are typically 5-15 characters)
    if (name.length >= 5 && name.length <= 15) {
      score += 2;
    }

    // Common medication endings
    const endings = ['ine', 'ol', 'pril', 'tan', 'ide', 'cin', 'mab', 'pam', 'pine', 'prazole', 'tidine', 'floxacin'];
    if (endings.some(ending => name.toLowerCase().endsWith(ending))) {
      score += 3;
    }

    // Appears near dosage information
    if (new RegExp(`${name}.*?\\d+\\s*(?:mg|mcg)`, 'i').test(fullText)) {
      score += 2;
    }

    // Appears near common prescription text
    const prescriptionWords = ['rx', 'prescription', 'take', 'tablet', 'capsule', 'daily', 'twice'];
    if (prescriptionWords.some(word => fullText.toLowerCase().includes(word))) {
      score += 1;
    }

    return score;
  }

  /**
   * Calculate confidence score for OCR result
   */
  calculateConfidence(visionResponse, medicationInfo) {
    let confidence = 0;

    // Base confidence from Vision API
    const textAnnotations = visionResponse.textAnnotations || [];
    if (textAnnotations.length > 0) {
      const avgConfidence = textAnnotations
        .slice(1)
        .reduce((sum, ann) => sum + (ann.confidence || 0.5), 0) / Math.max(textAnnotations.length - 1, 1);
      confidence += avgConfidence * 0.4; // 40% weight
    }

    // Medication name found
    if (medicationInfo.name) {
      confidence += 0.3; // 30% weight
    }

    // Multiple candidates found (indicates clear text)
    if (medicationInfo.allCandidates.length > 1) {
      confidence += 0.2; // 20% weight
    }

    // Labels detected (indicates clear image)
    const labels = visionResponse.labelAnnotations || [];
    if (labels.some(label => label.description.toLowerCase().includes('medication') ||
                              label.description.toLowerCase().includes('pill') ||
                              label.description.toLowerCase().includes('prescription'))) {
      confidence += 0.1; // 10% weight
    }

    // Normalize to 0-1 range
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyError(error) {
    const message = error.message.toLowerCase();

    if (message.includes('timeout') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('api key') || message.includes('authentication')) {
      return 'OCR service configuration error. Please contact support.';
    }

    if (message.includes('image too large')) {
      return 'Image file is too large. Please use a smaller image.';
    }

    if (message.includes('invalid image')) {
      return 'Invalid image format. Please use JPEG, PNG, or WebP.';
    }

    return 'Unable to process image. Please ensure the image is clear and try again.';
  }

  /**
   * Validate OCR result quality
   */
  isHighQualityResult(result) {
    return (
      result.success &&
      result.confidence >= 0.6 &&
      result.medicationName &&
      result.medicationName.length >= 3
    );
  }

  /**
   * Get suggestions for improving OCR results
   */
  getImprovementSuggestions(result) {
    const suggestions = [];

    if (result.confidence < 0.4) {
      suggestions.push('Try taking a clearer, more focused photo');
      suggestions.push('Ensure good lighting conditions');
      suggestions.push('Hold the camera steady');
    }

    if (result.confidence < 0.6) {
      suggestions.push('Make sure the medication label is in focus');
      suggestions.push('Avoid shadows on the label');
    }

    if (!result.medicationName) {
      suggestions.push('Center the medication label in the frame');
      suggestions.push('Try zooming in on the text');
      suggestions.push('Ensure the text is clearly visible');
    }

    return suggestions;
  }
}

// Create singleton instance
const ocrService = new OCRService();

export default ocrService;

// Export helper functions
export const processImage = (imageFile) => ocrService.processImage(imageFile);
export const isHighQuality = (result) => ocrService.isHighQualityResult(result);
export const getImprovementTips = (result) => ocrService.getImprovementSuggestions(result);
