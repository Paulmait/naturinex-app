// Audit Logger Tests - PHI Sanitization, Event Tracking, HIPAA Compliance
import auditLogger, { ACCESS_TYPES, RESOURCE_TYPES } from '../src/services/auditLogger';
import { supabase } from '../src/config/supabase';

describe('Audit Logger Tests', () => {
  describe('PHI Sanitization', () => {
    it('should redact medication names from metadata', () => {
      const metadata = {
        medication_name: 'Aspirin',
        dosage: '100mg',
        user_action: 'scan'
      };

      const sanitized = auditLogger.sanitizeMetadata(metadata);

      expect(sanitized.medication_name).toBe('[REDACTED]');
      expect(sanitized.dosage).toBe('100mg'); // Non-PHI should remain
      expect(sanitized.user_action).toBe('scan');
    });

    it('should redact email addresses', () => {
      const metadata = {
        email: 'patient@example.com',
        action: 'login'
      };

      const sanitized = auditLogger.sanitizeMetadata(metadata);

      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.action).toBe('login');
    });

    it('should redact phone numbers', () => {
      const metadata = {
        phone: '555-123-4567',
        contact_type: 'mobile'
      };

      const sanitized = auditLogger.sanitizeMetadata(metadata);

      expect(sanitized.phone).toBe('[REDACTED]');
    });

    it('should redact SSN', () => {
      const metadata = {
        ssn: '123-45-6789',
        verification: 'complete'
      };

      const sanitized = auditLogger.sanitizeMetadata(metadata);

      expect(sanitized.ssn).toBe('[REDACTED]');
    });

    it('should handle nested objects', () => {
      const metadata = {
        user: {
          email: 'test@example.com',
          name: 'John Doe'
        },
        scan: {
          medication_name: 'Warfarin'
        }
      };

      const sanitized = auditLogger.sanitizeMetadata(metadata);

      expect(sanitized.user.email).toBe('[REDACTED]');
      expect(sanitized.scan.medication_name).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const metadata = {
        medications: ['Aspirin', 'Metformin', 'Lisinopril']
      };

      const sanitized = auditLogger.sanitizeMetadata(metadata);

      expect(sanitized.medications).toEqual(['[REDACTED]', '[REDACTED]', '[REDACTED]']);
    });
  });

  describe('Audit Event Logging', () => {
    beforeEach(() => {
      // Mock Supabase insert
      jest.spyOn(supabase.from('audit_logs'), 'insert').mockResolvedValue({
        data: { id: 'test-id' },
        error: null
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should log PHI access events', async () => {
      await auditLogger.logAccess({
        userId: 'user123',
        action: ACCESS_TYPES.READ,
        resourceType: RESOURCE_TYPES.SCAN,
        resourceId: 'scan456',
        metadata: {
          medication_name: 'Aspirin'
        }
      });

      expect(supabase.from('audit_logs').insert).toHaveBeenCalled();

      const logEntry = supabase.from('audit_logs').insert.mock.calls[0][0];
      expect(logEntry.user_id).toBe('user123');
      expect(logEntry.action).toBe(ACCESS_TYPES.READ);
      expect(logEntry.resource_type).toBe(RESOURCE_TYPES.SCAN);
      expect(logEntry.metadata.medication_name).toBe('[REDACTED]');
    });

    it('should include timestamp in audit logs', async () => {
      const beforeTime = new Date().toISOString();

      await auditLogger.logAccess({
        userId: 'user123',
        action: ACCESS_TYPES.CREATE,
        resourceType: RESOURCE_TYPES.SCAN
      });

      const logEntry = supabase.from('audit_logs').insert.mock.calls[0][0];
      const afterTime = new Date().toISOString();

      expect(logEntry.timestamp).toBeDefined();
      expect(logEntry.timestamp >= beforeTime).toBe(true);
      expect(logEntry.timestamp <= afterTime).toBe(true);
    });

    it('should log IP address and device info', async () => {
      await auditLogger.logAccess({
        userId: 'user123',
        action: ACCESS_TYPES.READ,
        resourceType: RESOURCE_TYPES.SCAN,
        ipAddress: '192.168.1.1',
        deviceInfo: {
          platform: 'ios',
          version: '15.0'
        }
      });

      const logEntry = supabase.from('audit_logs').insert.mock.calls[0][0];

      expect(logEntry.ip_address).toBe('192.168.1.1');
      expect(logEntry.device_info).toEqual({
        platform: 'ios',
        version: '15.0'
      });
    });

    it('should handle logging errors gracefully', async () => {
      jest.spyOn(supabase.from('audit_logs'), 'insert').mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      // Should not throw, just log error
      await expect(auditLogger.logAccess({
        userId: 'user123',
        action: ACCESS_TYPES.READ,
        resourceType: RESOURCE_TYPES.SCAN
      })).resolves.not.toThrow();
    });
  });

  describe('Batch Logging', () => {
    beforeEach(() => {
      jest.spyOn(supabase.from('audit_logs'), 'insert').mockResolvedValue({
        data: [],
        error: null
      });
    });

    it('should batch multiple log entries', async () => {
      const events = [
        {
          userId: 'user1',
          action: ACCESS_TYPES.READ,
          resourceType: RESOURCE_TYPES.SCAN
        },
        {
          userId: 'user2',
          action: ACCESS_TYPES.CREATE,
          resourceType: RESOURCE_TYPES.SCAN
        }
      ];

      await auditLogger.logBatch(events);

      expect(supabase.from('audit_logs').insert).toHaveBeenCalledTimes(1);

      const logEntries = supabase.from('audit_logs').insert.mock.calls[0][0];
      expect(logEntries.length).toBe(2);
    });

    it('should flush batch after reaching limit', async () => {
      // Set batch size to 3 for testing
      auditLogger.batchSize = 3;

      for (let i = 0; i < 5; i++) {
        await auditLogger.logAccess({
          userId: `user${i}`,
          action: ACCESS_TYPES.READ,
          resourceType: RESOURCE_TYPES.SCAN
        });
      }

      // Should have flushed once when reaching 3, plus ongoing batch
      expect(supabase.from('audit_logs').insert.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should flush batch on timer', async () => {
      jest.useFakeTimers();

      await auditLogger.logAccess({
        userId: 'user1',
        action: ACCESS_TYPES.READ,
        resourceType: RESOURCE_TYPES.SCAN
      });

      // Fast-forward timer
      jest.advanceTimersByTime(10000);

      expect(supabase.from('audit_logs').insert).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('Security Alert Detection', () => {
    it('should detect suspicious activity patterns', async () => {
      const suspiciousEvent = {
        userId: 'user123',
        action: ACCESS_TYPES.READ,
        resourceType: RESOURCE_TYPES.SCAN,
        metadata: {
          rapid_requests: 100,
          time_window: '1 minute'
        }
      };

      const isSuspicious = auditLogger.detectSuspiciousActivity(suspiciousEvent);
      expect(isSuspicious).toBe(true);
    });

    it('should detect unauthorized access attempts', async () => {
      const unauthorizedEvent = {
        userId: 'user123',
        action: ACCESS_TYPES.READ,
        resourceType: RESOURCE_TYPES.ADMIN_PANEL,
        status: 'unauthorized'
      };

      await auditLogger.logAccess(unauthorizedEvent);

      const logEntry = supabase.from('audit_logs').insert.mock.calls[0][0];
      expect(logEntry.severity).toBe('high');
    });

    it('should flag failed authentication attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await auditLogger.logAccess({
          userId: 'user123',
          action: ACCESS_TYPES.LOGIN,
          resourceType: RESOURCE_TYPES.AUTH,
          status: 'failed'
        });
      }

      // Should detect pattern of failed logins
      const alerts = auditLogger.getSecurityAlerts('user123');
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  describe('Compliance Requirements', () => {
    it('should retain audit logs for 7 years (HIPAA requirement)', async () => {
      const retentionPolicy = auditLogger.getRetentionPolicy();

      expect(retentionPolicy.years).toBe(7);
      expect(retentionPolicy.reason).toContain('HIPAA');
    });

    it('should log all PHI access types', () => {
      const requiredAccessTypes = [
        ACCESS_TYPES.CREATE,
        ACCESS_TYPES.READ,
        ACCESS_TYPES.UPDATE,
        ACCESS_TYPES.DELETE,
        ACCESS_TYPES.EXPORT
      ];

      requiredAccessTypes.forEach(type => {
        expect(ACCESS_TYPES).toHaveProperty(type.split('.').pop());
      });
    });

    it('should log all PHI resource types', () => {
      const requiredResourceTypes = [
        RESOURCE_TYPES.SCAN,
        RESOURCE_TYPES.USER_PROFILE,
        RESOURCE_TYPES.PAYMENT,
        RESOURCE_TYPES.AUDIT_LOG
      ];

      requiredResourceTypes.forEach(type => {
        expect(RESOURCE_TYPES).toHaveProperty(type.split('.').pop());
      });
    });
  });

  describe('Data Hashing', () => {
    it('should hash sensitive data for change tracking', () => {
      const sensitiveData = {
        old_email: 'old@example.com',
        new_email: 'new@example.com'
      };

      const hashed = auditLogger.hashSensitiveData(sensitiveData);

      expect(hashed.old_email).not.toBe('old@example.com');
      expect(hashed.new_email).not.toBe('new@example.com');
      expect(hashed.old_email).toMatch(/^[a-f0-9]+$/); // Hex hash
    });

    it('should preserve non-sensitive fields', () => {
      const data = {
        email: 'test@example.com',
        action: 'update',
        timestamp: '2025-01-17T12:00:00Z'
      };

      const hashed = auditLogger.hashSensitiveData(data);

      expect(hashed.action).toBe('update');
      expect(hashed.timestamp).toBe('2025-01-17T12:00:00Z');
      expect(hashed.email).not.toBe('test@example.com');
    });
  });

  describe('Query and Retrieval', () => {
    beforeEach(() => {
      jest.spyOn(supabase.from('audit_logs'), 'select').mockReturnValue({
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });
    });

    it('should retrieve audit logs for user', async () => {
      await auditLogger.getUserAuditLogs('user123');

      expect(supabase.from('audit_logs').select).toHaveBeenCalled();
    });

    it('should filter logs by date range', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';

      await auditLogger.getLogsInRange(startDate, endDate);

      expect(supabase.from('audit_logs').select).toHaveBeenCalled();
    });

    it('should filter logs by action type', async () => {
      await auditLogger.getLogsByAction(ACCESS_TYPES.READ);

      expect(supabase.from('audit_logs').select).toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('should log events efficiently', async () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        auditLogger.logAccess({
          userId: `user${i}`,
          action: ACCESS_TYPES.READ,
          resourceType: RESOURCE_TYPES.SCAN
        });
      }

      const duration = Date.now() - start;

      // Should complete 100 logs in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });
});
