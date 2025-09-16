import drugInteractionService from '../drugInteractionService';
import { supabase } from '../config/supabase';

// Mock dependencies
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    })),
    functions: {
      invoke: jest.fn()
    }
  }
}));

describe('Drug Interaction Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Interaction Detection', () => {
    test('should detect major drug interactions', async () => {
      const mockInteractions = {
        data: [{
          id: 1,
          drug1: 'Warfarin',
          drug2: 'Aspirin',
          severity: 'major',
          description: 'Increased bleeding risk',
          mechanism: 'Additive anticoagulant effects',
          recommendation: 'Monitor INR closely, consider alternative',
          onset: 'rapid',
          documentation: 'established'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockInteractions);
      
      const result = await drugInteractionService.checkInteractions(['Warfarin', 'Aspirin']);
      
      expect(result.success).toBe(true);
      expect(result.interactions).toHaveLength(1);
      expect(result.interactions[0].severity).toBe('major');
      expect(result.interactions[0].description).toBe('Increased bleeding risk');
    });

    test('should detect moderate drug interactions', async () => {
      const mockInteractions = {
        data: [{
          id: 2,
          drug1: 'Simvastatin',
          drug2: 'Grapefruit',
          severity: 'moderate',
          description: 'Increased statin levels',
          mechanism: 'CYP3A4 inhibition',
          recommendation: 'Avoid grapefruit products',
          onset: 'delayed',
          documentation: 'probable'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockInteractions);
      
      const result = await drugInteractionService.checkInteractions(['Simvastatin', 'Grapefruit']);
      
      expect(result.success).toBe(true);
      expect(result.interactions[0].severity).toBe('moderate');
    });

    test('should handle no interactions found', async () => {
      const mockNoInteractions = {
        data: [],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockNoInteractions);
      
      const result = await drugInteractionService.checkInteractions(['Acetaminophen']);
      
      expect(result.success).toBe(true);
      expect(result.interactions).toHaveLength(0);
      expect(result.message).toBe('No known interactions found');
    });

    test('should handle multiple drug combinations', async () => {
      const mockMultipleInteractions = {
        data: [
          {
            id: 1,
            drug1: 'Drug A',
            drug2: 'Drug B',
            severity: 'major'
          },
          {
            id: 2,
            drug1: 'Drug A',
            drug2: 'Drug C',
            severity: 'moderate'
          },
          {
            id: 3,
            drug1: 'Drug B',
            drug2: 'Drug C',
            severity: 'minor'
          }
        ],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockMultipleInteractions);
      
      const result = await drugInteractionService.checkInteractions(['Drug A', 'Drug B', 'Drug C']);
      
      expect(result.success).toBe(true);
      expect(result.interactions).toHaveLength(3);
    });
  });

  describe('Severity Classification', () => {
    test('should classify contraindicated interactions', async () => {
      const contraindicated = {
        data: [{
          severity: 'contraindicated',
          drug1: 'MAO Inhibitor',
          drug2: 'SSRI',
          description: 'Risk of serotonin syndrome'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(contraindicated);
      
      const result = await drugInteractionService.checkInteractions(['MAO Inhibitor', 'SSRI']);
      
      expect(result.interactions[0].severity).toBe('contraindicated');
      expect(result.criticalInteractions).toHaveLength(1);
    });

    test('should prioritize interactions by severity', async () => {
      const mixedSeverity = {
        data: [
          { severity: 'minor', drug1: 'A', drug2: 'B' },
          { severity: 'major', drug1: 'C', drug2: 'D' },
          { severity: 'moderate', drug1: 'E', drug2: 'F' },
          { severity: 'contraindicated', drug1: 'G', drug2: 'H' }
        ],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mixedSeverity);
      
      const result = await drugInteractionService.checkInteractions(['A', 'B', 'C', 'D']);
      
      const severities = result.interactions.map(i => i.severity);
      const expectedOrder = ['contraindicated', 'major', 'moderate', 'minor'];
      
      expect(severities).toEqual(expectedOrder);
    });
  });

  describe('Drug Name Normalization', () => {
    test('should normalize generic and brand names', () => {
      const testCases = [
        { input: 'acetaminophen', expected: 'acetaminophen' },
        { input: 'Tylenol', expected: 'acetaminophen' },
        { input: 'ibuprofen', expected: 'ibuprofen' },
        { input: 'Advil', expected: 'ibuprofen' },
        { input: 'Motrin', expected: 'ibuprofen' }
      ];
      
      testCases.forEach(({ input, expected }) => {
        const normalized = drugInteractionService.normalizeDrugName(input);
        expect(normalized).toBe(expected);
      });
    });

    test('should handle dosage information in drug names', () => {
      const drugNames = [
        'Aspirin 81mg',
        'Metformin 500 mg',
        'Lisinopril 10mg tablets'
      ];
      
      drugNames.forEach(name => {
        const normalized = drugInteractionService.normalizeDrugName(name);
        expect(normalized).not.toContain('mg');
        expect(normalized).not.toContain('tablets');
      });
    });

    test('should handle case insensitive drug names', () => {
      const variants = [
        'ASPIRIN',
        'aspirin',
        'Aspirin',
        'AsPiRiN'
      ];
      
      const normalized = variants.map(name => 
        drugInteractionService.normalizeDrugName(name)
      );
      
      // All should normalize to the same value
      expect(new Set(normalized).size).toBe(1);
    });
  });

  describe('Food and Supplement Interactions', () => {
    test('should detect food interactions', async () => {
      const foodInteractions = {
        data: [{
          drug1: 'Warfarin',
          drug2: 'Vitamin K rich foods',
          severity: 'moderate',
          type: 'food',
          description: 'Vitamin K can counteract warfarin effects'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(foodInteractions);
      
      const result = await drugInteractionService.checkFoodInteractions(['Warfarin']);
      
      expect(result.success).toBe(true);
      expect(result.interactions[0].type).toBe('food');
    });

    test('should detect supplement interactions', async () => {
      const supplementInteractions = {
        data: [{
          drug1: 'Blood thinner',
          drug2: 'Ginkgo biloba',
          severity: 'moderate',
          type: 'supplement',
          description: 'Increased bleeding risk'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(supplementInteractions);
      
      const result = await drugInteractionService.checkSupplementInteractions(['Blood thinner']);
      
      expect(result.success).toBe(true);
      expect(result.interactions[0].type).toBe('supplement');
    });
  });

  describe('Clinical Decision Support', () => {
    test('should provide clinical recommendations', async () => {
      const clinicalData = {
        data: [{
          drug1: 'ACE Inhibitor',
          drug2: 'Potassium Supplement',
          severity: 'moderate',
          recommendation: 'Monitor serum potassium levels',
          clinicalSignificance: 'May lead to hyperkalemia',
          monitoring: 'Check potassium every 2 weeks initially'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(clinicalData);
      
      const result = await drugInteractionService.checkInteractions(['ACE Inhibitor', 'Potassium']);
      
      expect(result.interactions[0]).toHaveProperty('recommendation');
      expect(result.interactions[0]).toHaveProperty('monitoring');
    });

    test('should calculate interaction risk scores', async () => {
      const riskData = {
        data: [{
          drug1: 'High Risk Drug',
          drug2: 'Another Drug',
          severity: 'major',
          patientFactors: ['elderly', 'kidney_disease'],
          riskScore: 8.5
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(riskData);
      
      const result = await drugInteractionService.calculateRiskScore(
        ['High Risk Drug', 'Another Drug'],
        { age: 75, conditions: ['kidney_disease'] }
      );
      
      expect(result.riskScore).toBeGreaterThan(8);
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('Performance and Caching', () => {
    test('should cache interaction results', async () => {
      const mockData = {
        data: [{ drug1: 'A', drug2: 'B', severity: 'minor' }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockData);
      
      // First call
      await drugInteractionService.checkInteractions(['A', 'B']);
      // Second call (should use cache)
      await drugInteractionService.checkInteractions(['A', 'B']);
      
      // Should only make one database call
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    test('should handle large drug lists efficiently', async () => {
      const largeDrugList = Array(50).fill().map((_, i) => `Drug${i}`);
      
      const mockData = { data: [], error: null };
      supabase.from().select().mockResolvedValue(mockData);
      
      const startTime = Date.now();
      const result = await drugInteractionService.checkInteractions(largeDrugList);
      const endTime = Date.now();
      
      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    test('should handle database connection errors', async () => {
      supabase.from().select().mockRejectedValue(new Error('Database connection failed'));
      
      const result = await drugInteractionService.checkInteractions(['Aspirin']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
    });

    test('should validate input parameters', async () => {
      const invalidInputs = [
        null,
        undefined,
        [],
        [''],
        [null, undefined],
        ['valid', '', 'drug']
      ];
      
      for (const input of invalidInputs) {
        const result = await drugInteractionService.checkInteractions(input);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid');
      }
    });

    test('should handle malformed database responses', async () => {
      const malformedData = {
        data: [{
          // Missing required fields
          someField: 'value'
        }],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(malformedData);
      
      const result = await drugInteractionService.checkInteractions(['Drug A']);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('malformed');
    });
  });

  describe('Security', () => {
    test('should sanitize drug names to prevent SQL injection', async () => {
      const maliciousInputs = [
        "'; DROP TABLE interactions; --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>"
      ];
      
      for (const input of maliciousInputs) {
        const result = await drugInteractionService.checkInteractions([input]);
        
        // Should either reject or sanitize the input
        expect(result.success).toBe(false);
      }
    });

    test('should log security violations', async () => {
      const auditSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      await drugInteractionService.checkInteractions(["'; DROP TABLE --"]);
      
      expect(auditSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security violation')
      );
      
      auditSpy.mockRestore();
    });
  });
});