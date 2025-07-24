import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

/**
 * Comprehensive error tracking and crash reporting system
 */

export interface ErrorReport {
  errorId: string;
  userId?: string;
  timestamp: Date;
  environment: string;
  error: {
    message: string;
    stack?: string;
    code?: string;
    type: string;
  };
  device?: {
    platform: string;
    version: string;
    model?: string;
    os?: string;
  };
  app: {
    version: string;
    buildNumber?: string;
  };
  context: {
    action?: string;
    screen?: string;
    additionalInfo?: any;
  };
  network?: {
    type?: string;
    effectiveType?: string;
  };
  breadcrumbs?: Array<{
    timestamp: Date;
    action: string;
    data?: any;
  }>;
}

/**
 * Report client-side errors from mobile app
 */
export async function reportClientError(req: Request, res: Response) {
  try {
    const errorReport: ErrorReport = {
      errorId: generateErrorId(),
      userId: req.body.userId,
      timestamp: new Date(),
      environment: req.body.environment || 'production',
      error: {
        message: req.body.error.message,
        stack: req.body.error.stack,
        code: req.body.error.code,
        type: req.body.error.type || 'client_error'
      },
      device: req.body.device,
      app: req.body.app,
      context: req.body.context,
      network: req.body.network,
      breadcrumbs: req.body.breadcrumbs
    };

    // Store error report
    await admin.firestore()
      .collection('error_reports')
      .doc(errorReport.errorId)
      .set({
        ...errorReport,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        processed: false
      });

    // Check error severity
    const severity = calculateErrorSeverity(errorReport);
    
    // Alert for critical errors
    if (severity === 'critical') {
      await alertCriticalError(errorReport);
    }

    // Track error metrics
    await updateErrorMetrics(errorReport);

    res.json({
      success: true,
      errorId: errorReport.errorId,
      message: 'Error reported successfully'
    });

  } catch (error) {
    console.error('Failed to report client error:', error);
    res.status(500).json({
      error: 'Failed to report error'
    });
  }
}

/**
 * Report crash from mobile app
 */
export async function reportCrash(req: Request, res: Response) {
  try {
    const crashReport = {
      crashId: generateErrorId(),
      userId: req.body.userId,
      timestamp: new Date(),
      fatal: true,
      error: req.body.error,
      device: req.body.device,
      app: req.body.app,
      lastActions: req.body.lastActions || [],
      memoryUsage: req.body.memoryUsage,
      batteryLevel: req.body.batteryLevel,
      orientation: req.body.orientation,
      crashContext: req.body.context
    };

    // Store crash report with high priority
    await admin.firestore()
      .collection('crash_reports')
      .doc(crashReport.crashId)
      .set({
        ...crashReport,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        priority: 'high'
      });

    // Always alert for crashes
    await alertCriticalError(crashReport);

    // Update crash metrics
    await updateCrashMetrics(crashReport);

    res.json({
      success: true,
      crashId: crashReport.crashId
    });

  } catch (error) {
    console.error('Failed to report crash:', error);
    res.status(500).json({
      error: 'Failed to report crash'
    });
  }
}

/**
 * Get error analytics for debugging
 */
export async function getErrorAnalytics(req: Request, res: Response) {
  try {
    const { timeframe = '24h', errorType, userId } = req.query;
    
    const now = new Date();
    const startTime = getStartTime(timeframe as string);

    let query = admin.firestore()
      .collection('error_reports')
      .where('timestamp', '>=', startTime);

    if (errorType) {
      query = query.where('error.type', '==', errorType);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    const snapshot = await query.limit(100).get();

    // Aggregate error data
    const errorsByType: Record<string, number> = {};
    const errorsByScreen: Record<string, number> = {};
    const affectedUsers = new Set<string>();
    const topErrors: any[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Count by type
      errorsByType[data.error.type] = (errorsByType[data.error.type] || 0) + 1;
      
      // Count by screen
      if (data.context?.screen) {
        errorsByScreen[data.context.screen] = (errorsByScreen[data.context.screen] || 0) + 1;
      }
      
      // Track affected users
      if (data.userId) {
        affectedUsers.add(data.userId);
      }
      
      // Collect top errors
      if (topErrors.length < 10) {
        topErrors.push({
          errorId: doc.id,
          message: data.error.message,
          count: 1, // Would aggregate in production
          lastOccurred: data.timestamp
        });
      }
    });

    res.json({
      timeframe,
      totalErrors: snapshot.size,
      affectedUsers: affectedUsers.size,
      errorsByType,
      errorsByScreen,
      topErrors,
      healthScore: calculateHealthScore(snapshot.size, affectedUsers.size)
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      error: 'Failed to get error analytics'
    });
  }
}

