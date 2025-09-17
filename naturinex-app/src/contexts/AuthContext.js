// Universal Auth Context - Supports both Firebase and Supabase
// Allows gradual migration from Firebase to Supabase

import React, { createContext, useContext, useState, useEffect } from 'react';
import TwoFactorAuthService from '../services/TwoFactorAuthService';

// Firebase imports
import { auth as firebaseAuth, db as firebaseDb } from '../config/firebase.web';
import {
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseSignUp,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Supabase imports
import { supabase, supabaseAuth, supabaseHelpers } from '../config/supabase';

// Determine which backend to use
const USE_SUPABASE = process.env.REACT_APP_USE_SUPABASE === 'true' || false;

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authBackend, setAuthBackend] = useState(USE_SUPABASE ? 'supabase' : 'firebase');
  const [twoFactorSettings, setTwoFactorSettings] = useState({});
  const [secureSession, setSecureSession] = useState(null);

  // Universal sign up function
  async function signup(email, password, additionalData = {}) {
    if (authBackend === 'supabase' && supabase) {
      // Supabase signup
      const { data, error } = await supabaseAuth.signUp(email, password, additionalData);
      if (error) throw error;
      return data;
    } else {
      // Firebase signup
      const { user } = await firebaseSignUp(firebaseAuth, email, password);

      // Create user profile in Firestore
      await setDoc(doc(firebaseDb, 'users', user.uid), {
        email: user.email,
        createdAt: new Date(),
        ...additionalData,
      });

      return user;
    }
  }

  // Universal sign in function
  async function login(email, password) {
    if (authBackend === 'supabase' && supabase) {
      const { data, error } = await supabaseAuth.signIn(email, password);
      if (error) throw error;
      return data;
    } else {
      const { user } = await firebaseSignIn(firebaseAuth, email, password);
      return user;
    }
  }

  // Universal sign out function
  async function logout() {
    if (authBackend === 'supabase' && supabase) {
      await supabaseAuth.signOut();
    } else {
      await firebaseSignOut(firebaseAuth);
    }
    setCurrentUser(null);
    setUserProfile(null);
  }

  // Google sign in
  async function signInWithGoogle() {
    if (authBackend === 'supabase' && supabase) {
      const { data, error } = await supabaseAuth.signInWithProvider('google');
      if (error) throw error;
      return data;
    } else {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(firebaseAuth, provider);

      // Check if user profile exists
      const userDoc = await getDoc(doc(firebaseDb, 'users', user.uid));
      if (!userDoc.exists()) {
        // Create profile if new user
        await setDoc(doc(firebaseDb, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date(),
        });
      }

      return user;
    }
  }

  // Get user profile
  async function getUserProfile(userId) {
    if (authBackend === 'supabase' && supabase) {
      return await supabaseHelpers.getUserProfile(userId);
    } else {
      const userDoc = await getDoc(doc(firebaseDb, 'users', userId));
      return userDoc.exists() ? userDoc.data() : null;
    }
  }

  // Update user profile
  async function updateProfile(updates) {
    if (!currentUser) return;

    if (authBackend === 'supabase' && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
      return data;
    } else {
      await setDoc(
        doc(firebaseDb, 'users', currentUser.uid),
        updates,
        { merge: true }
      );

      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
    }
  }

  // Check subscription status
  async function checkSubscription() {
    if (!currentUser) return { status: 'free', tier: 'basic' };

    if (authBackend === 'supabase' && supabase) {
      const profile = await supabaseHelpers.getUserProfile(currentUser.id);
      return {
        status: profile?.subscription_status || 'free',
        tier: profile?.subscription_tier || 'basic',
        expiresAt: profile?.subscription_expires_at,
      };
    } else {
      const userDoc = await getDoc(doc(firebaseDb, 'users', currentUser.uid));
      const data = userDoc.data();
      return {
        status: data?.subscription?.status || 'free',
        tier: data?.subscription?.tier || 'basic',
        expiresAt: data?.subscription?.expiresAt,
      };
    }
  }

  // 2FA Methods
  async function setup2FA() {
    if (!currentUser) throw new Error('No authenticated user');

    await TwoFactorAuthService.initialize();
    return true;
  }

  async function get2FASettings() {
    if (!currentUser) return {};

    try {
      const settings = await TwoFactorAuthService.getUserSettings(currentUser.uid || currentUser.id);
      setTwoFactorSettings(settings);
      return settings;
    } catch (error) {
      console.error('Get 2FA settings error:', error);
      return {};
    }
  }

  async function require2FAForOperation(operation) {
    if (!currentUser) return false;

    return await TwoFactorAuthService.require2FAForOperation(
      currentUser.uid || currentUser.id,
      operation
    );
  }

  async function validateSecureSession() {
    if (!secureSession) return false;

    const validation = await TwoFactorAuthService.validateSession(
      currentUser?.uid || currentUser?.id,
      secureSession.sessionId
    );

    return validation.valid && validation.twoFactorVerified;
  }

  async function createSecureSession(twoFactorVerified = false) {
    if (!currentUser) return null;

    const session = await TwoFactorAuthService.createSecureSession(
      currentUser.uid || currentUser.id,
      twoFactorVerified
    );

    setSecureSession(session);
    return session;
  }

  async function disable2FA(method = 'all') {
    if (!currentUser) throw new Error('No authenticated user');

    await TwoFactorAuthService.disable2FA(currentUser.uid || currentUser.id, method);
    await get2FASettings(); // Refresh settings
    return true;
  }

  // Switch backend (for testing/migration)
  function switchBackend(backend) {
    if (backend === 'supabase' && !supabase) {
      console.error('Supabase not configured');
      return;
    }
    setAuthBackend(backend);
    setLoading(true);
  }

  // Auth state listener
  useEffect(() => {
    let unsubscribe;

    if (authBackend === 'supabase' && supabase) {
      // Supabase auth listener
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);

          // Load user profile
          const profile = await supabaseHelpers.getUserProfile(session.user.id);
          setUserProfile(profile);

          // Load 2FA settings
          await get2FASettings();
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setTwoFactorSettings({});
          setSecureSession(null);
        }
        setLoading(false);
      });

      unsubscribe = () => {
        authListener.subscription.unsubscribe();
      };

      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setCurrentUser(session.user);
          supabaseHelpers.getUserProfile(session.user.id).then(async (profile) => {
            setUserProfile(profile);
            await get2FASettings();
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
    } else {
      // Firebase auth listener
      unsubscribe = firebaseOnAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setCurrentUser(user);

          // Load user profile from Firestore
          const userDoc = await getDoc(doc(firebaseDb, 'users', user.uid));
          setUserProfile(userDoc.exists() ? userDoc.data() : null);

          // Load 2FA settings
          await get2FASettings();
        } else {
          setCurrentUser(null);
          setUserProfile(null);
          setTwoFactorSettings({});
          setSecureSession(null);
        }
        setLoading(false);
      });
    }

    return unsubscribe;
  }, [authBackend]);

  const value = {
    currentUser,
    userProfile,
    authBackend,
    twoFactorSettings,
    secureSession,
    signup,
    login,
    logout,
    signInWithGoogle,
    getUserProfile,
    updateProfile,
    checkSubscription,
    switchBackend,
    setup2FA,
    get2FASettings,
    require2FAForOperation,
    validateSecureSession,
    createSecureSession,
    disable2FA,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;