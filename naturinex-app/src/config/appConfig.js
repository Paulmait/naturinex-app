// App configuration with secure handling of API keys
import Constants from 'expo-constants';

// In production, these should come from secure environment variables
// For app store submission, these are obfuscated but not truly secure
// Consider implementing certificate pinning for additional security

const getConfig = () => {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  
  // Get values from app.json extra field or use defaults
  const extra = Constants.expoConfig?.extra || {};
  
  return {
    // API Configuration
    API_URL: extra.apiUrl || 'https://naturinex-app-zsga.onrender.com',
    
    // Stripe Configuration (public key is safe to expose)
    STRIPE_PUBLISHABLE_KEY: extra.stripePublishableKey || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05',
    
    // Firebase Configuration (these are client-side keys, safe to expose but should be restricted by domain)
    FIREBASE_CONFIG: {
      apiKey: extra.firebaseApiKey,
      authDomain: extra.firebaseAuthDomain,
      projectId: extra.firebaseProjectId,
      storageBucket: extra.firebaseStorageBucket,
      messagingSenderId: extra.firebaseMessagingSenderId,
      appId: extra.firebaseAppId,
      measurementId: extra.firebaseMeasurementId
    },
    
    // Google OAuth Configuration
    GOOGLE_CONFIG: {
      expoClientId: extra.googleExpoClientId,
      iosClientId: extra.googleIosClientId,
      androidClientId: extra.googleAndroidClientId,
      webClientId: extra.googleExpoClientId
    },
    
    // App Configuration
    APP_CONFIG: {
      minAge: 17,
      privacyPolicyUrl: 'https://naturinex.com/privacy-policy',
      termsOfServiceUrl: 'https://naturinex.com/terms-of-service',
      supportEmail: 'support@naturinex.com',
      appStoreId: 'YOUR_APP_STORE_ID', // Update after app store submission
      playStoreId: 'com.naturinex.app'
    },
    
    // Feature Flags
    FEATURES: {
      enableOfflineMode: true,
      enableAnalytics: !isDev,
      enableCrashReporting: !isDev,
      requireAgeVerification: true,
      showMedicalDisclaimer: true
    }
  };
};

// Export the function instead of calling it immediately
export default getConfig;