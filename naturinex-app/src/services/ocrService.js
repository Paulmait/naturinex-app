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
      // Import unified environment configuration
      const { GOOGLE_VISION_API_KEY } = await import('../config/env');

      // Get API key from unified config
      this.visionApiKey = GOOGLE_VISION_API_KEY;

      if (!this.visionApiKey) {
        throw new Error('Google Vision API key not configured. Set EXPO_PUBLIC_GOOGLE_VISION_API_KEY');
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
      // Convert to base64 for processing
      const base64 = await this.imageToBase64(imageFile);

      // Create image element for canvas processing
      const processedBase64 = await this.processImageCanvas(base64);

      // Convert back to file
      const blob = await fetch(`data:image/png;base64,${processedBase64}`).then(r => r.blob());
      const processedFile = new File([blob], imageFile.name || 'processed.png', { type: 'image/png' });

      return processedFile;
    } catch (error) {
      // If preprocessing fails, return original
      await ErrorService.logError(error, 'OCRService.preprocessImage');
      return imageFile;
    }
  }

  /**
   * Process image using canvas for enhancement
   */
  async processImageCanvas(base64Image) {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();

        img.onload = () => {
          // Create canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // 1. Resize if too large (max 2000px width/height for performance)
          let width = img.width;
          let height = img.height;
          const maxDimension = 2000;

          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // Get image data for pixel manipulation
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;

          // 2. Convert to grayscale and increase contrast
          for (let i = 0; i < data.length; i += 4) {
            // Grayscale conversion using luminosity method
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

            // Apply contrast enhancement
            const contrast = 1.3; // 30% contrast increase
            const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
            const enhancedGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

            // Set RGB to same value (grayscale)
            data[i] = enhancedGray;
            data[i + 1] = enhancedGray;
            data[i + 2] = enhancedGray;
            // Alpha channel remains unchanged (data[i + 3])
          }

          // 3. Apply simple denoising (median filter approximation)
          const denoisedData = this.applyDenoising(data, width, height);

          // 4. Apply sharpening for text clarity
          const sharpenedData = this.applySharpen(denoisedData, width, height);

          // Put processed data back
          const processedImageData = ctx.createImageData(width, height);
          processedImageData.data.set(sharpenedData);
          ctx.putImageData(processedImageData, 0, 0);

          // Convert to base64
          const processedBase64 = canvas.toDataURL('image/png').split(',')[1];
          resolve(processedBase64);
        };

        img.onerror = (error) => {
          reject(new Error('Failed to load image for preprocessing'));
        };

        img.src = `data:image/jpeg;base64,${base64Image}`;
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Apply simple denoising filter
   */
  applyDenoising(data, width, height) {
    const output = new Uint8ClampedArray(data);

    // Simple box blur for denoising
    const radius = 1;

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const idx = ((y + dy) * width + (x + dx)) * 4;
            sumR += data[idx];
            sumG += data[idx + 1];
            sumB += data[idx + 2];
            count++;
          }
        }

        const idx = (y * width + x) * 4;
        output[idx] = Math.floor(sumR / count);
        output[idx + 1] = Math.floor(sumG / count);
        output[idx + 2] = Math.floor(sumB / count);
      }
    }

    return output;
  }

  /**
   * Apply sharpening filter for text clarity
   */
  applySharpen(data, width, height) {
    const output = new Uint8ClampedArray(data);

    // Sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let r = 0, g = 0, b = 0;

        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4;
            const kernelVal = kernel[(ky + 1) * 3 + (kx + 1)];

            r += data[idx] * kernelVal;
            g += data[idx + 1] * kernelVal;
            b += data[idx + 2] * kernelVal;
          }
        }

        const idx = (y * width + x) * 4;
        output[idx] = Math.min(255, Math.max(0, r));
        output[idx + 1] = Math.min(255, Math.max(0, g));
        output[idx + 2] = Math.min(255, Math.max(0, b));
      }
    }

    return output;
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
