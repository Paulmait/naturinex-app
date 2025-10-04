// Performance Monitoring Configuration
export const monitoring = {
  // Sentry configuration
  sentry: {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% of transactions
    beforeSend: (event) => {
      // Filter sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      return event;
    }
  },
  // Performance thresholds
  thresholds: {
    apiResponseTime: 2000, // 2 seconds
    dbQueryTime: 500, // 500ms
    pageLoadTime: 3000, // 3 seconds
  },
  // Alert configuration
  alerts: {
    errorRate: 0.01, // 1% error rate
    responseTime: 2000, // 2 second response time
    availability: 0.999 // 99.9% uptime
  }
};