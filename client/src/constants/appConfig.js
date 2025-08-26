// App Configuration Constants
// Centralized configuration for Naturinex app

export const APP_CONFIG = {
  // App Information
  APP_NAME: 'Naturinex',
  APP_VERSION: '1.0.0',
  APP_DESCRIPTION: 'Natural medication alternatives scanner',
  
  // Admin Configuration
  ADMIN_EMAILS: [
    'admin@Naturinex.com',
    'maito@example.com'
  ],
  
  // User Tiers
  USER_TIERS: {
    FREE: 'free',
    PREMIUM: 'premium',
    ADMIN: 'admin'
  },
  
  // Scan Limits
  SCAN_LIMITS: {
    FREE_TIER_DAILY: 3,
    FREE_TIER_MONTHLY: 10,
    PREMIUM_TIER_DAILY: 50,
    PREMIUM_TIER_MONTHLY: 500
  },
  
  // UI Configuration
  UI: {
    MODAL_TIMEOUT: 30000, // 30 seconds
    LOADING_TIMEOUT: 10000, // 10 seconds
    AUTO_LOGOUT_DELAY: 300000, // 5 minutes
    CAMERA_TIMEOUT: 15000 // 15 seconds
  },
  
  // Analytics Events
  ANALYTICS_EVENTS: {
    SCAN_STARTED: 'scan_started',
    SCAN_COMPLETED: 'scan_completed',
    SCAN_FAILED: 'scan_failed',
    PREMIUM_UPGRADE: 'premium_upgrade',
    USER_LOGIN: 'user_login',
    USER_LOGOUT: 'user_logout',
    DASHBOARD_LOADED: 'dashboard_loaded'
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    SCAN_FAILED: 'Unable to process medication scan. Please try again.',
    NETWORK_ERROR: 'Network connection issue. Please check your internet.',
    CAMERA_ERROR: 'Camera access denied. Please enable camera permissions.',
    PREMIUM_REQUIRED: 'Premium subscription required for this feature.',
    QUOTA_EXCEEDED: 'Daily scan limit reached. Upgrade to premium for unlimited scans.'
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    SCAN_COMPLETED: 'Medication analysis completed successfully.',
    PREMIUM_UPGRADED: 'Premium subscription activated successfully.',
    SETTINGS_SAVED: 'Settings saved successfully.'
  },
  
  // Local Storage Keys
  STORAGE_KEYS: {
    DEVICE_ID: 'Naturinex_device_id',
    SESSION_ID: 'Naturinex_session_id',
    ONBOARDING_PREFIX: 'onboarding-',
    FREE_TIER_SCAN_COUNT: 'freeTierScanCount',
    USER_PREFERENCES: 'Naturinex_user_preferences'
  },
  
  // API Endpoints (if applicable)
  API: {
    BASE_URL: 'http://10.0.0.74:5000',
    TIMEOUT: 30000
  }
};

export default APP_CONFIG; 