# Naturinex Architecture Documentation

## System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Native App<br/>Expo SDK 53]
        B[Web Landing Page<br/>React]
    end
    
    subgraph "Authentication"
        C[Firebase Auth<br/>Email/Google/Apple]
    end
    
    subgraph "API Gateway"
        D[Firebase Functions<br/>Express.js API]
    end
    
    subgraph "Core Services"
        E[Stripe Payments]
        F[AI Processing<br/>Image Analysis]
        G[Email Service<br/>SendGrid/Firebase]
    end
    
    subgraph "Data Layer"
        H[Firestore<br/>NoSQL Database]
        I[Firebase Storage<br/>Images/Documents]
        J[Offline Queue<br/>Sync System]
    end
    
    subgraph "Infrastructure"
        K[Firebase Hosting<br/>Web Content]
        L[Cloud Scheduler<br/>Cron Jobs]
        M[Cloud Logging<br/>Monitoring]
    end
    
    A --> C
    A --> D
    B --> K
    C --> D
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    D --> J
    D --> L
    D --> M
```

## App Flow Diagrams

### 1. User Onboarding Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Auth
    participant API
    participant Firestore
    
    User->>App: Launch App
    App->>App: Check First Launch
    App->>User: Show Onboarding
    User->>App: Complete Onboarding
    App->>User: Show Privacy Policy
    User->>App: Accept Privacy Policy
    App->>API: Record Consent
    API->>Firestore: Store Consent
    App->>User: Show Medical Disclaimer
    User->>App: Acknowledge Disclaimer
    App->>API: Record Acknowledgment
    API->>Firestore: Store Acknowledgment
    App->>Auth: Show Sign Up
    User->>Auth: Create Account
    Auth->>API: Create User Profile
    API->>Firestore: Initialize User Data
    API->>App: User Created
    App->>User: Welcome to Naturinex!
```

### 2. Product Scanning Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Camera
    participant API
    participant AI
    participant Storage
    participant Queue
    
    User->>App: Tap Scan Button
    App->>Camera: Open Camera
    User->>Camera: Take Photo
    Camera->>App: Return Image
    App->>App: Show Preview
    User->>App: Confirm Scan
    App->>Storage: Upload Image
    Storage->>App: Return URL
    App->>API: Submit Scan Request
    App->>Queue: Add to Offline Queue
    API->>AI: Process Image
    AI->>API: Return Analysis
    API->>API: Wrap with Medical Disclaimer
    API->>Firestore: Store Scan Result
    API->>App: Return Results
    App->>User: Display Results + Disclaimer
    Queue->>API: Sync if Offline
```

### 3. Subscription Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant API
    participant Stripe
    participant Firestore
    
    User->>App: View Plans
    App->>API: Get Pricing
    API->>App: Return Plans
    User->>App: Select Plan
    App->>API: Create Checkout Session
    API->>API: Apply Smart Discounts
    API->>Stripe: Create Session
    Stripe->>API: Return Session URL
    API->>App: Return Checkout URL
    App->>Stripe: Open Checkout
    User->>Stripe: Complete Payment
    Stripe->>API: Webhook: payment_success
    API->>Firestore: Update Subscription
    API->>App: Notify Success
    App->>User: Show Premium Features
```

## Recommended Tech Stack

### ✅ Your Proposed Setup is Excellent! Here's the Complete Implementation:

## 1. Frontend Structure

```
naturinex-app/
├── app/                          # Expo Router app directory
│   ├── (auth)/                   # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/                   # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── scan.tsx
│   │   ├── history.tsx
│   │   └── profile.tsx
│   ├── (modal)/                  # Modal screens
│   │   ├── privacy-policy.tsx
│   │   ├── medical-disclaimer.tsx
│   │   └── subscription.tsx
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx
├── components/                   # Reusable components
│   ├── auth/
│   ├── common/
│   ├── scan/
│   └── subscription/
├── services/                     # Business logic
│   ├── api.ts
│   ├── auth.ts
│   ├── offline-queue.ts
│   └── analytics.ts
├── store/                        # State management
│   ├── auth.store.ts
│   ├── user.store.ts
│   └── scan.store.ts
├── utils/                        # Utilities
│   ├── constants.ts
│   ├── helpers.ts
│   └── validation.ts
├── hooks/                        # Custom hooks
│   ├── useAuth.ts
│   ├── useSubscription.ts
│   └── useOffline.ts
└── assets/                       # Images, fonts, etc
```

