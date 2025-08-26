import React, { useState } from 'react';
import { useUser } from './src/hooks/useUser';
import { useAutoLogout } from './src/utils/autoLogout';
import { APP_CONFIG } from './src/constants/appConfig';

// Components
import Dashboard from './src/components/Dashboard';
import Onboarding from './src/components/Onboarding';
import PremiumCheckout from './src/components/PremiumCheckout';
import ErrorBoundary from './src/components/ErrorBoundary';
import NotificationSystem, { useNotifications } from './src/components/NotificationSystem';

// Styles
import './src/mobile.css';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showPremiumCheckout, setShowPremiumCheckout] = useState(false);
  
  // Initialize hooks
  const notifications = useNotifications();
  const { user, isLoading, userProfile } = useUser();
  
  // Initialize auto-logout for security and API cost savings
  useAutoLogout(user, notifications);

  // Check if user needs onboarding
  React.useEffect(() => {
    if (user && !isLoading) {
      const onboardingCompleted = userProfile?.onboardingCompleted || 
        localStorage.getItem(`${APP_CONFIG.STORAGE_KEYS.ONBOARDING_PREFIX}${user.uid}`) === 'completed';
      
      if (!onboardingCompleted) {
        setShowOnboarding(true);
      }
    }
  }, [user, isLoading, userProfile]);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-icon">💊</div>
          <div className="loading-text">Loading {APP_CONFIG.APP_NAME}...</div>
        </div>
      </div>
    );
  }

  // Onboarding flow
  if (user && showOnboarding) {
    return (
      <ErrorBoundary>
        <NotificationSystem 
          notifications={notifications.notifications}
          removeNotification={notifications.removeNotification}
        />
        <Onboarding user={user} onComplete={handleOnboardingComplete} />
      </ErrorBoundary>
    );
  }

  // Premium checkout modal
  if (showPremiumCheckout) {
    return (
      <ErrorBoundary>
        <NotificationSystem 
          notifications={notifications.notifications}
          removeNotification={notifications.removeNotification}
        />
        <div className="modal-overlay">
          <div className="modal-container">
            <PremiumCheckout 
              user={user} 
              onSuccess={handlePremiumSuccess}
              onCancel={handlePremiumCancel}
            />
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Main app
  return (
    <ErrorBoundary>
      <NotificationSystem 
        notifications={notifications.notifications}
        removeNotification={notifications.removeNotification}
      />
      <Dashboard user={user} notifications={notifications} />
    </ErrorBoundary>
  );
}

export default App;
