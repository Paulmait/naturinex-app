// Firebase configuration for Web version
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Direct Firebase configuration for naturinex-app project
// These values are safe to expose as they're client-side keys
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naturinex-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naturinex-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naturinex-app.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "398613963385",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:398613963385:web:91b3c8e67976c252f0aaa8"
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
  // Use hardcoded fallback for naturinex-app
  firebaseConfig.apiKey = "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w";
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
} catch (error) {
  console.error('Firebase initialization error:', error);
  // Try with fallback config
  const fallbackConfig = {
    apiKey: "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w",
    authDomain: "naturinex-app.firebaseapp.com",
    projectId: "naturinex-app",
    storageBucket: "naturinex-app.appspot.com",
    messagingSenderId: "398613963385",
    appId: "1:398613963385:web:91b3c8e67976c252f0aaa8"
  };
  app = initializeApp(fallbackConfig);
}

// Initialize Auth (web uses default persistence)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export default app;