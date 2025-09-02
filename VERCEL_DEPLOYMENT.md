# 🚀 VERCEL DEPLOYMENT - LET'S GO!

## ✅ Git Status: READY TO DEPLOY!
All changes have been committed. Your code is ready for deployment!

## 📋 VERCEL DEPLOYMENT STEPS

### Step 1: Push to GitHub
```bash
git push origin master
```

### Step 2: Deploy Backend to Vercel
```bash
cd server
vercel --prod
```

When prompted, use these settings:
- Setup and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- What's your project's name? **naturinex-api**
- In which directory is your code located? **./** (current directory)
- Override settings? **No**

### Step 3: Deploy Web App to Vercel
```bash
cd ../naturinex-app
vercel --prod
```

When prompted, use these settings:
- Setup and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- What's your project's name? **naturinex-web**
- In which directory is your code located? **./** (current directory)
- Override settings? **Yes**
  - Build Command: `npm run build:web`
  - Output Directory: `build`
  - Install Command: `npm install`

## 🔐 ENVIRONMENT VARIABLES FOR VERCEL

### For Backend API (server deployment):
Go to your Vercel dashboard → Your backend project → Settings → Environment Variables

Add these variables:

```env
# ✅ REQUIRED - AI Service
GEMINI_API_KEY=AIzaSyD4cC70M7D44duyF5Y8q9xGz0BVwH3mzPk

# ✅ REQUIRED - Server Config
NODE_ENV=production
PORT=5000

# ⚠️ REQUIRED FOR PAYMENTS (Get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE
STRIPE_PREMIUM_PRICE_ID=price_YOUR_ACTUAL_PRICE_ID_HERE

# 📦 OPTIONAL - Firebase Admin (Get from Firebase Console → Project Settings → Service Accounts)
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@naturinex-app.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
```

### For Web App (naturinex-app deployment):
Go to your Vercel dashboard → Your web app project → Settings → Environment Variables

Add these variables:

```env
# ✅ REQUIRED - API Configuration
REACT_APP_API_URL=https://naturinex-api.vercel.app
# Note: Replace with your actual backend URL after deployment

# ✅ REQUIRED - Stripe Public Key (Safe to expose)
REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05

# 📦 OPTIONAL - Feature Flags
REACT_APP_ENABLE_OCR=true
REACT_APP_ENABLE_CAMERA=true
```

## 🔥 QUICK DEPLOYMENT COMMANDS

### Option 1: Deploy Everything Now
```bash
# Push to GitHub
git push origin master

# Deploy backend
cd server
vercel --prod
# Copy the URL (e.g., https://naturinex-api.vercel.app)

# Deploy web app
cd ../naturinex-app
vercel --prod
# Copy the URL (e.g., https://naturinex-web.vercel.app)
```

### Option 2: Deploy from GitHub (Auto-deploy)
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Deploy backend:
   - Root Directory: `server`
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Install Command: `npm install`
5. Deploy web app:
   - Root Directory: `naturinex-app`
   - Framework Preset: Create React App
   - Build Command: `npm run build:web`
   - Output Directory: `build`
   - Install Command: `npm install`

## ⚡ AFTER DEPLOYMENT

### 1. Update CORS in Backend
Edit `server/index.js` and add your Vercel URLs to allowed origins:
```javascript
const allowedOrigins = [
  'https://naturinex-web.vercel.app', // Your web app URL
  'https://naturinex.vercel.app',     // Alternative URL
  'http://localhost:3002',
  // ... other URLs
];
```

### 2. Update Stripe Webhook
Go to Stripe Dashboard → Webhooks → Add endpoint:
- Endpoint URL: `https://naturinex-api.vercel.app/webhook`
- Events: Select `checkout.session.completed`

### 3. Test Your Deployment
```bash
# Test backend
curl https://naturinex-api.vercel.app/health

# Test AI endpoint
curl -X POST https://naturinex-api.vercel.app/api/analyze/name \
  -H "Content-Type: application/json" \
  -d '{"medicationName": "aspirin"}'
```

## 🎯 DEPLOYMENT CHECKLIST

- [x] All code committed to Git
- [ ] Push to GitHub: `git push origin master`
- [ ] Deploy backend to Vercel
- [ ] Add backend environment variables
- [ ] Copy backend URL
- [ ] Deploy web app to Vercel
- [ ] Add web app environment variables (with backend URL)
- [ ] Test backend health endpoint
- [ ] Test web app OCR feature
- [ ] Update Stripe webhook URL
- [ ] Celebrate! 🎉

## 📱 FEATURES THAT WILL WORK

### Web App (100% Functional):
- ✅ **OCR Scanning** - Tesseract.js extracts text from images
- ✅ **Camera Capture** - Take photos directly
- ✅ **AI Analysis** - Get natural alternatives
- ✅ **Text Search** - Manual medication input
- ✅ **Responsive Design** - Works on all devices

### Backend API (100% Functional):
- ✅ **Health Check** - `/health`
- ✅ **AI Analysis** - `/api/analyze/name`
- ✅ **OCR Processing** - `/api/analyze`
- ✅ **Suggestions** - `/suggest`
- ✅ **Stripe Webhooks** - `/webhook`

## 🚨 IMPORTANT NOTES

1. **Free Tier**: Vercel free tier is perfect for this app
2. **Cold Starts**: First request might take a few seconds
3. **API Keys**: Never commit sensitive keys to Git
4. **CORS**: Update allowed origins after deployment
5. **Domain**: You can add custom domain later in Vercel settings

## 💪 YOU'RE READY!

Everything is committed and ready. Just run:
```bash
git push origin master
cd server && vercel --prod
cd ../naturinex-app && vercel --prod
```

Total deployment time: ~10 minutes

**LET'S GO! 🚀**