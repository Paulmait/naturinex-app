/**
 * Database Configuration
 * Handles PostgreSQL connection with fallback for when database is not available
 */

let pool = null;

// Only initialize pool if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require('pg');
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    pool.query('SELECT 1')
      .then(() => console.log('✅ Database connected'))
      .catch(err => {
        console.warn('⚠️ Database connection failed:', err.message);
        console.log('App will run without database features');
      });
  } catch (error) {
    console.warn('⚠️ PostgreSQL client not installed or database not configured');
    console.log('Run: npm install pg');
  }
} else {
  console.log('ℹ️ DATABASE_URL not set - running without database');
}

// Mock pool for when database is not available
const mockPool = {
  query: async (query, params) => {
    // Return mock data for essential queries
    if (query.includes('SELECT COUNT(*)')) {
      return { rows: [{ count: 0 }] };
    }
    if (query.includes('email_logs')) {
      return { rows: [], rowCount: 0 };
    }
    if (query.includes('users')) {
      return { rows: [], rowCount: 0 };
    }
    // Default empty result
    return { rows: [], rowCount: 0 };
  },
  connect: async () => {
    return {
      query: mockPool.query,
      release: () => {}
    };
  },
  end: async () => {},
  totalCount: 0,
  idleCount: 0,
  waitingCount: 0
};

module.exports = {
  pool: pool || mockPool,
  isConnected: () => pool !== null
};