/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'naturinex-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the response for certain URLs
          if (shouldCache(event.request.url)) {
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(error => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        throw error;
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'Medication reminder',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: data.tag || 'medication-reminder',
    requireInteraction: true,
    actions: data.actions || [
      { action: 'taken', title: '✓ Taken' },
      { action: 'snooze', title: '⏰ Snooze' }
    ],
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Naturinex Reminder', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === 'taken') {
    // Log medication as taken
    logMedicationTaken(notificationData);
  } else if (action === 'snooze') {
    // Snooze for 15 minutes
    snoozeMedication(notificationData, 15);
  } else {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-scans') {
    event.waitUntil(syncPendingScans());
  }
});

// Helper functions
function shouldCache(url) {
  // Cache static assets and API responses
  return url.includes('/static/') || 
         url.includes('/api/medications/') ||
         url.includes('/manifest.json') ||
         url.includes('/icon-');
}

async function logMedicationTaken(data) {
  try {
    // Send to server if online
    const response = await fetch('/api/medications/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        medicationName: data.medicationName,
        reminderId: data.reminderId,
        takenAt: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to log medication');
    }
  } catch (error) {
    console.error('Error logging medication:', error);
    // Queue for later sync
    queueForSync('medication-log', data);
  }
}

async function snoozeMedication(data, minutes) {
  const snoozeTime = new Date(Date.now() + minutes * 60 * 1000);
  
  // Schedule new notification
  setTimeout(() => {
    self.registration.showNotification('Medication Reminder - Snoozed', {
      body: `Time to take ${data.dosage} of ${data.medicationName}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: `${data.reminderId}-snoozed`,
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '✓ Taken' },
        { action: 'snooze', title: '⏰ Snooze Again' }
      ],
      data: data
    });
  }, minutes * 60 * 1000);
}

async function syncPendingScans() {
  // Get pending scans from IndexedDB and sync with server
  console.log('Syncing pending scans...');
  // Implementation would go here
}

function queueForSync(type, data) {
  // Queue data for background sync
  console.log('Queuing for sync:', type, data);
  // Implementation would go here
}