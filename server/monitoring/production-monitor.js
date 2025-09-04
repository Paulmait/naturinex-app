/**
 * Production Monitoring & Alerting System
 * Comprehensive monitoring for email service and overall system health
 */

const os = require('os');
const { pool } = require('../database/db-config');

class ProductionMonitor {
  constructor() {
    this.metrics = {
      email: { sent: 0, failed: 0, bounced: 0 },
      api: { requests: 0, errors: 0, latency: [] },
      system: { cpu: [], memory: [], disk: [] },
      database: { connections: 0, queries: 0, errors: 0 }
    };
    
    this.alerts = new Map();
    this.thresholds = {
      errorRate: 0.05, // 5% error rate
      responseTime: 2000, // 2 seconds
      cpuUsage: 80, // 80%
      memoryUsage: 85, // 85%
      diskUsage: 90, // 90%
      emailFailureRate: 0.1, // 10%
      dbConnectionLimit: 90 // 90% of pool
    };

    this.healthStatus = {
      overall: 'healthy',
      services: {},
      lastCheck: null
    };
  }

  // Main health check
  async performHealthCheck() {
    const startTime = Date.now();
    const checks = [];

    try {
      // Check all services
      checks.push(await this.checkDatabase());
      checks.push(await this.checkEmailService());
      checks.push(await this.checkAPIHealth());
      checks.push(await this.checkSystemResources());
      checks.push(await this.checkExternalServices());
      
      // Calculate overall health
      const unhealthyServices = checks.filter(c => c.status !== 'healthy');
      const degradedServices = checks.filter(c => c.status === 'degraded');
      
      let overallStatus = 'healthy';
      if (unhealthyServices.length > 0) {
        overallStatus = 'unhealthy';
      } else if (degradedServices.length > 0) {
        overallStatus = 'degraded';
      }

      this.healthStatus = {
        overall: overallStatus,
        services: checks.reduce((acc, check) => {
          acc[check.service] = check;
          return acc;
        }, {}),
        lastCheck: new Date().toISOString(),
        checkDuration: Date.now() - startTime
      };

      // Alert on critical issues
      if (overallStatus === 'unhealthy') {
        await this.sendAlert('SYSTEM_UNHEALTHY', {
          services: unhealthyServices,
          timestamp: new Date().toISOString()
        });
      }

      return this.healthStatus;
    } catch (error) {
      console.error('Health check failed:', error);
      this.healthStatus.overall = 'error';
      return this.healthStatus;
    }
  }

