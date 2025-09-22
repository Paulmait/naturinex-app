#!/usr/bin/env node

/**
 * Production Setup Script for Naturinex App
 * Automatically configures environment for 1M+ users
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Naturinex Production Setup Script');
console.log('====================================\n');

// Configuration template
const ENV_TEMPLATE = `# Naturinex Production Environment Configuration
# Generated on ${new Date().toISOString()}

# 🔐 AUTHENTICATION (Required)
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=naturinex-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# 💾 DATABASE (Required)
EXPO_PUBLIC_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 💳 PAYMENTS (Required)
STRIPE_PUBLISHABLE_KEY=pk_live_
STRIPE_SECRET_KEY=sk_live_
STRIPE_WEBHOOK_SECRET=whsec_

# 🤖 AI SERVICES (Required)
GEMINI_API_KEY=
GOOGLE_VISION_API_KEY=

# 🌐 API CONFIGURATION
EXPO_PUBLIC_API_URL=https://naturinex-app-zsga.onrender.com
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com

# 🚀 SCALABILITY (For 1M+ Users)
REDIS_URL=redis://localhost:6379
CDN_URL=https://cdn.naturinex.com
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=100
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# 📊 MONITORING
SENTRY_DSN=
SENTRY_ORG=naturinex
SENTRY_PROJECT=naturinex-app

# 📱 APP STORE
IOS_BUNDLE_ID=com.naturinex.app
ANDROID_PACKAGE=com.naturinex.app
APPLE_TEAM_ID=
APP_STORE_CONNECT_ID=

# 🔒 SECURITY
JWT_SECRET=${generateSecret(64)}
SESSION_SECRET=${generateSecret(64)}
ENCRYPTION_KEY=${generateSecret(32)}

# 📧 COMMUNICATIONS
SENDGRID_API_KEY=
SUPPORT_EMAIL=support@naturinex.com

# 🌍 PRODUCTION
NODE_ENV=production
EXPO_PUBLIC_ENV=production
`;

function generateSecret(length) {
  return require('crypto').randomBytes(length).toString('hex');
}

// Check existing configuration
function checkExistingConfig() {
  console.log('📋 Checking existing configuration...\n');

  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);

  if (envExists) {
    console.log('✅ .env file exists');
    const env = fs.readFileSync(envPath, 'utf8');
    const configured = {
      firebase: env.includes('FIREBASE_API_KEY') && !env.includes('your_firebase'),
      supabase: env.includes('SUPABASE_URL') && !env.includes('your_supabase'),
      stripe: env.includes('STRIPE_') && !env.includes('your_stripe'),
      ai: env.includes('GEMINI_API_KEY') && !env.includes('your_gemini')
    };

    console.log(`  Firebase: ${configured.firebase ? '✅' : '❌'}`);
    console.log(`  Supabase: ${configured.supabase ? '✅' : '❌'}`);
    console.log(`  Stripe: ${configured.stripe ? '✅' : '❌'}`);
    console.log(`  AI Services: ${configured.ai ? '✅' : '❌'}`);

    return configured;
  } else {
    console.log('❌ No .env file found');
    return { firebase: false, supabase: false, stripe: false, ai: false };
  }
}

// Create environment file
function createEnvFile() {
  console.log('\n📝 Creating .env.production file...');

  const envPath = path.join(process.cwd(), '.env.production');
  fs.writeFileSync(envPath, ENV_TEMPLATE);

  console.log('✅ .env.production created');
  console.log('📌 Please fill in the required values in .env.production');
}

// Setup Firebase
function setupFirebaseInstructions() {
  console.log('\n🔥 Firebase Setup Instructions:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Create a new project called "naturinex-app"');
  console.log('3. Enable Authentication → Email/Password');
  console.log('4. Go to Project Settings → General');
  console.log('5. Create a web app and copy the configuration');
  console.log('6. Add the values to .env.production');
}

// Setup Supabase
function setupSupabaseInstructions() {
  console.log('\n💾 Supabase Setup Instructions:');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Create a new project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy the Project URL and anon key');
  console.log('5. Add the values to .env.production');
}

// Setup monitoring
function setupMonitoring() {
  console.log('\n📊 Setting up monitoring...');

  // Create performance monitoring config
  const monitoringConfig = `
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
};`;

  const monitorPath = path.join(process.cwd(), 'src', 'config', 'monitoring.config.js');
  fs.writeFileSync(monitorPath, monitoringConfig);
  console.log('✅ Monitoring configuration created');
}

// Optimize for scale
function optimizeForScale() {
  console.log('\n⚡ Optimizing for 1M+ users...');

  // Create caching configuration
  const cacheConfig = `
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
};`;

  const cachePath = path.join(process.cwd(), 'src', 'config', 'cache.config.js');
  fs.writeFileSync(cachePath, cacheConfig);
  console.log('✅ Cache configuration created');

  // Create database optimization config
  const dbConfig = `
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
};`;

  const dbPath = path.join(process.cwd(), 'src', 'config', 'db.config.js');
  fs.writeFileSync(dbPath, dbConfig);
  console.log('✅ Database optimization created');
}

// Verify setup
function verifySetup() {
  console.log('\n🔍 Verifying setup...');

  const checks = [
    { name: 'Environment file', path: '.env.production', required: true },
    { name: 'Firebase config', path: 'src/config/firebase.production.js', required: true },
    { name: 'Monitoring config', path: 'src/config/monitoring.config.js', required: false },
    { name: 'Cache config', path: 'src/config/cache.config.js', required: false },
    { name: 'Database config', path: 'src/config/db.config.js', required: false }
  ];

  let allGood = true;
  checks.forEach(check => {
    const exists = fs.existsSync(path.join(process.cwd(), check.path));
    console.log(`  ${check.name}: ${exists ? '✅' : check.required ? '❌' : '⚠️'}`);
    if (check.required && !exists) allGood = false;
  });

  return allGood;
}

// Main setup flow
async function main() {
  try {
    // Check existing configuration
    const existing = checkExistingConfig();

    // Create environment file
    createEnvFile();

    // Show setup instructions
    if (!existing.firebase) setupFirebaseInstructions();
    if (!existing.supabase) setupSupabaseInstructions();

    // Setup monitoring
    setupMonitoring();

    // Optimize for scale
    optimizeForScale();

    // Verify setup
    const isReady = verifySetup();

    console.log('\n' + '='.repeat(50));
    if (isReady) {
      console.log('✅ Basic setup complete!');
    } else {
      console.log('⚠️ Setup partially complete');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Fill in the values in .env.production');
    console.log('2. Copy .env.production to .env for local testing');
    console.log('3. Run: npm run test:comprehensive');
    console.log('4. Deploy: npm run deploy:production');

    console.log('\n🎯 Quick Commands:');
    console.log('  Test locally: npm start');
    console.log('  Build iOS: npm run build:ios');
    console.log('  Build Android: npm run build:android');
    console.log('  Deploy API: git push origin master');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
main();