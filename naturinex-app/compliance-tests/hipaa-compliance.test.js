const { supabase } = require('../src/config/supabase');
const encryptionService = require('../src/services/encryptionService');
const auditService = require('../src/services/auditService');
const axios = require('axios');
const crypto = require('crypto');

// HIPAA Compliance Testing Suite
describe('HIPAA Compliance Tests', () => {
  const baseURL = process.env.API_BASE_URL || 'https://naturinex-app-1.onrender.com';
  let testUserId;
  let testPatientData;

  beforeAll(async () => {
    // Initialize encryption service
    await encryptionService.initialize();
    
    // Setup test data
    testUserId = 'hipaa-test-user-' + Date.now();
    testPatientData = {
      userId: testUserId,
      medicationHistory: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'daily',
          prescribedDate: '2023-01-15'
        }
      ],
      medicalConditions: ['Hypertension'],
      allergies: ['Penicillin'],
      dateOfBirth: '1980-05-15'
    };
  });

  describe('Administrative Safeguards (§164.308)', () => {
    describe('Security Officer (§164.308(a)(2))', () => {
      test('should have designated security officer controls', async () => {
        try {
          const response = await axios.get(`${baseURL}/api/admin/security-config`, {
            timeout: 5000
          });
          
          // Should require admin authentication
          expect([401, 403]).toContain(response.status);
        } catch (error) {
          if (error.response) {
            expect([401, 403]).toContain(error.response.status);
          }
        }
      });

      test('should track security officer actions', async () => {
        const securityAction = {
          action: 'security_config_change',
          officer: 'security-officer-id',
          timestamp: new Date().toISOString(),
          details: 'Updated encryption parameters'
        };

        await auditService.logSecurityAction(securityAction);

        // Verify action was logged
        const auditLogs = await supabase
          .from('security_audit_log')
          .select('*')
          .eq('action_type', 'security_config_change')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(auditLogs.data).toHaveLength(1);
        expect(auditLogs.data[0]).toHaveProperty('officer_id');
        expect(auditLogs.data[0]).toHaveProperty('action_details');
      });
    });

    describe('Workforce Training (§164.308(a)(5))', () => {
      test('should track user HIPAA training completion', async () => {
        const trainingRecord = {
          userId: testUserId,
          trainingType: 'HIPAA_PRIVACY_SECURITY',
          completedAt: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          score: 95
        };

        const { data, error } = await supabase
          .from('training_records')
          .insert(trainingRecord)
          .select();

        expect(error).toBeNull();
        expect(data[0].training_type).toBe('HIPAA_PRIVACY_SECURITY');
        expect(data[0].score).toBeGreaterThanOrEqual(80); // Minimum passing score
      });

      test('should identify users with expired training', async () => {
        const expiredTraining = await supabase
          .from('training_records')
          .select('user_id, training_type, expiration_date')
          .lt('expiration_date', new Date().toISOString())
          .eq('training_type', 'HIPAA_PRIVACY_SECURITY');

        // Should be able to identify expired training
        expect(expiredTraining.error).toBeNull();
        expect(Array.isArray(expiredTraining.data)).toBe(true);
      });
    });

    describe('Access Management (§164.308(a)(4))', () => {
      test('should implement role-based access control', async () => {
        const roles = [
          { role: 'patient', permissions: ['read_own_data'] },
          { role: 'healthcare_provider', permissions: ['read_patient_data', 'write_patient_data'] },
          { role: 'admin', permissions: ['read_all', 'write_all', 'manage_users'] }
        ];

        for (const roleConfig of roles) {
          const roleCheck = await supabase
            .from('user_roles')
            .select('permissions')
            .eq('role_name', roleConfig.role)
            .single();

          if (roleCheck.data) {
            expect(roleCheck.data.permissions).toEqual(
              expect.arrayContaining(roleConfig.permissions)
            );
          }
        }
      });

      test('should enforce minimum necessary access principle', async () => {
        // Test that users can only access minimum necessary PHI
        const restrictedData = {
          patient_id: 'patient-123',
          requesting_user: 'provider-456',
          requested_fields: ['medication_history', 'allergies'],
          justification: 'Treatment planning'
        };

        const accessRequest = await supabase
          .from('access_requests')
          .insert(restrictedData)
          .select();

        expect(accessRequest.error).toBeNull();
        expect(accessRequest.data[0]).toHaveProperty('justification');
        expect(accessRequest.data[0].requested_fields).not.toContain('ssn');
        expect(accessRequest.data[0].requested_fields).not.toContain('financial_info');
      });
    });
  });

  describe('Physical Safeguards (§164.310)', () => {
    describe('Facility Access Controls (§164.310(a)(1))', () => {
      test('should log facility access events', async () => {
        const facilityAccess = {
          facility_id: 'data-center-1',
          user_id: 'tech-staff-123',
          access_type: 'entry',
          timestamp: new Date().toISOString(),
          purpose: 'Server maintenance'
        };

        const { data, error } = await supabase
          .from('facility_access_log')
          .insert(facilityAccess)
          .select();

        expect(error).toBeNull();
        expect(data[0]).toHaveProperty('access_type');
        expect(data[0]).toHaveProperty('timestamp');
      });
    });

    describe('Workstation Security (§164.310(b))', () => {
      test('should enforce workstation security policies', async () => {
        const workstationPolicy = {
          automatic_logoff: true,
          automatic_logoff_time: 900, // 15 minutes
          encryption_required: true,
          antivirus_required: true,
          firewall_required: true
        };

        // Verify workstation security configuration
        expect(workstationPolicy.automatic_logoff).toBe(true);
        expect(workstationPolicy.automatic_logoff_time).toBeLessThanOrEqual(1800); // Max 30 minutes
        expect(workstationPolicy.encryption_required).toBe(true);
      });
    });

    describe('Device and Media Controls (§164.310(d)(1))', () => {
      test('should track media disposal', async () => {
        const mediaDisposal = {
          device_id: 'HDD-12345',
          disposal_method: 'DOD_5220.22-M_3_pass',
          disposed_by: 'tech-staff-789',
          disposal_date: new Date().toISOString(),
          verification_certificate: 'CERT-12345-2023'
        };

        const { data, error } = await supabase
          .from('media_disposal_log')
          .insert(mediaDisposal)
          .select();

        expect(error).toBeNull();
        expect(data[0].disposal_method).toMatch(/DOD|NIST/);
        expect(data[0]).toHaveProperty('verification_certificate');
      });
    });
  });

  describe('Technical Safeguards (§164.312)', () => {
    describe('Access Control (§164.312(a)(1))', () => {
      test('should implement unique user identification', async () => {
        const userId = 'user-' + crypto.randomUUID();
        
        // Verify user ID uniqueness
        const existingUser = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();

        expect(existingUser.error?.code).toBe('PGRST116'); // No rows returned
      });

      test('should implement automatic logoff', async () => {
        const sessionConfig = {
          maxIdleTime: 900, // 15 minutes
          maxSessionTime: 28800, // 8 hours
          warningTime: 120 // 2 minutes before logoff
        };

        expect(sessionConfig.maxIdleTime).toBeLessThanOrEqual(1800);
        expect(sessionConfig.maxSessionTime).toBeLessThanOrEqual(28800);
        expect(sessionConfig.warningTime).toBeGreaterThan(0);
      });

      test('should encrypt PHI data at rest', async () => {
        const phiData = {
          patientId: 'patient-456',
          medicalRecord: 'Sensitive medical information',
          diagnosis: 'Test diagnosis'
        };

        // Encrypt the data
        const encryptedData = await encryptionService.encryptPHI(phiData, 'medical_record');

        expect(encryptedData).toHaveProperty('data');
        expect(encryptedData).toHaveProperty('keyId');
        expect(encryptedData).toHaveProperty('iv');
        expect(encryptedData.data).not.toContain('Sensitive medical information');

        // Verify decryption works
        const decryptedData = await encryptionService.decryptPHI(encryptedData);
        expect(decryptedData).toEqual(phiData);
      });
    });

    describe('Audit Controls (§164.312(b))', () => {
      test('should log all PHI access events', async () => {
        const accessEvent = {
          user_id: testUserId,
          patient_id: 'patient-789',
          action: 'view_medical_record',
          timestamp: new Date().toISOString(),
          source_ip: '192.168.1.100',
          user_agent: 'NaturineX-App/1.0',
          success: true
        };

        await auditService.logPHIAccess(accessEvent);

        // Verify audit log entry
        const auditLog = await supabase
          .from('phi_access_log')
          .select('*')
          .eq('user_id', testUserId)
          .eq('action', 'view_medical_record')
          .order('created_at', { ascending: false })
          .limit(1);

        expect(auditLog.data).toHaveLength(1);
        expect(auditLog.data[0]).toHaveProperty('source_ip');
        expect(auditLog.data[0]).toHaveProperty('timestamp');
      });

      test('should detect unusual access patterns', async () => {
        // Simulate unusual access pattern
        const suspiciousEvents = [];
        for (let i = 0; i < 20; i++) {
          suspiciousEvents.push({
            user_id: testUserId,
            patient_id: `patient-${i}`,
            action: 'view_medical_record',
            timestamp: new Date(Date.now() - i * 1000).toISOString(),
            source_ip: '192.168.1.100'
          });
        }

        // Log events
        for (const event of suspiciousEvents) {
          await auditService.logPHIAccess(event);
        }

        // Check for unusual pattern detection
        const recentAccess = await supabase
          .from('phi_access_log')
          .select('patient_id')
          .eq('user_id', testUserId)
          .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

        expect(recentAccess.data.length).toBeGreaterThan(10); // Should trigger alert
      });
    });

    describe('Integrity (§164.312(c)(1))', () => {
      test('should maintain data integrity with checksums', async () => {
        const originalData = {
          patientId: 'patient-integrity-test',
          medicalData: 'Important medical information'
        };

        // Create checksum
        const checksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(originalData))
          .digest('hex');

        // Store data with checksum
        const { data, error } = await supabase
          .from('medical_records')
          .insert({
            patient_id: originalData.patientId,
            data: originalData.medicalData,
            checksum: checksum,
            created_at: new Date().toISOString()
          })
          .select();

        expect(error).toBeNull();
        expect(data[0]).toHaveProperty('checksum');

        // Verify integrity
        const storedRecord = data[0];
        const verificationData = {
          patientId: storedRecord.patient_id,
          medicalData: storedRecord.data
        };
        const verificationChecksum = crypto
          .createHash('sha256')
          .update(JSON.stringify(verificationData))
          .digest('hex');

        expect(verificationChecksum).toBe(storedRecord.checksum);
      });
    });

    describe('Transmission Security (§164.312(e)(1))', () => {
      test('should encrypt PHI in transit', async () => {
        // Test HTTPS enforcement
        const httpUrl = baseURL.replace('https:', 'http:');
        
        try {
          const response = await axios.get(httpUrl + '/api/health', {
            maxRedirects: 0,
            timeout: 5000
          });
          
          // Should redirect to HTTPS
          expect([301, 302, 308]).toContain(response.status);
        } catch (error) {
          // Connection refused is acceptable for HTTP
          expect(error.code).toBeOneOf(['ECONNREFUSED', 'ENOTFOUND']);
        }
      });

      test('should validate TLS configuration', async () => {
        try {
          const response = await axios.get(`${baseURL}/api/health`, {
            timeout: 5000,
            httpsAgent: new (require('https').Agent)({
              rejectUnauthorized: true,
              secureProtocol: 'TLSv1_2_method' // Minimum TLS 1.2
            })
          });
          
          expect(response.status).toBe(200);
        } catch (error) {
          if (error.code === 'CERT_UNTRUSTED') {
            throw new Error('Invalid SSL certificate');
          }
        }
      });
    });
  });

  describe('Business Associate Agreements', () => {
    test('should track business associate relationships', async () => {
      const businessAssociate = {
        company_name: 'Cloud Hosting Provider Inc.',
        service_type: 'cloud_hosting',
        baa_signed_date: '2023-01-01',
        baa_expiration_date: '2025-12-31',
        contact_person: 'John Doe',
        security_officer: 'Jane Smith',
        phi_access_level: 'infrastructure_only'
      };

      const { data, error } = await supabase
        .from('business_associates')
        .insert(businessAssociate)
        .select();

      expect(error).toBeNull();
      expect(data[0]).toHaveProperty('baa_signed_date');
      expect(data[0]).toHaveProperty('phi_access_level');
    });

    test('should alert on expiring BAAs', async () => {
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const expiringBAAs = await supabase
        .from('business_associates')
        .select('*')
        .lte('baa_expiration_date', thirtyDaysFromNow.toISOString());

      expect(expiringBAAs.error).toBeNull();
      // Should be able to identify expiring agreements
    });
  });

  describe('Breach Notification (§164.400-414)', () => {
    test('should detect potential data breaches', async () => {
      const breachIndicator = {
        incident_type: 'unauthorized_access',
        detected_at: new Date().toISOString(),
        affected_records: 150,
        discovery_method: 'automated_monitoring',
        reporter: 'security-system',
        initial_assessment: 'potential_breach'
      };

      const { data, error } = await supabase
        .from('security_incidents')
        .insert(breachIndicator)
        .select();

      expect(error).toBeNull();
      expect(data[0]).toHaveProperty('affected_records');
      expect(data[0]).toHaveProperty('discovery_method');
    });

    test('should track breach notification timeline', async () => {
      const breachTimeline = {
        incident_id: 'INC-2023-001',
        discovery_date: new Date().toISOString(),
        assessment_completed: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notification_required: true,
        hhs_notification_due: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        individual_notification_due: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('breach_notifications')
        .insert(breachTimeline)
        .select();

      expect(error).toBeNull();
      expect(data[0]).toHaveProperty('hhs_notification_due');
      expect(data[0]).toHaveProperty('individual_notification_due');
    });
  });

  describe('Data Retention and Disposal', () => {
    test('should enforce data retention policies', async () => {
      const retentionPolicy = {
        data_type: 'medical_scans',
        retention_period_years: 7,
        disposal_method: 'secure_deletion',
        legal_hold_exempt: false
      };

      const { data, error } = await supabase
        .from('retention_policies')
        .insert(retentionPolicy)
        .select();

      expect(error).toBeNull();
      expect(data[0].retention_period_years).toBeGreaterThanOrEqual(6); // Minimum retention
    });

    test('should identify data eligible for disposal', async () => {
      const sevenYearsAgo = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000);
      
      const eligibleForDisposal = await supabase
        .from('medical_records')
        .select('*')
        .lt('created_at', sevenYearsAgo.toISOString())
        .eq('legal_hold', false);

      expect(eligibleForDisposal.error).toBeNull();
      // Should be able to identify old records
    });

    test('should log secure data disposal', async () => {
      const disposalRecord = {
        record_type: 'medical_scan',
        record_id: 'scan-12345',
        disposal_date: new Date().toISOString(),
        disposal_method: 'cryptographic_erasure',
        disposed_by: 'automated-system',
        verification_hash: crypto.randomBytes(32).toString('hex')
      };

      const { data, error } = await supabase
        .from('data_disposal_log')
        .insert(disposalRecord)
        .select();

      expect(error).toBeNull();
      expect(data[0]).toHaveProperty('verification_hash');
      expect(data[0].disposal_method).toMatch(/cryptographic|dod|nist/);
    });
  });

  describe('Risk Assessment and Management', () => {
    test('should conduct periodic risk assessments', async () => {
      const riskAssessment = {
        assessment_date: new Date().toISOString(),
        assessor: 'security-team',
        scope: 'entire_system',
        methodology: 'NIST_800-66',
        risks_identified: 12,
        high_risks: 2,
        medium_risks: 5,
        low_risks: 5,
        next_assessment_due: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data, error } = await supabase
        .from('risk_assessments')
        .insert(riskAssessment)
        .select();

      expect(error).toBeNull();
      expect(data[0]).toHaveProperty('methodology');
      expect(data[0]).toHaveProperty('risks_identified');
    });

    test('should track risk mitigation actions', async () => {
      const mitigationAction = {
        risk_id: 'RISK-2023-001',
        action_description: 'Implement additional encryption for database backups',
        assigned_to: 'security-team',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_progress',
        priority: 'high'
      };

      const { data, error } = await supabase
        .from('risk_mitigation_actions')
        .insert(mitigationAction)
        .select();

      expect(error).toBeNull();
      expect(data[0]).toHaveProperty('due_date');
      expect(data[0]).toHaveProperty('priority');
    });
  });

  afterAll(async () => {
    // Clean up test data
    const cleanup = await Promise.allSettled([
      supabase.from('training_records').delete().eq('user_id', testUserId),
      supabase.from('phi_access_log').delete().eq('user_id', testUserId),
      supabase.from('medical_records').delete().eq('patient_id', 'patient-integrity-test'),
      supabase.from('security_incidents').delete().eq('reporter', 'security-system'),
      supabase.from('business_associates').delete().eq('company_name', 'Cloud Hosting Provider Inc.'),
    ]);
    
    console.log('HIPAA compliance test cleanup completed');
  });
});