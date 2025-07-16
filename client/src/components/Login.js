import React, { useState, useEffect } from 'react';
import { auth, provider } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loginMode, setLoginMode] = useState('google'); // 'google', 'email', 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

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
    setError('');
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
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const signInWithEmail = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email login error:', error);
      let errorMessage = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Try signing up first.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email signup error:', error);
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      }
      setError(errorMessage);
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

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {loginMode === 'google' && (
          <>
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
                maxWidth: '280px',
                marginBottom: '15px'
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

            <div style={{ margin: '20px 0', color: '#666' }}>
              OR
            </div>

            <button 
              onClick={() => setLoginMode('email')}
              style={{
                backgroundColor: '#2c5530',
                color: 'white',
                border: 'none',
                padding: '12px 20px',
                fontSize: '14px',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '10px',
                width: '100%',
                maxWidth: '280px'
              }}
            >
              📧 Beta Tester Login (Email)
            </button>

            <button 
              onClick={() => setLoginMode('signup')}
              style={{
                backgroundColor: 'transparent',
                color: '#2c5530',
                border: '2px solid #2c5530',
                padding: '12px 20px',
                fontSize: '14px',
                borderRadius: '5px',
                cursor: 'pointer',
                width: '100%',
                maxWidth: '280px'
              }}
            >
              🆕 Create Beta Account
            </button>
          </>
        )}

        {loginMode === 'email' && (
          <>
            <div style={{ textAlign: 'left', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              onClick={signInWithEmail}
              disabled={isLoading}
              style={{
                backgroundColor: '#2c5530',
                color: 'white',
                border: 'none',
                padding: '15px 25px',
                fontSize: '16px',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                width: '100%',
                maxWidth: '280px',
                marginBottom: '15px'
              }}
            >
              {isLoading ? 'Signing in...' : '🔐 Sign In'}
            </button>

            <button 
              onClick={() => setLoginMode('google')}
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                border: 'none',
                padding: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Google Login
            </button>
          </>
        )}

        {loginMode === 'signup' && (
          <>
            <div style={{ textAlign: 'left', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginBottom: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              onClick={signUpWithEmail}
              disabled={isLoading}
              style={{
                backgroundColor: '#2c5530',
                color: 'white',
                border: 'none',
                padding: '15px 25px',
                fontSize: '16px',
                borderRadius: '5px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                width: '100%',
                maxWidth: '280px',
                marginBottom: '15px'
              }}
            >
              {isLoading ? 'Creating Account...' : '🆕 Create Account'}
            </button>

            <button 
              onClick={() => setLoginMode('google')}
              style={{
                backgroundColor: 'transparent',
                color: '#666',
                border: 'none',
                padding: '10px',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              ← Back to Google Login
            </button>
          </>
        )}
        
        <div style={{ 
          marginTop: '20px', 
          fontSize: '12px', 
          color: '#888' 
        }}>
          <p>Free • Secure • No spam</p>
          <p>Get up to 5 AI-powered suggestions per day</p>
          <p style={{ color: '#2c5530', fontWeight: 'bold' }}>
            🧪 Beta Testing: Create account with any email!
          </p>
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
