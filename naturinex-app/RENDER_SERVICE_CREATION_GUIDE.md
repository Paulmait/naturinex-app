# 🚀 Complete Guide: Creating Render Service for Naturinex Backend

## Step 1: Prepare Your GitHub Repository

### Option A: If you already have a GitHub repo
1. Make sure your code is pushed to GitHub
2. Your repository should contain the `server` folder

### Option B: If you need to create a GitHub repo
1. Go to https://github.com/new
2. Name it: `naturinex-app`
3. Set to Private (recommended)
4. Don't initialize with README
5. Push your code:
```bash
cd C:\Users\maito\mediscan-app\naturinex-app
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/naturinex-app.git
git push -u origin main
```

---

## Step 2: Create Render Account (If needed)

1. Go to https://render.com/
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

---

## Step 3: Create New Web Service

### 1. Start Service Creation
1. Login to https://dashboard.render.com/
2. Click "**New +**" button (top right)
3. Select "**Web Service**"

### 2. Connect GitHub
1. You'll see "Connect a repository"
2. Click "**Connect GitHub**"
3. Authorize Render to access your GitHub
4. Select your repository (`naturinex-app`)
5. Click "**Connect**"

### 3. Configure Your Service

Fill in these settings:

**Basic Settings:**
- **Name**: `naturinex-api` (or any name you like)
- **Region**: Oregon (US West) - or closest to you
- **Branch**: main (or master)
- **Root Directory**: `server` ⚠️ IMPORTANT: Type "server" here
- **Runtime**: Node

**Build & Deploy Settings:**
- **Build Command**: `npm install`
- **Start Command**: `node index.js`

**Instance Type:**
- Select "**Free**" ($0/month)

### 4. Add Environment Variables

Scroll down to "Environment Variables" section and add:

Click "Add Environment Variable" for each:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`

2. **PORT**
   - Key: `PORT`
   - Value: `10000`

3. **GEMINI_API_KEY** (Get this first!)
   - Key: `GEMINI_API_KEY`
   - Value: `AIzaSyD...` (your API key from Google AI Studio)
   
   **To get this key:**
   - Open new tab: https://makersuite.google.com/app/apikey
   - Sign in with Google
   - Create API key
   - Copy and paste here

4. **STRIPE_SECRET_KEY** (For payments)
   - Key: `STRIPE_SECRET_KEY`
   - Value: `sk_live_...` (from your Stripe dashboard)

5. **STRIPE_WEBHOOK_SECRET** (Optional for now)
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: `whsec_...` (we'll set this up later)

6. **CORS_ORIGIN** (Optional but recommended)
   - Key: `CORS_ORIGIN`
   - Value: `*` (allows all origins for testing)

### 5. Create Web Service

1. Review all settings
2. Click "**Create Web Service**" button at bottom
3. Render will start building your service

---

## Step 4: Wait for Deployment (5-10 minutes)

### What to Expect:
1. **"Building"** - Installing dependencies
2. **"Deploying"** - Starting your server
3. **"Live"** - Service is running!

### Monitor Progress:
- Watch the logs in real-time
- Look for "Server is running on port 10000"
- Check for any error messages

---

## Step 5: Test Your Service

### 1. Get Your Service URL
- Look at top of Render dashboard
- It will be: `https://naturinex-api.onrender.com`
- Click the URL to open

### 2. Test Endpoints
Try these URLs in your browser:

1. **Health Check**:
   ```
   https://naturinex-api.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "Server is running",
     "timestamp": "...",
     "version": "2.0.0"
   }
   ```

2. **Test Analysis** (use Postman or similar):
   ```
   POST https://naturinex-api.onrender.com/api/analyze/name
   Content-Type: application/json
   
   {
     "medicationName": "Advil"
   }
   ```

---

## Step 6: Update Your App Configuration

1. Open `app.json` in your project
2. Find the `apiUrl` line
3. Update it with your Render URL:
```json
"apiUrl": "https://naturinex-api.onrender.com",
```

---

## 🚨 Common Issues & Solutions

### "Build failed"
- Check build logs for errors
- Make sure `package.json` exists in server folder
- Verify all dependencies are listed

### "Deploy failed" 
- Check start command is correct
- Verify `index.js` exists in server folder
- Check for missing environment variables

### "Cannot GET /"
- This is normal! The API doesn't have a homepage
- Try `/health` endpoint instead

### Free Tier Limitations
- Service sleeps after 15 minutes of inactivity
- First request takes 30-50 seconds to wake up
- Limited to 750 hours/month

---

## ✅ Success Checklist

- [ ] GitHub repository created/connected
- [ ] Render service created
- [ ] Environment variables added (especially GEMINI_API_KEY)
- [ ] Service deployed successfully (green "Live" status)
- [ ] Health endpoint returns JSON
- [ ] Updated app.json with service URL

---

## 🎯 Quick Summary

1. **Connect GitHub** → Select your repo
2. **Configure Service** → Set root directory to "server"
3. **Add Environment Variables** → Especially GEMINI_API_KEY
4. **Create & Deploy** → Wait for "Live" status
5. **Test** → Check health endpoint
6. **Update App** → Add service URL to app.json

Once complete, your app will have a fully functional backend!

Need help? The most common issue is forgetting to set the root directory to "server".