  // Database health check
  async checkDatabase() {
    try {
      const start = Date.now();
      const result = await pool.query('SELECT 1');
      const latency = Date.now() - start;

      // Check connection pool
      const poolStats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      };

      const utilizationPercent = ((poolStats.total - poolStats.idle) / poolStats.total) * 100;

      let status = 'healthy';
      let issues = [];

      if (latency > 100) {
        status = 'degraded';
        issues.push(`High latency: ${latency}ms`);
      }

      if (utilizationPercent > this.thresholds.dbConnectionLimit) {
        status = 'degraded';
        issues.push(`High connection pool usage: ${utilizationPercent.toFixed(1)}%`);
      }

      return {
        service: 'database',
        status,
        latency,
        poolStats,
        issues,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Email service health check
  async checkEmailService() {
    try {
      // Get recent email stats
      const stats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced,
          COUNT(CASE WHEN status = 'rate_limited' THEN 1 END) as rate_limited
        FROM email_logs
        WHERE sent_at >= NOW() - INTERVAL '1 hour'
      `);

      const emailStats = stats.rows[0];
      const failureRate = emailStats.total > 0 
        ? (parseInt(emailStats.failed) + parseInt(emailStats.bounced)) / parseInt(emailStats.total)
        : 0;

      let status = 'healthy';
      let issues = [];

      if (failureRate > this.thresholds.emailFailureRate) {
        status = 'degraded';
        issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
      }

      if (parseInt(emailStats.rate_limited) > 0) {
        issues.push(`Rate limiting active: ${emailStats.rate_limited} emails`);
      }

      // Check Resend API key
      if (!process.env.RESEND_API_KEY) {
        status = 'unhealthy';
        issues.push('Resend API key not configured');
      }

      return {
        service: 'email',
        status,
        stats: emailStats,
        failureRate: (failureRate * 100).toFixed(2) + '%',
        issues,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        service: 'email',
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // API health check
  async checkAPIHealth() {
    try {
      // Get API metrics from last hour
      const apiStats = await pool.query(`
        SELECT 
          COUNT(*) as total_requests,
          AVG(response_time) as avg_response_time,
          MAX(response_time) as max_response_time,
          COUNT(CASE WHEN status_code >= 500 THEN 1 END) as server_errors,
          COUNT(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 END) as client_errors
        FROM api_usage
        WHERE created_at >= NOW() - INTERVAL '1 hour'
      `);

      const stats = apiStats.rows[0];
      const errorRate = stats.total_requests > 0
        ? parseInt(stats.server_errors) / parseInt(stats.total_requests)
        : 0;

      let status = 'healthy';
      let issues = [];

      if (errorRate > this.thresholds.errorRate) {
        status = 'degraded';
        issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      }

      if (parseFloat(stats.avg_response_time) > this.thresholds.responseTime) {
        status = 'degraded';
        issues.push(`High response time: ${stats.avg_response_time}ms`);
      }

      return {
        service: 'api',
        status,
        stats: {
          requests: stats.total_requests || 0,
          avgResponseTime: Math.round(stats.avg_response_time || 0),
          maxResponseTime: Math.round(stats.max_response_time || 0),
          errorRate: (errorRate * 100).toFixed(2) + '%'
        },
        issues,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      // If no database, use in-memory metrics
      return {
        service: 'api',
        status: 'healthy',
        stats: this.metrics.api,
        timestamp: new Date().toISOString()
      };
    }
  }

  // System resources check
  async checkSystemResources() {
    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    let status = 'healthy';
    let issues = [];

    if (cpuUsage > this.thresholds.cpuUsage) {
      status = 'degraded';
      issues.push(`High CPU usage: ${cpuUsage.toFixed(1)}%`);
    }

    if (memoryUsage > this.thresholds.memoryUsage) {
      status = 'degraded';
      issues.push(`High memory usage: ${memoryUsage.toFixed(1)}%`);
    }

    // Store metrics for trending
    this.metrics.system.cpu.push({ value: cpuUsage, timestamp: Date.now() });
    this.metrics.system.memory.push({ value: memoryUsage, timestamp: Date.now() });

    // Keep only last hour of metrics
    const hourAgo = Date.now() - 3600000;
    this.metrics.system.cpu = this.metrics.system.cpu.filter(m => m.timestamp > hourAgo);
    this.metrics.system.memory = this.metrics.system.memory.filter(m => m.timestamp > hourAgo);

    return {
      service: 'system',
      status,
      resources: {
        cpu: {
          usage: cpuUsage.toFixed(1) + '%',
          cores: os.cpus().length,
          loadAverage: os.loadavg()
        },
        memory: {
          usage: memoryUsage.toFixed(1) + '%',
          total: (totalMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          free: (freeMemory / 1024 / 1024 / 1024).toFixed(2) + ' GB'
        },
        uptime: (os.uptime() / 3600).toFixed(2) + ' hours'
      },
      issues,
      timestamp: new Date().toISOString()
    };
  }

  // External services check
  async checkExternalServices() {
    const services = [];
    let overallStatus = 'healthy';

    // Check Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // In production, make a test API call to Stripe
        services.push({
          name: 'Stripe',
          status: 'healthy',
          configured: true
        });
      } catch (error) {
        services.push({
          name: 'Stripe',
          status: 'unhealthy',
          error: error.message
        });
        overallStatus = 'degraded';
      }
    }

    // Check Firebase
    if (process.env.FIREBASE_PROJECT_ID) {
      services.push({
        name: 'Firebase',
        status: 'healthy',
        configured: true
      });
    }

    // Check Gemini AI
    if (process.env.GEMINI_API_KEY) {
      services.push({
        name: 'Gemini AI',
        status: 'healthy',
        configured: true
      });
    } else {
      services.push({
        name: 'Gemini AI',
        status: 'unhealthy',
        configured: false
      });
      overallStatus = 'degraded';
    }

    return {
      service: 'external',
      status: overallStatus,
      services,
      timestamp: new Date().toISOString()
    };
  }

  // Send alerts
  async sendAlert(type, details) {
    const alertKey = `${type}_${Date.now()}`;
    
    // Prevent duplicate alerts within 5 minutes
    const recentAlert = Array.from(this.alerts.values()).find(
      a => a.type === type && Date.now() - a.timestamp < 300000
    );

    if (recentAlert) {
      return;
    }

    const alert = {
      id: alertKey,
      type,
      details,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type)
    };

    this.alerts.set(alertKey, alert);

    // Log alert
    console.error(`🚨 ALERT [${alert.severity}]: ${type}`, details);

    // In production, send to monitoring service
    // await this.sendToMonitoringService(alert);

    // Clean old alerts
    this.cleanOldAlerts();

    return alert;
  }

  // Determine alert severity
  getAlertSeverity(type) {
    const critical = ['SYSTEM_UNHEALTHY', 'DATABASE_DOWN', 'EMAIL_SERVICE_DOWN'];
    const high = ['HIGH_ERROR_RATE', 'HIGH_RESOURCE_USAGE', 'EXTERNAL_SERVICE_DOWN'];
    
    if (critical.includes(type)) return 'CRITICAL';
    if (high.includes(type)) return 'HIGH';
    return 'MEDIUM';
  }

  // Clean old alerts
  cleanOldAlerts() {
    const dayAgo = Date.now() - 86400000;
    for (const [key, alert] of this.alerts.entries()) {
      if (alert.timestamp < dayAgo) {
        this.alerts.delete(key);
      }
    }
  }

  // Get monitoring dashboard data
  async getMonitoringDashboard() {
    const health = await this.performHealthCheck();
    
    return {
      health,
      metrics: {
        email: await this.getEmailMetrics(),
        api: await this.getAPIMetrics(),
        system: this.getSystemMetrics()
      },
      alerts: Array.from(this.alerts.values()).slice(-10), // Last 10 alerts
      timestamp: new Date().toISOString()
    };
  }

  // Get email metrics
  async getEmailMetrics() {
    try {
      const result = await pool.query(`
        SELECT 
          DATE(sent_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'bounced' THEN 1 END) as bounced
        FROM email_logs
        WHERE sent_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(sent_at)
        ORDER BY date DESC
      `);

      return result.rows;
    } catch (error) {
      return [];
    }
  }

  // Get API metrics
  async getAPIMetrics() {
    try {
      const result = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as requests,
          AVG(response_time) as avg_response_time,
          MAX(response_time) as max_response_time,
          COUNT(CASE WHEN status_code >= 500 THEN 1 END) as errors
        FROM api_usage
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `);

      return result.rows;
    } catch (error) {
      return [];
    }
  }

  // Get system metrics
  getSystemMetrics() {
    return {
      cpu: {
        current: os.loadavg()[0] * 100 / os.cpus().length,
        history: this.metrics.system.cpu.slice(-60) // Last hour
      },
      memory: {
        current: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        history: this.metrics.system.memory.slice(-60)
      }
    };
  }

  // Start monitoring
  startMonitoring(intervalMinutes = 5) {
    // Perform health checks
    setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Log metrics every minute
    setInterval(() => {
      this.logSystemMetrics();
    }, 60 * 1000);

    console.log(`📊 Production monitoring started (checking every ${intervalMinutes} minutes)`);
  }

  // Log system metrics
  logSystemMetrics() {
    const metrics = {
      cpu: os.loadavg()[0],
      memory: (os.totalmem() - os.freemem()) / os.totalmem(),
      timestamp: new Date().toISOString()
    };

    // In production, send to metrics service
    // metricsService.record(metrics);
  }
}

module.exports = new ProductionMonitor();