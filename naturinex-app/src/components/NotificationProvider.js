import React, { useState, useEffect } from 'react';
import NotificationBanner, { notificationManager } from './NotificationBanner';

export default function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationManager.subscribe((newNotification) => {
      setNotification(newNotification);
    });

    return unsubscribe;
  }, []);

  return (
    <>
      {children}
      {notification && (
        <NotificationBanner
          {...notification}
          onDismiss={() => setNotification(null)}
        />
      )}
    </>
  );
}