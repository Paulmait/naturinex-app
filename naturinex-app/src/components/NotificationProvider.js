import React from 'react';

// Simple notification provider - no push notifications for MVP
const NotificationProvider = ({ children }) => {
  return <>{children}</>;
};

export default NotificationProvider;
