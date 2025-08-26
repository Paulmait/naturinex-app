# Naturinex App Flow Visualization

## Complete User Journey Map

```mermaid
graph TD
    Start([App Launch]) --> CheckAuth{User Authenticated?}
    
    CheckAuth -->|No| Onboarding[Show Onboarding]
    CheckAuth -->|Yes| CheckConsent{Privacy Consent Valid?}
    
    Onboarding --> SignUp[Sign Up Screen]
    SignUp --> PrivacyPolicy[Show Privacy Policy]
    PrivacyPolicy --> AcceptPrivacy{Accept Privacy?}
    AcceptPrivacy -->|No| ExitApp[Exit App]
    AcceptPrivacy -->|Yes| MedicalDisclaimer[Show Medical Disclaimer]
    
    MedicalDisclaimer --> AcceptDisclaimer{Accept Disclaimer?}
    AcceptDisclaimer -->|No| ExitApp
    AcceptDisclaimer -->|Yes| CreateAccount[Create Firebase Account]
    
    CreateAccount --> InitializeUser[Initialize User Profile]
    InitializeUser --> CheckReferral{Has Referral Code?}
    CheckReferral -->|Yes| ApplyReferral[Apply Referral Benefits]
    CheckReferral -->|No| ShowPlans[Show Subscription Plans]
    ApplyReferral --> ShowPlans
    
    ShowPlans --> SelectPlan{Select Plan?}
    SelectPlan -->|Free| HomePage[Go to Home Page]
    SelectPlan -->|Paid| StripeCheckout[Stripe Checkout]
    
    StripeCheckout --> PaymentSuccess{Payment Success?}
    PaymentSuccess -->|Yes| ActivateSubscription[Activate Subscription]
    PaymentSuccess -->|No| ShowPlans
    ActivateSubscription --> HomePage
    
    CheckConsent -->|No| MedicalDisclaimer
    CheckConsent -->|Yes| HomePage
    
    HomePage --> UserAction{User Action}
    
    UserAction -->|Scan| ScanFlow[Product Scan Flow]
    UserAction -->|History| ViewHistory[View Scan History]
    UserAction -->|Profile| ProfileSettings[Profile & Settings]
    UserAction -->|Feedback| BetaFeedback[Submit Feedback]
    
    ScanFlow --> Camera[Open Camera]
    Camera --> TakePhoto[Take Photo]
    TakePhoto --> PreviewImage[Preview Image]
    PreviewImage --> ConfirmScan{Confirm?}
    ConfirmScan -->|No| Camera
    ConfirmScan -->|Yes| CheckNetwork{Network Available?}
    
    CheckNetwork -->|Yes| UploadImage[Upload to Storage]
    CheckNetwork -->|No| QueueOffline[Add to Offline Queue]
    
    UploadImage --> ProcessAI[AI Processing]
    ProcessAI --> ShowResults[Show Results + Disclaimer]
    ShowResults --> SaveScan[Save to Firestore]
    SaveScan --> UpdateStats[Update User Stats]
    UpdateStats --> CheckAchievements[Check Achievements]
    CheckAchievements --> HomePage
    
    QueueOffline --> ShowPending[Show Pending Status]
    ShowPending --> HomePage
    
    ViewHistory --> LoadScans[Load User Scans]
    LoadScans --> DisplayList[Display Scan List]
    DisplayList --> SelectScan{Select Scan?}
    SelectScan -->|Yes| ShowDetails[Show Scan Details]
    SelectScan -->|No| HomePage
    ShowDetails --> HomePage
    
    ProfileSettings --> SettingsMenu{Settings Option}
    SettingsMenu -->|Subscription| ManageSubscription[Manage Subscription]
    SettingsMenu -->|Privacy| PrivacySettings[Privacy Settings]
    SettingsMenu -->|Referrals| ReferralDashboard[Referral Dashboard]
    SettingsMenu -->|Achievements| AchievementsList[View Achievements]
    SettingsMenu -->|Support| ContactSupport[Contact Support]
    SettingsMenu -->|Logout| LogoutConfirm{Confirm Logout?}
    
    LogoutConfirm -->|Yes| ClearSession[Clear Session]
    ClearSession --> Start
    LogoutConfirm -->|No| ProfileSettings
    
    BetaFeedback --> FeedbackForm[Feedback Form]
    FeedbackForm --> SelectType[Select Feedback Type]
    SelectType --> WriteFeedback[Write Description]
    WriteFeedback --> AttachScreenshot{Attach Screenshot?}
    AttachScreenshot -->|Yes| AddScreenshot[Add Screenshot]
    AttachScreenshot -->|No| SubmitFeedback[Submit Feedback]
    AddScreenshot --> SubmitFeedback
    SubmitFeedback --> ThankYou[Thank You Message]
    ThankYou --> HomePage
```

