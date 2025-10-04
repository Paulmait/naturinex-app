// Database Optimization Configuration
export const dbOptimization = {
  // Connection pooling
  pool: {
    min: parseInt(process.env.DATABASE_POOL_MIN) || 10,
    max: parseInt(process.env.DATABASE_POOL_MAX) || 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },
  // Query optimization
  queries: {
    batchSize: 1000,
    maxRetries: 3,
    timeout: 5000,
    enablePreparedStatements: true
  },
  // Indexing strategy
  indexes: [
    'users.email',
    'users.subscription_status',
    'scans.user_id',
    'scans.created_at',
    'medications.name',
    'alternatives.medication_id'
  ]
};