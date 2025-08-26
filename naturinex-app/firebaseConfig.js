// Firebase configuration for Naturinex
// Replace these values with your actual Firebase project configuration

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naturinex-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naturinex-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naturinex-app.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "398613963385",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:398613963385:web:91b3c8e67976c252f0aaa8",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-04VE09YVEC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (optional, only in production)
// export const analytics = getAnalytics(app);

export default app;