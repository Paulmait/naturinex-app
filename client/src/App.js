import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
// Login component no longer needed - allowing free tier access
// import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import PremiumCheckout from './components/PremiumCheckout';
import AuthDebugger from './components/AuthDebugger';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumCheckout, setShowPremiumCheckout] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Check if user needs onboarding
        try {
          const userRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userRef);
          
          // Check Firestore first, then localStorage backup
          const firestoreCompleted = docSnap.exists() && docSnap.data().onboardingCompleted;
          const localStorageCompleted = localStorage.getItem(`onboarding-${user.uid}`) === 'completed';
          
          if (!firestoreCompleted && !localStorageCompleted) {
            setShowOnboarding(true);
          } else if (localStorageCompleted && !firestoreCompleted) {
            // Sync localStorage to Firestore if needed
            try {
              await setDoc(userRef, {
                onboardingCompleted: true,
                onboardingDate: new Date(),
                isPremium: false,
                scanCount: 0,
                lastScanDate: null
              }, { merge: true });
            } catch (error) {
              console.error('Error syncing onboarding to Firestore:', error);
            }
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          // Check localStorage as fallback
          const localStorageCompleted = localStorage.getItem(`onboarding-${user.uid}`) === 'completed';
          if (!localStorageCompleted) {
            setShowOnboarding(true);
          }
        }
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOnboardingComplete = (shouldShowPremium) => {
    setShowOnboarding(false);
    if (shouldShowPremium) {
      setShowPremiumCheckout(true);
    }
  };

  const handlePremiumSuccess = () => {
    setShowPremiumCheckout(false);
  };

  const handlePremiumCancel = () => {
    setShowPremiumCheckout(false);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>💊</div>
          <div style={{ color: '#2c5530', fontWeight: 'bold' }}>Loading MediScan...</div>
        </div>
      </div>
    );
  }

  // CHANGE: Allow free tier access without login
  // Users can scan without signing up, login required for premium features
  // if (!user) {
  //   return (
  //     <>
  //       <Login />
  //       <AuthDebugger />
  //     </>
  //   );
  // }

  if (user && showOnboarding) {
    return <Onboarding user={user} onComplete={handleOnboardingComplete} />;
  }

  if (showPremiumCheckout) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          maxWidth: '500px',
          margin: '20px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <PremiumCheckout 
            user={user} 
            onSuccess={handlePremiumSuccess}
            onCancel={handlePremiumCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard user={user} />
      <AuthDebugger />
    </>
  );
}

export default App;
