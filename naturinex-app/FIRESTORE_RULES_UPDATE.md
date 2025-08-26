# 🔒 Firestore Security Rules Update

## Problem
You're seeing "Missing or insufficient permissions" errors because the Firestore security rules need to be updated to allow the engagement tracking features.

## Solution

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your Naturinex project
3. Go to **Firestore Database** → **Rules**

### 2. Update Security Rules
Replace the existing rules with these comprehensive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isPremiumUser() {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isPremium == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if false; // Never allow deletion
    }
    
    // Scan history collection
    match /scanHistory/{scanId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Engagement tracking (for authenticated users)
    match /engagement/{eventId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if false; // Events are immutable
      allow delete: if false;
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isOwner(resource.data.userId);
      allow delete: if isOwner(resource.data.userId);
    }
    
    // Referrals
    match /referrals/{referralId} {
      allow read: if isAuthenticated() && 
        (resource.data.referrerUser == request.auth.uid || 
         resource.data.referredUser == request.auth.uid);
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if false;
    }
    
    // Coupon tracking
    match /couponTracking/{trackingId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if false;
      allow delete: if false;
    }
    
    // Pricing analytics
    match /pricingAnalytics/{analyticsId} {
      allow read: if false; // Admin only via server
      allow create: if isAuthenticated();
      allow update: if false;
      allow delete: if false;
    }
    
    // Student verifications
    match /studentVerifications/{verificationId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update: if false;
      allow delete: if false;
    }
  }
}
```

### 3. Simplified Rules (If Above Doesn't Work)
If you're still having issues, try these simplified rules temporarily:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to create engagement events
    match /engagement/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Allow authenticated users to read/write their scan history
    match /scanHistory/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Other collections
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Publish Rules
After updating the rules:
1. Click **Publish** button
2. Wait for confirmation
3. Test the app again

## Testing
1. Restart the app
2. Login with a test account
3. Try scanning a product
4. Check if errors persist

## Additional Fixes in Code
The engagement tracking code has been updated to:
- Check authentication before writing
- Handle permission errors gracefully
- Skip tracking for non-authenticated users
- Provide better error messages

## Common Issues
1. **Still getting errors?**
   - Clear app cache
   - Logout and login again
   - Check Firebase Authentication is enabled

2. **Rules not updating?**
   - Check for syntax errors
   - Ensure you clicked "Publish"
   - Wait 1-2 minutes for propagation

3. **Need admin access?**
   - Add custom claims to admin users
   - Use Firebase Admin SDK on server