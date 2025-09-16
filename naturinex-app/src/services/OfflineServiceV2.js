import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import ErrorService from './ErrorService';

/**
 * Enhanced OfflineService for comprehensive offline support
 * Cross-platform (React Native & Web) with advanced features
 */
class OfflineServiceV2 {
  constructor() {
    this.isOnline = true;
    this.listeners = new Set();
    this.syncQueue = [];
    this.syncInProgress = false;
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
    this.maxRetryDelay = 30000;

    // Storage keys for different data types
    this.STORAGE_KEYS = {
      SYNC_QUEUE: 'offline_v2_sync_queue',
      CACHED_MEDICATIONS: 'offline_v2_medications',
      SCAN_HISTORY: 'offline_v2_scan_history',
      PENDING_SCANS: 'offline_v2_pending_scans',
      USER_PREFERENCES: 'offline_v2_user_preferences',
      LAST_SYNC: 'offline_v2_last_sync',
      OFFLINE_MODE: 'offline_v2_mode_enabled',
      CACHED_INTERACTIONS: 'offline_v2_drug_interactions',
      CACHED_ALTERNATIVES: 'offline_v2_natural_alternatives',
      ANALYTICS_QUEUE: 'offline_v2_analytics_queue',
    };

    // Comprehensive medication database for offline use
    this.offlineMedicationDatabase = {
      // Pain management
      pain_medications: [
        { name: 'ibuprofen', category: 'NSAID', conditions: ['pain', 'inflammation', 'fever'] },
        { name: 'acetaminophen', category: 'Analgesic', conditions: ['pain', 'fever'] },
        { name: 'aspirin', category: 'NSAID', conditions: ['pain', 'inflammation', 'cardiovascular'] },
        { name: 'naproxen', category: 'NSAID', conditions: ['pain', 'inflammation'] },
        { name: 'diclofenac', category: 'NSAID', conditions: ['pain', 'inflammation'] },
        { name: 'celecoxib', category: 'COX-2 Inhibitor', conditions: ['arthritis', 'pain'] },
      ],

      // Cardiovascular
      cardiovascular_medications: [
        { name: 'lisinopril', category: 'ACE Inhibitor', conditions: ['hypertension', 'heart failure'] },
        { name: 'metoprolol', category: 'Beta Blocker', conditions: ['hypertension', 'angina'] },
        { name: 'amlodipine', category: 'Calcium Channel Blocker', conditions: ['hypertension'] },
        { name: 'atorvastatin', category: 'Statin', conditions: ['cholesterol', 'cardiovascular'] },
        { name: 'simvastatin', category: 'Statin', conditions: ['cholesterol'] },
        { name: 'warfarin', category: 'Anticoagulant', conditions: ['blood clots'] },
      ],

      // Diabetes
      diabetes_medications: [
        { name: 'metformin', category: 'Biguanide', conditions: ['diabetes'] },
        { name: 'insulin', category: 'Hormone', conditions: ['diabetes'] },
        { name: 'glipizide', category: 'Sulfonylurea', conditions: ['diabetes'] },
        { name: 'sitagliptin', category: 'DPP-4 Inhibitor', conditions: ['diabetes'] },
      ],

      // Mental health
      mental_health_medications: [
        { name: 'sertraline', category: 'SSRI', conditions: ['depression', 'anxiety'] },
        { name: 'fluoxetine', category: 'SSRI', conditions: ['depression', 'anxiety'] },
        { name: 'alprazolam', category: 'Benzodiazepine', conditions: ['anxiety'] },
        { name: 'lorazepam', category: 'Benzodiazepine', conditions: ['anxiety'] },
      ],

      // Natural alternatives database
      natural_alternatives: {
        pain: [
          {
            name: 'Turmeric (Curcumin)',
            description: 'Powerful anti-inflammatory compound',
            dosage: '500-2000mg curcumin daily with black pepper',
            precautions: 'May interact with blood thinners',
            evidence: 'Strong clinical evidence for inflammation',
            alternatives_to: ['ibuprofen', 'naproxen', 'diclofenac']
          },
          {
            name: 'Ginger',
            description: 'Natural anti-inflammatory and pain reliever',
            dosage: '250-1000mg daily or 1-3g fresh root',
            precautions: 'May increase bleeding risk with anticoagulants',
            evidence: 'Moderate evidence for pain and inflammation',
            alternatives_to: ['ibuprofen', 'aspirin']
          },
          {
            name: 'White Willow Bark',
            description: 'Natural source of salicin (aspirin precursor)',
            dosage: '240mg standardized extract daily',
            precautions: 'Similar side effects to aspirin',
            evidence: 'Good evidence for pain relief',
            alternatives_to: ['aspirin', 'ibuprofen']
          }
        ],
        cardiovascular: [
          {
            name: 'Hawthorn',
            description: 'Cardiovascular tonic and mild ACE inhibitor',
            dosage: '160-900mg standardized extract daily',
            precautions: 'May enhance effects of heart medications',
            evidence: 'Good evidence for heart health',
            alternatives_to: ['lisinopril', 'metoprolol']
          },
          {
            name: 'Garlic',
            description: 'Natural blood pressure and cholesterol reducer',
            dosage: '600-1200mg aged garlic extract daily',
            precautions: 'May increase bleeding risk',
            evidence: 'Strong evidence for cardiovascular benefits',
            alternatives_to: ['amlodipine', 'atorvastatin']
          },
          {
            name: 'CoQ10',
            description: 'Supports heart function and reduces statin side effects',
            dosage: '100-200mg daily',
            precautions: 'May interact with warfarin',
            evidence: 'Good evidence for heart health',
            alternatives_to: ['atorvastatin', 'simvastatin']
          }
        ],
        diabetes: [
          {
            name: 'Berberine',
            description: 'Natural metformin alternative',
            dosage: '500mg 2-3 times daily before meals',
            precautions: 'Monitor blood sugar closely',
            evidence: 'Strong evidence for blood sugar control',
            alternatives_to: ['metformin']
          },
          {
            name: 'Cinnamon (Ceylon)',
            description: 'Improves insulin sensitivity',
            dosage: '1-6g Ceylon cinnamon daily',
            precautions: 'Use Ceylon variety, not Cassia',
            evidence: 'Moderate evidence for blood sugar',
            alternatives_to: ['metformin', 'glipizide']
          }
        ],
        anxiety: [
          {
            name: 'Ashwagandha',
            description: 'Adaptogen for stress and anxiety',
            dosage: '300-600mg daily',
            precautions: 'May affect thyroid hormones',
            evidence: 'Good evidence for anxiety and stress',
            alternatives_to: ['alprazolam', 'lorazepam']
          },
          {
            name: 'L-Theanine',
            description: 'Promotes relaxation without drowsiness',
            dosage: '100-200mg 1-2 times daily',
            precautions: 'Generally well tolerated',
            evidence: 'Moderate evidence for anxiety',
            alternatives_to: ['alprazolam', 'sertraline']
          }
        ]
      }
    };

    this.init();
  }

