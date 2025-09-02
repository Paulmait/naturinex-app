// Web-specific configuration for production
const webConfig = {
  // Backend API URL - using Render deployment
  API_URL: process.env.REACT_APP_API_URL || 'https://naturinex-app-zsga.onrender.com',
  
  // Stripe Live Public Key (safe to expose)
  STRIPE_PUBLISHABLE_KEY: process.env.REACT_APP_STRIPE_KEY || 'pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05',
  
  // Firebase Configuration - Replace API key in Vercel environment variables
  FIREBASE_CONFIG: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naturinex-app.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naturinex-app",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naturinex-app.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "398613963385",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:398613963385:web:91b3c8e67976c252f0aaa8",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-04VE09YVEC"
  }
};

export default webConfig;