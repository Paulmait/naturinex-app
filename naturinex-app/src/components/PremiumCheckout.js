import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import getStripe from '../stripe';
import Constants from 'expo-constants';
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://naturinex-app-1.onrender.com';
function PremiumCheckout({ user, onSuccess, onCancel }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Create checkout session
      const response = await fetch(`${API_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          userEmail: user.email,
        }),
      });
      const { sessionId } = await response.json();
      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to start checkout process');
      console.error('Checkout error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  const handleTestUpgrade = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Test endpoint for demo purposes
      const response = await fetch(`${API_URL}/test-premium-upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
        }),
      });
      const result = await response.json();
      if (result.success) {
        // Update Firestore with premium status
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          isPremium: true,
          premiumSince: new Date(),
          subscriptionType: 'test_upgrade',
          lastUpdated: new Date()
        }, { merge: true });
        onSuccess();
      } else {
        setError(result.error || 'Test upgrade failed');
      }
    } catch (err) {
      setError('Test upgrade failed');
      console.error('Test upgrade error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div style={{
      padding: '20px',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#2c5530', marginBottom: '20px' }}>
        🚀 Upgrade to Premium
      </h3>
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#333', marginBottom: '15px' }}>Premium Features:</h4>
        <ul style={{ textAlign: 'left', color: '#666', marginBottom: '15px' }}>
          <li>✅ Unlimited daily scans</li>
          <li>✅ Export results to PDF</li>
          <li>✅ Email and share results</li>
          <li>✅ Scan history tracking</li>
          <li>✅ Priority AI responses</li>
          <li>✅ Advanced analytics</li>
        </ul>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c5530' }}>
          $6.99/month (Plus) or $12.99/month (Pro)
        </div>
      </div>
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '15px'
        }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <button
          onClick={handleCheckout}
          disabled={isLoading}
          style={{
            backgroundColor: '#2c5530',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Processing...' : '💳 Pay with Stripe'}
        </button>
        <button
          onClick={handleTestUpgrade}
          disabled={isLoading}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Processing...' : '🧪 Test Upgrade (Demo)'}
        </button>
        <button
          onClick={onCancel}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3cd',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#856404'
      }}>
        <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future date and CVC for testing.
        Or use the "Test Upgrade" button for instant demo.
      </div>
    </div>
  );
}
export default PremiumCheckout;
