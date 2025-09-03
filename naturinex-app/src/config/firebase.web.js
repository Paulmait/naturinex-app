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

// Debug logging only in development
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Debug:', {
    hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
}

// Validate configuration
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  throw new Error('Firebase configuration is missing. Please set environment variables.');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  if (process.env.NODE_ENV === 'development') {
    console.log('Firebase initialized successfully');
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Firebase initialization error:', error);
  }
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

// Initialize Auth (web uses default persistence)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export default app;