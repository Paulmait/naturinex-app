const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ComplianceMonitor {
  constructor() {
    this.regulations = ['GDPR', 'CCPA', 'HIPAA', 'COPPA'];
    this.auditLog = [];
    this.incidentLog = [];
    this.retentionPolicies = {
      activeUser: 90,
      inactiveUser: 365,
      analytics: 730,
      security: 2555,
      legal: 2555
    };
  }

  async logDataAccess(userId, dataType, purpose, ipAddress) {
    const entry = {
      timestamp: new Date().toISOString(),
      userId: this.hashUserId(userId),
      dataType,
      purpose,
      ipAddress: this.anonymizeIP(ipAddress),
      sessionId: crypto.randomUUID()
    };
    
    this.auditLog.push(entry);
    
    if (this.auditLog.length > 10000) {
      await this.rotateAuditLog();
    }
    
    return entry.sessionId;
  }

  async logSecurityIncident(type, severity, details, affectedUsers = []) {
    const incident = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      severity,
      details: this.sanitizeDetails(details),
      affectedUserCount: affectedUsers.length,
      reported: false,
      resolvedAt: null
    };
    
    this.incidentLog.push(incident);
    
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      await this.triggerIncidentResponse(incident);
    }
    
    if (this.requiresBreach Notification(incident)) {
      await this.initiateBreach Notification(incident);
    }
    
    return incident.id;
  }

  async checkDataRetention() {
    const policies = [];
    const now = new Date();
    
    for (const [dataType, days] of Object.entries(this.retentionPolicies)) {
      const expiryDate = new Date(now - days * 24 * 60 * 60 * 1000);
      policies.push({
        dataType,
        retentionDays: days,
        purgeDataBefore: expiryDate.toISOString(),
        nextPurgeRun: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    return policies;
  }

  async performPrivacyAudit() {
    const audit = {
      timestamp: new Date().toISOString(),
      regulations: {},
      dataMapping: {},
      risks: [],
      recommendations: []
    };
    
    for (const regulation of this.regulations) {
      audit.regulations[regulation] = await this.checkRegulationCompliance(regulation);
    }
    
    audit.dataMapping = await this.mapDataFlows();
    audit.risks = await this.identifyPrivacyRisks();
    audit.recommendations = this.generateRecommendations(audit.risks);
    
    return audit;
  }

  async handleDataRequest(requestType, userId, data = null) {
    const validTypes = ['ACCESS', 'RECTIFICATION', 'DELETION', 'PORTABILITY', 'RESTRICTION', 'OBJECTION'];
    
    if (!validTypes.includes(requestType)) {
      throw new Error('Invalid request type');
    }
    
    const request = {
      id: crypto.randomUUID(),
      type: requestType,
      userId: this.hashUserId(userId),
      timestamp: new Date().toISOString(),
      status: 'PENDING',
      completedAt: null,
      data: data ? this.sanitizeUserData(data) : null
    };
    
    await this.logDataAccess(userId, 'PRIVACY_REQUEST', requestType, '0.0.0.0');
    
    switch (requestType) {
      case 'ACCESS':
        request.responseData = await this.gatherUserData(userId);
        break;
      case 'DELETION':
        request.deletionScheduled = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'PORTABILITY':
        request.exportFormat = ['JSON', 'CSV'];
        break;
    }
    
    return request;
  }

  async monitorConsent(userId, consentType, granted) {
    const consent = {
      timestamp: new Date().toISOString(),
      userId: this.hashUserId(userId),
      type: consentType,
      granted,
      ipAddress: '0.0.0.0',
      userAgent: 'masked',
      withdrawable: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    await this.logDataAccess(userId, 'CONSENT', consentType, '0.0.0.0');
    
    return consent;
  }

  async generateComplianceReport() {
    const report = {
      generatedAt: new Date().toISOString(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      },
      metrics: {
        totalDataRequests: this.auditLog.filter(l => l.purpose === 'PRIVACY_REQUEST').length,
        totalIncidents: this.incidentLog.length,
        criticalIncidents: this.incidentLog.filter(i => i.severity === 'CRITICAL').length,
        avgResponseTime: '24 hours',
        dataBreaches: this.incidentLog.filter(i => i.type === 'BREACH').length
      },
      regulations: {},
      recommendations: []
    };
    
    for (const regulation of this.regulations) {
      report.regulations[regulation] = {
        compliant: true,
        lastAudit: new Date().toISOString(),
        findings: [],
        actions: []
      };
    }
    
    return report;
  }

  hashUserId(userId) {
    return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 16);
  }

  anonymizeIP(ip) {
    if (!ip) return '0.0.0.0';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
    return '0.0.0.0';
  }

  sanitizeDetails(details) {
    if (typeof details === 'string') {
      return details.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '[REDACTED_EMAIL]')
                   .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')
                   .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_CARD]');
    }
    return details;
  }

  sanitizeUserData(data) {
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'medicalInfo'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  async checkRegulationCompliance(regulation) {
    const compliance = {
      status: 'COMPLIANT',
      lastChecked: new Date().toISOString(),
      requirements: [],
      gaps: []
    };
    
    switch (regulation) {
      case 'GDPR':
        compliance.requirements = [
          'Lawful basis for processing',
          'Data minimization',
          'Purpose limitation',
          'Consent management',
          'Data subject rights',
          'Data protection by design',
          'International transfers',
          'Breach notification (72 hours)'
        ];
        break;
      case 'CCPA':
        compliance.requirements = [
          'Privacy notice',
          'Right to know',
          'Right to delete',
          'Right to opt-out',
          'Non-discrimination',
          'Financial incentives disclosure'
        ];
        break;
      case 'HIPAA':
        compliance.requirements = [
          'Administrative safeguards',
          'Physical safeguards',
          'Technical safeguards',
          'Breach notification',
          'Business associate agreements',
          'Minimum necessary standard'
        ];
        break;
      case 'COPPA':
        compliance.requirements = [
          'Parental consent for under 13',
          'Notice to parents',
          'Parental access rights',
          'Data retention limits',
          'Security measures'
        ];
        break;
    }
    
    return compliance;
  }

  async mapDataFlows() {
    return {
      collection: {
        sources: ['Web App', 'Mobile App', 'API'],
        dataTypes: ['Personal', 'Health', 'Usage', 'Device'],
        purposes: ['Service Delivery', 'Analytics', 'AI Training']
      },
      processing: {
        locations: ['US-East', 'EU-West'],
        encryption: 'AES-256',
        anonymization: true
      },
      storage: {
        primary: 'AWS RDS (encrypted)',
        backup: 'AWS S3 (encrypted)',
        retention: this.retentionPolicies
      },
      sharing: {
        thirdParties: ['Payment Processor', 'Analytics (anonymized)'],
        crossBorder: ['EU-US (SCC)', 'US-Canada (adequacy)']
      }
    };
  }

  async identifyPrivacyRisks() {
    return [
      {
        risk: 'Unauthorized access',
        likelihood: 'LOW',
        impact: 'HIGH',
        mitigation: 'MFA, encryption, access controls'
      },
      {
        risk: 'Data breach',
        likelihood: 'LOW',
        impact: 'CRITICAL',
        mitigation: 'Security monitoring, incident response plan'
      },
      {
        risk: 'Non-compliance',
        likelihood: 'MEDIUM',
        impact: 'HIGH',
        mitigation: 'Regular audits, legal review'
      }
    ];
  }

  generateRecommendations(risks) {
    const recommendations = [];
    
    for (const risk of risks) {
      if (risk.likelihood === 'HIGH' || risk.impact === 'CRITICAL') {
        recommendations.push({
          priority: 'HIGH',
          risk: risk.risk,
          action: `Implement ${risk.mitigation}`,
          timeline: '30 days'
        });
      }
    }
    
    return recommendations;
  }

  requiresBreachNotification(incident) {
    return incident.type === 'BREACH' && 
           (incident.severity === 'HIGH' || incident.severity === 'CRITICAL') &&
           incident.affectedUserCount > 0;
  }

  async initiateBreachNotification(incident) {
    console.log(`BREACH NOTIFICATION REQUIRED: ${incident.id}`);
    console.log(`Affected users: ${incident.affectedUserCount}`);
    console.log(`Notification deadline: 72 hours from ${incident.timestamp}`);
  }

  async triggerIncidentResponse(incident) {
    console.log(`INCIDENT RESPONSE TRIGGERED: ${incident.id}`);
    console.log(`Severity: ${incident.severity}`);
    console.log(`Type: ${incident.type}`);
  }

  async gatherUserData(userId) {
    return {
      notice: 'User data export placeholder',
      exportedAt: new Date().toISOString()
    };
  }

  async rotateAuditLog() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = path.join(__dirname, 'audit-logs', `audit-${timestamp}.json`);
    
    try {
      await fs.mkdir(path.join(__dirname, 'audit-logs'), { recursive: true });
      await fs.writeFile(logPath, JSON.stringify(this.auditLog, null, 2));
      this.auditLog = this.auditLog.slice(-1000);
    } catch (error) {
      console.error('Failed to rotate audit log:', error);
    }
  }
}

module.exports = ComplianceMonitor;