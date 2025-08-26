import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const OFFLINE_QUEUE_KEY = 'offline_request_queue';
const CACHED_DATA_PREFIX = 'cached_data_';

class NetworkHandler {
  constructor() {
    this.isConnected = true;
    this.offlineQueue = [];
    this.retryTimeout = null;
    this.initializeNetworkListener();
  }

  async initializeNetworkListener() {
    // Check initial network state
    const networkState = await Network.getNetworkStateAsync();
    this.isConnected = networkState.isConnected && networkState.isInternetReachable;
    
    // Set up interval to check network status
    setInterval(async () => {
      const state = await Network.getNetworkStateAsync();
      const wasOffline = !this.isConnected;
      this.isConnected = state.isConnected && state.isInternetReachable;
      
      if (wasOffline && this.isConnected) {
        // Back online - process queued requests
        this.processOfflineQueue();
      }
    }, 5000); // Check every 5 seconds
  }

  async makeRequest(url, options = {}, config = {}) {
    const { 
      cacheKey = null, 
      cacheExpiry = 3600000, // 1 hour default
      showOfflineAlert = true,
      queueIfOffline = false,
      fallbackData = null
    } = config;

    try {
      // Check network status
      const networkState = await Network.getNetworkStateAsync();
      const isOnline = networkState.isConnected && networkState.isInternetReachable;

      if (!isOnline) {
        return this.handleOfflineRequest(url, options, config);
      }

      // Try to make the request
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Cache successful response if cacheKey provided
      if (cacheKey) {
        await this.cacheData(cacheKey, data, cacheExpiry);
      }

      return { success: true, data, fromCache: false };

    } catch (error) {
      // Handle timeout
      if (error.name === 'AbortError') {
        return this.handleTimeoutError(url, options, config);
      }

      // Handle other network errors
      return this.handleNetworkError(error, url, options, config);
    }
  }

  async handleOfflineRequest(url, options, config) {
    const { cacheKey, showOfflineAlert, queueIfOffline, fallbackData } = config;

    // Try to get cached data
    if (cacheKey) {
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        if (showOfflineAlert) {
          this.showOfflineMessage('Using cached data while offline');
        }
        return { success: true, data: cachedData, fromCache: true };
      }
    }

    // Queue for later if requested
    if (queueIfOffline) {
      await this.queueRequest(url, options, config);
      if (showOfflineAlert) {
        this.showOfflineMessage('Request saved for when you\'re back online');
      }
    }

    // Return fallback data if provided
    if (fallbackData) {
      return { success: true, data: fallbackData, fromCache: false, isFallback: true };
    }

    // Show offline alert
    if (showOfflineAlert) {
      this.showOfflineMessage('You are offline. Please check your connection.');
    }

    return { 
      success: false, 
      error: 'No internet connection', 
      isOffline: true 
    };
  }

  async handleTimeoutError(url, options, config) {
    const { cacheKey, fallbackData } = config;

    // Try cached data on timeout
    if (cacheKey) {
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        this.showOfflineMessage('Request timed out. Using cached data.');
        return { success: true, data: cachedData, fromCache: true };
      }
    }

    if (fallbackData) {
      return { success: true, data: fallbackData, isFallback: true };
    }

    return { 
      success: false, 
      error: 'Request timed out. Please try again.', 
      isTimeout: true 
    };
  }

  async handleNetworkError(error, url, options, config) {
    const { cacheKey, fallbackData, showOfflineAlert } = config;

    console.error('Network request failed:', error);

    // Try cached data
    if (cacheKey) {
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        if (showOfflineAlert) {
          this.showOfflineMessage('Network error. Using cached data.');
        }
        return { success: true, data: cachedData, fromCache: true };
      }
    }

    // Use fallback data
    if (fallbackData) {
      return { success: true, data: fallbackData, isFallback: true };
    }

    // Show error message
    if (showOfflineAlert) {
      this.showOfflineMessage('Network error. Please try again.');
    }

    return { 
      success: false, 
      error: error.message || 'Network request failed',
      isNetworkError: true 
    };
  }

  async cacheData(key, data, expiry) {
    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        expiry
      };
      await AsyncStorage.setItem(
        `${CACHED_DATA_PREFIX}${key}`,
        JSON.stringify(cacheEntry)
      );
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  async getCachedData(key) {
    try {
      const cached = await AsyncStorage.getItem(`${CACHED_DATA_PREFIX}${key}`);
      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cacheEntry.timestamp > cacheEntry.expiry) {
        await AsyncStorage.removeItem(`${CACHED_DATA_PREFIX}${key}`);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  async queueRequest(url, options, config) {
    try {
      const queue = await this.getOfflineQueue();
      queue.push({
        url,
        options,
        config,
        timestamp: Date.now()
      });
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error queuing request:', error);
    }
  }

  async getOfflineQueue() {
    try {
      const queue = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Error getting offline queue:', error);
      return [];
    }
  }

  async processOfflineQueue() {
    try {
      const queue = await this.getOfflineQueue();
      if (queue.length === 0) return;

      console.log(`Processing ${queue.length} queued requests`);

      const processed = [];
      const failed = [];

      for (const request of queue) {
        try {
          const result = await this.makeRequest(
            request.url,
            request.options,
            { ...request.config, queueIfOffline: false }
          );
          
          if (result.success) {
            processed.push(request);
          } else {
            failed.push(request);
          }
        } catch (error) {
          failed.push(request);
        }
      }

      // Update queue with failed requests only
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(failed));

      if (processed.length > 0) {
        Alert.alert(
          'Sync Complete',
          `${processed.length} queued requests have been processed.`
        );
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  }

  showOfflineMessage(message) {
    // You can customize this to use a toast library or custom UI
    Alert.alert('Network Status', message);
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHED_DATA_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHED_DATA_PREFIX));
      let totalSize = 0;

      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }
}

export default new NetworkHandler();