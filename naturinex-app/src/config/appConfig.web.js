// App configuration for Web - no Expo dependencies
const getConfig = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  // Firebase configuration for naturinex-app project
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naturinex-app.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naturinex-app",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naturinex-app.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "398613963385",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:398613963385:web:91b3c8e67976c252f0aaa8"
  };
  
  return {
    // API Configuration
    API_URL: process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com',
    
    // Stripe Configuration (public key is safe to expose)
    STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05',
    
    // Firebase Configuration
    FIREBASE_CONFIG: firebaseConfig,
    
    // Google OAuth Configuration (optional for web)
    GOOGLE_CONFIG: {
      webClientId: process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID || "398613963385-7o0aaj1ue9kd8e3h3fkq9qtv04e7mqvg.apps.googleusercontent.com"
    },
    
    // App Configuration
    APP_CONFIG: {
      minAge: 17,
      privacyPolicyUrl: 'https://naturinex.com/privacy-policy',
      termsOfServiceUrl: 'https://naturinex.com/terms-of-service',
      supportEmail: 'guampaul@gmail.com',
      appStoreId: 'YOUR_APP_STORE_ID',
      playStoreId: 'com.naturinex.app'
    },
    
    // Feature Flags
    FEATURES: {
      enableOfflineMode: false,
      enableAnalytics: !isDev,
      enableCrashReporting: !isDev,
      requireAgeVerification: true,
      showMedicalDisclaimer: true
    }
  };
};

// Export the function
export default getConfig;