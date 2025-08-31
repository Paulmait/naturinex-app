# Environment Variables for naturinex-app-1

Add these in Render Dashboard → Environment tab:

## Critical API Keys
```
GEMINI_API_KEY=your_actual_gemini_key_here
GOOGLE_VISION_API_KEY=your_actual_vision_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

## Firebase Configuration
```
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@naturinex-app.iam.gserviceaccount.com
FIREBASE_API_KEY=AIzaSyDjyig8VkzsaaoGLl2tg702FE-VRWenM0w
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[your full private key here]\n-----END PRIVATE KEY-----
```

## Server Configuration
```
NODE_ENV=production
PORT=10000
ADMIN_SECRET=your_admin_secret_here
DATA_ENCRYPTION_KEY=your_encryption_key_here
CACHE_ENABLED=true
```

## Optional but Recommended
```
CORS_ORIGIN=*
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```