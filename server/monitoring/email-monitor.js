const { pool } = require('../database/db-config');
const emailService = require('../services/email-service');

class EmailMonitor {
  constructor() {
    this.alerts = new Map();
    this.thresholds = {
      failureRate: 0.1, // 10% failure rate
      bounceRate: 0.05, // 5% bounce rate  
      complaintRate: 0.001, // 0.1% complaint rate
      minEmails: 100 // Minimum emails before alerting
    };
  }

  // Monitor email health
  async checkEmailHealth() {
    try {
      const stats = await this.getRecentStats();
      
      const issues = [];

      // Check failure rate
      if (stats.total >= this.thresholds.minEmails) {
        const failureRate = stats.failed / stats.total;
        if (failureRate > this.thresholds.failureRate) {
          issues.push({
            type: 'high_failure_rate',
            severity: 'critical',
            message: `Email failure rate is ${(failureRate * 100).toFixed(2)}%`,
            value: failureRate
          });
        }
      }

      // Check bounce rate
      if (stats.bounced && stats.total >= this.thresholds.minEmails) {
        const bounceRate = stats.bounced / stats.total;
        if (bounceRate > this.thresholds.bounceRate) {
          issues.push({
            type: 'high_bounce_rate',
            severity: 'warning',
            message: `Email bounce rate is ${(bounceRate * 100).toFixed(2)}%`,
            value: bounceRate
          });
        }
      }

      // Check rate limiting
      if (stats.rate_limited > 0) {
        issues.push({
          type: 'rate_limiting',
          severity: 'warning',
          message: `${stats.rate_limited} emails were rate limited`,
          value: stats.rate_limited
        });
      }

      // Log issues
      for (const issue of issues) {
        await this.logIssue(issue);
        
        // Send alert if critical
        if (issue.severity === 'critical') {
          await this.sendAlert(issue);
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
        stats
      };
    } catch (error) {
      console.error('Email health check error:', error);
      throw error;
    }
  }

  // Get recent email statistics
  async getRecentStats() {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
        COUNT(CASE WHEN status = 'complaint' THEN 1 END) as complaints,
        COUNT(CASE WHEN status = 'rate_limited' THEN 1 END) as rate_limited
       FROM email_logs
       WHERE sent_at >= NOW() - INTERVAL '1 hour'`
    );

    return result.rows[0];
  }

  // Log monitoring issue
  async logIssue(issue) {
    try {
      await pool.query(
        `INSERT INTO monitoring_logs (
          service, 
          issue_type, 
          severity, 
          message, 
          metadata,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        ['email', issue.type, issue.severity, issue.message, JSON.stringify(issue)]
      );
    } catch (error) {
      console.error('Failed to log monitoring issue:', error);
    }
  }

  // Send alert for critical issues
  async sendAlert(issue) {
    // Check if we've already sent an alert recently
    const alertKey = `${issue.type}_${issue.severity}`;
    const lastAlert = this.alerts.get(alertKey);
    
    if (lastAlert && Date.now() - lastAlert < 3600000) { // 1 hour cooldown
      return;
    }

    try {
      // Send alert to admins
      const admins = await this.getAdminEmails();
      
      for (const admin of admins) {
        await emailService.sendEmail(admin, 'systemAlert', {
          issue,
          timestamp: new Date().toISOString()
        });
      }

      this.alerts.set(alertKey, Date.now());
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Get admin email addresses
  async getAdminEmails() {
    const result = await pool.query(
      `SELECT email 
       FROM users 
       WHERE role = 'admin' 
       AND email_verified = true`
    );

    return result.rows.map(r => r.email);
  }

  // Clean old email logs
  async cleanOldLogs(daysToKeep = 30) {
    try {
      const result = await pool.query(
        `DELETE FROM email_logs 
         WHERE sent_at < NOW() - INTERVAL '${daysToKeep} days'
         RETURNING id`
      );

      console.log(`Cleaned ${result.rowCount} old email logs`);
      return result.rowCount;
    } catch (error) {
      console.error('Failed to clean old logs:', error);
      throw error;
    }
  }

  // Process email bounces from webhook
  async processBounce(data) {
    try {
      // Add to blacklist
      await pool.query(
        `INSERT INTO email_blacklist (email, reason, metadata)
         VALUES ($1, 'bounce', $2)
         ON CONFLICT (email) DO UPDATE
         SET reason = 'bounce', metadata = $2`,
        [data.email, JSON.stringify(data)]
      );

      // Update email log
      await pool.query(
        `UPDATE email_logs 
         SET status = 'bounced', 
             error = $2
         WHERE recipient = $1 
         AND sent_at >= NOW() - INTERVAL '24 hours'`,
        [data.email, data.reason || 'Email bounced']
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to process bounce:', error);
      throw error;
    }
  }

  // Process email complaints from webhook
  async processComplaint(data) {
    try {
      // Add to blacklist
      await pool.query(
        `INSERT INTO email_blacklist (email, reason, metadata)
         VALUES ($1, 'complaint', $2)
         ON CONFLICT (email) DO UPDATE
         SET reason = 'complaint', metadata = $2`,
        [data.email, JSON.stringify(data)]
      );

      // Update user preferences to unsubscribe
      await pool.query(
        `UPDATE email_preferences
         SET scan_alerts = false,
             product_updates = false,
             newsletter = false
         WHERE user_id = (SELECT id FROM users WHERE email = $1)`,
        [data.email]
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to process complaint:', error);
      throw error;
    }
  }

  // Get email performance metrics
  async getPerformanceMetrics(days = 7) {
    try {
      const result = await pool.query(
        `SELECT 
          DATE(sent_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'opened' THEN 1 END) as opened,
          COUNT(CASE WHEN status = 'clicked' THEN 1 END) as clicked,
          AVG(CASE 
            WHEN status = 'opened' 
            THEN EXTRACT(EPOCH FROM (opened_at - sent_at))/60 
          END) as avg_open_time_minutes
         FROM email_logs
         WHERE sent_at >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(sent_at)
         ORDER BY date DESC`,
        []
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  // Start monitoring
  startMonitoring(intervalMinutes = 15) {
    // Run health check periodically
    setInterval(async () => {
      try {
        const health = await this.checkEmailHealth();
        if (!health.healthy) {
          console.warn('Email health issues detected:', health.issues);
        }
      } catch (error) {
        console.error('Email monitoring error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Clean old logs daily
    setInterval(async () => {
      try {
        await this.cleanOldLogs();
      } catch (error) {
        console.error('Log cleanup error:', error);
      }
    }, 24 * 60 * 60 * 1000);

    console.log(`Email monitoring started (checking every ${intervalMinutes} minutes)`);
  }
}

module.exports = new EmailMonitor();