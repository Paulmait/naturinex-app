import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "naturinex-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "naturinex-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "naturinex-app.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "398613963385",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:398613963385:web:91b3c8e67976c252f0aaa8"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;