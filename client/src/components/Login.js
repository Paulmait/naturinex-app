import React, { useState, useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if running on mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    setIsMobile(mobile);

    // Handle redirect result for mobile devices
    if (mobile) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            console.log('Sign-in successful via redirect');
          }
        })
        .catch((error) => {
          console.error('Redirect sign-in error:', error);
          setIsLoading(false);
        });
    }
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      if (isMobile) {
        // Use redirect for mobile devices (better compatibility)
        await signInWithRedirect(auth, provider);
      } else {
        // Use popup for desktop (better UX)
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to sign in. Please try again.';
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'This domain is not authorized. Please contact support.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      }
      
      alert(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          color: '#333', 
          marginBottom: '10px',
          fontSize: '2.5em'
        }}>
          🏥 Naturinex
        </h1>
        <p style={{ 
          color: '#666', 
          marginBottom: '30px',
          fontSize: '1.1em'
        }}>
          Discover natural alternatives to your medications
        </p>
        
        <button 
          onClick={signIn}
          disabled={isLoading}
          style={{
            backgroundColor: '#4285f4',
            color: 'white',
            border: 'none',
            padding: '15px 25px',
            fontSize: '16px',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1,
            transition: 'all 0.3s ease',
            width: '100%',
            maxWidth: '280px'
          }}
          onMouseOver={(e) => {
            if (!isLoading) e.target.style.backgroundColor = '#3367d6';
          }}
          onMouseOut={(e) => {
            if (!isLoading) e.target.style.backgroundColor = '#4285f4';
          }}
        >
          {isLoading ? 'Signing in...' : '🔐 Sign in with Google'}
        </button>
        
        <div style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#888' 
        }}>
          <p>Free • Secure • No spam</p>
          <p>Get up to 5 AI-powered suggestions per day</p>
          {isMobile && (
            <p style={{ color: '#007bff', marginTop: '10px' }}>
              📱 Mobile-optimized authentication
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
