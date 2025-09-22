
// Caching Configuration for Scale
export const cacheConfig = {
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true
  },

  // Cache TTL settings (in seconds)
  ttl: {
    userProfile: 3600, // 1 hour
    medications: 86400, // 24 hours
    alternatives: 604800, // 1 week
    pricing: 3600, // 1 hour
    session: 1800 // 30 minutes
  },

  // Cache warming
  warmup: {
    enabled: true,
    interval: 300000, // 5 minutes
    keys: ['popular_medications', 'pricing_tiers', 'alternatives_db']
  }
};