import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, setPersistence, browserSessionPersistence, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for Naturinex project (using existing mediscan project)
const firebaseConfig = {
  apiKey: "AIzaSyDsTe9-uNbFq4rCJbIjXra7_j9hRCy9Nq4",
  authDomain: "mediscan-b6252.firebaseapp.com",
  projectId: "mediscan-b6252",
  storageBucket: "mediscan-b6252.appspot.com",
  messagingSenderId: "890126739800",
  appId: "1:890126739800:web:fc1bf8d290b0533e501d2d"
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