## Offline Queue Sync Flow

```mermaid
sequenceDiagram
    participant App
    participant Queue
    participant Network
    participant API
    participant Firestore
    
    Note over App,Queue: User performs action offline
    App->>Queue: Add action to queue
    Queue->>Queue: Store in AsyncStorage
    App->>App: Show offline indicator
    
    loop Every 30 seconds
        Queue->>Network: Check connectivity
        alt Network Available
            Network-->>Queue: Connected
            Queue->>Queue: Get pending items
            Queue->>API: Batch submit actions
            API->>Firestore: Process actions
            Firestore-->>API: Success
            API-->>Queue: Processed items
            Queue->>Queue: Remove from queue
            Queue->>App: Update UI
        else Network Unavailable
            Network-->>Queue: No connection
            Queue->>Queue: Keep in queue
        end
    end
```

## Subscription Management Flow

```mermaid
stateDiagram-v2
    [*] --> Free: Initial State
    
    Free --> Selecting: View Plans
    Selecting --> Checkout: Select Plan
    Checkout --> Processing: Complete Payment
    
    Processing --> Active: Payment Success
    Processing --> Free: Payment Failed
    
    Active --> Grace: Payment Failed (Retry)
    Grace --> Active: Payment Recovered
    Grace --> Cancelled: Grace Period Expired
    
    Active --> Cancelled: User Cancels
    Cancelled --> Free: Subscription Ends
    
    Active --> Upgraded: Change Plan (Higher)
    Active --> Downgraded: Change Plan (Lower)
    
    Upgraded --> Active: Process Complete
    Downgraded --> Active: Process Complete
```

## Security & Privacy Flow

```mermaid
graph LR
    subgraph "Every API Request"
        Request[API Request] --> CheckAuth{Authenticated?}
        CheckAuth -->|No| Reject1[401 Unauthorized]
        CheckAuth -->|Yes| CheckConsent{Privacy Consent?}
        CheckConsent -->|No| Reject2[403 Consent Required]
        CheckConsent -->|Yes| CheckStatus{User Active?}
        CheckStatus -->|Blocked| Reject3[403 Account Blocked]
        CheckStatus -->|Active| RateLimit{Rate Limit OK?}
        RateLimit -->|Exceeded| Reject4[429 Too Many Requests]
        RateLimit -->|OK| ValidateRequest{Valid Request?}
        ValidateRequest -->|Invalid| Reject5[400 Bad Request]
        ValidateRequest -->|Valid| ProcessRequest[Process Request]
        ProcessRequest --> LogRequest[Log Everything]
        LogRequest --> Response[Send Response]
    end
```

## Data Flow Architecture

```mermaid
graph TB
    subgraph "Client Side"
        UI[React Native UI]
        Store[Redux Store]
        Cache[AsyncStorage Cache]
        Queue[Offline Queue]
    end
    
    subgraph "Firebase Services"
        Auth[Firebase Auth]
        Functions[Cloud Functions]
        Firestore[(Firestore DB)]
        Storage[Cloud Storage]
    end
    
    subgraph "External Services"
        Stripe[Stripe API]
        AI[AI Processing]
        Email[Email Service]
    end
    
    UI <--> Store
    Store <--> Cache
    Store <--> Queue
    
    UI --> Auth
    Auth --> Functions
    
    Functions <--> Firestore
    Functions <--> Storage
    Functions <--> Stripe
    Functions <--> AI
    Functions <--> Email
    
    Queue -.->|Sync when online| Functions
```

## Achievement & Gamification Flow