## 2. Backend Structure

```
functions/
├── src/
│   ├── api/                      # API endpoints
│   │   ├── auth/
│   │   ├── scan/
│   │   ├── subscription/
│   │   └── user/
│   ├── services/                 # Business services
│   │   ├── stripe/
│   │   ├── ai/
│   │   ├── email/
│   │   └── analytics/
│   ├── middleware/               # Express middleware
│   │   ├── auth.ts
│   │   ├── security.ts
│   │   └── logging.ts
│   ├── utils/                    # Utilities
│   │   ├── database.ts
│   │   ├── validation.ts
│   │   └── errors.ts
│   ├── scheduled/                # Cron jobs
│   │   ├── cleanup.ts
│   │   ├── emails.ts
│   │   └── queue.ts
│   └── index.ts                  # Main entry
├── lib/                          # Compiled JS
└── package.json
```

## 3. Database Schema (Firestore)

```typescript
// Collections Structure
interface Collections {
  users: {
    // Document ID: userId
    email: string;
    displayName: string;
    photoURL?: string;
    subscription: {
      status: 'free' | 'active' | 'cancelled' | 'past_due';
      plan: 'basic' | 'premium' | 'professional';
      currentPeriodEnd?: Timestamp;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    };
    stats: {
      totalScans: number;
      monthlyScans: number;
      lastScan?: Timestamp;
      joinedAt: Timestamp;
    };
    preferences: {
      notifications: boolean;
      marketing: boolean;
      language: string;
      theme: 'light' | 'dark' | 'system';
    };
    privacyConsent: {
      accepted: boolean;
      version: string;
      timestamp: Timestamp;
    };
    medicalDisclaimer: {
      acknowledged: boolean;
      version: string;
      lastAcknowledged: Timestamp;
    };
  };
  
  scans: {
    // Document ID: scanId
    userId: string;
    timestamp: Timestamp;
    imageUrl: string;
    results: {
      productName: string;
      ingredients: string[];
      healthScore: number;
      warnings: string[];
      benefits: string[];
      alternatives: string[];
    };
    metadata: {
      deviceInfo: object;
      appVersion: string;
      processingTime: number;
    };
  };
  
  feedback: {
    // Document ID: feedbackId
    userId: string;
    type: string;
    message: string;
    severity: string;
    status: string;
    timestamp: Timestamp;
  };
  
  // System collections
  api_logs: {};
  error_logs: {};
  security_logs: {};
  offline_queue: {};
}
```

## 4. Firebase Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function hasValidSubscription() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.subscription.status == 'active';
    }
    
    // User rules
    match /users/{userId} {
      allow read: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && isOwner(userId) && 
        !request.resource.data.diff(resource.data).affectedKeys().hasAny(['subscription', 'stats']);
      allow create: if false; // Only through Cloud Functions
    }
    
    // Scan rules
    match /scans/{scanId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid &&
        hasValidSubscription();
      allow update, delete: if false; // Immutable
    }
    
    // Feedback rules
    match /feedback/{feedbackId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && 
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if false;
    }
    
    // Admin collections - no client access
    match /{collection}/{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 5. CI/CD Pipeline

### A. EAS Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "preview"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      },
      "env": {
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./secrets/google-play-key.json",
        "track": "beta"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "your-apple-team-id"
      }
    }
  }
}
```

### B. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Naturinex

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  # Mobile App Build
  build-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Setup Expo
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
          
      - name: Install dependencies
        run: |
          cd naturinex-app
          npm install
          
      - name: Run tests
        run: |
          cd naturinex-app
          npm test
          
      - name: Build for preview
        if: github.event_name == 'pull_request'
        run: |
          cd naturinex-app
          eas build --platform all --profile preview --non-interactive
          
      - name: Build for production
        if: github.ref == 'refs/heads/main'
        run: |
          cd naturinex-app
          eas build --platform all --profile production --non-interactive

  # Backend Deployment
  deploy-backend:
    runs-on: ubuntu-latest
    needs: build-mobile
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
        
      - name: Install dependencies
        run: |
          cd naturinex-app/functions
          npm install
          
      - name: Build functions
        run: |
          cd naturinex-app/functions
          npm run build
          
      - name: Deploy to Firebase
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          cd naturinex-app
          firebase deploy --only functions,firestore:rules,storage:rules

  # Web Deployment
  deploy-web:
    runs-on: ubuntu-latest
    needs: build-mobile
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Build landing page
        run: |
          cd web-landing
          npm install
          npm run build
          
      - name: Deploy to Firebase Hosting
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
        run: |
          cd web-landing
          firebase deploy --only hosting
```

