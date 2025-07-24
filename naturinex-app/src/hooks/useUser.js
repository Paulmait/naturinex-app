import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { APP_CONFIG } from '../constants/appConfig';

export const useUser = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [userTier, setUserTier] = useState(APP_CONFIG.USER_TIERS.FREE);
  const [scanCount, setScanCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load user profile from Firestore
  const loadUserProfile = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        setIsPremium(data.isPremium || false);
        setUserTier(data.userTier || APP_CONFIG.USER_TIERS.FREE);
        setScanCount(data.scanCount || 0);
      } else {
        // Initialize new user profile
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: new Date(),
          isPremium: false,
          userTier: APP_CONFIG.USER_TIERS.FREE,
          scanCount: 0,
          lastScanDate: null,
          onboardingCompleted: false
        };
        
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
        setIsPremium(false);
        setUserTier(APP_CONFIG.USER_TIERS.FREE);
        setScanCount(0);
      }
      
      // Check if user is admin
      const isUserAdmin = APP_CONFIG.ADMIN_EMAILS.includes(user.email);
      setIsAdmin(isUserAdmin);
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      // Set default values on error
      setIsPremium(false);
      setUserTier(APP_CONFIG.USER_TIERS.FREE);
      setScanCount(0);
      setIsAdmin(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);
      
      // Update local state
      setUserProfile(prev => ({ ...prev, ...updates }));
      
      // Update specific state if needed
      if (updates.isPremium !== undefined) {
        setIsPremium(updates.isPremium);
      }
      if (updates.userTier !== undefined) {
        setUserTier(updates.userTier);
      }
      if (updates.scanCount !== undefined) {
        setScanCount(updates.scanCount);
      }
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Increment scan count
  const incrementScanCount = async () => {
    if (!user?.uid) {
      // Free tier - use session storage
      const currentCount = parseInt(sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.FREE_TIER_SCAN_COUNT) || '0');
      const newCount = currentCount + 1;
      sessionStorage.setItem(APP_CONFIG.STORAGE_KEYS.FREE_TIER_SCAN_COUNT, newCount.toString());
      setScanCount(newCount);
      return newCount;
    }
    
    try {
      const newCount = scanCount + 1;
      await updateUserProfile({ 
        scanCount: newCount,
        lastScanDate: new Date()
      });
      return newCount;
    } catch (error) {
      console.error('Error incrementing scan count:', error);
      return scanCount;
    }
  };

  // Check if user can perform scan (quota check)
  const canPerformScan = () => {
    if (isPremium) return true;
    
    const currentCount = user?.uid ? scanCount : 
      parseInt(sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.FREE_TIER_SCAN_COUNT) || '0');
    
    return currentCount < APP_CONFIG.SCAN_LIMITS.FREE_TIER_DAILY;
  };

  // Get remaining scans for free tier
  const getRemainingScans = () => {
    if (isPremium) return 'Unlimited';
    
    const currentCount = user?.uid ? scanCount : 
      parseInt(sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.FREE_TIER_SCAN_COUNT) || '0');
    
    return Math.max(0, APP_CONFIG.SCAN_LIMITS.FREE_TIER_DAILY - currentCount);
  };

  // Initialize user state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        await loadUserProfile(authUser);
      } else {
        // Reset state for logged out user
        setUserProfile(null);
        setIsPremium(false);
        setUserTier(APP_CONFIG.USER_TIERS.FREE);
        setScanCount(0);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    // State
    user,
    userProfile,
    isLoading,
    isPremium,
    userTier,
    scanCount,
    isAdmin,
    
    // Actions
    updateUserProfile,
    incrementScanCount,
    canPerformScan,
    getRemainingScans,
    
    // Computed values
    isLoggedIn: !!user,
    isFreeTier: userTier === APP_CONFIG.USER_TIERS.FREE
  };
}; 