```mermaid
graph TD
    Action[User Action] --> Check{Check Triggers}
    
    Check --> Scan[Scan Milestone]
    Check --> Streak[Daily Streak]
    Check --> Referral[Referral Success]
    Check --> Subscription[Subscription Upgrade]
    
    Scan --> ScanCount{Count Reached?}
    ScanCount -->|1st| FirstScan[First Scan Badge]
    ScanCount -->|10th| TenScans[Scanner Badge]
    ScanCount -->|100th| HundredScans[Pro Scanner Badge]
    
    Streak --> StreakDays{Days in Row?}
    StreakDays -->|7| WeekStreak[Week Warrior]
    StreakDays -->|30| MonthStreak[Dedicated User]
    
    Referral --> ReferralCount{Referrals Made?}
    ReferralCount -->|1| FirstReferral[Ambassador]
    ReferralCount -->|5| FiveReferrals[Influencer]
    
    FirstScan --> Award[Award Achievement]
    TenScans --> Award
    HundredScans --> Award
    WeekStreak --> Award
    MonthStreak --> Award
    FirstReferral --> Award
    FiveReferrals --> Award
    
    Award --> Notify[Push Notification]
    Award --> Points[Add Points]
    Award --> UpdateProfile[Update Profile]
    
    Notify --> Celebrate[Show Celebration UI]
    Points --> Leaderboard[Update Leaderboard]
```

## Error Handling Flow

```mermaid
graph TD
    Error[Error Occurs] --> Catch{Error Type?}
    
    Catch -->|Network| NetworkError[Network Error]
    Catch -->|Auth| AuthError[Auth Error]
    Catch -->|Payment| PaymentError[Payment Error]
    Catch -->|Scan| ScanError[Scan Error]
    Catch -->|Unknown| UnknownError[Unknown Error]
    
    NetworkError --> Queue1[Queue Action]
    Queue1 --> Retry1[Auto Retry]
    
    AuthError --> Logout[Force Logout]
    Logout --> Login[Show Login]
    
    PaymentError --> Alert1[Alert User]
    Alert1 --> Support1[Offer Support]
    
    ScanError --> Alert2[Alert User]
    Alert2 --> Retry2[Offer Retry]
    
    UnknownError --> Log[Log to Backend]
    Log --> Alert3[Generic Alert]
    
    All[All Errors] --> Track[Track in Analytics]
    All --> Report[Send Error Report]
```

## Beta Testing Feedback Loop

```mermaid
graph LR
    User[Beta User] --> Test[Test Feature]
    Test --> Issue{Find Issue?}
    
    Issue -->|Yes| Report[Report Feedback]
    Issue -->|No| Continue[Continue Testing]
    
    Report --> Categorize[Auto-Categorize]
    Categorize --> Priority{Severity?}
    
    Priority -->|Critical| Alert[Alert Team]
    Priority -->|High| Queue1[Priority Queue]
    Priority -->|Medium| Queue2[Regular Queue]
    Priority -->|Low| Backlog[Backlog]
    
    Alert --> Fix[Immediate Fix]
    Queue1 --> Sprint[Next Sprint]
    Queue2 --> Planning[Future Planning]
    
    Fix --> Deploy[Deploy Update]
    Sprint --> Deploy
    
    Deploy --> Notify[Notify Users]
    Notify --> User
```

## Complete Tech Stack Summary

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React Native + Expo | Cross-platform mobile app |
| **Navigation** | Expo Router | File-based routing |
| **State Management** | Redux Toolkit | Global state management |
| **UI Components** | React Native Elements | Consistent UI |
| **Authentication** | Firebase Auth | User authentication |
| **Backend** | Firebase Functions | Serverless API |
| **Database** | Firestore | NoSQL database |
| **Storage** | Firebase Storage | Image storage |
| **Payments** | Stripe | Subscription management |
| **Analytics** | Firebase Analytics | User behavior tracking |
| **Crash Reporting** | Sentry | Error tracking |
| **Push Notifications** | Firebase FCM | User engagement |
| **CI/CD** | GitHub Actions + EAS | Automated deployment |
| **Monitoring** | Firebase Performance | Performance tracking |
| **A/B Testing** | Firebase Remote Config | Feature flags |

This architecture provides:
- ✅ Scalability
- ✅ Offline support
- ✅ Security
- ✅ Performance
- ✅ Cost efficiency
- ✅ Easy maintenance
- ✅ Rapid deployment