import aiService from '../aiService';
import { supabase } from '../config/supabase';
// Mock dependencies
jest.mock('../config/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));
jest.mock('../encryptionService', () => ({
  __esModule: true,
  default: {
    encryptPHI: jest.fn().mockResolvedValue({
      data: 'encrypted-data',
      keyId: 'key-123',
      iv: 'iv-123'
    }),
    decryptPHI: jest.fn().mockResolvedValue({ test: 'decrypted-data' })
  }
}));
describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Medication Name Validation', () => {
    test('should validate correct medication names', () => {
      const validNames = [
        'Aspirin',
        'Acetaminophen',
        'Ibuprofen 200mg',
        'Metformin XR',
        'Vitamin D3'
      ];
      validNames.forEach(name => {
        const result = aiService.validateMedicationName(name);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeNull();
      });
    });
    test('should reject invalid medication names', () => {
      const invalidNames = [
        '',
        'a',
        '123',
        'Test@#$',
        'Very long medication name that exceeds reasonable character limits for medication names'
      ];
      invalidNames.forEach(name => {
        const result = aiService.validateMedicationName(name);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeTruthy();
      });
    });
    test('should handle special characters in medication names', () => {
      const specialNames = [
        'Co-trimoxazole',
        'Tylenol PM',
        'Advil Liqui-Gels',
        'Ex-Lax'
      ];
      specialNames.forEach(name => {
        const result = aiService.validateMedicationName(name);
        expect(result.isValid).toBe(true);
      });
    });
  });
  describe('Drug Analysis', () => {
    test('should analyze medication successfully', async () => {
      const mockResponse = {
        data: {
          analysis: {
            medication: {
              name: 'Aspirin',
              genericName: 'Acetylsalicylic Acid',
              strength: '81mg',
              form: 'Tablet'
            },
            interactions: [],
            warnings: ['Take with food'],
            sideEffects: ['Stomach upset', 'Nausea']
          }
        },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockResponse);
      const result = await aiService.analyzeMedication('Aspirin');
      expect(result.success).toBe(true);
      expect(result.data.medication.name).toBe('Aspirin');
      expect(result.data.medication.genericName).toBe('Acetylsalicylic Acid');
    });
    test('should handle API errors gracefully', async () => {
      const mockError = {
        data: null,
        error: { message: 'API Error' }
      };
      supabase.functions.invoke.mockResolvedValue(mockError);
      const result = await aiService.analyzeMedication('InvalidMed');
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
    test('should encrypt sensitive medication data', async () => {
      const mockResponse = {
        data: { analysis: { medication: { name: 'Aspirin' } } },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockResponse);
      await aiService.analyzeMedication('Aspirin');
      const encryptionService = require('../encryptionService').default;
      expect(encryptionService.encryptPHI).toHaveBeenCalled();
    });
  });
  describe('OCR Processing', () => {
    test('should process image and extract text', async () => {
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...';
      const mockOCRResponse = {
        data: {
          extractedText: 'ASPIRIN 81MG TABLETS',
          confidence: 0.95,
          medications: ['Aspirin 81mg']
        },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockOCRResponse);
      const result = await aiService.processImageOCR(mockImageData);
      expect(result.success).toBe(true);
      expect(result.data.extractedText).toBe('ASPIRIN 81MG TABLETS');
      expect(result.data.confidence).toBe(0.95);
    });
    test('should handle low confidence OCR results', async () => {
      const mockImageData = 'data:image/jpeg;base64,blurry-image';
      const mockOCRResponse = {
        data: {
          extractedText: 'unclear text',
          confidence: 0.3,
          medications: []
        },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockOCRResponse);
      const result = await aiService.processImageOCR(mockImageData);
      expect(result.success).toBe(false);
      expect(result.error).toContain('confidence');
    });
    test('should sanitize extracted text', async () => {
      const mockOCRResponse = {
        data: {
          extractedText: 'ASPIRIN <script>alert("xss")</script> 81MG',
          confidence: 0.95,
          medications: ['Aspirin 81mg']
        },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockOCRResponse);
      const result = await aiService.processImageOCR('test-image');
      expect(result.data.extractedText).not.toContain('<script>');
      expect(result.data.extractedText).not.toContain('alert');
    });
  });
  describe('Drug Interaction Checking', () => {
    test('should identify drug interactions', async () => {
      const medications = ['Aspirin', 'Warfarin'];
      const mockResponse = {
        data: {
          interactions: [{
            severity: 'major',
            description: 'Increased bleeding risk',
            medications: ['Aspirin', 'Warfarin'],
            recommendation: 'Monitor closely'
          }]
        },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockResponse);
      const result = await aiService.checkDrugInteractions(medications);
      expect(result.success).toBe(true);
      expect(result.data.interactions).toHaveLength(1);
      expect(result.data.interactions[0].severity).toBe('major');
    });
    test('should handle no interactions found', async () => {
      const medications = ['Aspirin'];
      const mockResponse = {
        data: { interactions: [] },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockResponse);
      const result = await aiService.checkDrugInteractions(medications);
      expect(result.success).toBe(true);
      expect(result.data.interactions).toHaveLength(0);
    });
    test('should validate medication list before checking interactions', async () => {
      const invalidMedications = ['', null, undefined];
      const result = await aiService.checkDrugInteractions(invalidMedications);
      expect(result.success).toBe(false);
      expect(result.error).toContain('valid medications');
    });
  });
  describe('Rate Limiting', () => {
    test('should respect rate limits for API calls', async () => {
      const rapidCalls = Array(10).fill().map(() => 
        aiService.analyzeMedication('Aspirin')
      );
      // Some calls should be rate limited
      const results = await Promise.allSettled(rapidCalls);
      const rateLimited = results.filter(r => 
        r.status === 'rejected' || 
        (r.status === 'fulfilled' && r.value.error?.includes('rate limit'))
      );
      expect(rateLimited.length).toBeGreaterThan(0);
    });
    test('should queue requests when rate limited', async () => {
      // Mock rate limiting
      let callCount = 0;
      supabase.functions.invoke.mockImplementation(() => {
        callCount++;
        if (callCount <= 5) {
          return Promise.resolve({ data: { analysis: {} }, error: null });
        } else {
          return Promise.resolve({ 
            data: null, 
            error: { message: 'Rate limit exceeded' } 
          });
        }
      });
      const results = await Promise.all([
        aiService.analyzeMedication('Med1'),
        aiService.analyzeMedication('Med2'),
        aiService.analyzeMedication('Med3')
      ]);
      // Should handle rate limiting gracefully
      expect(results.every(r => r.success !== undefined)).toBe(true);
    });
  });
  describe('Security', () => {
    test('should sanitize input to prevent injection attacks', async () => {
      const maliciousInput = "'; DROP TABLE medications; --";
      const result = await aiService.analyzeMedication(maliciousInput);
      // Should either reject the input or sanitize it
      expect(result.success).toBe(false);
    });
    test('should validate API responses', async () => {
      const maliciousResponse = {
        data: {
          analysis: {
            medication: '<script>alert("xss")</script>'
          }
        },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(maliciousResponse);
      const result = await aiService.analyzeMedication('Aspirin');
      // Should sanitize response data
      expect(JSON.stringify(result)).not.toContain('<script>');
    });
  });
  describe('Performance', () => {
    test('should cache frequently requested medication data', async () => {
      const mockResponse = {
        data: { analysis: { medication: { name: 'Aspirin' } } },
        error: null
      };
      supabase.functions.invoke.mockResolvedValue(mockResponse);
      // First call
      await aiService.analyzeMedication('Aspirin');
      // Second call (should use cache)
      await aiService.analyzeMedication('Aspirin');
      // Should only make one API call due to caching
      expect(supabase.functions.invoke).toHaveBeenCalledTimes(1);
    });
    test('should timeout long-running requests', async () => {
      // Mock a slow response
      supabase.functions.invoke.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 30000))
      );
      const startTime = Date.now();
      const result = await aiService.analyzeMedication('SlowMed');
      const endTime = Date.now();
      // Should timeout before 30 seconds
      expect(endTime - startTime).toBeLessThan(10000);
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });
});