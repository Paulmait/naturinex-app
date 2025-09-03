// Firebase configuration for Web version
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Direct Firebase configuration - no dependency on appConfig
// These values are safe to expose as they're client-side keys
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyD6X93iVLw92V58oAvMJdrhnW-tFxMcmZA",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "mediscan-b6252.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "mediscan-b6252",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "mediscan-b6252.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1076876259650",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1076876259650:web:f37e5ec88aba25cc8c3f35",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-BVDBZFQYF1"
};

// Debug logging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-4) : 'MISSING'
  });
}

// Validate configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.error('Firebase API Key is missing! Using fallback configuration.');
  // Use hardcoded fallback
  firebaseConfig.apiKey = "AIzaSyD6X93iVLw92V58oAvMJdrhnW-tFxMcmZA";
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Try with fallback config
  const fallbackConfig = {
    apiKey: "AIzaSyD6X93iVLw92V58oAvMJdrhnW-tFxMcmZA",
    authDomain: "mediscan-b6252.firebaseapp.com",
    projectId: "mediscan-b6252",
    storageBucket: "mediscan-b6252.appspot.com",
    messagingSenderId: "1076876259650",
    appId: "1:1076876259650:web:f37e5ec88aba25cc8c3f35",
    measurementId: "G-BVDBZFQYF1"
  };
  app = initializeApp(fallbackConfig);
}

// Initialize Auth (web uses default persistence)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export default app;