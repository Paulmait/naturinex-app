// HIPAA-Compliant Audit Logging Service
// Tracks all access to PHI (Protected Health Information)

import { supabase } from '../config/supabase';
import ErrorService from './ErrorService';

// HIPAA requires logging these access types
const ACCESS_TYPES = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  SEARCH: 'search',
  EXPORT: 'export',
  PRINT: 'print',
  LOGIN: 'login',
  LOGOUT: 'logout',
  FAILED_LOGIN: 'failed_login',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
};

const RESOURCE_TYPES = {
  SCAN: 'scan',
  MEDICATION: 'medication',
  USER_PROFILE: 'user_profile',
  MEDICAL_HISTORY: 'medical_history',
  PRESCRIPTION: 'prescription',
  LAB_RESULT: 'lab_result',
  CONSULTATION: 'consultation',
  PAYMENT: 'payment',
};

const SEVERITY_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

class AuditLogger {
  constructor() {
    this.enabled = true;
    this.batchSize = 50;
    this.flushInterval = 30000; // 30 seconds
    this.auditQueue = [];
    this.isProcessing = false;

    // Start automatic flushing
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.flushQueue(), this.flushInterval);
    }
  }

  /**
   * Log access to PHI
   * @param {Object} logEntry - Audit log entry
   */
  async logAccess(logEntry) {
    try {
      const entry = this.createAuditEntry(logEntry);

      // Validate entry
      this.validateEntry(entry);

      // Add to queue
      this.auditQueue.push(entry);

      // Flush if queue is full
      if (this.auditQueue.length >= this.batchSize) {
        await this.flushQueue();
      }

      // For critical events, flush immediately
      if (entry.severity === SEVERITY_LEVELS.CRITICAL) {
        await this.flushQueue();
      }

      return true;
    } catch (error) {
      // Audit logging should never break the app
      console.error('[AUDIT] Failed to log access:', error);
      // Log the audit failure itself
      await ErrorService.logError(error, 'AuditLogger.logAccess');
      return false;
    }
  }

  /**
   * Create standardized audit entry
   */
  createAuditEntry(logEntry) {
    return {
      // Who
      user_id: logEntry.userId || 'anonymous',
      user_role: logEntry.userRole || 'patient',
      session_id: logEntry.sessionId,

      // What
      action: logEntry.action,
      resource_type: logEntry.resourceType,
      resource_id: logEntry.resourceId,

      // When
      timestamp: new Date().toISOString(),

      // Where
      ip_address: logEntry.ipAddress,
      device_info: {
        platform: logEntry.platform,
        user_agent: logEntry.userAgent,
        device_id: logEntry.deviceId,
      },

      // Why (optional context)
      reason: logEntry.reason,

      // How (success or failure)
      status: logEntry.status || 'success',
      error_message: logEntry.errorMessage,

      // Severity
      severity: logEntry.severity || SEVERITY_LEVELS.INFO,

      // Additional metadata (no PHI!)
      metadata: this.sanitizeMetadata(logEntry.metadata),

      // Change tracking (for update/delete)
      changes: logEntry.changes ? this.hashSensitiveData(logEntry.changes) : null,
    };
  }

  /**
   * Validate audit entry
   */
  validateEntry(entry) {
    const required = ['user_id', 'action', 'resource_type', 'timestamp'];

    for (const field of required) {
      if (!entry[field]) {
        throw new Error(`Missing required audit field: ${field}`);
      }
    }

    // Validate action
    if (!Object.values(ACCESS_TYPES).includes(entry.action)) {
      throw new Error(`Invalid audit action: ${entry.action}`);
    }

    // Validate resource type
    if (!Object.values(RESOURCE_TYPES).includes(entry.resource_type)) {
      throw new Error(`Invalid resource type: ${entry.resource_type}`);
    }

    return true;
  }

  /**
   * Remove PHI from metadata
   */
  sanitizeMetadata(metadata) {
    if (!metadata) return {};

    const sanitized = { ...metadata };

    // Remove fields that might contain PHI
    const phiFields = [
      'medication_name',
      'diagnosis',
      'symptoms',
      'prescription',
      'lab_results',
      'notes',
      'comments',
      'name',
      'email',
      'phone',
      'address',
      'ssn',
      'date_of_birth',
    ];

    for (const field of phiFields) {
      if (sanitized[field]) {
        // Replace with indicator that field existed
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Hash sensitive data for change tracking
   */
  hashSensitiveData(data) {
    // Create a hash of sensitive fields for integrity verification
    // without storing the actual data
    try {
      const str = JSON.stringify(data);
      // Simple hash (in production, use proper cryptographic hash)
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return {
        hash: hash.toString(16),
        field_count: Object.keys(data).length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Flush audit queue to database
   */
  async flushQueue() {
    if (this.isProcessing || this.auditQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const entries = [...this.auditQueue];
      this.auditQueue = [];

      // Insert into audit log table
      const { error } = await supabase
        .from('audit_logs')
        .insert(entries);

      if (error) {
        // If insertion fails, put entries back in queue
        this.auditQueue = [...entries, ...this.auditQueue];
        throw error;
      }

      // Successfully logged
      return true;
    } catch (error) {
      console.error('[AUDIT] Failed to flush queue:', error);
      await ErrorService.logError(error, 'AuditLogger.flushQueue');
      return false;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Log scan access
   */
  async logScanAccess(userId, scanId, action, metadata = {}) {
    return this.logAccess({
      userId,
      action,
      resourceType: RESOURCE_TYPES.SCAN,
      resourceId: scanId,
      metadata,
    });
  }

  /**
   * Log medication lookup
   */
  async logMedicationLookup(userId, metadata = {}) {
    return this.logAccess({
      userId,
      action: ACCESS_TYPES.SEARCH,
      resourceType: RESOURCE_TYPES.MEDICATION,
      metadata: {
        ...metadata,
        // Don't log actual medication name
        has_medication: !!metadata.medication_name,
      },
    });
  }

  /**
   * Log authentication events
   */
  async logLogin(userId, status, ipAddress, deviceInfo) {
    return this.logAccess({
      userId,
      action: status === 'success' ? ACCESS_TYPES.LOGIN : ACCESS_TYPES.FAILED_LOGIN,
      resourceType: RESOURCE_TYPES.USER_PROFILE,
      resourceId: userId,
      status,
      severity: status === 'failed' ? SEVERITY_LEVELS.WARNING : SEVERITY_LEVELS.INFO,
      ipAddress,
      ...deviceInfo,
    });
  }

  /**
   * Log unauthorized access attempts
   */
  async logUnauthorizedAccess(userId, resourceType, resourceId, metadata = {}) {
    return this.logAccess({
      userId: userId || 'anonymous',
      action: ACCESS_TYPES.UNAUTHORIZED_ACCESS,
      resourceType,
      resourceId,
      status: 'failed',
      severity: SEVERITY_LEVELS.CRITICAL,
      metadata,
    });
  }

  /**
   * Log data export (critical for HIPAA)
   */
  async logDataExport(userId, exportType, metadata = {}) {
    return this.logAccess({
      userId,
      action: ACCESS_TYPES.EXPORT,
      resourceType: exportType,
      status: 'success',
      severity: SEVERITY_LEVELS.WARNING, // Exports are monitored closely
      metadata,
    });
  }

  /**
   * Get audit trail for a user (admin function)
   */
  async getAuditTrail(userId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        action,
        resourceType,
        limit = 100,
      } = options;

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      await ErrorService.logError(error, 'AuditLogger.getAuditTrail');
      throw new Error('Failed to retrieve audit trail');
    }
  }

  /**
   * Get security alerts (failed logins, unauthorized access)
   */
  async getSecurityAlerts(options = {}) {
    try {
      const { limit = 50, hoursBack = 24 } = options;

      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hoursBack);

      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', [ACCESS_TYPES.FAILED_LOGIN, ACCESS_TYPES.UNAUTHORIZED_ACCESS])
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      await ErrorService.logError(error, 'AuditLogger.getSecurityAlerts');
      return [];
    }
  }

  /**
   * Check for suspicious activity
   */
  async detectSuspiciousActivity(userId) {
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      // Check for multiple failed logins
      const { data: failedLogins } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('action', ACCESS_TYPES.FAILED_LOGIN)
        .gte('timestamp', oneHourAgo.toISOString());

      if (failedLogins && failedLogins.length >= 5) {
        return {
          suspicious: true,
          reason: 'Multiple failed login attempts',
          count: failedLogins.length,
        };
      }

      // Check for unauthorized access attempts
      const { data: unauthorized } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('action', ACCESS_TYPES.UNAUTHORIZED_ACCESS)
        .gte('timestamp', oneHourAgo.toISOString());

      if (unauthorized && unauthorized.length >= 3) {
        return {
          suspicious: true,
          reason: 'Multiple unauthorized access attempts',
          count: unauthorized.length,
        };
      }

      return { suspicious: false };
    } catch (error) {
      await ErrorService.logError(error, 'AuditLogger.detectSuspiciousActivity');
      return { suspicious: false, error: true };
    }
  }

  /**
   * Enable/disable audit logging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      // Flush remaining logs before disabling
      this.flushQueue();
    }
  }

  /**
   * Get audit statistics (admin function)
   */
  async getAuditStatistics(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, resource_type, severity')
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: data.length,
        byAction: {},
        byResourceType: {},
        bySeverity: {},
      };

      data.forEach(entry => {
        // Count by action
        stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;

        // Count by resource type
        stats.byResourceType[entry.resource_type] =
          (stats.byResourceType[entry.resource_type] || 0) + 1;

        // Count by severity
        stats.bySeverity[entry.severity] =
          (stats.bySeverity[entry.severity] || 0) + 1;
      });

      return stats;
    } catch (error) {
      await ErrorService.logError(error, 'AuditLogger.getAuditStatistics');
      throw new Error('Failed to calculate audit statistics');
    }
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

// Export singleton
export default auditLogger;

// Export enums
export { ACCESS_TYPES, RESOURCE_TYPES, SEVERITY_LEVELS };

// Export convenience functions
export const logScanAccess = (userId, scanId, action, metadata) =>
  auditLogger.logScanAccess(userId, scanId, action, metadata);

export const logMedicationLookup = (userId, metadata) =>
  auditLogger.logMedicationLookup(userId, metadata);

export const logLogin = (userId, status, ipAddress, deviceInfo) =>
  auditLogger.logLogin(userId, status, ipAddress, deviceInfo);

export const logUnauthorizedAccess = (userId, resourceType, resourceId, metadata) =>
  auditLogger.logUnauthorizedAccess(userId, resourceType, resourceId, metadata);

export const logDataExport = (userId, exportType, metadata) =>
  auditLogger.logDataExport(userId, exportType, metadata);
