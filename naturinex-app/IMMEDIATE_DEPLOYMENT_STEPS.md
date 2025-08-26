# 🚨 IMMEDIATE DEPLOYMENT STEPS

## Your Render deployment is failing. Here's the fix:

### Option 1: Quick Fix (5 minutes)

1. **Go to Render Dashboard**
   - Click on your service
   - Go to "Settings" tab

2. **Update Start Command**
   ```
   cd server && node index.js
   ```

3. **Go to Environment tab and add these 3 variables:**

   **GEMINI_API_KEY**
   - Go to: https://makersuite.google.com/app/apikey
   - Create key and paste it
   
   **STRIPE_SECRET_KEY**
   - Use your Stripe secret key from dashboard
   
   **STRIPE_WEBHOOK_SECRET**
   - Use placeholder: `whsec_test123`

4. **Save Changes** - Render will redeploy automatically

### Option 2: Use Deployment-Friendly Server (Better)

1. **In your GitHub repo**, rename files:
   - Rename `server/index.js` to `server/index-original.js`
   - Rename `server/index-deployment.js` to `server/index.js`

2. **Commit and push**:
   ```bash
   git add .
   git commit -m "Use deployment-friendly server"
   git push
   ```

3. **In Render**, add only the API key you have:
   - **GEMINI_API_KEY**: Your Google AI key
   - Other services will be disabled but server won't crash

### Option 3: Test Locally First

```bash
# In your project root
cd server
npm install

# Create .env file
echo "GEMINI_API_KEY=your_key_here" > .env
echo "STRIPE_SECRET_KEY=your_stripe_secret_key" >> .env
echo "STRIPE_WEBHOOK_SECRET=whsec_test123" >> .env

# Run server
node index.js
```

## What's Happening?

Your server crashes because it REQUIRES these environment variables:
- GEMINI_API_KEY (for AI analysis)
- STRIPE_SECRET_KEY (for payments)
- STRIPE_WEBHOOK_SECRET (for webhooks)

Without ALL three, the server won't start.

## Fastest Solution

Use Option 1 above - just add the 3 environment variables in Render, even if using test values.

Once deployed, your app will work with the mock data removed!