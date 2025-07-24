import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Firebase configuration - Use environment variables or fallback to defaults
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || Constants.expoConfig?.extra?.firebaseAuthDomain || "naturinex-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || Constants.expoConfig?.extra?.firebaseProjectId || "naturinex-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || Constants.expoConfig?.extra?.firebaseStorageBucket || "naturinex-app.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || Constants.expoConfig?.extra?.firebaseMessagingSenderId || "your-sender-id",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId || "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

export { auth, db, provider };
