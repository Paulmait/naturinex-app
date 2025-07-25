# 🔧 Backend Fix Guide - Solving "Analysis Failed"

## ✅ Good News: Your Backend IS Running!

The server at `https://naturinex-app.onrender.com` is responding, but it's returning HTML error pages instead of JSON data.

## 🚨 The Problem

When you try to analyze medication, the server returns:
```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot POST /api/analyze/name</pre>
</body>
</html>
```

This happens when:
1. **Missing GEMINI_API_KEY** - Most likely cause
2. **Server error handling** returns HTML instead of JSON
3. **Missing required environment variables**

## 🛠️ Fix Steps

### Step 1: Check Render.com Environment Variables

1. **Login to Render.com**
   - Go to https://dashboard.render.com/
   - Find your "naturinex-api" service

2. **Check Environment Variables**
   - Click on your service
   - Go to "Environment" tab
   - Verify these are set:
     - `GEMINI_API_KEY` ⚠️ (This is likely missing!)
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`

### Step 2: Get a Gemini API Key

1. **Go to Google AI Studio**
   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with Google account

2. **Create API Key**
   - Click "Create API Key"
   - Copy the key (starts with "AIza...")

3. **Add to Render**
   - In Render Environment tab
   - Add: `GEMINI_API_KEY` = `your-api-key-here`
   - Click "Save Changes"
   - **Service will auto-restart**

### Step 3: Wait for Deploy

- Render will redeploy automatically
- Takes 2-5 minutes
- Check logs for any errors

## 🧪 Test After Fix

Run this test again:
```bash
node test-backend.js
```

Or test in browser:
```
https://naturinex-app.onrender.com/health
```

Should return:
```json
{
  "status": "Server is running",
  "timestamp": "...",
  "version": "2.0.0"
}
```

## 📱 Alternative: Test with Mock Data NOW

While waiting for backend fix, you can test the app with mock data:

**In `src/screens/AnalysisScreen.js`, temporarily add:**

```javascript
// Add this mock function at the top
const getMockAnalysis = (medicationName) => ({
  medication: {
    name: medicationName,
    activeIngredient: 'Test ingredient',
    uses: ['Pain relief', 'Fever reduction'],
    warnings: ['Test warning - consult doctor']
  },
  naturalAlternatives: [
    {
      name: 'Turmeric',
      benefits: 'Natural anti-inflammatory',
      usage: 'Add to food or take as supplement'
    }
  ],
  interactions: [],
  analysisDate: new Date().toISOString()
});

// In analyzeMedicationByName function, replace the fetch with:
const analyzeMedicationByName = async (medicationName) => {
  try {
    setLoading(true);
    
    // TEMPORARY: Use mock data
    console.log('Using mock data for testing');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    const result = getMockAnalysis(medicationName);
    setAnalysisResult(result);
    
    // Original code commented out for now:
    // const response = await fetch(`${API_URL}/api/analyze/name`, {
    //   ...
    // });
    
  } catch (error) {
    console.error('Analysis error:', error);
    setError(`Failed to analyze "${medicationName}"`);
  } finally {
    setLoading(false);
  }
};
```

## 🎯 Quick Checklist

1. ✅ Backend is running (confirmed)
2. ❌ GEMINI_API_KEY missing (most likely)
3. ⏳ Add API key to Render
4. 🧪 Test with mock data while waiting

## 📊 Expected Timeline

- **Add API Key**: 2 minutes
- **Render Redeploy**: 3-5 minutes
- **Total Fix Time**: ~7 minutes

Once the GEMINI_API_KEY is added, your app should work perfectly!

## 🆘 If Still Not Working

Check server logs in Render for errors like:
- "GEMINI_API_KEY is required"
- "Failed to initialize Gemini"
- Any other error messages

The server code expects these environment variables:
- `GEMINI_API_KEY` (required for AI analysis)
- `STRIPE_SECRET_KEY` (for payments)
- `PORT` (already set to 10000)

Your Firebase setup is perfect - this is purely a backend configuration issue!