/**
 * Health Data Model
 * Standardizes health data across different platforms and devices
 */
class HealthDataModel {
  constructor() {
    this.dataTypes = {
      VITAL_SIGNS: 'vital_signs',
      ACTIVITY: 'activity',
      SLEEP: 'sleep',
      NUTRITION: 'nutrition',
      MEDICATION: 'medication',
      BODY_MEASUREMENTS: 'body_measurements'
    };

    this.units = {
      // Vital Signs
      heartRate: 'bpm',
      bloodPressure: 'mmHg',
      temperature: '°C',
      oxygenSaturation: '%',
      respiratoryRate: '/min',

      // Activity
      steps: 'count',
      distance: 'm',
      calories: 'kcal',
      activeMinutes: 'minutes',
      floors: 'count',

      // Body Measurements
      weight: 'kg',
      height: 'cm',
      bmi: 'kg/m²',
      bodyFat: '%',
      muscleMass: 'kg',

      // Sleep
      sleepDuration: 'hours',
      sleepEfficiency: '%',
      remSleep: 'minutes',
      deepSleep: 'minutes',
      lightSleep: 'minutes',

      // Nutrition
      water: 'ml',
      carbohydrates: 'g',
      protein: 'g',
      fat: 'g',
      fiber: 'g',
      sodium: 'mg'
    };
  }

  /**
   * Create a standardized health data entry
   */
  createHealthDataEntry(type, value, options = {}) {
    const entry = {
      id: this.generateId(),
      type,
      value,
      unit: options.unit || this.units[type] || '',
      timestamp: options.timestamp || new Date().toISOString(),
      source: options.source || 'manual',
      device: options.device || null,
      accuracy: options.accuracy || 'unknown',
      metadata: options.metadata || {},
      tags: options.tags || [],
      privacy: {
        level: options.privacyLevel || 'private',
        shareWith: options.shareWith || [],
        encrypted: true
      },
      validation: {
        isValid: true,
        confidence: options.confidence || 1.0,
        flags: []
      }
    };

    this.validateHealthData(entry);
    return entry;
  }

  /**
   * Normalize HealthKit data to standard format
   */
  normalizeHealthKitData(sample, dataType) {
    return {
      id: sample.uuid || this.generateId(),
      type: dataType,
      value: sample.value,
      unit: sample.unit || this.units[dataType],
      timestamp: sample.startDate || sample.endDate,
      source: 'healthkit',
      device: sample.device || 'iPhone',
      metadata: {
        healthKit: {
          uuid: sample.uuid,
          startDate: sample.startDate,
          endDate: sample.endDate,
          metadata: sample.metadata
        }
      },
      privacy: {
        level: 'private',
        shareWith: [],
        encrypted: true
      },
      validation: {
        isValid: true,
        confidence: 1.0,
        flags: []
      }
    };
  }

  /**
   * Normalize Google Fit data to standard format
   */
  normalizeGoogleFitData(sample, dataType) {
    return {
      id: this.generateId(),
      type: dataType,
      value: sample.value,
      unit: sample.unit || this.units[dataType],
      timestamp: sample.date || sample.startDate,
      source: 'googlefit',
      device: sample.device || 'Android',
      metadata: {
        googleFit: {
          dataStreamId: sample.dataStreamId,
          originDataSourceId: sample.originDataSourceId,
          startDate: sample.startDate,
          endDate: sample.endDate
        }
      },
      privacy: {
        level: 'private',
        shareWith: [],
        encrypted: true
      },
      validation: {
        isValid: true,
        confidence: sample.accuracy || 1.0,
        flags: []
      }
    };
  }

  /**
   * Validate health data entry
   */
  validateHealthData(entry) {
    const validators = {
      heartRate: (value) => value >= 30 && value <= 220,
      bloodPressure: (value) => {
        if (typeof value === 'object' && value.systolic && value.diastolic) {
          return value.systolic >= 70 && value.systolic <= 250 &&
                 value.diastolic >= 40 && value.diastolic <= 150;
        }
        return false;
      },
      temperature: (value) => value >= 35 && value <= 42,
      steps: (value) => value >= 0 && value <= 100000,
      weight: (value) => value >= 1 && value <= 500,
      height: (value) => value >= 30 && value <= 250,
      sleepDuration: (value) => value >= 0 && value <= 24,
      oxygenSaturation: (value) => value >= 80 && value <= 100
    };

    const validator = validators[entry.type];
    if (validator) {
      entry.validation.isValid = validator(entry.value);
      if (!entry.validation.isValid) {
        entry.validation.flags.push('invalid_range');
      }
    }

    // Check for suspicious values
    if (this.isSuspiciousValue(entry)) {
      entry.validation.flags.push('suspicious_value');
      entry.validation.confidence *= 0.5;
    }

    return entry.validation.isValid;
  }

  /**
   * Check if a value is suspicious
   */
  isSuspiciousValue(entry) {
    const suspiciousPatterns = {
      heartRate: (value) => value === 0 || value > 200,
      steps: (value) => value > 50000,
      weight: (value) => value < 10 || value > 300
    };

    const pattern = suspiciousPatterns[entry.type];
    return pattern ? pattern(entry.value) : false;
  }

  /**
   * Aggregate health data by time period
   */
  aggregateData(data, period = 'day') {
    const grouped = this.groupByTimePeriod(data, period);
    const aggregated = {};

    for (const [timeKey, entries] of Object.entries(grouped)) {
      aggregated[timeKey] = this.calculateAggregates(entries);
    }

    return aggregated;
  }

