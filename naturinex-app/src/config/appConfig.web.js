// App configuration for Web - no Expo dependencies
const getConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  return {
    // API Configuration
    API_URL: process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com',
    
    // Stripe Configuration (public key is safe to expose)
    STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05',
    
    // Firebase Configuration (these are client-side keys, safe to expose but should be restricted by domain)
    FIREBASE_CONFIG: {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD6X93iVLw92V58oAvMJdrhnW-tFxMcmZA",
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "mediscan-b6252.firebaseapp.com",
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "mediscan-b6252",
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "mediscan-b6252.appspot.com",
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1076876259650",
      appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1076876259650:web:f37e5ec88aba25cc8c3f35",
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-BVDBZFQYF1"
    },
    
    // Google OAuth Configuration
    GOOGLE_CONFIG: {
      webClientId: process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || "1076876259650-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com"
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
      enableOfflineMode: false, // Web doesn't support offline mode yet
      enableAnalytics: !isDev,
      enableCrashReporting: !isDev,
      requireAgeVerification: true,
      showMedicalDisclaimer: true
    }
  };
};

// Export the function
export default getConfig;