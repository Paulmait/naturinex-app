# 📋 Step-by-Step Guide: Adding Gemini API Key to Render

## Part 1: Get Your Gemini API Key (5 minutes)

### Step 1: Go to Google AI Studio
1. Open your browser
2. Go to: **https://makersuite.google.com/app/apikey**
3. You'll see the Google AI Studio page

### Step 2: Sign In
1. Click "Sign in" (top right)
2. Use your Google account
3. Accept terms if prompted

### Step 3: Create API Key
1. Look for "Create API Key" button
2. Click it
3. Choose "Create API key in new project" or select existing project
4. **IMPORTANT**: Copy the API key immediately!
   - It looks like: `AIzaSyD...` (39 characters)
   - Save it somewhere safe temporarily

### Step 4: Test Your API Key (Optional)
Visit: https://makersuite.google.com/app/prompts
- Try a sample prompt to verify the key works

---

## Part 2: Add API Key to Render (5 minutes)

### Step 1: Login to Render
1. Go to: **https://dashboard.render.com/**
2. Sign in with your account
3. You'll see your dashboard

### Step 2: Find Your Service
1. Look for service named "**naturinex-api**" or "**naturinex-app**"
2. Click on the service name
3. You'll see the service overview page

### Step 3: Go to Environment Variables
1. Look at the left sidebar
2. Click on "**Environment**" tab
3. You'll see a list of environment variables

### Step 4: Add the API Key
1. Click "**Add Environment Variable**" button
2. Fill in:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Paste your API key (AIzaSyD...)
3. Click "**Save**"

### Step 5: Wait for Redeploy
1. Render will show "Updating..."
2. The service will automatically restart
3. Wait 3-5 minutes for deployment
4. Look for green "Live" status

---

## Part 3: Verify It's Working (2 minutes)

### Step 1: Check Service Logs
1. In Render dashboard, click "**Logs**" tab
2. Look for:
   - "Server started on port 10000"
   - "Gemini AI initialized successfully"
   - No error messages about missing API key

### Step 2: Test the Health Endpoint
1. Open new browser tab
2. Go to: **https://naturinex-app.onrender.com/health**
3. You should see:
```json
{
  "status": "Server is running",
  "timestamp": "...",
  "version": "2.0.0"
}
```

### Step 3: Test in Your App
1. Open Expo Go
2. Try analyzing "Advil" or "Tylenol"
3. Should now return real AI analysis!

---

## 🚨 Troubleshooting

### If API Key Doesn't Work:
1. **Check for spaces**: Make sure no extra spaces before/after the key
2. **Check quotes**: Don't include quotes around the key
3. **Verify key**: Test at https://makersuite.google.com/app/prompts

### If Render Won't Restart:
1. Click "**Manual Deploy**" button
2. Choose "**Deploy latest commit**"

### If Still Getting Errors:
Check Render logs for:
- "GEMINI_API_KEY is not defined"
- "Failed to initialize Gemini"
- Any other error messages

---

## 📱 Remove Mock Data After Testing

Once the API key is working:

1. Go back to `src/screens/AnalysisScreen.js`
2. Remove the mock code:
   - Delete the `getMockAnalysis` function
   - Uncomment the original fetch code
   - Delete the mock implementation

Or I can do this for you once you confirm the API is working!

---

## ✅ Success Checklist

- [ ] Created Gemini API key
- [ ] Added to Render environment
- [ ] Service redeployed successfully
- [ ] Health endpoint returns JSON
- [ ] App can analyze medications
- [ ] Removed mock data

## 🎯 Expected Timeline

1. Get API key: 2-3 minutes
2. Add to Render: 2 minutes
3. Wait for deploy: 3-5 minutes
4. **Total: ~10 minutes**

Your app will be fully functional once this is complete!