  /**
   * Group data by time period
   */
  groupByTimePeriod(data, period) {
    const grouped = {};

    data.forEach(entry => {
      const date = new Date(entry.timestamp);
      let key;

      switch (period) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth()}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(entry);
    });

    return grouped;
  }

  /**
   * Calculate aggregates for a group of entries
   */
  calculateAggregates(entries) {
    if (!entries.length) return null;

    const values = entries.map(e => e.value).filter(v => typeof v === 'number');
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      count: entries.length,
      sum,
      average: avg,
      min,
      max,
      median: this.calculateMedian(values),
      stdDev: this.calculateStandardDeviation(values, avg),
      firstEntry: entries[0].timestamp,
      lastEntry: entries[entries.length - 1].timestamp
    };
  }

  /**
   * Calculate median value
   */
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values, mean) {
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Generate trends and insights
   */
  generateInsights(data, timeframe = 30) {
    const insights = [];
    const recent = this.getRecentData(data, timeframe);
    const aggregated = this.aggregateData(recent, 'day');

    // Trend analysis
    const trend = this.calculateTrend(aggregated);
    if (trend.direction !== 'stable') {
      insights.push({
        type: 'trend',
        severity: trend.significance > 0.5 ? 'high' : 'medium',
        message: `${trend.direction === 'increasing' ? 'Increasing' : 'Decreasing'} trend detected`,
        data: trend
      });
    }

    // Goal tracking
    const goalProgress = this.checkGoalProgress(recent);
    if (goalProgress.length > 0) {
      insights.push(...goalProgress);
    }

    // Anomaly detection
    const anomalies = this.detectAnomalies(recent);
    if (anomalies.length > 0) {
      insights.push(...anomalies);
    }

    return insights;
  }

  /**
   * Get recent data within timeframe (days)
   */
  getRecentData(data, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter(entry => new Date(entry.timestamp) >= cutoff);
  }

  /**
   * Calculate trend direction and significance
   */
  calculateTrend(aggregatedData) {
    const values = Object.values(aggregatedData).map(d => d.average);
    if (values.length < 3) {
      return { direction: 'insufficient_data', significance: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const significance = Math.abs(slope) / (sumY / n); // Normalized slope

    return {
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable',
      slope,
      significance: Math.min(significance, 1)
    };
  }

  /**
   * Check goal progress
   */
  checkGoalProgress(data) {
    const insights = [];
    const goals = {
      steps: 10000,
      heartRate: { min: 60, max: 100 },
      sleepDuration: 8
    };

    for (const [type, goal] of Object.entries(goals)) {
      const typeData = data.filter(d => d.type === type);
      if (typeData.length > 0) {
        const progress = this.calculateGoalProgress(typeData, goal);
        if (progress.insight) {
          insights.push(progress.insight);
        }
      }
    }

    return insights;
  }

  /**
   * Calculate progress towards a specific goal
   */
  calculateGoalProgress(data, goal) {
    const recent = data.slice(-7); // Last 7 entries
    const avg = recent.reduce((sum, d) => sum + d.value, 0) / recent.length;

    if (typeof goal === 'number') {
      const progress = (avg / goal) * 100;
      if (progress < 80) {
        return {
          insight: {
            type: 'goal',
            severity: progress < 50 ? 'high' : 'medium',
            message: `You're at ${progress.toFixed(1)}% of your goal`,
            data: { current: avg, goal, progress }
          }
        };
      }
    }

    return {};
  }

  /**
   * Detect anomalies in health data
   */
  detectAnomalies(data) {
    const anomalies = [];
    const grouped = this.groupByType(data);

    for (const [type, entries] of Object.entries(grouped)) {
      const typeAnomalies = this.detectTypeAnomalies(entries, type);
      anomalies.push(...typeAnomalies);
    }

    return anomalies;
  }

  /**
   * Group data by type
   */
  groupByType(data) {
    return data.reduce((groups, entry) => {
      if (!groups[entry.type]) {
        groups[entry.type] = [];
      }
      groups[entry.type].push(entry);
      return groups;
    }, {});
  }

  /**
   * Detect anomalies for a specific data type
   */
  detectTypeAnomalies(entries, type) {
    if (entries.length < 10) return [];

    const values = entries.map(e => e.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values, mean);

    const anomalies = [];
    const threshold = 2; // 2 standard deviations

    entries.forEach(entry => {
      const zScore = Math.abs((entry.value - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          type: 'anomaly',
          severity: zScore > 3 ? 'high' : 'medium',
          message: `Unusual ${type} reading detected`,
          data: {
            value: entry.value,
            expected: mean,
            deviation: zScore,
            timestamp: entry.timestamp
          }
        });
      }
    });

    return anomalies;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export data for sharing or backup
   */
  exportData(data, format = 'json') {
    const exportData = {
      exported: new Date().toISOString(),
      version: '1.0',
      source: 'Naturinex Health Integration',
      data: data.map(entry => ({
        ...entry,
        privacy: undefined // Remove privacy info for export
      }))
    };

    switch (format) {
      case 'csv':
        return this.convertToCSV(exportData.data);
      case 'json':
        return JSON.stringify(exportData, null, 2);
      default:
        return exportData;
    }
  }

  /**
   * Convert data to CSV format
   */
  convertToCSV(data) {
    if (!data.length) return '';

    const headers = ['timestamp', 'type', 'value', 'unit', 'source', 'device'];
    const csvRows = [headers.join(',')];

    data.forEach(entry => {
      const row = headers.map(header => {
        const value = entry[header] || '';
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}

export default HealthDataModel;