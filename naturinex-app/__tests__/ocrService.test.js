// OCR Service Tests - Image Processing, Medication Extraction, Confidence Scoring
import ocrService from '../src/services/ocrService';

describe('OCR Service Tests', () => {
  describe('Image Validation', () => {
    it('should accept valid image URIs', () => {
      const validURIs = [
        'file:///path/to/image.jpg',
        'file:///path/to/photo.png',
        'content://media/image.jpeg'
      ];

      validURIs.forEach(uri => {
        const isValid = ocrService.validateImageUri(uri);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid image URIs', () => {
      const invalidURIs = [
        '',
        'not_a_uri',
        'http://external.com/image.jpg',
        'javascript:alert("xss")'
      ];

      invalidURIs.forEach(uri => {
        const isValid = ocrService.validateImageUri(uri);
        expect(isValid).toBe(false);
      });
    });

    it('should validate image format', () => {
      const validFormats = ['jpg', 'jpeg', 'png', 'webp'];
      const invalidFormats = ['exe', 'pdf', 'svg'];

      validFormats.forEach(format => {
        const isValid = ocrService.isValidImageFormat(`image.${format}`);
        expect(isValid).toBe(true);
      });

      invalidFormats.forEach(format => {
        const isValid = ocrService.isValidImageFormat(`file.${format}`);
        expect(isValid).toBe(false);
      });
    });

    it('should check image size limits', () => {
      const validSize = 5 * 1024 * 1024; // 5MB
      const invalidSize = 15 * 1024 * 1024; // 15MB

      expect(ocrService.isValidSize(validSize)).toBe(true);
      expect(ocrService.isValidSize(invalidSize)).toBe(false);
    });
  });

  describe('Base64 Conversion', () => {
    it('should convert image URI to base64', async () => {
      // Mock file system read
      const mockImageData = 'mock_image_data';
      global.FileSystem = {
        readAsStringAsync: jest.fn().mockResolvedValue(mockImageData)
      };

      const base64 = await ocrService.imageToBase64('file:///test.jpg');

      expect(base64).toBe(mockImageData);
      expect(global.FileSystem.readAsStringAsync).toHaveBeenCalled();
    });

    it('should handle base64 conversion errors', async () => {
      global.FileSystem = {
        readAsStringAsync: jest.fn().mockRejectedValue(new Error('File not found'))
      };

      await expect(ocrService.imageToBase64('file:///invalid.jpg'))
        .rejects.toThrow('File not found');
    });
  });

  describe('Google Vision API Integration', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully call Vision API', async () => {
      const mockResponse = {
        responses: [{
          textAnnotations: [
            { description: 'Aspirin 100mg' },
            { description: 'Aspirin' },
            { description: '100mg' }
          ]
        }]
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await ocrService.processImage('mock_base64_image');

      expect(global.fetch).toHaveBeenCalled();
      expect(result.text).toBeDefined();
    });

    it('should handle Vision API errors', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid image' } })
      });

      await expect(ocrService.processImage('invalid_base64'))
        .rejects.toThrow();
    });

    it('should include both TEXT_DETECTION and DOCUMENT_TEXT_DETECTION', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ responses: [{ textAnnotations: [] }] })
      });

      await ocrService.processImage('mock_base64');

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      const features = requestBody.requests[0].features;
      expect(features).toContainEqual({ type: 'TEXT_DETECTION', maxResults: 50 });
      expect(features).toContainEqual({ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 50 });
    });
  });

  describe('Medication Name Extraction', () => {
    it('should extract common medication names', () => {
      const texts = [
        'Aspirin 100mg',
        'Lisinopril 10mg once daily',
        'Metformin HCL 500mg',
        'Atorvastatin (Lipitor) 20mg'
      ];

      texts.forEach(text => {
        const medications = ocrService.extractMedicationNames(text);
        expect(medications.length).toBeGreaterThan(0);
      });
    });

    it('should detect medications with common suffixes', () => {
      const suffixes = [
        'ine', 'ol', 'pril', 'tan', 'ide', 'cin', 'mab', 'pam'
      ];

      suffixes.forEach(suffix => {
        const text = `Med${suffix} 50mg`;
        const medications = ocrService.extractMedicationNames(text);
        expect(medications.length).toBeGreaterThan(0);
      });
    });

    it('should extract brand names in parentheses', () => {
      const text = 'Atorvastatin (Lipitor) 20mg';
      const medications = ocrService.extractMedicationNames(text);

      expect(medications).toContain('Atorvastatin');
      expect(medications).toContain('Lipitor');
    });

    it('should handle multiple medications in one text', () => {
      const text = 'Aspirin 100mg and Metformin 500mg';
      const medications = ocrService.extractMedicationNames(text);

      expect(medications.length).toBeGreaterThanOrEqual(2);
      expect(medications).toContain('Aspirin');
      expect(medications).toContain('Metformin');
    });

    it('should filter out common non-medication words', () => {
      const text = 'Take one tablet daily with food';
      const medications = ocrService.extractMedicationNames(text);

      expect(medications).not.toContain('tablet');
      expect(medications).not.toContain('daily');
      expect(medications).not.toContain('food');
    });

    it('should handle OCR errors and typos', () => {
      const typos = [
        'Aspirln',  // OCR misread 'i' as 'l'
        'Metf0rmin', // OCR misread 'o' as '0'
        'Llsinopril' // OCR doubled 'L'
      ];

      typos.forEach(text => {
        const medications = ocrService.extractMedicationNames(text);
        // Should still attempt extraction or use fuzzy matching
        expect(Array.isArray(medications)).toBe(true);
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should assign high confidence to clear text', () => {
      const mockResponse = {
        responses: [{
          textAnnotations: [
            { description: 'ASPIRIN 100MG', confidence: 0.99 }
          ]
        }]
      };

      const confidence = ocrService.calculateConfidence(mockResponse);
      expect(confidence).toBeGreaterThan(0.8);
    });

    it('should assign low confidence to unclear text', () => {
      const mockResponse = {
        responses: [{
          textAnnotations: [
            { description: 'unclear text', confidence: 0.4 }
          ]
        }]
      };

      const confidence = ocrService.calculateConfidence(mockResponse);
      expect(confidence).toBeLessThan(0.6);
    });

    it('should factor in medication pattern matches', () => {
      const textWithDosage = 'Aspirin 100mg twice daily';
      const textWithoutDosage = 'Some random text';

      const conf1 = ocrService.scoreTextQuality(textWithDosage);
      const conf2 = ocrService.scoreTextQuality(textWithoutDosage);

      expect(conf1).toBeGreaterThan(conf2);
    });

    it('should penalize very short extractions', () => {
      const shortText = 'A';
      const normalText = 'Aspirin 100mg';

      const conf1 = ocrService.scoreTextQuality(shortText);
      const conf2 = ocrService.scoreTextQuality(normalText);

      expect(conf2).toBeGreaterThan(conf1);
    });
  });

  describe('Image Preprocessing', () => {
    it('should enhance image quality before OCR', async () => {
      const mockImage = 'mock_image_data';

      // Mock image manipulation library
      const enhanced = await ocrService.preprocessImage(mockImage);

      expect(enhanced).toBeDefined();
      // Should return enhanced image
    });

    it('should handle preprocessing errors gracefully', async () => {
      const corruptImage = 'corrupt_data';

      // Should fallback to original image if preprocessing fails
      const result = await ocrService.preprocessImage(corruptImage);
      expect(result).toBeDefined();
    });
  });

  describe('Full OCR Workflow', () => {
    it('should complete full workflow: validate -> convert -> process -> extract', async () => {
      // Mock all dependencies
      global.FileSystem = {
        readAsStringAsync: jest.fn().mockResolvedValue('base64_image_data')
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          responses: [{
            textAnnotations: [
              { description: 'Aspirin 100mg', confidence: 0.95 }
            ]
          }]
        })
      });

      const result = await ocrService.scanImage('file:///test.jpg');

      expect(result).toHaveProperty('medications');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('rawText');
      expect(result.medications.length).toBeGreaterThan(0);
    });

    it('should handle workflow failures at each stage', async () => {
      // Test validation failure
      await expect(ocrService.scanImage('invalid_uri'))
        .rejects.toThrow();

      // Test conversion failure
      global.FileSystem = {
        readAsStringAsync: jest.fn().mockRejectedValue(new Error('Read error'))
      };
      await expect(ocrService.scanImage('file:///test.jpg'))
        .rejects.toThrow();

      // Test API failure
      global.FileSystem = {
        readAsStringAsync: jest.fn().mockResolvedValue('data')
      };
      global.fetch = jest.fn().mockRejectedValue(new Error('API error'));
      await expect(ocrService.scanImage('file:///test.jpg'))
        .rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete OCR within reasonable time', async () => {
      global.FileSystem = {
        readAsStringAsync: jest.fn().mockResolvedValue('base64_data')
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          responses: [{ textAnnotations: [{ description: 'Aspirin' }] }]
        })
      });

      const start = Date.now();
      await ocrService.scanImage('file:///test.jpg');
      const duration = Date.now() - start;

      // Should complete in under 5 seconds
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Error Messages', () => {
    it('should provide helpful error messages', async () => {
      try {
        await ocrService.scanImage('');
      } catch (error) {
        expect(error.message).toContain('Invalid image');
      }

      try {
        await ocrService.scanImage('file:///huge_file.jpg');
      } catch (error) {
        expect(error.message).toMatch(/size|large/i);
      }
    });
  });
});
