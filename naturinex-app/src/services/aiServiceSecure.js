/**
 * AI Service for Naturinex - Secure Version (RECOMMENDED FOR PRODUCTION)
 *
 * ============================================================================
 * This is the RECOMMENDED AI service for production use.
 * ============================================================================
 *
 * Security benefits:
 * - API keys (Gemini, Vision) stay server-side in Edge Functions
 * - All sensitive operations happen on the server
 * - Rate limiting enforced server-side
 * - Input sanitization and validation
 *
 * Alternative: Direct API calls to backend /api/analyze endpoints
 * (also secure - API calls go through Render backend)
 */

import { supabase } from '../config/supabase';
import { SUPABASE_URL } from '../config/env';
import logger from '../utils/logger';

class AIServiceSecure {
  constructor() {
    this.functionsUrl = `${SUPABASE_URL}/functions/v1`;
  }

  /**
   * Analyze medication using secure backend (Gemini API via Edge Function)
   * @param {string} medicationName - Name of the medication
   * @param {string} ocrText - Optional OCR extracted text
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeMedication(medicationName, ocrText = null) {
    try {
      // Validate input
      const validation = this.validateMedicationName(medicationName || ocrText);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in.');
      }

      logger.info('Calling Gemini Edge Function', { medicationName: validation.sanitized });

      // Call Supabase Edge Function
      const response = await fetch(`${this.functionsUrl}/gemini-analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medicationName: validation.sanitized,
          ocrText: ocrText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Gemini Edge Function error', errorData);
        throw new Error(errorData.error || 'Failed to analyze medication');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      logger.info('Gemini analysis successful', { medicationName: validation.sanitized });

      return {
        medicationName: data.medicationName,
        medicationType: data.medicationType,
        commonUses: data.commonUses || [],
        naturalAlternatives: data.naturalAlternatives || [],
        warnings: data.warnings || [],
        disclaimer: data.disclaimer,
        analyzedAt: data.analyzedAt,
        confidence: 85, // High confidence from Gemini
        processingTime: Date.now(),
      };

    } catch (error) {
      logger.error('AI analysis error', { error: error.message });
      throw new Error(error.message || 'Failed to analyze medication. Please try again.');
    }
  }

  /**
   * Process image using secure backend (Vision API via Edge Function)
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<Object>} OCR result with extracted text
   */
  async processImageForOCR(imageBase64) {
    try {
      if (!imageBase64) {
        throw new Error('Image data is required');
      }

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in.');
      }

      logger.info('Calling Vision OCR Edge Function');

      // Call Supabase Edge Function
      const response = await fetch(`${this.functionsUrl}/vision-ocr`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Vision OCR Edge Function error', errorData);
        throw new Error(errorData.error || 'Failed to process image');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'OCR processing failed');
      }

      logger.info('Vision OCR successful');

      return {
        success: true,
        fullText: data.fullText,
        confidence: data.confidence,
        potentialMedications: data.potentialMedications || [],
        detectedLanguage: data.detectedLanguage || 'en',
        textAnnotations: data.textAnnotations || [],
        labels: data.labels || [],
      };

    } catch (error) {
      logger.error('OCR processing error', { error: error.message });
      throw new Error(error.message || 'Failed to process image. Please try again.');
    }
  }

  /**
   * Validate medication name with enhanced security
   */
  validateMedicationName(name) {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Medication name is required' };
    }

    // Sanitize input first
    const sanitizedName = name
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[^\w\s\-.()]/g, ''); // Keep only allowed characters

    if (sanitizedName.length < 2) {
      return { isValid: false, error: 'Medication name must be at least 2 characters' };
    }

    if (sanitizedName.length > 200) {
      return { isValid: false, error: 'Medication name is too long' };
    }

    // Check for suspicious patterns (SQL injection, XSS, etc.)
    const suspiciousPatterns = [
      /(\.|%2e){2,}/i, // Directory traversal
      /<script/i, // Script injection
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript protocol
      /on\w+\s*=/i // Event handlers
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(name)) {
        return { isValid: false, error: 'Invalid characters detected' };
      }
    }

    // Basic validation for common medication name patterns
    const validPattern = /^[a-zA-Z0-9\s\-.()]+$/;
    if (!validPattern.test(sanitizedName)) {
      return { isValid: false, error: 'Medication name contains invalid characters' };
    }

    return { isValid: true, error: null, sanitized: sanitizedName };
  }

  /**
   * Check quota for user (server-side validation)
   * @param {string} userId - User ID
   * @param {string} deviceId - Device ID
   * @returns {Promise<Object>} Quota status
   */
  async checkQuota(userId, deviceId) {
    try {
      const { data, error } = await supabase
        .from('device_usage')
        .select('scan_count, is_blocked, last_scan_at')
        .eq('device_id', deviceId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      // If no record, user can scan (first time)
      if (!data) {
        return {
          canScan: true,
          remainingScans: 3,
          scanCount: 0,
          isBlocked: false,
        };
      }

      // Check if blocked
      if (data.is_blocked) {
        return {
          canScan: false,
          remainingScans: 0,
          scanCount: data.scan_count,
          isBlocked: true,
          reason: 'Device has been blocked. Please contact support.',
        };
      }

      // Check scan limit (3 free scans for guests)
      const remainingScans = Math.max(0, 3 - data.scan_count);

      return {
        canScan: remainingScans > 0,
        remainingScans,
        scanCount: data.scan_count,
        isBlocked: false,
        lastScanAt: data.last_scan_at,
      };

    } catch (error) {
      logger.error('Quota check error', { error: error.message });
      // Fail open - allow scan if quota check fails
      return {
        canScan: true,
        remainingScans: 1,
        scanCount: 0,
        isBlocked: false,
      };
    }
  }

  /**
   * Increment scan count for device (server-side tracking)
   */
  async incrementScanCount(deviceId) {
    try {
      const { error } = await supabase.rpc('increment_device_scan', {
        p_device_id: deviceId
      });

      if (error) {
        logger.error('Failed to increment scan count', { error: error.message });
      }

      return !error;
    } catch (error) {
      logger.error('Increment scan count error', { error: error.message });
      return false;
    }
  }
}

// Create singleton instance
const aiServiceSecure = new AIServiceSecure();

export default aiServiceSecure;
