# 📊 Database Schema for Naturinex

## User Data Structure

### 1. Users Collection
```javascript
users: {
  userId: string (Firebase UID),
  email: string,
  displayName: string,
  photoURL: string,
  subscription: {
    status: 'free' | 'premium' | 'cancelled',
    plan: 'monthly' | 'yearly' | null,
    startDate: timestamp,
    endDate: timestamp,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    amount: number, // $9.99 or $99.99
    currency: 'USD'
  },
  metadata: {
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLogin: timestamp,
    deviceIds: string[], // Track all devices
    totalScans: number,
    isAdmin: boolean
  }
}
```

### 2. Scan History Collection
```javascript
scanHistory: {
  scanId: string (auto-generated),
  userId: string,
  deviceId: string,
  timestamp: timestamp,
  productInfo: {
    name: string,
    brand: string,
    activeIngredient: string,
    category: string,
    ocrConfidence: 'high' | 'low'
  },
  imageUrl: string, // Store in Firebase Storage
  analysisResult: {
    alternatives: array,
    warnings: array
  },
  location: {
    ip: string,
    country: string,
    city: string
  }
}
```

### 3. Admin Analytics Collection
```javascript
analytics: {
  date: string (YYYY-MM-DD),
  metrics: {
    totalUsers: number,
    activeUsers: number,
    premiumUsers: number,
    totalScans: number,
    revenue: {
      daily: number,
      monthly: number,
      yearly: number
    },
    popularProducts: [
      {
        name: string,
        scanCount: number
      }
    ],
    deviceBreakdown: {
      ios: number,
      android: number
    }
  }
}
```

### 4. Subscription Events Collection
```javascript
subscriptionEvents: {
  eventId: string,
  userId: string,
  type: 'created' | 'updated' | 'cancelled' | 'expired',
  plan: 'monthly' | 'yearly',
  amount: number,
  timestamp: timestamp,
  stripeEventId: string,
  metadata: object
}
```

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.metadata.isAdmin == true;
    }
    
    // Scan history - users can read their own, admins can read all
    match /scanHistory/{document=**} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.metadata.isAdmin == true);
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Analytics - only admins can read
    match /analytics/{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.metadata.isAdmin == true;
      allow write: if false; // Only server can write
    }
    
    // Subscription events - users can read their own, admins can read all
    match /subscriptionEvents/{document=**} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.metadata.isAdmin == true);
      allow write: if false; // Only server can write
    }
  }
}
```

## Implementation Notes

### Privacy & Compliance
1. **GDPR Compliance**:
   - Users can request data deletion
   - Clear privacy policy
   - Explicit consent for data storage
   - Data export functionality

2. **Data Retention**:
   - Scan history: 2 years
   - Analytics: 3 years
   - User accounts: Until deletion requested

3. **Encryption**:
   - All sensitive data encrypted at rest
   - TLS for data in transit
   - API keys stored securely

### Admin Features
1. **Admin Dashboard Access**:
   - Special admin flag in user metadata
   - Separate admin login portal
   - Two-factor authentication required

2. **Admin Capabilities**:
   - View all user data
   - Export analytics reports
   - Manage subscriptions
   - View scan trends
   - Monitor suspicious activity

### Subscription Pricing
- **Monthly Plan**: $9.99/month
- **Yearly Plan**: $99.99/year (save $19.89)
- **Features**:
  - Unlimited scans
  - PDF export
  - Share functionality
  - Full scan history
  - Priority support