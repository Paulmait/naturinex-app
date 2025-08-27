/**
 * Production Cache Manager
 * Optimizes performance with intelligent caching
 */

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 3600000; // Default 1 hour
    this.maxSize = options.maxSize || 1000;
    this.hits = 0;
    this.misses = 0;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  // Generate cache key
  generateKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  // Set cache with TTL
  set(key, value, customTTL) {
    const ttl = customTTL || this.ttl;
    const expiresAt = Date.now() + ttl;

    // Implement LRU if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      hits: 0
    });

    return true;
  }

  // Get from cache
  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update stats
    item.hits++;
    this.hits++;
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  // Check if key exists and is valid
  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Clear specific key or pattern
  clear(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clean expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cache cleanup: Removed ${cleaned} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests * 100).toFixed(2) : 0;
    
    let totalSize = 0;
    let oldestEntry = Date.now();
    let mostUsed = { key: null, hits: 0 };

    for (const [key, item] of this.cache.entries()) {
      totalSize += JSON.stringify(item.value).length;
      if (item.createdAt < oldestEntry) {
        oldestEntry = item.createdAt;
      }
      if (item.hits > mostUsed.hits) {
        mostUsed = { key, hits: item.hits };
      }
    }

    return {
      entries: this.cache.size,
      maxSize: this.maxSize,
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      hits: this.hits,
      misses: this.misses,
      hitRate: `${hitRate}%`,
      oldestEntry: oldestEntry === Date.now() ? null : new Date(oldestEntry).toISOString(),
      mostUsedKey: mostUsed.key,
      mostUsedHits: mostUsed.hits
    };
  }

  // Express middleware for caching
  middleware(options = {}) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Skip cache for authenticated requests by default
      if (options.skipAuth && req.headers.authorization) {
        return next();
      }

      const key = this.generateKey(req.path, req.query);
      const cached = this.get(key);

      if (cached) {
        console.log(`Cache hit: ${req.path}`);
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = (data) => {
        // Cache successful responses only
        if (res.statusCode === 200) {
          this.set(key, data, options.ttl);
        }
        
        // Call original json method
        originalJson.call(res, data);
      };

      next();
    };
  }

  // Invalidate cache on data changes
  invalidateOnChange() {
    return (req, res, next) => {
      // Clear cache on POST, PUT, DELETE
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const pattern = req.path.replace(/\/[^\/]+$/, '');
        this.clear(pattern);
        console.log(`Cache invalidated for pattern: ${pattern}`);
      }
      next();
    };
  }

  // Cleanup on shutdown
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

module.exports = CacheManager;