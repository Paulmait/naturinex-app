// 💎 Enhanced Premium Checkout with Tiered Pricing
// Professional pricing strategy with better value proposition and anti-abuse features

import React, { useState } from 'react';
import { trackEvent } from '../utils/analytics';

function EnhancedPremiumCheckout({ user, onSuccess, onCancel }) {
  const [selectedPlan, setSelectedPlan] = useState('premium');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isProcessing, setIsProcessing] = useState(false);  const plans = {
    basic: {
      name: 'Basic',
      icon: '📱',
      monthly: 7.99,
      yearly: 79.99,
      savings: 16,
      features: [
        '10 scans per month',
        '30-day storage',
        'Email results',
        'No watermarks',
        'Basic AI analysis'
      ],
      limits: {
        scansPerMonth: 10,
        storageLimit: 30,
        advancedFeatures: false
      }
    },
    premium: {
      name: 'Premium',
      icon: '💎',
      monthly: 14.99,
      yearly: 149.99,
      savings: 30,
      popular: true,
      features: [
        '50 scans per month',
        'Permanent storage',
        'Advanced AI analysis',
        'Drug interaction warnings',
        'PDF export',
        'Priority support',
        'Health timeline tracking',
        'Comprehensive medical insights'
      ],
      limits: {
        scansPerMonth: 50,
        storageLimit: 0, // Permanent
        advancedFeatures: true
      }
    },
    professional: {
      name: 'Professional',
      icon: '🏆',
      monthly: 39.99,
      yearly: 399.99,
      savings: 80,
      features: [
        '200 scans per month',
        'Everything in Premium',
        'Bulk scanning',
        'API access',
        'Custom reports',
        'White-label options',
        'Healthcare provider tools',
        'Advanced analytics'
      ],
      limits: {
        scansPerMonth: 200,
        storageLimit: 0, // Permanent
        advancedFeatures: true,
        apiAccess: true
      }
    }
  };

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    trackEvent('plan_selected', { 
      plan: planKey, 
      billingCycle,
      price: billingCycle === 'monthly' ? plans[planKey].monthly : plans[planKey].yearly
    });
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
    trackEvent('billing_cycle_changed', { 
      cycle, 
      plan: selectedPlan,
      savings: cycle === 'yearly' ? plans[selectedPlan].savings : 0
    });
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    
    try {
      const plan = plans[selectedPlan];
      const amount = billingCycle === 'monthly' ? plan.monthly : plan.yearly;
      
      // Track checkout initiation
      await trackEvent('checkout_initiated', {
        plan: selectedPlan,
        billingCycle,
        amount,
        userId: user?.uid
      });

      // Call Stripe checkout
      const response = await fetch('http://localhost:5000/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid,
          userEmail: user?.email,
          plan: selectedPlan,
          billingCycle,
          amount: amount * 100, // Convert to cents
          planName: `${plan.name} - ${billingCycle}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Track checkout error
      await trackEvent('checkout_error', {
        plan: selectedPlan,
        billingCycle,
        error: error.message,
        userId: user?.uid
      });
      
      alert('Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getCurrentPrice = () => {
    const plan = plans[selectedPlan];
    return billingCycle === 'monthly' ? plan.monthly : plan.yearly;
  };

  const getSavings = () => {
    if (billingCycle === 'yearly') {
      return plans[selectedPlan].savings;
    }
    return 0;
  };

  return (
    <div style={{ 
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '15px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: '#2c5530', marginBottom: '10px' }}>
          🚀 Choose Your Plan
        </h2>
        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
          Unlock professional health management with advanced AI analysis
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '30px',
        backgroundColor: '#f8f9fa',
        borderRadius: '25px',
        padding: '5px'
      }}>
        {['monthly', 'yearly'].map(cycle => (
          <button
            key={cycle}
            onClick={() => handleBillingCycleChange(cycle)}
            style={{
              flex: 1,
              padding: '10px 20px',
              backgroundColor: billingCycle === cycle ? '#2c5530' : 'transparent',
              color: billingCycle === cycle ? 'white' : '#666',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: billingCycle === cycle ? 'bold' : 'normal',
              transition: 'all 0.2s ease'
            }}
          >
            {cycle === 'monthly' ? 'Monthly' : 'Yearly (Save up to $80!)'}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            onClick={() => handlePlanSelect(key)}
            style={{
              border: selectedPlan === key ? '3px solid #2c5530' : '2px solid #e0e0e0',
              borderRadius: '15px',
              padding: '25px',
              cursor: 'pointer',
              position: 'relative',
              backgroundColor: selectedPlan === key ? '#f8f9fa' : 'white',
              transition: 'all 0.2s ease',
              transform: selectedPlan === key ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '20px',
                backgroundColor: '#ff6b35',
                color: 'white',
                padding: '5px 15px',
                borderRadius: '15px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                MOST POPULAR
              </div>
            )}

            {/* Plan Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{plan.icon}</div>
              <h3 style={{ color: '#2c5530', marginBottom: '5px' }}>{plan.name}</h3>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333' }}>
                ${billingCycle === 'monthly' ? plan.monthly : plan.yearly}
                <span style={{ fontSize: '16px', color: '#666' }}>
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
              </div>
              {billingCycle === 'yearly' && plan.savings > 0 && (
                <div style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
                  Save ${plan.savings}!
                </div>
              )}
            </div>

            {/* Features List */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {plan.features.map((feature, index) => (
                <li key={index} style={{ 
                  padding: '8px 0',
                  borderBottom: index < plan.features.length - 1 ? '1px solid #f0f0f0' : 'none',
                  fontSize: '14px',
                  color: '#333'
                }}>
                  <span style={{ color: '#28a745', marginRight: '8px' }}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* Selection Indicator */}
            {selectedPlan === key && (
              <div style={{
                marginTop: '15px',
                textAlign: 'center',
                color: '#2c5530',
                fontWeight: 'bold'
              }}>
                ✅ Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Anti-Abuse Notice */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <h5 style={{ color: '#856404', marginTop: 0, marginBottom: '10px' }}>
          🛡️ Personal Use Policy
        </h5>
        <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
          Plans are for individual personal use only. Sharing accounts or scanning for others violates our terms. 
          Each account is tracked by device fingerprint and usage patterns.
        </p>
      </div>

      {/* Checkout Summary */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Selected Plan:</span>
          <span style={{ fontWeight: 'bold' }}>{plans[selectedPlan].name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Billing:</span>
          <span style={{ fontWeight: 'bold' }}>{billingCycle}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Price:</span>
          <span style={{ fontWeight: 'bold', fontSize: '18px', color: '#2c5530' }}>
            ${getCurrentPrice()}/{billingCycle === 'monthly' ? 'mo' : 'yr'}
          </span>
        </div>
        {getSavings() > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#28a745' }}>
            <span>You Save:</span>
            <span style={{ fontWeight: 'bold' }}>${getSavings()}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '15px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleCheckout}
          disabled={isProcessing}
          style={{
            flex: 2,
            padding: '15px',
            backgroundColor: isProcessing ? '#ccc' : '#2c5530',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isProcessing ? 'Processing...' : `Start ${plans[selectedPlan].name} Plan`}
        </button>
      </div>

      {/* Security Notice */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '20px',
        fontSize: '12px',
        color: '#666'
      }}>
        🔒 Secure checkout powered by Stripe. Cancel anytime.
      </div>
    </div>
  );
}

export default EnhancedPremiumCheckout;
