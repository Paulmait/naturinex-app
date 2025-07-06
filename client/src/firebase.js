import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserSessionPersistence, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration using environment variables for security
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// For beta testing: Set session-only persistence to ensure fresh start
// Comment this out in production if you want persistent login
try {
  setPersistence(auth, browserSessionPersistence);
  console.log('🔒 Auth persistence set to session-only for beta testing');
} catch (error) {
  console.warn('⚠️ Could not set auth persistence:', error);
}

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

// Helper function to clear all authentication and app state
export const clearAllAppState = async () => {
  try {
    // Sign out from Firebase
    await signOut(auth);
    
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('🧹 All app state cleared for fresh start');
  } catch (error) {
    console.error('Error clearing app state:', error);
  }
};

export { auth, db, provider, createUserWithEmailAndPassword, signInWithEmailAndPassword };