## 6. Environment Configuration

### A. Development (.env.development)
```env
EXPO_PUBLIC_API_URL=http://localhost:5001/naturinex/us-central1/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_ENVIRONMENT=development
```

### B. Production (.env.production)
```env
EXPO_PUBLIC_API_URL=https://api.naturinex.com
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_ENVIRONMENT=production
```

## 7. Monitoring & Analytics

### A. Firebase Analytics Events
```typescript
// Key events to track
const analyticsEvents = {
  // User journey
  'app_open': {},
  'sign_up_start': {},
  'sign_up_complete': { method: string },
  'login': { method: string },
  
  // Core features
  'scan_initiated': {},
  'scan_completed': { product_type: string },
  'scan_failed': { error: string },
  
  // Monetization
  'view_plans': {},
  'select_plan': { plan: string },
  'purchase_complete': { plan: string, revenue: number },
  'purchase_failed': { error: string },
  
  // Engagement
  'share_result': { method: string },
  'view_history': {},
  'submit_feedback': { type: string },
};
```

### B. Performance Monitoring
```typescript
// Monitor key operations
import perf from '@react-native-firebase/perf';

// Track scan performance
const scanTrace = await perf().startTrace('product_scan');
scanTrace.putAttribute('product_type', 'food');
// ... perform scan
scanTrace.stop();

// Track API calls
const apiTrace = await perf().startTrace('api_call');
apiTrace.putAttribute('endpoint', '/scan');
// ... make API call
apiTrace.stop();
```

## 8. Storage Strategy

### Current: Firebase Storage
```typescript
// Good for MVP and small-medium scale
const uploadImage = async (uri: string) => {
  const blob = await fetch(uri).then(r => r.blob());
  const ref = storage().ref(`scans/${userId}/${Date.now()}.jpg`);
  await ref.put(blob);
  return await ref.getDownloadURL();
};
```

### Future: AWS S3 Migration
```typescript
// When you need more control and cost optimization
const uploadToS3 = async (uri: string) => {
  // Get presigned URL from your API
  const { uploadUrl } = await api.getS3UploadUrl();
  
  // Direct upload to S3
  const blob = await fetch(uri).then(r => r.blob());
  await fetch(uploadUrl, {
    method: 'PUT',
    body: blob,
    headers: { 'Content-Type': 'image/jpeg' }
  });
};
```

## 9. Optimization Strategies

### A. App Performance
1. **Image Optimization**: Compress before upload
2. **Lazy Loading**: Load features on demand
3. **Caching**: Implement Redux Persist
4. **Code Splitting**: Use dynamic imports

### B. Backend Performance
1. **Function Cold Starts**: Keep functions warm
2. **Database Indexes**: Optimize Firestore queries
3. **CDN**: Use Firebase Hosting CDN
4. **Response Caching**: Cache common responses

### C. Cost Optimization
1. **Firestore**: Batch writes, compound queries
2. **Functions**: Optimize memory allocation
3. **Storage**: Implement lifecycle rules
4. **Monitoring**: Set up billing alerts

## Launch Checklist

- [ ] App Store assets ready (screenshots, description)
- [ ] Privacy Policy and Terms updated
- [ ] SSL certificates configured
- [ ] Domain names set up
- [ ] Email templates created
- [ ] Support system ready
- [ ] Analytics tracking verified
- [ ] Performance benchmarks set
- [ ] Security audit completed
- [ ] Beta testing completed
- [ ] Marketing materials prepared
- [ ] Launch announcement scheduled