import React from 'react';

// Performance monitoring and optimization utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.initializeObservers();
  }

  initializeObservers() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      this.observeMetric('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });

      // First Input Delay (FID)
      this.observeMetric('first-input', (entries) => {
        const firstEntry = entries[0];
        this.recordMetric('FID', firstEntry.processingStart - firstEntry.startTime);
      });

      // Cumulative Layout Shift (CLS)
      this.observeMetric('layout-shift', (entries) => {
        let clsValue = 0;
        for (const entry of entries) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.recordMetric('CLS', clsValue);
      });
    }
  }

  observeMetric(entryType, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [entryType] });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Failed to observe ${entryType}:`, error);
    }
  }

  recordMetric(name, value) {
    this.metrics.set(name, {
      value,
      timestamp: Date.now(),
      url: window.location.href
    });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric - ${name}:`, value);
    }
  }

  // Track custom timing for specific operations
  startTiming(label) {
    performance.mark(`${label}-start`);
  }

  endTiming(label) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    if (measure) {
      this.recordMetric(label, measure.duration);
      return measure.duration;
    }
    return null;
  }

  // Get current metrics
  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  // Memory usage monitoring
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  // Network monitoring
  getNetworkInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  // Report performance data
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics: this.getMetrics(),
      memory: this.getMemoryUsage(),
      network: this.getNetworkInfo(),
      timing: {
        navigationStart: performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      }
    };

    return report;
  }

  getFirstPaint() {
    const paint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint');
    return paint ? paint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint');
    return paint ? paint.startTime : null;
  }

  // Cleanup observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [monitor] = React.useState(() => new PerformanceMonitor());
  const [metrics, setMetrics] = React.useState({});

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      monitor.disconnect();
    };
  }, [monitor]);

  return { monitor, metrics };
};

// Singleton instance for global use
export const performanceMonitor = new PerformanceMonitor();

// Auto-report to console in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    console.log('📊 Performance Report:', performanceMonitor.generateReport());
  }, 5000);
}

export default PerformanceMonitor;
