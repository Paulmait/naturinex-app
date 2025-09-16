import disclaimerService from '../disclaimerService';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../config/supabase';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    }))
  },
  auditLog: jest.fn().mockResolvedValue()
}));

describe('Disclaimer Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    disclaimerService.reset(); // Reset state between tests
  });

  describe('Legal Compliance', () => {
    test('should display medical disclaimer before first use', async () => {
      SecureStore.getItemAsync.mockResolvedValue(null); // No previous acceptance
      
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      expect(disclaimer.required).toBe(true);
      expect(disclaimer.content).toContain('medical advice');
      expect(disclaimer.content).toContain('healthcare professional');
      expect(disclaimer.version).toBeTruthy();
    });

    test('should not require disclaimer if already accepted', async () => {
      const acceptanceData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        userId: 'user-123'
      };
      
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(acceptanceData));
      
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      expect(disclaimer.required).toBe(false);
    });

    test('should require new acceptance for updated disclaimer versions', async () => {
      const oldAcceptance = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        userId: 'user-123'
      };
      
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify(oldAcceptance));
      
      // Mock current version being newer
      jest.spyOn(disclaimerService, 'getCurrentVersion').mockReturnValue('1.1');
      
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      expect(disclaimer.required).toBe(true);
      expect(disclaimer.versionChanged).toBe(true);
    });
  });

  describe('Disclaimer Content', () => {
    test('should include required legal elements', async () => {
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      const requiredElements = [
        'not medical advice',
        'consult',
        'healthcare professional',
        'emergency',
        'accuracy',
        'liability',
        'educational purposes'
      ];
      
      const content = disclaimer.content.toLowerCase();
      
      requiredElements.forEach(element => {
        expect(content).toContain(element);
      });
    });

    test('should include HIPAA privacy notice', async () => {
      const privacyNotice = await disclaimerService.getPrivacyNotice();
      
      expect(privacyNotice.content).toContain('HIPAA');
      expect(privacyNotice.content).toContain('protected health information');
      expect(privacyNotice.content).toContain('encryption');
      expect(privacyNotice.content).toContain('data retention');
    });

    test('should include FDA compliance statement', async () => {
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      expect(disclaimer.content).toContain('FDA');
      expect(disclaimer.content).toContain('not evaluated');
      expect(disclaimer.content).toContain('diagnose');
      expect(disclaimer.content).toContain('treat');
    });

    test('should support multiple languages', async () => {
      const languages = ['en', 'es', 'fr'];
      
      for (const lang of languages) {
        const disclaimer = await disclaimerService.getMedicalDisclaimer(lang);
        expect(disclaimer.language).toBe(lang);
        expect(disclaimer.content.length).toBeGreaterThan(100);
      }
    });
  });

  describe('Acceptance Tracking', () => {
    test('should record disclaimer acceptance with full audit trail', async () => {
      const userId = 'user-123';
      const acceptanceData = {
        version: '1.0',
        language: 'en',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };
      
      await disclaimerService.recordAcceptance(userId, acceptanceData);
      
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        `disclaimer_acceptance_${userId}`,
        expect.any(String)
      );
      
      expect(supabase.from).toHaveBeenCalledWith('disclaimer_acceptances');
      
      const { auditLog } = require('../config/supabase');
      expect(auditLog).toHaveBeenCalledWith(
        'disclaimer_accepted',
        expect.objectContaining({
          userId,
          version: '1.0',
          timestamp: expect.any(Date)
        })
      );
    });

    test('should validate acceptance data before recording', async () => {
      const invalidData = [
        null,
        undefined,
        {},
        { version: null },
        { version: '1.0' }, // missing timestamp
        { timestamp: new Date() } // missing version
      ];
      
      for (const data of invalidData) {
        await expect(disclaimerService.recordAcceptance('user-123', data))
          .rejects.toThrow('Invalid acceptance data');
      }
    });

    test('should prevent duplicate acceptances within short time window', async () => {
      const userId = 'user-123';
      const acceptanceData = {
        version: '1.0',
        timestamp: new Date()
      };
      
      // First acceptance should succeed
      await disclaimerService.recordAcceptance(userId, acceptanceData);
      
      // Second acceptance within 1 minute should be rejected
      await expect(disclaimerService.recordAcceptance(userId, acceptanceData))
        .rejects.toThrow('Duplicate acceptance');
    });
  });

  describe('Disclaimer Types', () => {
    test('should provide drug interaction disclaimer', async () => {
      const disclaimer = await disclaimerService.getDrugInteractionDisclaimer();
      
      expect(disclaimer.content).toContain('drug interaction');
      expect(disclaimer.content).toContain('complete');
      expect(disclaimer.content).toContain('pharmacist');
      expect(disclaimer.severity).toBe('high');
    });

    test('should provide OCR scanning disclaimer', async () => {
      const disclaimer = await disclaimerService.getOCRDisclaimer();
      
      expect(disclaimer.content).toContain('optical character recognition');
      expect(disclaimer.content).toContain('accuracy');
      expect(disclaimer.content).toContain('verify');
      expect(disclaimer.content).toContain('manual review');
    });

    test('should provide AI analysis disclaimer', async () => {
      const disclaimer = await disclaimerService.getAIDisclaimer();
      
      expect(disclaimer.content).toContain('artificial intelligence');
      expect(disclaimer.content).toContain('machine learning');
      expect(disclaimer.content).toContain('accuracy cannot be guaranteed');
      expect(disclaimer.content).toContain('human oversight');
    });

    test('should provide emergency disclaimer', async () => {
      const disclaimer = await disclaimerService.getEmergencyDisclaimer();
      
      expect(disclaimer.content).toContain('emergency');
      expect(disclaimer.content).toContain('911');
      expect(disclaimer.content).toContain('poison control');
      expect(disclaimer.priority).toBe('critical');
    });
  });

  describe('Context-Specific Disclaimers', () => {
    test('should show enhanced disclaimer for high-risk medications', async () => {
      const highRiskMeds = ['warfarin', 'insulin', 'digoxin', 'lithium'];
      
      for (const med of highRiskMeds) {
        const disclaimer = await disclaimerService.getContextualDisclaimer({
          medication: med,
          context: 'high-risk'
        });
        
        expect(disclaimer.enhanced).toBe(true);
        expect(disclaimer.content).toContain('high-risk medication');
        expect(disclaimer.content).toContain('monitoring');
      }
    });

    test('should show pregnancy disclaimer for pregnancy category drugs', async () => {
      const pregnancyMeds = ['warfarin', 'isotretinoin', 'valproic acid'];
      
      for (const med of pregnancyMeds) {
        const disclaimer = await disclaimerService.getContextualDisclaimer({
          medication: med,
          context: 'pregnancy-risk'
        });
        
        expect(disclaimer.content).toContain('pregnancy');
        expect(disclaimer.content).toContain('birth defects');
        expect(disclaimer.content).toContain('healthcare provider');
      }
    });

    test('should show controlled substance disclaimer', async () => {
      const controlledSubstances = ['oxycodone', 'alprazolam', 'adderall'];
      
      for (const substance of controlledSubstances) {
        const disclaimer = await disclaimerService.getContextualDisclaimer({
          medication: substance,
          context: 'controlled-substance'
        });
        
        expect(disclaimer.content).toContain('controlled substance');
        expect(disclaimer.content).toContain('DEA');
        expect(disclaimer.content).toContain('prescription required');
      }
    });
  });

  describe('User Interface Integration', () => {
    test('should provide disclaimer display preferences', async () => {
      const preferences = await disclaimerService.getDisplayPreferences('user-123');
      
      expect(preferences).toHaveProperty('showOnStartup');
      expect(preferences).toHaveProperty('reminderFrequency');
      expect(preferences).toHaveProperty('allowSkip');
      expect(preferences).toHaveProperty('fontSize');
    });

    test('should track disclaimer viewing time', async () => {
      const startTime = Date.now();
      
      disclaimerService.startViewingTimer('medical-disclaimer');
      
      // Simulate user reading for 30 seconds
      await new Promise(resolve => setTimeout(resolve, 30));
      
      const viewingTime = disclaimerService.getViewingTime('medical-disclaimer');
      
      expect(viewingTime).toBeGreaterThan(25);
      expect(viewingTime).toBeLessThan(50);
    });

    test('should enforce minimum reading time before acceptance', async () => {
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      // Try to accept immediately (should fail)
      const immediateAcceptance = disclaimerService.canAcceptDisclaimer('medical');
      expect(immediateAcceptance.allowed).toBe(false);
      expect(immediateAcceptance.reason).toContain('minimum reading time');
      
      // Start viewing timer
      disclaimerService.startViewingTimer('medical');
      
      // Wait for minimum time
      await new Promise(resolve => setTimeout(resolve, disclaimer.minimumReadingTime));
      
      // Now acceptance should be allowed
      const delayedAcceptance = disclaimerService.canAcceptDisclaimer('medical');
      expect(delayedAcceptance.allowed).toBe(true);
    });
  });

  describe('Version Management', () => {
    test('should track disclaimer version history', async () => {
      const versionHistory = await disclaimerService.getVersionHistory();
      
      expect(Array.isArray(versionHistory)).toBe(true);
      expect(versionHistory.length).toBeGreaterThan(0);
      
      versionHistory.forEach(version => {
        expect(version).toHaveProperty('version');
        expect(version).toHaveProperty('releaseDate');
        expect(version).toHaveProperty('changes');
        expect(version).toHaveProperty('requiredReAcceptance');
      });
    });

    test('should handle version migration', async () => {
      const oldVersion = '1.0';
      const newVersion = '1.1';
      
      // Mock old acceptance
      SecureStore.getItemAsync.mockResolvedValue(JSON.stringify({
        version: oldVersion,
        timestamp: new Date().toISOString()
      }));
      
      const migrationResult = await disclaimerService.migrateToNewVersion(
        'user-123',
        oldVersion,
        newVersion
      );
      
      expect(migrationResult.migrationRequired).toBe(true);
      expect(migrationResult.changes).toBeTruthy();
      expect(migrationResult.newAcceptanceRequired).toBe(true);
    });
  });

  describe('Compliance Reporting', () => {
    test('should generate acceptance compliance report', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      
      const mockReportData = {
        data: [
          {
            user_id: 'user-1',
            version: '1.0',
            accepted_at: '2023-06-01T10:00:00Z',
            ip_address: '192.168.1.1'
          },
          {
            user_id: 'user-2',
            version: '1.0',
            accepted_at: '2023-06-15T14:30:00Z',
            ip_address: '192.168.1.2'
          }
        ],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockReportData);
      
      const report = await disclaimerService.generateComplianceReport(startDate, endDate);
      
      expect(report.totalAcceptances).toBe(2);
      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.acceptancesByVersion).toHaveProperty('1.0');
    });

    test('should identify users with expired acceptances', async () => {
      const mockExpiredData = {
        data: [
          {
            user_id: 'user-old',
            version: '0.9',
            accepted_at: '2022-01-01T10:00:00Z'
          }
        ],
        error: null
      };
      
      supabase.from().select().mockResolvedValue(mockExpiredData);
      
      const expiredUsers = await disclaimerService.findExpiredAcceptances();
      
      expect(expiredUsers.length).toBe(1);
      expect(expiredUsers[0].userId).toBe('user-old');
      expect(expiredUsers[0].requiresNewAcceptance).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async () => {
      SecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));
      
      const disclaimer = await disclaimerService.getMedicalDisclaimer();
      
      // Should default to requiring acceptance if unable to check storage
      expect(disclaimer.required).toBe(true);
      expect(disclaimer.fallbackMode).toBe(true);
    });

    test('should handle database connection errors', async () => {
      supabase.from().insert().mockRejectedValue(new Error('Database error'));
      
      // Should still record locally even if database fails
      await expect(disclaimerService.recordAcceptance('user-123', {
        version: '1.0',
        timestamp: new Date()
      })).not.toThrow();
      
      expect(SecureStore.setItemAsync).toHaveBeenCalled();
    });
  });
});