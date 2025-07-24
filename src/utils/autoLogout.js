// Auto-logout utility to save on API charges and improve security
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

class AutoLogoutManager {
  constructor() {
    this.timeoutId = null;
    this.warningTimeoutId = null;
    this.LOGOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
    this.WARNING_TIME = 13 * 60 * 1000; // Show warning at 13 minutes
    this.isActive = false;
    this.onWarning = null;
    this.onLogout = null;
  }

  // Start the auto-logout timer
  start(onWarning = null, onLogout = null) {
    this.onWarning = onWarning;
    this.onLogout = onLogout;
    this.isActive = true;
    this.resetTimer();
    this.addActivityListeners();
  }

  // Stop the auto-logout timer
  stop() {
    this.isActive = false;
    this.clearTimers();
    this.removeActivityListeners();
  }

  // Reset the timer when user is active
  resetTimer() {
    if (!this.isActive) return;
    
    this.clearTimers();
    
    // Set warning timer (13 minutes)
    this.warningTimeoutId = setTimeout(() => {
      if (this.onWarning) {
        this.onWarning();
      }
    }, this.WARNING_TIME);

    // Set logout timer (15 minutes)
    this.timeoutId = setTimeout(() => {
      this.performLogout();
    }, this.LOGOUT_TIME);
  }

  // Clear all timers
  clearTimers() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
  }

  // Perform the actual logout
  async performLogout() {
    try {
      if (this.onLogout) {
        this.onLogout();
      }
      await signOut(auth);
      console.log('User automatically logged out due to inactivity');
    } catch (error) {
      console.error('Error during auto-logout:', error);
    }
  }

  // Activity event handler
  handleActivity = () => {
    if (this.isActive) {
      this.resetTimer();
    }
  }

  // Add event listeners for user activity
  addActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });
  }

  // Remove event listeners
  removeActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });
  }

  // Get remaining time in minutes
  getRemainingTime() {
    // This is an approximation since we don't track exact start time
    return Math.ceil(this.LOGOUT_TIME / (1000 * 60));
  }
}

// Singleton instance
export const autoLogoutManager = new AutoLogoutManager();

// React hook for auto-logout functionality
export const useAutoLogout = (user, notifications) => {
  React.useEffect(() => {
    if (user) {
      // Start auto-logout when user is logged in
      autoLogoutManager.start(
        // Warning callback
        () => {
          notifications?.showWarning(
            'You will be automatically logged out in 2 minutes due to inactivity. Move your mouse or click anywhere to stay logged in.',
            'Session Timeout Warning',
            { duration: 120000 } // Show for 2 minutes
          );
        },
        // Logout callback
        () => {
          notifications?.showInfo(
            'You have been logged out due to 15 minutes of inactivity. This helps protect your privacy and saves API costs.',
            'Automatic Logout',
            { duration: 8000 }
          );
        }
      );
    } else {
      // Stop auto-logout when user is not logged in
      autoLogoutManager.stop();
    }

    return () => {
      autoLogoutManager.stop();
    };
  }, [user, notifications]);

  return {
    resetTimer: () => autoLogoutManager.resetTimer(),
    getRemainingTime: () => autoLogoutManager.getRemainingTime()
  };
};

export default AutoLogoutManager;
