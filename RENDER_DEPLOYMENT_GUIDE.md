# Step-by-Step Render Deployment Guide

## Step 1: Prepare Your Backend Code

First, let's make sure your backend is ready for deployment.

### 1.1 Create a `package.json` start script
Make sure your `server/package.json` has a start script:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

### 1.2 Update Environment Variables
Your server uses these environment variables:
- `PORT` (Render provides this automatically)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- Firebase Admin credentials

## Step 2: Push to GitHub (if not already)

Make sure your code is on GitHub:

```bash
cd C:\Users\maito\mediscan-app
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

## Step 3: Sign Up and Connect GitHub

1. Go to https://render.com and sign up
2. Click "Sign up with GitHub" (recommended) or create an account
3. Authorize Render to access your GitHub repositories

## Step 4: Create New Web Service

1. Once logged in, click the **"New +"** button
2. Select **"Web Service"**
3. Connect your GitHub repository:
   - If using GitHub auth: Select your `mediscan-app` repository
   - If not: Click "Public Git repository" and enter your repo URL

## Step 5: Configure Your Service

Fill in these settings:

### Basic Settings:
- **Name**: `naturinex-api` (or any name you prefer)
- **Region**: Choose closest to your users (e.g., Oregon, USA)
- **Branch**: `main` (or your default branch)
- **Root Directory**: `server` ⚠️ IMPORTANT - must be set to 'server'
- **Runtime**: `Node`

### Build & Deploy Settings:
- **Build Command**: `npm install`
- **Start Command**: `npm start` (or `node index.js`)

### Instance Type:
- Select **"Free"** tier ($0/month)

## Step 6: Add Environment Variables

Click "Advanced" and add these environment variables:

```bash
# Stripe Keys (from your Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Google Gemini API
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

# Node Environment
NODE_ENV=production

# Firebase Admin SDK (see note below)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=your-service-account@email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_CERT_URL=your-cert-url
```

### Getting Firebase Admin Credentials:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Copy values from the downloaded JSON file

## Step 7: Deploy

1. Click **"Create Web Service"**
2. Render will start building your app
3. Watch the logs - this takes 2-5 minutes
4. Once deployed, you'll get a URL like: `https://naturinex-api.onrender.com`

## Step 8: Update Your Server Code

Before your next deployment, update `server/index.js` CORS settings:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://naturinex.com',
        'https://www.naturinex.com',
        'https://naturinex-api.onrender.com' // Add your Render URL
      ]
    : [
        'http://localhost:3000',
        // ... other local URLs
      ],
  credentials: true
}));
```

## Step 9: Test Your Deployment

1. Visit your Render URL: `https://naturinex-api.onrender.com`
   - You should see: `{"status":"OK","message":"Naturinex API Server"}`

2. Test the webhook endpoint:
   ```bash
   curl https://naturinex-api.onrender.com/webhooks/stripe
   ```
   - Should return an error (expected without proper Stripe signature)

## Step 10: Update Stripe Webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your failing webhook
3. Click "Update endpoint"
4. Change URL to: `https://naturinex-api.onrender.com/webhooks/stripe`
5. Click "Update endpoint"

## Step 11: Update Your React App

Update your React app to use the new backend:

1. Create/update `client/.env.production`:
   ```env
   REACT_APP_API_URL=https://naturinex-api.onrender.com
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
   ```

2. Update your API calls to use the environment variable:
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   ```

3. Rebuild and redeploy your React app to GoDaddy

## Troubleshooting

### If deployment fails:
1. Check the logs in Render dashboard
2. Make sure all dependencies are in `package.json`
3. Verify environment variables are set correctly

### If webhook still fails:
1. Check Render logs for incoming requests
2. Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
3. Test with Stripe CLI: `stripe listen --forward-to https://naturinex-api.onrender.com/webhooks/stripe`

### Free tier limitations:
- App spins down after 15 minutes of inactivity
- First request after sleeping takes ~30 seconds
- This is fine for webhooks - Stripe will retry

## Next Steps

1. Monitor your Render dashboard for any errors
2. Set up alerts for failed deployments
3. Consider upgrading to paid tier if you need:
   - No sleep/instant response
   - Custom domain
   - More resources

## Success Checklist

- [ ] Backend deployed to Render
- [ ] Can access API at Render URL
- [ ] Environment variables configured
- [ ] Stripe webhook URL updated
- [ ] React app updated with new API URL
- [ ] Webhook test successful

Let me know once you've signed up and I'll help you through each step!