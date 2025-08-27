/**
 * Production Health Monitoring System
 * Ensures server reliability and uptime
 */

const os = require('os');
const process = require('process');

class HealthMonitor {
  constructor() {
    this.startTime = Date.now();
    this.requestCount = 0;
    this.errorCount = 0;
    this.lastError = null;
    this.responseTime = [];
    this.maxResponseTimeSamples = 100;
  }

  // Track request metrics
  trackRequest(duration) {
    this.requestCount++;
    this.responseTime.push(duration);
    
    // Keep only last N samples
    if (this.responseTime.length > this.maxResponseTimeSamples) {
      this.responseTime.shift();
    }
  }

  // Track errors
  trackError(error) {
    this.errorCount++;
    this.lastError = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
  }

  // Calculate average response time
  getAverageResponseTime() {
    if (this.responseTime.length === 0) return 0;
    const sum = this.responseTime.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTime.length);
  }

  // Get comprehensive health status
  getHealthStatus() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const memoryUsage = process.memoryUsage();
    const cpuUsage = os.loadavg();

    return {
      status: this.errorCount > 50 ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      metrics: {
        requestCount: this.requestCount,
        errorCount: this.errorCount,
        errorRate: this.requestCount > 0 ? 
          (this.errorCount / this.requestCount * 100).toFixed(2) + '%' : '0%',
        averageResponseTime: this.getAverageResponseTime() + 'ms'
      },
      system: {
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1) + '%'
        },
        cpu: {
          loadAverage: cpuUsage.map(load => load.toFixed(2)),
          cores: os.cpus().length
        },
        platform: os.platform(),
        nodeVersion: process.version
      },
      lastError: this.lastError
    };
  }

  // Format uptime in human-readable format
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  // Auto-restart if critical errors detected
  checkCriticalStatus() {
    const errorThreshold = 100;
    const memoryThreshold = 0.9; // 90% memory usage
    
    const memoryUsage = process.memoryUsage();
    const memoryPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;

    if (this.errorCount > errorThreshold) {
      console.error('⚠️ Critical: Error threshold exceeded. Consider restart.');
      return { restart: true, reason: 'error_threshold' };
    }

    if (memoryPercentage > memoryThreshold) {
      console.error('⚠️ Critical: Memory threshold exceeded. Consider restart.');
      return { restart: true, reason: 'memory_threshold' };
    }

    return { restart: false };
  }

  // Middleware for Express
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Track response time
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        this.trackRequest(duration);
        
        // Log slow requests
        if (duration > 5000) {
          console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${duration}ms`);
        }
      });

      next();
    };
  }
}

module.exports = HealthMonitor;