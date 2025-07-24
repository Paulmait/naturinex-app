import React, { useState, useEffect } from 'react';

const NotificationSystem = ({ notifications, removeNotification }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      maxWidth: '400px'
    }}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          notification={notification}
          onRemove={removeNotification}
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onRemove }) => {
  useEffect(() => {
    if (notification.autoRemove !== false) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  const getNotificationStyle = (type) => {
    const baseStyle = {
      marginBottom: '10px',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      animation: 'slideInFromRight 0.3s ease-out',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      position: 'relative'
    };

    const styles = {
      success: {
        backgroundColor: '#f0fff4',
        border: '1px solid #9ae6b4',
        color: '#2f855a'
      },
      error: {
        backgroundColor: '#fff5f5',
        border: '1px solid #fed7d7',
        color: '#e53e3e'
      },
      warning: {
        backgroundColor: '#fffaf0',
        border: '1px solid #fbd38d',
        color: '#dd6b20'
      },
      info: {
        backgroundColor: '#ebf8ff',
        border: '1px solid #90cdf4',
        color: '#3182ce'
      }
    };

    return { ...baseStyle, ...styles[type] };
  };

  const getIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || '📢';
  };

  return (
    <div style={getNotificationStyle(notification.type)}>
      <div style={{ fontSize: '20px', flexShrink: 0 }}>
        {getIcon(notification.type)}
      </div>
      <div style={{ flex: 1 }}>
        {notification.title && (
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {notification.title}
          </div>
        )}
        <div>{notification.message}</div>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          lineHeight: '1',
          opacity: 0.7,
          position: 'absolute',
          top: '8px',
          right: '8px'
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Helper methods for different types
  const showSuccess = (message, title = '', options = {}) => {
    return addNotification({ type: 'success', message, title, ...options });
  };

  const showError = (message, title = 'Error', options = {}) => {
    return addNotification({ type: 'error', message, title, autoRemove: false, ...options });
  };

  const showWarning = (message, title = 'Warning', options = {}) => {
    return addNotification({ type: 'warning', message, title, ...options });
  };

  const showInfo = (message, title = '', options = {}) => {
    return addNotification({ type: 'info', message, title, ...options });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default NotificationSystem;
