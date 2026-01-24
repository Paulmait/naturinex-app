/**
 * Offline Sync Service (React Native)
 *
 * Provides offline-first architecture for React Native:
 * - Local caching of scan results
 * - Sync queue for pending operations
 * - Network state management
 * - Background sync when online
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl ||
  'https://hxhbsxzkzarqwksbjpce.supabase.co';

// Storage keys
const CACHE_PREFIX = '@offline_cache_';
const SYNC_QUEUE_KEY = '@offline_sync_queue';
const LAST_SYNC_KEY = '@offline_last_sync';
const OFFLINE_SCANS_KEY = '@offline_scans';
const CACHED_ALTERNATIVES_KEY = '@cached_alternatives';

// Cache expiration (7 days in milliseconds)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

class OfflineSyncService {
  constructor() {
    this.isOnline = true;
    this.syncInProgress = false;
    this.listeners = [];
    this.unsubscribeNetInfo = null;
  }

  /**
   * Initialize the offline service
   */
  async initialize() {
    try {
      // Start network monitoring
      this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
        const wasOffline = !this.isOnline;
        this.isOnline = state.isConnected && state.isInternetReachable;

        // Notify listeners of status change
        this.notifyListeners(this.isOnline);

        // Trigger sync when coming back online
        if (wasOffline && this.isOnline) {
          console.log('[OfflineSyncService] Back online, starting sync...');
          this.syncPendingOperations();
        }
      });

      // Check initial network state
      const netState = await NetInfo.fetch();
      this.isOnline = netState.isConnected && netState.isInternetReachable;

      // Clean expired cache
      await this.cleanExpiredCache();

      console.log('[OfflineSyncService] Initialized, online:', this.isOnline);
      return { success: true, isOnline: this.isOnline };
    } catch (error) {
      console.error('[OfflineSyncService] Initialize error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add listener for online/offline status changes
   */
  addStatusListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners(isOnline) {
    this.listeners.forEach(callback => {
      try {
        callback(isOnline);
      } catch (error) {
        console.error('[OfflineSyncService] Listener error:', error);
      }
    });
  }

  /**
   * Get current online status
   */
  getOnlineStatus() {
    return this.isOnline;
  }

  /**
   * Cache scan result for offline access
   */
  async cacheScanResult(medicationName, result) {
    try {
      const key = `${CACHE_PREFIX}scan_${medicationName.toLowerCase().replace(/\s+/g, '_')}`;
      const cacheData = {
        result,
        cachedAt: Date.now(),
        expiresAt: Date.now() + CACHE_EXPIRATION,
      };

      await AsyncStorage.setItem(key, JSON.stringify(cacheData));
      console.log('[OfflineSyncService] Cached scan result for:', medicationName);
      return true;
    } catch (error) {
      console.error('[OfflineSyncService] Cache error:', error);
      return false;
    }
  }

  /**
   * Get cached scan result
   */
  async getCachedScanResult(medicationName) {
    try {
      const key = `${CACHE_PREFIX}scan_${medicationName.toLowerCase().replace(/\s+/g, '_')}`;
      const cached = await AsyncStorage.getItem(key);

      if (!cached) return null;

      const cacheData = JSON.parse(cached);

      // Check if expired
      if (Date.now() > cacheData.expiresAt) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      return {
        ...cacheData.result,
        fromCache: true,
        cachedAt: cacheData.cachedAt,
      };
    } catch (error) {
      console.error('[OfflineSyncService] Get cache error:', error);
      return null;
    }
  }

  /**
   * Save scan for offline processing (will sync when online)
   */
  async saveOfflineScan(scanData) {
    try {
      // Get existing queue
      const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const queue = existing ? JSON.parse(existing) : [];

      // Add new scan with unique ID
      const offlineScan = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...scanData,
        savedAt: Date.now(),
        synced: false,
      };

      queue.push(offlineScan);
      await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(queue));

      console.log('[OfflineSyncService] Saved offline scan:', offlineScan.id);
      return { success: true, id: offlineScan.id };
    } catch (error) {
      console.error('[OfflineSyncService] Save offline scan error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all pending offline scans
   */
  async getPendingScans() {
    try {
      const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const queue = existing ? JSON.parse(existing) : [];
      return queue.filter(scan => !scan.synced);
    } catch (error) {
      console.error('[OfflineSyncService] Get pending scans error:', error);
      return [];
    }
  }

  /**
   * Add operation to sync queue
   */
  async addToSyncQueue(operation) {
    try {
      const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = existing ? JSON.parse(existing) : [];

      queue.push({
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...operation,
        queuedAt: Date.now(),
        retryCount: 0,
      });

      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      return true;
    } catch (error) {
      console.error('[OfflineSyncService] Add to queue error:', error);
      return false;
    }
  }

  /**
   * Sync all pending operations
   */
  async syncPendingOperations() {
    if (this.syncInProgress || !this.isOnline) {
      console.log('[OfflineSyncService] Sync skipped:', {
        inProgress: this.syncInProgress,
        online: this.isOnline,
      });
      return { success: false, reason: this.syncInProgress ? 'in_progress' : 'offline' };
    }

    this.syncInProgress = true;
    const results = { synced: 0, failed: 0, total: 0 };

    try {
      const authToken = await SecureStore.getItemAsync('auth_token');
      const userId = await SecureStore.getItemAsync('user_id');

      if (!authToken || !userId) {
        console.log('[OfflineSyncService] Not authenticated, skipping sync');
        return { success: false, reason: 'not_authenticated' };
      }

      // Sync offline scans
      const pendingScans = await this.getPendingScans();
      results.total += pendingScans.length;

      for (const scan of pendingScans) {
        try {
          const syncResult = await this.syncScan(scan, authToken, userId);
          if (syncResult.success) {
            await this.markScanAsSynced(scan.id);
            results.synced++;
          } else {
            results.failed++;
          }
        } catch (error) {
          console.error('[OfflineSyncService] Sync scan error:', error);
          results.failed++;
        }
      }

      // Sync queue operations
      const queue = await this.getSyncQueue();
      results.total += queue.length;

      for (const operation of queue) {
        try {
          const opResult = await this.executeOperation(operation, authToken);
          if (opResult.success) {
            await this.removeFromQueue(operation.id);
            results.synced++;
          } else if (operation.retryCount >= 3) {
            // Too many retries, remove from queue
            await this.removeFromQueue(operation.id);
            results.failed++;
          } else {
            // Increment retry count
            await this.incrementRetryCount(operation.id);
            results.failed++;
          }
        } catch (error) {
          console.error('[OfflineSyncService] Execute operation error:', error);
          results.failed++;
        }
      }

      // Update last sync time
      await AsyncStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

      console.log('[OfflineSyncService] Sync completed:', results);
      return { success: true, results };
    } catch (error) {
      console.error('[OfflineSyncService] Sync error:', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync a single scan to the server
   */
  async syncScan(scan, authToken, userId) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': Constants.expoConfig?.extra?.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          medication_name: scan.medicationName,
          scan_type: scan.scanType || 'manual',
          result_data: scan.result,
          created_at: new Date(scan.savedAt).toISOString(),
          synced_from_offline: true,
        }),
      });

      return { success: response.ok };
    } catch (error) {
      console.error('[OfflineSyncService] Sync scan API error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark scan as synced
   */
  async markScanAsSynced(scanId) {
    try {
      const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      const queue = existing ? JSON.parse(existing) : [];

      const updated = queue.map(scan =>
        scan.id === scanId ? { ...scan, synced: true, syncedAt: Date.now() } : scan
      );

      await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[OfflineSyncService] Mark synced error:', error);
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue() {
    try {
      const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Execute a queued operation
   */
  async executeOperation(operation, authToken) {
    // Generic operation execution - can be extended for different operation types
    try {
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': Constants.expoConfig?.extra?.supabaseAnonKey,
          'Content-Type': 'application/json',
          ...operation.headers,
        },
        body: operation.body ? JSON.stringify(operation.body) : undefined,
      });

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove operation from queue
   */
  async removeFromQueue(operationId) {
    try {
      const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = existing ? JSON.parse(existing) : [];
      const updated = queue.filter(op => op.id !== operationId);
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[OfflineSyncService] Remove from queue error:', error);
    }
  }

  /**
   * Increment retry count for operation
   */
  async incrementRetryCount(operationId) {
    try {
      const existing = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      const queue = existing ? JSON.parse(existing) : [];
      const updated = queue.map(op =>
        op.id === operationId ? { ...op, retryCount: (op.retryCount || 0) + 1 } : op
      );
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('[OfflineSyncService] Increment retry error:', error);
    }
  }

  /**
   * Cache natural alternatives for offline lookup
   */
  async cacheAlternatives(alternatives) {
    try {
      await AsyncStorage.setItem(CACHED_ALTERNATIVES_KEY, JSON.stringify({
        data: alternatives,
        cachedAt: Date.now(),
      }));
      return true;
    } catch (error) {
      console.error('[OfflineSyncService] Cache alternatives error:', error);
      return false;
    }
  }

  /**
   * Get cached alternatives
   */
  async getCachedAlternatives() {
    try {
      const cached = await AsyncStorage.getItem(CACHED_ALTERNATIVES_KEY);
      if (!cached) return null;
      return JSON.parse(cached).data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const data = JSON.parse(cached);
            if (data.expiresAt && Date.now() > data.expiresAt) {
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Remove corrupted cache entries
          await AsyncStorage.removeItem(key);
        }
      }

      // Clean synced offline scans older than 30 days
      const existing = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
      if (existing) {
        const queue = JSON.parse(existing);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filtered = queue.filter(
          scan => !scan.synced || scan.syncedAt > thirtyDaysAgo
        );
        await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(filtered));
      }

      console.log('[OfflineSyncService] Cache cleaned');
    } catch (error) {
      console.error('[OfflineSyncService] Clean cache error:', error);
    }
  }

  /**
   * Get offline statistics
   */
  async getStats() {
    try {
      const pendingScans = await this.getPendingScans();
      const syncQueue = await this.getSyncQueue();
      const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const lastSync = lastSyncStr ? parseInt(lastSyncStr) : null;

      const keys = await AsyncStorage.getAllKeys();
      const cachedCount = keys.filter(key => key.startsWith(CACHE_PREFIX)).length;

      return {
        isOnline: this.isOnline,
        pendingScans: pendingScans.length,
        pendingOperations: syncQueue.length,
        cachedItems: cachedCount,
        lastSync: lastSync ? new Date(lastSync).toISOString() : null,
      };
    } catch (error) {
      console.error('[OfflineSyncService] Get stats error:', error);
      return null;
    }
  }

  /**
   * Clear all offline data
   */
  async clearAllData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key =>
        key.startsWith(CACHE_PREFIX) ||
        key === SYNC_QUEUE_KEY ||
        key === OFFLINE_SCANS_KEY ||
        key === LAST_SYNC_KEY ||
        key === CACHED_ALTERNATIVES_KEY
      );

      await AsyncStorage.multiRemove(offlineKeys);
      console.log('[OfflineSyncService] All offline data cleared');
      return true;
    } catch (error) {
      console.error('[OfflineSyncService] Clear data error:', error);
      return false;
    }
  }

  /**
   * Cleanup on app close
   */
  cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.listeners = [];
  }
}

export default new OfflineSyncService();
