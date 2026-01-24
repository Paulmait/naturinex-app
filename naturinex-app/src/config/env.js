/**
 * Unified Environment Configuration
 *
 * This file provides a single source of truth for all environment variables
 * across mobile (Expo), web (React), and server (Node.js) environments.
 *
 * NAMING CONVENTIONS:
 * - EXPO_PUBLIC_* = Client-side variables (safe to expose, included in bundle)
 * - Regular names = Server-side only (never exposed to client)
 *
 * For Expo: Use process.env.EXPO_PUBLIC_*
 * For Web: Can use REACT_APP_* or EXPO_PUBLIC_*
 * For Server: Use regular process.env.*
 */

// Detect environment
const isExpo = typeof window !== 'undefined' && window.expo;
const isWeb = typeof window !== 'undefined' && !isExpo;
const isServer = typeof window === 'undefined';

// Helper function to get env variable with fallbacks
const getEnvVar = (expoKey, reactKey, nextKey, defaultValue = '') => {
  // Try Expo first (mobile)
  if (process.env[expoKey]) return process.env[expoKey];

  // Try React (web)
  if (reactKey && process.env[reactKey]) return process.env[reactKey];

  // Try Next.js (web)
  if (nextKey && process.env[nextKey]) return process.env[nextKey];

  // Return default
  return defaultValue;
};

// ============================================================================
// AUTHENTICATION & DATABASE
// ============================================================================

export const SUPABASE_URL = getEnvVar(
  'EXPO_PUBLIC_SUPABASE_URL',
  'REACT_APP_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'https://hxhbsxzkzarqwksbjpce.supabase.co'
);

export const SUPABASE_ANON_KEY = getEnvVar(
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'REACT_APP_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);

// Server-side only (NEVER expose to client)
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const FIREBASE_API_KEY = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_API_KEY'
);

export const FIREBASE_AUTH_DOMAIN = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'naturinex-app.firebaseapp.com'
);

export const FIREBASE_PROJECT_ID = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'naturinex-app'
);

export const FIREBASE_STORAGE_BUCKET = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'naturinex-app.appspot.com'
);

export const FIREBASE_MESSAGING_SENDER_ID = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'
);

export const FIREBASE_APP_ID = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_APP_ID',
  'REACT_APP_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
);

export const FIREBASE_MEASUREMENT_ID = getEnvVar(
  'EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID',
  'REACT_APP_FIREBASE_MEASUREMENT_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID'
);

// ============================================================================
// AI SERVICES
// ============================================================================

export const GEMINI_API_KEY = getEnvVar(
  'EXPO_PUBLIC_GEMINI_API_KEY',
  'REACT_APP_GEMINI_API_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY'
) || process.env.GEMINI_API_KEY || ''; // Also check server-side

export const GOOGLE_VISION_API_KEY = getEnvVar(
  'EXPO_PUBLIC_GOOGLE_VISION_API_KEY',
  'REACT_APP_GOOGLE_VISION_API_KEY',
  'NEXT_PUBLIC_GOOGLE_VISION_API_KEY'
) || process.env.GOOGLE_VISION_API_KEY || ''; // Also check server-side

// ============================================================================
// PAYMENTS (STRIPE)
// ============================================================================

export const STRIPE_PUBLISHABLE_KEY = getEnvVar(
  'EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'REACT_APP_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
);

// Server-side only (NEVER expose to client)
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// ============================================================================
// SECURITY SECRETS (SERVER-SIDE ONLY)
// ============================================================================

// NEVER expose these to client
export const JWT_SECRET = process.env.JWT_SECRET || '';
export const SESSION_SECRET = process.env.SESSION_SECRET || '';
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

// ============================================================================
// API CONFIGURATION
// ============================================================================

export const API_URL = getEnvVar(
  'EXPO_PUBLIC_API_URL',
  'REACT_APP_API_URL',
  'NEXT_PUBLIC_API_URL',
  'https://naturinex-app-zsga.onrender.com'
);

// ============================================================================
// MONITORING & ERROR TRACKING
// ============================================================================

export const SENTRY_DSN = getEnvVar(
  'EXPO_PUBLIC_SENTRY_DSN',
  'REACT_APP_SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN'
) || process.env.SENTRY_DSN || '';

// ============================================================================
// ENVIRONMENT
// ============================================================================

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const EXPO_ENV = getEnvVar('EXPO_PUBLIC_ENV', 'REACT_APP_ENV', 'NEXT_PUBLIC_ENV', 'development');
export const IS_DEVELOPMENT = NODE_ENV === 'development' || EXPO_ENV === 'development';
export const IS_PRODUCTION = NODE_ENV === 'production' || EXPO_ENV === 'production';

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const ENABLE_OCR = getEnvVar('EXPO_PUBLIC_ENABLE_OCR', 'REACT_APP_ENABLE_OCR', 'NEXT_PUBLIC_ENABLE_OCR', 'true') === 'true';
export const ENABLE_CAMERA = getEnvVar('EXPO_PUBLIC_ENABLE_CAMERA', 'REACT_APP_ENABLE_CAMERA', 'NEXT_PUBLIC_ENABLE_CAMERA', 'true') === 'true';
export const ENABLE_2FA = getEnvVar('EXPO_PUBLIC_ENABLE_2FA', 'REACT_APP_ENABLE_2FA', 'NEXT_PUBLIC_ENABLE_2FA', 'true') === 'true';
export const ENABLE_BIOMETRIC = getEnvVar('EXPO_PUBLIC_ENABLE_BIOMETRIC', 'REACT_APP_ENABLE_BIOMETRIC', 'NEXT_PUBLIC_ENABLE_BIOMETRIC', 'true') === 'true';

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates client-side configuration (runs in mobile/web apps)
 * AI keys are NOT required on client since all AI processing goes through backend API
 */
