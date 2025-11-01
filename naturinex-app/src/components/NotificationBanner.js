// Simple notification manager stub - no UI notifications for MVP
export const notificationManager = {
  showWarning: (message, action) => {
    // No-op for now - could log to console in development
    if (__DEV__) {
      console.log('[NotificationManager] Warning:', message, action);
    }
  },
  showSuccess: (message, action) => {
    if (__DEV__) {
      console.log('[NotificationManager] Success:', message, action);
    }
  },
  showError: (message, action) => {
    if (__DEV__) {
      console.log('[NotificationManager] Error:', message, action);
    }
  },
  showInfo: (message, action) => {
    if (__DEV__) {
      console.log('[NotificationManager] Info:', message, action);
    }
  },
};

export default notificationManager;
