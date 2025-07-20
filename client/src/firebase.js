import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import Constants from 'expo-constants';

// Firebase configuration - Use environment variables or fallback to defaults
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "mediscan-b6252.firebaseapp.com",
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.REACT_APP_FIREBASE_PROJECT_ID || "mediscan-b6252",
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "mediscan-b6252.appspot.com",
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "890126739800",
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
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