export const validateClientConfig = () => {
  const errors = [];
  const warnings = [];

  // Critical - app cannot function without these
  if (!SUPABASE_URL) errors.push('SUPABASE_URL is required');
  if (!SUPABASE_ANON_KEY) errors.push('SUPABASE_ANON_KEY is required');
  if (!API_URL) errors.push('API_URL is required for backend communication');

  // Important - features will be degraded without these
  if (!FIREBASE_API_KEY) warnings.push('FIREBASE_API_KEY is not set - authentication may not work');
  if (!STRIPE_PUBLISHABLE_KEY) warnings.push('STRIPE_PUBLISHABLE_KEY is not set - payments will not work');

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Validates server-side configuration (runs on backend/edge functions)
 */
export const validateServerConfig = () => {
  const errors = [];

  // Server-side required
  if (!JWT_SECRET) errors.push('JWT_SECRET is required');
  if (!SESSION_SECRET) errors.push('SESSION_SECRET is required');
  if (!ENCRYPTION_KEY) errors.push('ENCRYPTION_KEY is required');
  if (!STRIPE_SECRET_KEY) errors.push('STRIPE_SECRET_KEY is required');
  if (!GEMINI_API_KEY) errors.push('GEMINI_API_KEY is required for AI features');
  if (!GOOGLE_VISION_API_KEY) errors.push('GOOGLE_VISION_API_KEY is required for OCR');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Full configuration validation (backwards compatible)
 */
export const validateConfig = () => {
  const clientValidation = validateClientConfig();

  if (isServer) {
    const serverValidation = validateServerConfig();
    return {
      isValid: clientValidation.isValid && serverValidation.isValid,
      errors: [...clientValidation.errors, ...serverValidation.errors],
      warnings: clientValidation.warnings || [],
    };
  }

  return clientValidation;
};

// Configuration validation state - used by AppLaunchGate
let configValidationResult = null;
let configValidationPerformed = false;

/**
 * Performs startup validation and caches the result
 * Call this early in app initialization
 */
export const performStartupValidation = () => {
  if (configValidationPerformed) {
    return configValidationResult;
  }

  configValidationResult = validateConfig();
  configValidationPerformed = true;

  return configValidationResult;
};

/**
 * Gets the cached validation result
 */
export const getValidationResult = () => {
  if (!configValidationPerformed) {
    return performStartupValidation();
  }
  return configValidationResult;
};

/**
 * Checks if the app is properly configured to run
 * Returns true if all critical config is present
 */
export const isAppConfigured = () => {
  const result = getValidationResult();
  return result.isValid;
};

// ============================================================================
// EXPORT ALL AS CONFIG OBJECT
// ============================================================================

export const ENV_CONFIG = {
  // Authentication & Database
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY, // Server-side only
  },
  firebase: {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    measurementId: FIREBASE_MEASUREMENT_ID,
  },

  // AI Services
  ai: {
    geminiApiKey: GEMINI_API_KEY,
    googleVisionApiKey: GOOGLE_VISION_API_KEY,
  },

  // Payments
  stripe: {
    publishableKey: STRIPE_PUBLISHABLE_KEY,
    secretKey: STRIPE_SECRET_KEY, // Server-side only
    webhookSecret: STRIPE_WEBHOOK_SECRET, // Server-side only
  },

  // Security (Server-side only)
  security: {
    jwtSecret: JWT_SECRET,
    sessionSecret: SESSION_SECRET,
    encryptionKey: ENCRYPTION_KEY,
  },

  // API
  api: {
    url: API_URL,
  },

  // Monitoring
  monitoring: {
    sentryDsn: SENTRY_DSN,
  },

  // Environment
  env: {
    nodeEnv: NODE_ENV,
    expoEnv: EXPO_ENV,
    isDevelopment: IS_DEVELOPMENT,
    isProduction: IS_PRODUCTION,
    isExpo,
    isWeb,
    isServer,
  },

  // Feature Flags
  features: {
    enableOcr: ENABLE_OCR,
    enableCamera: ENABLE_CAMERA,
    enable2FA: ENABLE_2FA,
    enableBiometric: ENABLE_BIOMETRIC,
  },
};

// Run startup validation immediately when this module loads
const startupValidation = performStartupValidation();

// Log configuration status in development (never log secrets)
if (IS_DEVELOPMENT && !isServer) {
  console.log('🔧 Environment Configuration Loaded:', {
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKeyConfigured: !!SUPABASE_ANON_KEY,
    firebaseConfigured: !!FIREBASE_API_KEY,
    stripeConfigured: !!STRIPE_PUBLISHABLE_KEY,
    apiUrl: API_URL,
    environment: EXPO_ENV,
  });
}

// Always log validation errors (in development) or fail fast (in production server)
if (!startupValidation.isValid) {
  if (IS_DEVELOPMENT) {
    console.error('❌ CRITICAL: Missing required environment configuration:');
    startupValidation.errors.forEach(err => console.error(`   - ${err}`));
    console.error('The app may not function correctly. Please set all required environment variables.');
  } else if (isServer) {
    // On server in production, fail fast
    throw new Error(`Missing required configuration: ${startupValidation.errors.join(', ')}`);
  }
  // On client in production, AppLaunchGate will handle showing error UI
}

// Log warnings in development
if (IS_DEVELOPMENT && startupValidation.warnings?.length > 0) {
  console.warn('⚠️ Configuration Warnings:');
  startupValidation.warnings.forEach(warn => console.warn(`   - ${warn}`));
}

export default ENV_CONFIG;