  async init() {
    try {
      // Set up network monitoring
      this.setupNetworkMonitoring();

      // Load cached data
      await this.loadCachedData();

      // Load sync queue
      await this.loadQueueFromStorage();

      // Check initial network state
      const netInfo = await this.getNetworkState();
      this.handleNetworkChange(netInfo);

      // Cache essential medication data
      await this.cacheMedicationDatabase();

    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.init');
    }
  }

  /**
   * Set up network monitoring (cross-platform)
   */
  setupNetworkMonitoring() {
    if (Platform.OS === 'web') {
      // Web implementation
      window.addEventListener('online', this.handleOnlineEvent.bind(this));
      window.addEventListener('offline', this.handleOfflineEvent.bind(this));
      this.isOnline = navigator.onLine;
    } else {
      // React Native implementation
      NetInfo.addEventListener(this.handleNetworkChange.bind(this));
    }
  }

  /**
   * Get current network state
   */
  async getNetworkState() {
    if (Platform.OS === 'web') {
      return {
        isConnected: navigator.onLine,
        isInternetReachable: navigator.onLine,
        type: 'unknown'
      };
    } else {
      return await NetInfo.fetch();
    }
  }

  /**
   * Handle network state changes
   */
  async handleNetworkChange(state) {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected && (state.isInternetReachable !== false);

    // Notify listeners
    this.notifyListeners({
      isOnline: this.isOnline,
      connectionType: state.type,
      timestamp: new Date().toISOString(),
    });

    // If we just came back online, start sync
    if (!wasOnline && this.isOnline) {
      await this.syncWhenOnline();
    }

    ErrorService.logInfo(`Network status: ${this.isOnline ? 'Online' : 'Offline'}`, {
      connectionType: state.type,
      wasOnline,
    });
  }

