# 🔧 Fix OCR to Use Real Product Detection

## Current Issue
Your app is returning mock data (like "Metformin" when scanning "Miralax") because the Google Vision API key is not configured on your server.

## Quick Fix Steps (5 minutes)

### Step 1: Get Your Google Vision API Key

You already have a Google Cloud project. You need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (naturinex-app or mediscan)
3. Go to **APIs & Services** → **Credentials**
4. Look for an API key that has **Cloud Vision API** enabled
   - If you see "API key 4" as mentioned in VISION_API_SETUP.md, use that one
   - Otherwise, create a new API key

### Step 2: Enable Cloud Vision API (if not already enabled)

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Cloud Vision API"
3. Click on it and press **Enable**
4. Wait for it to activate

### Step 3: Add API Key to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your service: **naturinex-app-zsga**
3. Navigate to the **Environment** tab
4. Click **Add Environment Variable**
5. Add:
   ```
   Key: GOOGLE_VISION_API_KEY
   Value: [Your API key starting with AIza...]
   ```
6. Click **Save Changes**

### Step 4: Wait for Automatic Deployment

- Render will automatically redeploy your service
- This takes about 2-3 minutes
- You can watch the deployment progress in the Events tab

## How to Verify It's Working

### In Render Logs
You should see:
```
✅ Environment Variables:
   GEMINI_API_KEY: ✅ Set
   STRIPE_SECRET_KEY: ✅ Set
   STRIPE_WEBHOOK_SECRET: ✅ Set
   GOOGLE_VISION_API_KEY: ✅ Set  <-- This should now show as Set
```

### In Your App
1. Open the app
2. Go to camera screen
3. Take a photo of a real product (like Miralax)
4. You should see:
   - Real product name detected (not Metformin)
   - Actual analysis based on the product
   - No "mock data" warning

## What the Server Does with Vision API

When configured properly:
1. Receives image from camera
2. Sends to Google Vision API for text detection
3. Extracts product/medication name from detected text
4. Uses Gemini AI to analyze and provide natural alternatives
5. Returns real analysis (not mock data)

## Troubleshooting

### Still Getting Mock Data?
- Check Render logs for: `⚠️ Google Vision API not configured`
- Verify the environment variable name is exactly: `GOOGLE_VISION_API_KEY`
- Make sure the API key has Vision API access enabled

### Getting API Errors?
- Check if Vision API is enabled in Google Cloud Console
- Verify API key restrictions allow Vision API
- Check quota (free tier is 1000 requests/month)

### API Key Format
Your key should look like:
```
AIzaSyD3_example_key_about_39_characters_long
```

## Cost Information
- First 1000 requests per month: **FREE**
- After that: $1.50 per 1000 requests
- For beta testing with 100 users: Likely stay within free tier

## Success Indicators

When working properly, scanning "Miralax" should return:
- Product name: "Miralax" (not Metformin)
- Type: "Laxative" or "Digestive Health"
- Natural alternatives specific to constipation relief
- No mock data warnings

## Need the API Key?

If you can't find your API key:
1. Create a new one in Google Cloud Console
2. Make sure to enable Cloud Vision API access
3. Add it to Render as shown above

Once you add the `GOOGLE_VISION_API_KEY` to Render, OCR will start working immediately after deployment!