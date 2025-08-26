// Firebase configuration for Naturinex app
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import appConfig from './appConfig.js';

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

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence()
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
export default app;