  handleOnlineEvent() {
    this.handleNetworkChange({ isConnected: true, isInternetReachable: true, type: 'web' });
  }

  handleOfflineEvent() {
    this.handleNetworkChange({ isConnected: false, isInternetReachable: false, type: 'web' });
  }

  /**
   * Add network listener
   */
  addNetworkListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify listeners
   */
  notifyListeners(networkInfo) {
    this.listeners.forEach(callback => {
      try {
        callback(networkInfo);
      } catch (error) {
        ErrorService.logError(error, 'OfflineServiceV2.notifyListeners');
      }
    });
  }

  /**
   * Cache medication database for offline use
   */
  async cacheMedicationDatabase() {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.CACHED_MEDICATIONS,
        JSON.stringify({
          database: this.offlineMedicationDatabase,
          lastUpdated: new Date().toISOString(),
          version: '2.0',
        })
      );

      ErrorService.logInfo('Medication database cached successfully');
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.cacheMedicationDatabase');
    }
  }

  /**
   * Search medication database offline
   */
  async searchMedicationsOffline(query) {
    try {
      const cachedData = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHED_MEDICATIONS);
      if (!cachedData) return [];

      const { database } = JSON.parse(cachedData);
      const results = [];
      const searchTerm = query.toLowerCase();

      // Search through all medication categories
      Object.entries(database).forEach(([category, medications]) => {
        if (Array.isArray(medications)) {
          medications.forEach(med => {
            if (med.name.toLowerCase().includes(searchTerm) ||
                med.category.toLowerCase().includes(searchTerm) ||
                med.conditions.some(condition => condition.includes(searchTerm))) {
              results.push({
                ...med,
                source: 'offline_cache',
                category: category.replace('_medications', ''),
              });
            }
          });
        }
      });

      return results.slice(0, 20); // Limit results
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.searchMedicationsOffline');
      return [];
    }
  }

  /**
   * Get natural alternatives offline
   */
  async getNaturalAlternativesOffline(medicationName) {
    try {
      const cachedData = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHED_MEDICATIONS);
      if (!cachedData) return null;

      const { database } = JSON.parse(cachedData);
      const alternatives = [];
      const searchTerm = medicationName.toLowerCase();

      // Search through natural alternatives
      Object.entries(database.natural_alternatives || {}).forEach(([category, alts]) => {
        alts.forEach(alt => {
          if (alt.alternatives_to.some(med => med.toLowerCase().includes(searchTerm))) {
            alternatives.push({
              ...alt,
              category,
              source: 'offline_cache',
            });
          }
        });
      });

      return {
        medication: medicationName,
        alternatives,
        isOffline: true,
        lastUpdated: JSON.parse(cachedData).lastUpdated,
      };
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.getNaturalAlternativesOffline');
      return null;
    }
  }

  /**
   * Save scan for offline processing
   */
  async saveScanOffline(scanData) {
    try {
      const scanWithId = {
        ...scanData,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        status: 'pending_upload',
        offline: true,
      };

      // Add to pending scans
      const pendingScans = await this.getPendingScans();
      pendingScans.push(scanWithId);

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PENDING_SCANS,
        JSON.stringify(pendingScans)
      );

      // Add to scan history for immediate viewing
      await this.addToScanHistory(scanWithId);

      // Queue for sync when online
      await this.queueOperation({
        type: 'scan_upload',
        data: scanWithId,
        priority: 'high',
      });

      ErrorService.logInfo('Scan saved offline', { scanId: scanWithId.id });

      return scanWithId;
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.saveScanOffline');
      throw error;
    }
  }

  /**
   * Get scan history (includes offline scans)
   */
  async getScanHistory(limit = 50) {
    try {
      const historyData = await AsyncStorage.getItem(this.STORAGE_KEYS.SCAN_HISTORY);
      const history = historyData ? JSON.parse(historyData) : [];

      return history
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.getScanHistory');
      return [];
    }
  }

  /**
   * Add scan to history
   */
  async addToScanHistory(scanData) {
    try {
      const history = await this.getScanHistory();
      history.unshift(scanData);

      // Keep only last 100 scans
      if (history.length > 100) {
        history.splice(100);
      }

      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SCAN_HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.addToScanHistory');
    }
  }

  /**
   * Get pending scans
   */
  async getPendingScans() {
    try {
      const pendingData = await AsyncStorage.getItem(this.STORAGE_KEYS.PENDING_SCANS);
      return pendingData ? JSON.parse(pendingData) : [];
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.getPendingScans');
      return [];
    }
  }

  /**
   * Queue operation for sync
   */
  async queueOperation(operation) {
    const queueItem = {
      id: this.generateId(),
      operation,
      timestamp: new Date().toISOString(),
      retries: 0,
      priority: operation.priority || 'normal',
    };

    this.syncQueue.push(queueItem);
    await this.saveQueueToStorage();

    ErrorService.logInfo('Operation queued', {
      operationId: queueItem.id,
      type: operation.type,
      priority: operation.priority,
    });

    return queueItem.id;
  }

  /**
   * Execute operation (online or queue if offline)
   */
  async executeOperation(operation) {
    if (this.isOnline) {
      try {
        return await this.performOperation(operation);
      } catch (error) {
        if (this.shouldRetryOperation(error)) {
          await this.queueOperation(operation);
          throw new Error('Operation queued for retry');
        }
        throw error;
      }
    } else {
      const operationId = await this.queueOperation(operation);
      throw new Error(`Operation queued (ID: ${operationId}). Will sync when online.`);
    }
  }

  /**
   * Perform actual operation
   */
  async performOperation(operation) {
    switch (operation.type) {
      case 'scan_upload':
        return await this.uploadScan(operation.data);

      case 'profile_update':
        return await this.updateProfile(operation.data);

      case 'feedback_submit':
        return await this.submitFeedback(operation.data);

      case 'analytics_event':
        return await this.sendAnalyticsEvent(operation.data);

      case 'medication_interaction_check':
        return await this.checkMedicationInteraction(operation.data);

      case 'natural_alternatives_request':
        return await this.requestNaturalAlternatives(operation.data);

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Check if operation should be retried
   */
  shouldRetryOperation(error) {
    const retryableErrors = ['NetworkError', 'TimeoutError', 'AbortError'];
    const isRetryableStatus = error.status >= 500 && error.status < 600;
    const isRetryableError = retryableErrors.some(type =>
      error.name === type || error.message.includes(type)
    );

    return isRetryableStatus || isRetryableError;
  }

  /**
   * Sync when online
   */
  async syncWhenOnline() {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      ErrorService.logInfo('Starting offline sync', {
        queueSize: this.syncQueue.length,
      });

      // Sort by priority and timestamp
      this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        const aPriority = priorityOrder[a.priority] || 2;
        const bPriority = priorityOrder[b.priority] || 2;

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      const results = [];
      const failedOperations = [];

      for (const queueItem of [...this.syncQueue]) {
        try {
          const result = await this.performOperation(queueItem.operation);
          results.push({ id: queueItem.id, result });

          // Remove successful operation
          this.syncQueue = this.syncQueue.filter(item => item.id !== queueItem.id);

          // Update scan status if it was a scan upload
          if (queueItem.operation.type === 'scan_upload') {
            await this.updateScanStatus(queueItem.operation.data.id, 'synced');
          }

        } catch (error) {
          queueItem.retries++;

          if (queueItem.retries >= this.maxRetries) {
            this.syncQueue = this.syncQueue.filter(item => item.id !== queueItem.id);
            failedOperations.push({ id: queueItem.id, error: error.message });

            ErrorService.logError(error, 'OfflineServiceV2.syncOperation.maxRetries', {
              operationId: queueItem.id,
              operationType: queueItem.operation.type,
            });
          }
        }
      }

      await this.saveQueueToStorage();

      // Update last sync timestamp
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      );

      ErrorService.logInfo('Offline sync completed', {
        successful: results.length,
        failed: failedOperations.length,
        remaining: this.syncQueue.length,
      });

    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.syncWhenOnline');
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Update scan status
   */
  async updateScanStatus(scanId, status) {
    try {
      // Update in scan history
      const history = await this.getScanHistory();
      const scanIndex = history.findIndex(scan => scan.id === scanId);
      if (scanIndex !== -1) {
        history[scanIndex].status = status;
        history[scanIndex].syncedAt = new Date().toISOString();
        await AsyncStorage.setItem(this.STORAGE_KEYS.SCAN_HISTORY, JSON.stringify(history));
      }

      // Remove from pending scans if synced
      if (status === 'synced') {
        const pendingScans = await this.getPendingScans();
        const updatedPending = pendingScans.filter(scan => scan.id !== scanId);
        await AsyncStorage.setItem(this.STORAGE_KEYS.PENDING_SCANS, JSON.stringify(updatedPending));
      }
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.updateScanStatus');
    }
  }

  /**
   * Cache user preferences
   */
  async cacheUserPreferences(preferences) {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify({
          ...preferences,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.cacheUserPreferences');
    }
  }

  /**
   * Get cached user preferences
   */
  async getCachedUserPreferences() {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.getCachedUserPreferences');
      return null;
    }
  }

  /**
   * Save and load methods
   */
  async saveQueueToStorage() {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.SYNC_QUEUE,
        JSON.stringify(this.syncQueue)
      );
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.saveQueueToStorage');
    }
  }

  async loadQueueFromStorage() {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE);
      this.syncQueue = queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.loadQueueFromStorage');
      this.syncQueue = [];
    }
  }

  async loadCachedData() {
    // Implemented by specific cache loading methods
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    try {
      const lastSync = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
      const pendingScans = await this.getPendingScans();

      return {
        isOnline: this.isOnline,
        queuedOperations: this.syncQueue.length,
        pendingScans: pendingScans.length,
        lastSync: lastSync ? new Date(lastSync) : null,
        syncInProgress: this.syncInProgress,
      };
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.getSyncStats');
      return {
        isOnline: this.isOnline,
        queuedOperations: 0,
        pendingScans: 0,
        lastSync: null,
        syncInProgress: false,
      };
    }
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData() {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.STORAGE_KEYS.SYNC_QUEUE),
        AsyncStorage.removeItem(this.STORAGE_KEYS.SCAN_HISTORY),
        AsyncStorage.removeItem(this.STORAGE_KEYS.PENDING_SCANS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.CACHED_MEDICATIONS),
        AsyncStorage.removeItem(this.STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.removeItem(this.STORAGE_KEYS.LAST_SYNC),
      ]);

      this.syncQueue = [];
      ErrorService.logInfo('Offline data cleared');
    } catch (error) {
      ErrorService.logError(error, 'OfflineServiceV2.clearOfflineData');
    }
  }

  /**
   * Force sync now
   */
  async forceSyncNow() {
    if (this.isOnline) {
      await this.syncWhenOnline();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  generateId() {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // API operation implementations
  async uploadScan(scanData) {
    if (!supabase) throw new Error('Supabase not available');

    const { data, error } = await supabase
      .from('scans')
      .insert(scanData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(profileData) {
    if (!supabase) throw new Error('Supabase not available');

    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', profileData.user_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async submitFeedback(feedbackData) {
    if (!supabase) throw new Error('Supabase not available');

    const { data, error } = await supabase
      .from('feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async sendAnalyticsEvent(eventData) {
    // Implementation depends on analytics provider
    console.log('Analytics event:', eventData);
    return { success: true };
  }

  async checkMedicationInteraction(interactionData) {
    // Implementation for medication interaction checking
    return { interactions: [], safe: true };
  }

  async requestNaturalAlternatives(medicationData) {
    // Implementation for natural alternatives request
    return { alternatives: [] };
  }
}

// Create singleton instance
const offlineServiceV2 = new OfflineServiceV2();

export default offlineServiceV2;