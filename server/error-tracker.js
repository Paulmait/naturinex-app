/**
 * Production Error Tracking System
 * Captures and reports errors for debugging
 */

const fs = require('fs').promises;
const path = require('path');

class ErrorTracker {
  constructor(options = {}) {
    this.maxErrors = options.maxErrors || 1000;
    this.errors = [];
    this.errorLogPath = options.logPath || path.join(__dirname, 'logs');
    this.initializeLogDirectory();
  }

  async initializeLogDirectory() {
    try {
      await fs.mkdir(this.errorLogPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  // Capture and categorize errors
  captureError(error, context = {}) {
    const errorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      type: error.name || 'UnknownError',
      severity: this.determineSeverity(error),
      context: {
        ...context,
        url: context.url || 'unknown',
        method: context.method || 'unknown',
        userId: context.userId || 'anonymous',
        userAgent: context.userAgent || 'unknown'
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage()
      }
    };

    // Store in memory (limited)
    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Log to file for persistent storage
    this.logToFile(errorEntry);

    // Alert on critical errors
    if (errorEntry.severity === 'critical') {
      this.alertCriticalError(errorEntry);
    }

    return errorEntry.id;
  }

  // Determine error severity
  determineSeverity(error) {
    // Critical errors that need immediate attention
    const criticalPatterns = [
      /database.*connect/i,
      /stripe.*api/i,
      /firebase.*auth/i,
      /out.*memory/i,
      /cannot.*undefined/i
    ];

    // High severity errors
    const highPatterns = [
      /unauthorized/i,
      /forbidden/i,
      /payment.*fail/i,
      /timeout/i
    ];

    const errorString = `${error.message} ${error.stack || ''}`;

    if (criticalPatterns.some(pattern => pattern.test(errorString))) {
      return 'critical';
    }
    if (highPatterns.some(pattern => pattern.test(errorString))) {
      return 'high';
    }
    if (error.statusCode >= 500) {
      return 'high';
    }
    if (error.statusCode >= 400) {
      return 'medium';
    }
    return 'low';
  }

  // Generate unique error ID
  generateErrorId() {
    return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log errors to file
  async logToFile(errorEntry) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `errors-${date}.log`;
      const filepath = path.join(this.errorLogPath, filename);
      
      const logLine = JSON.stringify(errorEntry) + '\n';
      await fs.appendFile(filepath, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write error log:', error);
    }
  }

  // Alert critical errors (integrate with monitoring service)
  alertCriticalError(errorEntry) {
    console.error('🚨 CRITICAL ERROR DETECTED:');
    console.error(`ID: ${errorEntry.id}`);
    console.error(`Message: ${errorEntry.message}`);
    console.error(`Context: ${JSON.stringify(errorEntry.context)}`);
    
    // Here you would integrate with services like:
    // - Sentry
    // - Datadog
    // - PagerDuty
    // - Email alerts
  }

  // Get error statistics
  getStatistics() {
    const stats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      last24Hours: 0,
      topErrors: []
    };

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const errorCounts = {};

    this.errors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[error.severity]++;
      
      // Count last 24 hours
      if (new Date(error.timestamp).getTime() > oneDayAgo) {
        stats.last24Hours++;
      }
      
      // Track top errors
      const key = error.message.substring(0, 50);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    // Get top 5 errors
    stats.topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    return stats;
  }

  // Express error handler middleware
  errorHandler() {
    return (err, req, res, next) => {
      const errorId = this.captureError(err, {
        url: req.originalUrl,
        method: req.method,
        userId: req.user?.id,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        body: req.body
      });

      // Send appropriate response
      const statusCode = err.statusCode || 500;
      const message = process.env.NODE_ENV === 'production' 
        ? 'An error occurred processing your request'
        : err.message;

      res.status(statusCode).json({
        error: message,
        errorId: errorId,
        timestamp: new Date().toISOString()
      });
    };
  }

  // Clean old error logs
  async cleanOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(this.errorLogPath);
      const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('errors-')) {
          const filepath = path.join(this.errorLogPath, file);
          const stats = await fs.stat(filepath);
          
          if (stats.mtimeMs < cutoffDate) {
            await fs.unlink(filepath);
            console.log(`Cleaned old log: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning old logs:', error);
    }
  }
}

module.exports = ErrorTracker;