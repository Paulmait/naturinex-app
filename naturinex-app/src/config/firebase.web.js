// Firebase configuration for Web version
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appConfig from './appConfig.web.js';

// Get the config by calling the function
const config = appConfig();

// Firebase configuration
const firebaseConfig = {
  apiKey: config.FIREBASE_CONFIG.apiKey,
  authDomain: config.FIREBASE_CONFIG.authDomain,
  projectId: config.FIREBASE_CONFIG.projectId,
  storageBucket: config.FIREBASE_CONFIG.storageBucket,
  messagingSenderId: config.FIREBASE_CONFIG.messagingSenderId,
  appId: config.FIREBASE_CONFIG.appId,
  measurementId: config.FIREBASE_CONFIG.measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth (web uses default persistence)
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export default app;