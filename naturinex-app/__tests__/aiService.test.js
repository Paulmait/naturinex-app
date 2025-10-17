// AI Service Tests - Gemini Integration, Medication Validation, Safety Guardrails
import aiService from '../src/services/aiServiceProduction';

describe('AI Service Tests', () => {
  describe('Gemini Integration', () => {
    beforeEach(() => {
      // Mock fetch for Gemini API
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully call Gemini API', async () => {
      const mockResponse = {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                alternatives: [
                  { name: 'Turmeric', purpose: 'Anti-inflammatory' }
                ]
              })
            }]
          }
        }]
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const result = await aiService.analyzeMedication('Aspirin');

      expect(global.fetch).toHaveBeenCalled();
      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should handle Gemini API errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(aiService.analyzeMedication('Aspirin')).rejects.toThrow();
    });

    it('should include safety prompt in all requests', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{}' }] } }]
        })
      });

      await aiService.analyzeMedication('Warfarin');

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.contents[0].parts[0].text).toContain('CRITICAL SAFETY RULES');
      expect(requestBody.contents[0].parts[0].text).toContain('consulting healthcare providers');
    });

    it('should set appropriate temperature for medical info', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{}' }] } }]
        })
      });

      await aiService.analyzeMedication('Metformin');

      const callArgs = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // Medical info should use low temperature for accuracy
      expect(requestBody.generationConfig.temperature).toBeLessThanOrEqual(0.4);
    });
  });

  describe('Medication Validation', () => {
    it('should detect critical medications', () => {
      const criticalMeds = [
        'Warfarin',
        'Insulin',
        'Lithium',
        'Digoxin',
        'Methotrexate'
      ];

      criticalMeds.forEach(med => {
        const isCritical = aiService.isCriticalMedication(med);
        expect(isCritical).toBe(true);
      });
    });

    it('should allow non-critical medications', () => {
      const nonCriticalMeds = [
        'Vitamin D',
        'Melatonin',
        'Ibuprofen'
      ];

      nonCriticalMeds.forEach(med => {
        const isCritical = aiService.isCriticalMedication(med);
        expect(isCritical).toBe(false);
      });
    });

    it('should validate medication name format', () => {
      const validNames = [
        'Aspirin',
        'Acetyl-L-Carnitine',
        'CoQ10',
        'Omega-3'
      ];

      validNames.forEach(name => {
        const sanitized = aiService.sanitizeInput(name);
        expect(sanitized.length).toBeGreaterThan(0);
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
      });
    });

    it('should reject invalid medication names', () => {
      const invalidNames = [
        '',
        '<script>alert("xss")</script>',
        'A'.repeat(1000),
        ';;;DROP TABLE;;;'
      ];

      invalidNames.forEach(name => {
        expect(() => {
          aiService.validateMedicationName(name);
        }).toThrow();
      });
    });
  });

  describe('Safety Guardrails', () => {
    it('should include disclaimer in all responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [{ name: 'Turmeric' }]
                })
              }]
            }
          }]
        })
      });

      const result = await aiService.analyzeMedication('Aspirin');

      expect(result.disclaimer).toContain('IMPORTANT MEDICAL DISCLAIMER');
      expect(result.disclaimer).toContain('NOT medical advice');
      expect(result.disclaimer).toContain('consult your healthcare provider');
    });

    it('should add emergency warning for critical medications', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [{ name: 'Natural alternative' }]
                })
              }]
            }
          }]
        })
      });

      const result = await aiService.analyzeMedication('Warfarin');

      expect(result.criticalWarning).toBeDefined();
      expect(result.criticalWarning).toContain('CRITICAL MEDICATION');
      expect(result.criticalWarning).toContain('DO NOT stop');
    });

    it('should refuse to recommend stopping prescription medications', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [
                    { name: 'Ginger', recommendation: 'Stop your medication' }
                  ]
                })
              }]
            }
          }]
        })
      });

      const result = await aiService.analyzeMedication('Lisinopril');

      // Should filter out dangerous recommendations
      result.alternatives.forEach(alt => {
        expect(alt.recommendation?.toLowerCase()).not.toContain('stop your medication');
      });
    });

    it('should include drug interaction warnings', async () => {
      const result = await aiService.analyzeMedication('Warfarin');

      expect(result.interactionWarning).toBeDefined();
      expect(result.interactionWarning).toContain('drug interactions');
    });

    it('should flag responses that contain harmful advice', () => {
      const harmfulResponses = [
        'Stop taking your medication immediately',
        'You don\'t need to see a doctor',
        'This will cure your cancer'
      ];

      harmfulResponses.forEach(response => {
        const isHarmful = aiService.detectHarmfulAdvice(response);
        expect(isHarmful).toBe(true);
      });
    });

    it('should pass responses with safe advice', () => {
      const safeResponses = [
        'Consult your healthcare provider before making changes',
        'This supplement may help, but check with your doctor first',
        'Always follow your doctor\'s recommendations'
      ];

      safeResponses.forEach(response => {
        const isHarmful = aiService.detectHarmfulAdvice(response);
        expect(isHarmful).toBe(false);
      });
    });
  });

  describe('FDA Database Integration', () => {
    it('should validate medication against FDA database', async () => {
      // Mock FDA API response
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ openfda: { brand_name: ['Aspirin'] } }]
          })
        });

      const isValid = await aiService.validateWithFDA('Aspirin');
      expect(isValid).toBe(true);
    });

    it('should handle FDA API failures gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('FDA API down'));

      // Should not crash, just return false or skip validation
      const isValid = await aiService.validateWithFDA('Unknown Med');
      expect(typeof isValid).toBe('boolean');
    });
  });

  describe('Response Formatting', () => {
    it('should format alternatives with all required fields', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [
                    {
                      name: 'Turmeric',
                      purpose: 'Anti-inflammatory',
                      dosage: '500mg daily',
                      evidence: 'Some studies suggest...'
                    }
                  ]
                })
              }]
            }
          }]
        })
      });

      const result = await aiService.analyzeMedication('Ibuprofen');

      result.alternatives.forEach(alt => {
        expect(alt).toHaveProperty('name');
        expect(alt).toHaveProperty('purpose');
        expect(alt).toHaveProperty('dosage');
        expect(alt).toHaveProperty('evidence');
      });
    });

    it('should include confidence scores', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  alternatives: [{ name: 'Turmeric' }]
                })
              }]
            }
          }]
        })
      });

      const result = await aiService.analyzeMedication('Aspirin');

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed API responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'invalid json' }] } }]
        })
      });

      await expect(aiService.analyzeMedication('Aspirin')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      await expect(aiService.analyzeMedication('Aspirin')).rejects.toThrow('Timeout');
    });

    it('should retry on transient failures', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            candidates: [{
              content: {
                parts: [{
                  text: JSON.stringify({ alternatives: [] })
                }]
              }
            }]
          })
        });
      });

      // Should succeed after retries
      await expect(aiService.analyzeMedication('Aspirin')).resolves.toBeDefined();
      expect(callCount).toBe(3);
    });
  });
});
