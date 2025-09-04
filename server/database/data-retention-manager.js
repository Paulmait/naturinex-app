const cron = require('node-cron');
const { Pool } = require('pg');
const crypto = require('crypto');

class DataRetentionManager {
  constructor(dbConfig) {
    this.pool = new Pool(dbConfig || {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    this.retentionPolicies = {
      userAccount: { days: 730, anonymizeAfter: null }, // 2 years
      healthProfile: { days: 730, anonymizeAfter: 365 }, // 2 years, anonymize after 1
      scanHistory: { days: 90, anonymizeAfter: 30 }, // 90 days, anonymize after 30
      aiInteractions: { days: 30, anonymizeAfter: 7 }, // 30 days, anonymize after 7
      paymentRecords: { days: 2555, anonymizeAfter: null }, // 7 years
      auditLogs: { days: 730, anonymizeAfter: null }, // 2 years
      securityIncidents: { days: 1825, anonymizeAfter: null } // 5 years
    };
    
    this.initializeScheduledJobs();
  }

  initializeScheduledJobs() {
    // Daily retention enforcement at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting daily retention enforcement...');
      await this.enforceAllPolicies();
    });
    
    // Hourly expired data cleanup
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly data cleanup...');
      await this.deleteExpiredData();
    });
    
    // Daily anonymization at 3 AM
    cron.schedule('0 3 * * *', async () => {
      console.log('Running daily anonymization...');
      await this.anonymizeOldData();
    });
    
    // Weekly compliance report
    cron.schedule('0 0 * * 0', async () => {
      console.log('Generating weekly compliance report...');
      await this.generateComplianceReport();
    });
  }

  async enforceAllPolicies() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Enforce each policy
      for (const [category, policy] of Object.entries(this.retentionPolicies)) {
        await this.enforcePolicy(client, category, policy);
      }
      
      // Update policy enforcement timestamps
      await client.query(`
        UPDATE data_retention_policies 
        SET 
          last_enforced = CURRENT_TIMESTAMP,
          next_enforcement = CURRENT_TIMESTAMP + INTERVAL '1 day'
      `);
      
      await client.query('COMMIT');
      console.log('Retention policies enforced successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error enforcing retention policies:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async enforcePolicy(client, category, policy) {
    switch (category) {
      case 'userAccount':
        await this.enforceUserRetention(client, policy);
        break;
      case 'healthProfile':
        await this.enforceHealthProfileRetention(client, policy);
        break;
      case 'scanHistory':
        await this.enforceScanHistoryRetention(client, policy);
        break;
      case 'aiInteractions':
        await this.enforceAIInteractionRetention(client, policy);
        break;
      case 'paymentRecords':
        await this.enforcePaymentRetention(client, policy);
        break;
      case 'auditLogs':
        await this.enforceAuditLogRetention(client, policy);
        break;
      case 'securityIncidents':
        await this.enforceSecurityIncidentRetention(client, policy);
        break;
    }
  }

  async enforceUserRetention(client, policy) {
    // Mark inactive users for deletion
    const result = await client.query(`
      UPDATE users 
      SET 
        deletion_requested_at = CURRENT_TIMESTAMP,
        deletion_scheduled_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
      WHERE 
        last_active_at < CURRENT_TIMESTAMP - INTERVAL '${policy.days} days'
        AND deletion_requested_at IS NULL
      RETURNING id
    `);
    
    if (result.rowCount > 0) {
      console.log(`Marked ${result.rowCount} inactive users for deletion`);
    }
    
    // Process deletion requests older than 30 days
    const deleted = await client.query(`
      DELETE FROM users 
      WHERE deletion_scheduled_at < CURRENT_TIMESTAMP
      RETURNING id
    `);
    
    if (deleted.rowCount > 0) {
      console.log(`Deleted ${deleted.rowCount} users per retention policy`);
    }
  }

  async enforceHealthProfileRetention(client, policy) {
    if (policy.anonymizeAfter) {
      // Anonymize old health profiles
      const anonymized = await client.query(`
        UPDATE health_profiles 
        SET 
          encrypted_medical_conditions = 'ANONYMIZED',
          encrypted_medications = 'ANONYMIZED',
          encrypted_allergies = 'ANONYMIZED'
        WHERE 
          created_at < CURRENT_TIMESTAMP - INTERVAL '${policy.anonymizeAfter} days'
          AND encrypted_medical_conditions != 'ANONYMIZED'
        RETURNING id
      `);
      
      if (anonymized.rowCount > 0) {
        console.log(`Anonymized ${anonymized.rowCount} health profiles`);
      }
    }
    
    // Delete expired profiles
    const deleted = await client.query(`
      DELETE FROM health_profiles 
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id
    `);
    
    if (deleted.rowCount > 0) {
      console.log(`Deleted ${deleted.rowCount} expired health profiles`);
    }
  }

  async enforceScanHistoryRetention(client, policy) {
    if (policy.anonymizeAfter) {
      // Anonymize old scans
      const anonymized = await client.query(`
        UPDATE scan_history 
        SET 
          user_id = NULL,
          device_id = 'ANONYMIZED',
          ip_address_hash = 'ANONYMIZED',
          anonymized = true
        WHERE 
          created_at < CURRENT_TIMESTAMP - INTERVAL '${policy.anonymizeAfter} days'
          AND anonymized = false
        RETURNING id
      `);
      
      if (anonymized.rowCount > 0) {
        console.log(`Anonymized ${anonymized.rowCount} scan records`);
      }
    }
    
    // Delete expired scans
    const deleted = await client.query(`
      DELETE FROM scan_history 
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id
    `);
    
    if (deleted.rowCount > 0) {
      console.log(`Deleted ${deleted.rowCount} expired scan records`);
    }
  }

  async enforceAIInteractionRetention(client, policy) {
    if (policy.anonymizeAfter) {
      // Anonymize old AI interactions
      const anonymized = await client.query(`
        UPDATE ai_interactions 
        SET 
          user_id = NULL,
          prompt_hash = 'ANONYMIZED'
        WHERE 
          created_at < CURRENT_TIMESTAMP - INTERVAL '${policy.anonymizeAfter} days'
          AND prompt_hash != 'ANONYMIZED'
        RETURNING id
      `);
      
      if (anonymized.rowCount > 0) {
        console.log(`Anonymized ${anonymized.rowCount} AI interaction records`);
      }
    }
    
    // Delete expired interactions
    const deleted = await client.query(`
      DELETE FROM ai_interactions 
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id
    `);
    
    if (deleted.rowCount > 0) {
      console.log(`Deleted ${deleted.rowCount} expired AI interactions`);
    }
  }

  async enforcePaymentRetention(client, policy) {
    // Payment records have 7-year retention for tax purposes
    // Only delete if explicitly marked for deletion after legal period
    const deleted = await client.query(`
      DELETE FROM payment_transactions 
      WHERE 
        expires_at < CURRENT_TIMESTAMP
        AND created_at < CURRENT_TIMESTAMP - INTERVAL '${policy.days} days'
      RETURNING id
    `);
    
    if (deleted.rowCount > 0) {
      console.log(`Deleted ${deleted.rowCount} expired payment records`);
    }
  }

  async enforceAuditLogRetention(client, policy) {
    // Delete old audit logs
    const deleted = await client.query(`
      DELETE FROM audit_logs 
      WHERE expires_at < CURRENT_TIMESTAMP
      RETURNING id
    `);
    
    if (deleted.rowCount > 0) {
      console.log(`Deleted ${deleted.rowCount} expired audit logs`);
    }
  }

  async enforceSecurityIncidentRetention(client, policy) {
    // Archive resolved incidents older than retention period
    const archived = await client.query(`
      UPDATE security_incidents 
      SET description = 'ARCHIVED - Details removed for privacy'
      WHERE 
        resolved_at < CURRENT_TIMESTAMP - INTERVAL '${policy.days} days'
        AND description NOT LIKE 'ARCHIVED%'
      RETURNING id
    `);
    
    if (archived.rowCount > 0) {
      console.log(`Archived ${archived.rowCount} old security incidents`);
    }
  }

  async deleteExpiredData() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Delete all expired records
      const queries = [
        'DELETE FROM scan_history WHERE expires_at < CURRENT_TIMESTAMP',
        'DELETE FROM ai_interactions WHERE expires_at < CURRENT_TIMESTAMP',
        'DELETE FROM audit_logs WHERE expires_at < CURRENT_TIMESTAMP',
        'DELETE FROM consent_records WHERE expires_at < CURRENT_TIMESTAMP'
      ];
      
      let totalDeleted = 0;
      for (const query of queries) {
        const result = await client.query(query);
        totalDeleted += result.rowCount;
      }
      
      await client.query('COMMIT');
      
      if (totalDeleted > 0) {
        console.log(`Deleted ${totalDeleted} expired records`);
      }
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting expired data:', error);
    } finally {
      client.release();
    }
  }

  async anonymizeOldData() {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Anonymize various data types
      await this.enforceScanHistoryRetention(client, this.retentionPolicies.scanHistory);
      await this.enforceAIInteractionRetention(client, this.retentionPolicies.aiInteractions);
      
      await client.query('COMMIT');
      console.log('Data anonymization completed');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error anonymizing data:', error);
    } finally {
      client.release();
    }
  }

  async handleUserDeletionRequest(userId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Mark user for deletion (30-day grace period)
      await client.query(`
        UPDATE users 
        SET 
          deletion_requested_at = CURRENT_TIMESTAMP,
          deletion_scheduled_at = CURRENT_TIMESTAMP + INTERVAL '30 days'
        WHERE id = $1
      `, [userId]);
      
      // Log the privacy request
      await client.query(`
        INSERT INTO privacy_requests 
        (user_id, request_type, status, requested_at, deadline_at)
        VALUES ($1, 'deletion', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days')
      `, [userId]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        message: 'Deletion request received. Your data will be deleted within 30 days.',
        scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error processing deletion request:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async handleDataExportRequest(userId) {
    const client = await this.pool.connect();
    
    try {
      // Gather all user data
      const userData = {};
      
      // User profile
      const userResult = await client.query(`
        SELECT * FROM users WHERE id = $1
      `, [userId]);
      userData.profile = userResult.rows[0];
      
      // Health profile
      const healthResult = await client.query(`
        SELECT * FROM health_profiles WHERE user_id = $1
      `, [userId]);
      userData.healthProfile = healthResult.rows;
      
      // Scan history
      const scanResult = await client.query(`
        SELECT * FROM scan_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);
      userData.scanHistory = scanResult.rows;
      
      // AI interactions
      const aiResult = await client.query(`
        SELECT * FROM ai_interactions 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [userId]);
      userData.aiInteractions = aiResult.rows;
      
      // Consent records
      const consentResult = await client.query(`
        SELECT * FROM consent_records 
        WHERE user_id = $1 
        ORDER BY granted_at DESC
      `, [userId]);
      userData.consentRecords = consentResult.rows;
      
      // Log the privacy request
      await client.query(`
        INSERT INTO privacy_requests 
        (user_id, request_type, status, requested_at, completed_at, response_data)
        VALUES ($1, 'access', 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $2)
      `, [userId, JSON.stringify({ exported: true })]);
      
      return userData;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async generateComplianceReport() {
    const client = await this.pool.connect();
    
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        metrics: {}
      };
      
      // Count active users
      const activeUsers = await client.query(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE last_active_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);
      report.metrics.activeUsers = parseInt(activeUsers.rows[0].count);
      
      // Count deletion requests
      const deletionRequests = await client.query(`
        SELECT COUNT(*) as count 
        FROM privacy_requests 
        WHERE request_type = 'deletion' 
        AND requested_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);
      report.metrics.deletionRequests = parseInt(deletionRequests.rows[0].count);
      
      // Count data exports
      const exportRequests = await client.query(`
        SELECT COUNT(*) as count 
        FROM privacy_requests 
        WHERE request_type IN ('access', 'portability') 
        AND requested_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      `);
      report.metrics.exportRequests = parseInt(exportRequests.rows[0].count);
      
      // Anonymized data count
      const anonymizedScans = await client.query(`
        SELECT COUNT(*) as count 
        FROM scan_history 
        WHERE anonymized = true
      `);
      report.metrics.anonymizedRecords = parseInt(anonymizedScans.rows[0].count);
      
      // Security incidents
      const incidents = await client.query(`
        SELECT severity, COUNT(*) as count 
        FROM security_incidents 
        WHERE detected_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
        GROUP BY severity
      `);
      report.metrics.securityIncidents = incidents.rows;
      
      console.log('Compliance report generated:', report);
      return report;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = DataRetentionManager;