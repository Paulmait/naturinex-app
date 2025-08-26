# 🔧 Complete Vision API Setup Guide

## Step 1: Verify API Key 4 Has Vision API Access

1. Go to Google Cloud Console
2. Click on **"API key 4"** in your credentials list
3. Look at the **API restrictions** section
4. Make sure **"Cloud Vision API"** is in the list
5. If not there:
   - Click **"Edit API key"**
   - Under "API restrictions", select **"Restrict key"**
   - Add **"Cloud Vision API"** to the list
   - Click **Save**

## Step 2: Copy Your API Key

1. Still on the API key 4 page
2. Click the **copy icon** next to your key
3. It should look like: `AIzaSyD...` (about 39 characters)

## Step 3: Add to Render Environment

1. Go to https://dashboard.render.com
2. Click your **naturinex-app-zsga** service
3. Go to **Environment** tab
4. You should see your existing variables (GEMINI_API_KEY, etc.)
5. Add a new one:
   ```
   Key: GOOGLE_VISION_API_KEY
   Value: [paste your API key here]
   ```
6. Click **Save Changes**

## Step 4: Wait for Deployment

- Render will automatically redeploy (the fix I just pushed will deploy too)
- Takes about 2-3 minutes
- Check the logs for success

## Step 5: Verify It's Working

In Render logs, you should see:
```
✅ Server running on port 10000
```

When someone uses the camera, you'll see:
```
📊 Analyzing medication from image
Detected text: [actual text from photo]
Extracted medication name: [medication name]
```

## Troubleshooting

If you still get errors:

1. **"API key not valid"** - Make sure Vision API is enabled for the key
2. **"Quota exceeded"** - You're still on free tier (1000/month)
3. **Still seeing mock data** - Check the environment variable name is exactly `GOOGLE_VISION_API_KEY`

## Test It

1. Open your app in Expo Go
2. Go to camera screen  
3. Take a photo of ANY text (try a book cover or product label)
4. You should see real analysis, not mock data!

Your deployment should work now with the syntax fix + API key! 🚀