/**
 * Calculate error severity
 */
function calculateErrorSeverity(errorReport: ErrorReport): 'low' | 'medium' | 'high' | 'critical' {
  // Critical errors
  if (errorReport.error.message.includes('payment') ||
      errorReport.error.message.includes('subscription') ||
      errorReport.error.message.includes('crash') ||
      errorReport.error.type === 'security_error') {
    return 'critical';
  }

  // High severity
  if (errorReport.error.message.includes('scan failed') ||
      errorReport.error.message.includes('login failed') ||
      errorReport.error.type === 'api_error') {
    return 'high';
  }

  // Medium severity
  if (errorReport.error.type === 'network_error' ||
      errorReport.error.type === 'validation_error') {
    return 'medium';
  }

  return 'low';
}

/**
 * Alert team for critical errors
 */
async function alertCriticalError(errorReport: any) {
  try {
    await admin.firestore()
      .collection('critical_alerts')
      .add({
        errorId: errorReport.errorId || errorReport.crashId,
        type: errorReport.fatal ? 'crash' : 'error',
        message: errorReport.error.message,
        userId: errorReport.userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        notified: false
      });

    // In production, also send email/Slack/PagerDuty alert
    console.error('🚨 CRITICAL ERROR:', {
      id: errorReport.errorId || errorReport.crashId,
      message: errorReport.error.message,
      user: errorReport.userId
    });

  } catch (error) {
    console.error('Failed to alert critical error:', error);
  }
}

/**
 * Update error metrics for monitoring
 */
async function updateErrorMetrics(errorReport: ErrorReport) {
  const date = new Date().toISOString().split('T')[0];
  const hour = new Date().getHours();

  try {
    const metricsRef = admin.firestore()
      .collection('error_metrics')
      .doc(`${date}_${hour}`);

    await metricsRef.set({
      date,
      hour,
      errors: {
        [errorReport.error.type]: admin.firestore.FieldValue.increment(1),
        total: admin.firestore.FieldValue.increment(1)
      },
      affectedUsers: admin.firestore.FieldValue.arrayUnion(errorReport.userId),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

  } catch (error) {
    console.error('Failed to update error metrics:', error);
  }
}

/**
 * Update crash metrics
 */
async function updateCrashMetrics(crashReport: any) {
  const date = new Date().toISOString().split('T')[0];

  try {
    await admin.firestore()
      .collection('crash_metrics')
      .doc(date)
      .set({
        date,
        crashes: admin.firestore.FieldValue.increment(1),
        affectedUsers: admin.firestore.FieldValue.arrayUnion(crashReport.userId),
        devices: admin.firestore.FieldValue.arrayUnion(crashReport.device?.model || 'unknown'),
        versions: admin.firestore.FieldValue.arrayUnion(crashReport.app?.version || 'unknown'),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

  } catch (error) {
    console.error('Failed to update crash metrics:', error);
  }
}

/**
 * Generate unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get start time based on timeframe
 */
function getStartTime(timeframe: string): Date {
  const now = new Date();
  
  switch (timeframe) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
}

/**
 * Calculate app health score
 */
function calculateHealthScore(errorCount: number, affectedUsers: number): number {
  // Simple health score calculation (0-100)
  if (errorCount === 0) return 100;
  if (errorCount > 100) return 0;
  
  const errorScore = Math.max(0, 100 - errorCount);
  const userImpactScore = Math.max(0, 100 - (affectedUsers * 2));
  
  return Math.round((errorScore + userImpactScore) / 2);
}

/**
 * Client-side error boundary helper
 */
export function getErrorBoundaryCode(): string {
  return `
// Add this to your React Native app
import * as Sentry from 'sentry-expo';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Report to your API
    fetch('YOUR_API_URL/error/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error.toString(),
          stack: error.stack,
          type: 'react_error_boundary'
        },
        context: {
          componentStack: errorInfo.componentStack
        },
        userId: this.props.userId,
        app: {
          version: Constants.manifest.version
        }
      })
    });
    
    // Also report to Sentry if configured
    Sentry.Native.captureException(error);
  }
  
  render() {
    if (this.state.hasError) {
      return <FallbackComponent />;
    }
    return this.props.children;
  }
}
`;
}