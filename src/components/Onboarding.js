import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

function Onboarding({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);  const [userData, setUserData] = useState({
    age: '',
    healthGoals: [],
    conditions: [],
    medications: [],
    interests: [],
    privacyConsent: false,
    termsAccepted: false,
    privacyPolicyAccepted: false,
    communicationPrefs: {
      email: true,
      pushNotifications: true
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    {
      id: 'welcome',
      title: '👋 Welcome to Naturinex',
      subtitle: 'Your natural wellness guide',
      component: WelcomeStep
    },
    {
      id: 'privacy',
      title: '🔒 Your Privacy Matters',
      subtitle: 'We take your health data seriously',
      component: PrivacyStep
    },
    {
      id: 'profile',
      title: '👤 Tell us about yourself',
      subtitle: 'Help us personalize your experience',
      component: ProfileStep
    },
    {
      id: 'health',
      title: '🌿 Natural Wellness',
      subtitle: 'What are your health goals?',
      component: HealthStep
    },
    {
      id: 'preview',
      title: '✨ See what\'s possible',
      subtitle: 'Preview your personalized dashboard',
      component: PreviewStep
    },
    {
      id: 'paywall',
      title: '🚀 Unlock Premium Features',
      subtitle: 'Get the most out of Naturinex',
      component: PaywallStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setCurrentStep(steps.length - 2); // Go to preview step
  };
  const handleComplete = async (skipPaywall = false) => {
    setIsLoading(true);
    try {
      // Save user preferences to Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        ...userData,
        onboardingCompleted: true,
        onboardingDate: new Date(),
        isPremium: false, // Will be updated if they upgrade
        scanCount: 0,
        lastScanDate: null
      }, { merge: true });

      // Also save to localStorage as backup
      localStorage.setItem(`onboarding-${user.uid}`, 'completed');

      onComplete(skipPaywall);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Still save to localStorage even if Firestore fails
      localStorage.setItem(`onboarding-${user.uid}`, 'completed');
      onComplete(skipPaywall);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = (key, value) => {
    setUserData(prev => ({ ...prev, [key]: value }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Progress Bar */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderBottom: '1px solid #e0e0e0'
      }}>
        <div style={{
          maxWidth: '500px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#2c5530'
          }}>
            Naturinex
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              backgroundColor: '#e0e0e0',
              height: '6px',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                backgroundColor: '#2c5530',
                height: '100%',
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <div style={{
            fontSize: '12px',
            color: '#666'
          }}>
            {currentStep + 1} of {steps.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '20px',
        maxWidth: '500px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <CurrentStepComponent
            userData={userData}
            updateUserData={updateUserData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            onComplete={handleComplete}
            isLoading={isLoading}
            user={user}
            currentStep={currentStep}
            totalSteps={steps.length}
            stepData={steps[currentStep]}
          />
        </div>
      </div>
    </div>
  );
}

// Step Components
function WelcomeStep({ onNext, stepData }) {
  return (
    <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '20px' }}>🌿</div>
      <h1 style={{ color: '#2c5530', marginBottom: '15px', fontSize: '28px' }}>
        {stepData.title}
      </h1>
      <p style={{ color: '#666', fontSize: '18px', marginBottom: '30px', lineHeight: '1.6' }}>
        Discover natural wellness alternatives with AI-powered insights.
        Join thousands who've already improved their wellness journey.
      </p>
      
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>✨ What you'll get:</h3>
        <ul style={{ textAlign: 'left', color: '#666', margin: 0, paddingLeft: '20px' }}>
          <li>Personalized natural alternatives</li>
          <li>AI-powered medication analysis</li>
          <li>Professional health disclaimers</li>
          <li>Secure, private health tracking</li>
        </ul>
      </div>

      <button
        onClick={onNext}
        style={{
          backgroundColor: '#2c5530',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Get Started →
      </button>
    </div>
  );
}

function PrivacyStep({ userData, updateUserData, onNext, onBack, stepData }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
        <h2 style={{ color: '#2c5530', marginBottom: '10px' }}>{stepData.title}</h2>
        <p style={{ color: '#666' }}>{stepData.subtitle}</p>
      </div>

      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '25px'
      }}>
        <h3 style={{ color: '#2c5530', marginBottom: '15px' }}>🛡️ Our Privacy Promise</h3>
        <ul style={{ color: '#666', margin: 0, paddingLeft: '20px', lineHeight: '1.6' }}>
          <li><strong>HIPAA-Compliant:</strong> Your health data is protected by industry standards</li>
          <li><strong>Encrypted Storage:</strong> All data is encrypted at rest and in transit</li>
          <li><strong>No Selling:</strong> We never sell your personal health information</li>
          <li><strong>You Control:</strong> Delete your data anytime</li>
        </ul>
      </div>      <div style={{
        backgroundColor: '#fff3cd',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '25px'
      }}>
        <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
          <strong>Medical Disclaimer:</strong> Naturinex provides educational information only. 
          Always consult healthcare professionals before making medical decisions.
        </p>
      </div>

      <div style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '25px'
      }}>
        <h4 style={{ color: '#333', marginBottom: '15px' }}>📋 Legal Agreement Required</h4>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
          By using Naturinex, you must agree to our Terms of Use and Privacy Policy:
        </p>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={userData.termsAccepted || false}
              onChange={(e) => updateUserData('termsAccepted', e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span style={{ color: '#333', fontSize: '14px' }}>
              I agree to the <strong>Terms of Use</strong> (includes medical disclaimers and liability limitations)
            </span>
          </label>
          
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={userData.privacyPolicyAccepted || false}
              onChange={(e) => updateUserData('privacyPolicyAccepted', e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span style={{ color: '#333', fontSize: '14px' }}>
              I agree to the <strong>Privacy Policy</strong> (data collection and health information handling)
            </span>
          </label>
        </div>
      </div>      <label style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '30px',
        cursor: 'pointer'
      }}>
        <input
          type="checkbox"
          checked={userData.privacyConsent}
          onChange={(e) => updateUserData('privacyConsent', e.target.checked)}
          style={{ marginTop: '2px' }}
        />
        <span style={{ color: '#333', fontSize: '14px' }}>
          I understand this app provides educational information only and will consult healthcare professionals for medical decisions
        </span>
      </label>

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!userData.privacyConsent || !userData.termsAccepted || !userData.privacyPolicyAccepted}
          style={{
            flex: 2,
            backgroundColor: (userData.privacyConsent && userData.termsAccepted && userData.privacyPolicyAccepted) ? '#2c5530' : '#ccc',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: (userData.privacyConsent && userData.termsAccepted && userData.privacyPolicyAccepted) ? 'pointer' : 'not-allowed'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function ProfileStep({ userData, updateUserData, onNext, onBack, stepData }) {
  const ageRanges = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
  
  const interests = [
    'Natural remedies', 'Nutrition', 'Fitness', 'Mental health',
    'Chronic conditions', 'Preventive care', 'Alternative medicine', 'Supplements'
  ];

  const toggleInterest = (interest) => {
    const current = userData.interests || [];
    if (current.includes(interest)) {
      updateUserData('interests', current.filter(i => i !== interest));
    } else {
      updateUserData('interests', [...current, interest]);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>👤</div>
        <h2 style={{ color: '#2c5530', marginBottom: '10px' }}>{stepData.title}</h2>
        <p style={{ color: '#666' }}>{stepData.subtitle}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
          Age Range
        </label>
        <select
          value={userData.age}
          onChange={(e) => updateUserData('age', e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '16px'
          }}
        >
          <option value="">Select your age range</option>
          {ageRanges.map(range => (
            <option key={range} value={range}>{range}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
          Health Interests (select all that apply)
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {interests.map(interest => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: (userData.interests || []).includes(interest) ? '#e8f5e8' : 'white',
                color: (userData.interests || []).includes(interest) ? '#2c5530' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'center'
              }}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 2,
            backgroundColor: '#2c5530',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function HealthStep({ userData, updateUserData, onNext, onBack, onSkip, stepData }) {
  const healthGoals = [
    'Reduce medication dependency',
    'Find natural alternatives',
    'Understand side effects',
    'Improve overall wellness',
    'Manage chronic conditions',
    'Preventive health measures'
  ];

  const toggleGoal = (goal) => {
    const current = userData.healthGoals || [];
    if (current.includes(goal)) {
      updateUserData('healthGoals', current.filter(g => g !== goal));
    } else {
      updateUserData('healthGoals', [...current, goal]);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🌿</div>
        <h2 style={{ color: '#2c5530', marginBottom: '10px' }}>{stepData.title}</h2>
        <p style={{ color: '#666' }}>{stepData.subtitle}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 'bold' }}>
          What are your health goals?
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {healthGoals.map(goal => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: (userData.healthGoals || []).includes(goal) ? '#e8f5e8' : 'white',
                color: (userData.healthGoals || []).includes(goal) ? '#2c5530' : '#666',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {goal}
              {(userData.healthGoals || []).includes(goal) && <span>✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
          💡 <strong>Tip:</strong> The more we know about your goals, the better we can personalize your experience.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          onClick={onSkip}
          style={{
            backgroundColor: 'transparent',
            color: '#666',
            border: 'none',
            padding: '12px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Skip
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 2,
            backgroundColor: '#2c5530',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

function PreviewStep({ userData, onNext, onBack, stepData }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>✨</div>
        <h2 style={{ color: '#2c5530', marginBottom: '10px' }}>{stepData.title}</h2>
        <p style={{ color: '#666' }}>{stepData.subtitle}</p>
      </div>

      {/* Mock Dashboard Preview */}
      <div style={{
        border: '2px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <div style={{
          backgroundColor: '#2c5530',
          color: 'white',
          padding: '10px 15px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          📱 Your Personalized Dashboard
        </div>
        <div style={{ padding: '15px', backgroundColor: 'white' }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>Daily Scans Remaining</div>
            <div style={{ fontSize: '24px', color: '#2c5530', fontWeight: 'bold' }}>5 free scans</div>
          </div>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Recommended for you:</div>
            <div style={{ fontSize: '14px', color: '#333' }}>
              🌿 Natural alternatives for {userData.interests?.[0] || 'your health goals'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #2c5530',
              borderRadius: '4px',
              color: '#2c5530',
              fontSize: '12px'
            }}>
              📊 Scan Barcode
            </button>
            <button style={{
              flex: 1,
              padding: '8px',
              backgroundColor: '#e8f5e8',
              border: '1px solid #2c5530',
              borderRadius: '4px',
              color: '#2c5530',
              fontSize: '12px'
            }}>
              📸 Take Photo
            </button>
          </div>
        </div>
      </div>

      <div style={{
        backgroundColor: '#e8f5e8',
        padding: '15px',
        borderRadius: '6px',
        marginBottom: '20px'
      }}>
        <h4 style={{ color: '#2c5530', margin: '0 0 10px 0' }}>🎯 Personalized just for you:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
          <li>Age-appropriate recommendations ({userData.age || 'your age group'})</li>
          <li>Focus on {(userData.interests || ['your interests']).slice(0, 2).join(' and ')}</li>
          <li>Goals: {(userData.healthGoals || ['your health goals']).slice(0, 1)[0] || 'wellness improvement'}</li>
        </ul>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <button
          onClick={onBack}
          style={{
            flex: 1,
            backgroundColor: '#f8f9fa',
            color: '#333',
            border: '1px solid #ddd',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 2,
            backgroundColor: '#2c5530',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Get Premium →
        </button>
      </div>
    </div>
  );
}

function PaywallStep({ onComplete, onBack, stepData }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <div style={{ fontSize: '48px', marginBottom: '15px' }}>🚀</div>
        <h2 style={{ color: '#2c5530', marginBottom: '10px' }}>{stepData.title}</h2>
        <p style={{ color: '#666' }}>{stepData.subtitle}</p>
      </div>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2c5530' }}>$9.99/month</div>
          <div style={{ fontSize: '14px', color: '#666' }}>7-day free trial</div>
        </div>
        
        <h4 style={{ color: '#2c5530', marginBottom: '15px' }}>🎁 Premium Features:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', lineHeight: '1.6' }}>
          <li>✅ <strong>Unlimited daily scans</strong></li>
          <li>✅ <strong>Detailed scan history</strong> with export</li>
          <li>✅ <strong>Priority AI responses</strong></li>
          <li>✅ <strong>Advanced natural alternatives</strong></li>
          <li>✅ <strong>Email & share results</strong></li>
          <li>✅ <strong>Personalized recommendations</strong></li>
        </ul>
      </div>

      <div style={{
        backgroundColor: '#fff3cd',
        padding: '12px',
        borderRadius: '6px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ color: '#856404', fontSize: '14px' }}>
          🎉 <strong>Limited Time:</strong> Get 50% off your first month!
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
        <button
          onClick={() => onComplete(false)}
          style={{
            backgroundColor: '#2c5530',
            color: 'white',
            border: 'none',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🚀 Start Premium Trial
        </button>
        
        <button
          onClick={() => onComplete(true)}
          style={{
            backgroundColor: 'transparent',
            color: '#666',
            border: '1px solid #ddd',
            padding: '12px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Continue with Free Version
        </button>
        
        <button
          onClick={onBack}
          style={{
            backgroundColor: 'transparent',
            color: '#999',
            border: 'none',
            padding: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            textDecoration: 'underline'
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

export default Onboarding;
