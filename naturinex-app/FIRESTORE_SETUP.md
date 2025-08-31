# Firestore Setup for Naturinex

## Why Use Firestore?
- **Real-time synchronization** between web and mobile apps
- **No server-side database setup needed** (no MongoDB/PostgreSQL)
- **Automatic scaling** and managed by Google
- **Already configured** in your project

## Current Firestore Collections

Your app already uses these Firestore collections:

### 1. `users` Collection
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  displayName: "John Doe",
  isPremium: false,
  createdAt: timestamp,
  scanCount: 0
}
```

### 2. `scans` Collection
```javascript
{
  userId: "user_id",
  medicationName: "Aspirin",
  alternatives: [...],
  timestamp: timestamp,
  confidence: 85
}
```

### 3. `subscriptions` Collection
```javascript
{
  userId: "user_id",
  stripeCustomerId: "cus_xxx",
  subscriptionId: "sub_xxx",
  status: "active",
  planType: "premium",
  expiresAt: timestamp
}
```

## Environment Variables Needed

Make sure these are set in Render:

```bash
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Using Firestore in Your Server

The server already has Firestore initialized. Here's how to use it:

```javascript
const { getFirestore } = require('./config/firebase-init');
const db = getFirestore();

// Save scan data
async function saveScan(userId, medicationName, alternatives) {
  const scanRef = await db.collection('scans').add({
    userId,
    medicationName,
    alternatives,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  return scanRef.id;
}

// Get user's scan history
async function getUserScans(userId) {
  const snapshot = await db.collection('scans')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
```

## Benefits Over Traditional Database

1. **No Database Server Needed** - Firestore is serverless
2. **Real-time Updates** - Changes sync instantly to all clients
3. **Offline Support** - Works offline and syncs when back online
4. **Security Rules** - Built-in security without backend code
5. **Automatic Backups** - Google handles all backups

## Firestore Security Rules

Update in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read/write their own scans
    match /scans/{scanId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Subscriptions are managed by the server
    match /subscriptions/{subId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if false; // Only server can write
    }
  }
}
```

## No Additional Setup Needed!

Your app is already configured to use Firestore. The Firebase Admin SDK is initialized in your server, and the client apps use Firebase directly.

Just ensure the environment variables are set in Render and you're good to go!