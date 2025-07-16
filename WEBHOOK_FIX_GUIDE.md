# Stripe Webhook Fix - Complete Guide

## The Problem
Your website is hosted on GoDaddy Website Builder, which only serves static files (HTML, CSS, JS). It cannot run your Node.js backend server that handles Stripe webhooks.

## Solution: Deploy Your Backend Separately

### Step 1: Choose a Backend Hosting Platform

Pick one of these free/low-cost options:

#### Option A: Render (Recommended - Free)
1. Sign up at https://render.com
2. Connect your GitHub repository
3. Create a new "Web Service"
4. Set build command: `npm install`
5. Set start command: `node index.js`
6. Your backend will be at: `https://your-app.onrender.com`

#### Option B: Railway
1. Sign up at https://railway.app
2. Connect GitHub and deploy
3. Your backend will be at: `https://your-app.railway.app`

#### Option C: Heroku (Paid)
1. Sign up at https://heroku.com
2. Install Heroku CLI
3. Deploy using Git

### Step 2: Prepare Your Backend for Deployment

1. **Update your server's CORS settings** in `server/index.js`:
```javascript
app.use(cors({
  origin: [
    'https://naturinex.com',
    'https://www.naturinex.com',
    'http://localhost:3000' // for local development
  ],
  credentials: true
}));
```

2. **Create a health check endpoint**:
```javascript
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Naturinex API Server',
    webhook: '/webhooks/stripe'
  });
});
```

3. **Update environment variables** for production:
```env
NODE_ENV=production
PORT=5000
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
GEMINI_API_KEY=xxxxx

# Firebase Admin SDK credentials
FIREBASE_PROJECT_ID=xxxxx
FIREBASE_PRIVATE_KEY=xxxxx
FIREBASE_CLIENT_EMAIL=xxxxx
```

### Step 3: Deploy Your Backend

Using Render as example:

1. Push your code to GitHub
2. Go to https://dashboard.render.com
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - Name: `naturinex-api`
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node index.js`
6. Add environment variables
7. Click "Create Web Service"

Your backend will be deployed at: `https://naturinex-api.onrender.com`

### Step 4: Update Your Frontend

Update your React app to use the new backend URL:

1. **Create/update `.env.production`** in your client folder:
```env
REACT_APP_API_URL=https://naturinex-api.onrender.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

2. **Update API calls** in your React app:
```javascript
// In your API service files
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Example API call
const response = await fetch(`${API_URL}/api/analyze`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ medication: medicationName })
});
```

### Step 5: Update Stripe Webhook

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Update your webhook URL to: `https://naturinex-api.onrender.com/webhooks/stripe`
3. Make sure to select all the events you need:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### Step 6: Test Your Webhook

Run the test script with your new backend URL:
```bash
node test-webhook.js --url https://naturinex-api.onrender.com/webhooks/stripe
```

## Alternative: Use Stripe's Fulfillment Integration

If you don't want to manage a backend server, you can use Stripe's built-in fulfillment:

1. Use Stripe Payment Links or Checkout with metadata
2. Set up email notifications in Stripe
3. Use Zapier or Make.com to connect Stripe to Firebase
4. Use Stripe's Customer Portal for subscription management

## Quick Fix for Testing

While setting up your backend hosting, you can use a webhook testing service:

1. Go to https://webhook.site
2. Get a unique URL
3. Update Stripe webhook to this URL temporarily
4. You'll see all webhook events in real-time

## Next Steps

1. **Immediate**: Deploy your backend to Render/Railway
2. **Update**: Frontend API URLs to point to new backend
3. **Configure**: Stripe webhook to new backend URL
4. **Test**: Ensure webhooks are working
5. **Monitor**: Check logs for any issues

## Need Help?

- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- Stripe Webhooks: https://stripe.com/docs/webhooks

Remember: Your GoDaddy site will continue to serve your React app, while your backend API runs on a separate server!