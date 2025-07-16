import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration for Mediscan project
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

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

export { auth, db, provider };
