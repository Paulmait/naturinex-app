# Vercel Deployment Guide for Naturinex

## Quick Deployment Steps

### 1. Sign up for Vercel
- Go to [vercel.com](https://vercel.com)
- Sign up with your GitHub account (recommended)
- This will allow automatic deployments

### 2. Deploy via GitHub (Recommended)

Since your code is already on GitHub:

1. **In Vercel Dashboard:**
   - Click "Add New Project"
   - Import your GitHub repository: `naturinex-app`
   - Select the repository

2. **Configure Build Settings:**
   - Framework Preset: `Create React App`
   - Root Directory: `client` (important!)
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Add Environment Variables:**
   Click "Environment Variables" and add:
   ```
   REACT_APP_FIREBASE_API_KEY=AIzaSyBxwcFSu18M8YHDFT_eTrV73amrDXv20Tg
   REACT_APP_FIREBASE_AUTH_DOMAIN=mediscan-b6252.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=mediscan-b6252
   REACT_APP_FIREBASE_STORAGE_BUCKET=mediscan-b6252.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=558707650938
   REACT_APP_FIREBASE_APP_ID=1:558707650938:web:5d5f7f1234567890abcdef
   REACT_APP_API_URL=https://naturinex-app.onrender.com
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnopqrstuvwxyz
   ```

4. **Click "Deploy"**
   - Vercel will build and deploy your app
   - You'll get a URL like: `naturinex-app.vercel.app`

### 3. Connect Your Custom Domain

After deployment:

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Click "Domains"
   - Add `naturinex.com` and `www.naturinex.com`

2. **Vercel will show you DNS records to add**

3. **In GoDaddy DNS:**
   - Delete the current A record pointing to WebsiteBuilder
   - Add the records Vercel provides:
     - Usually an A record pointing to `76.76.21.21`
     - And a CNAME for www pointing to `cname.vercel-dns.com`

### 4. Alternative: Deploy via Vercel CLI

If you prefer command line:

```bash
# Install Vercel CLI
npm install -g vercel

# In your client directory
cd C:\Users\maito\mediscan-app\client

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: naturinex-app
# - Directory: ./
# - Override settings: N
```

## Post-Deployment

1. **Test your deployment:**
   - Visit your Vercel URL
   - Test all features
   - Check console for any errors

2. **Set up automatic deployments:**
   - Every push to GitHub will trigger a new deployment
   - Preview deployments for pull requests

3. **Monitor your app:**
   - Vercel provides analytics and performance monitoring
   - Check the Functions tab for API logs

## Environment Variables Reference

Make sure these are set in Vercel:

- `REACT_APP_FIREBASE_API_KEY` - Your Firebase API key
- `REACT_APP_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `REACT_APP_FIREBASE_PROJECT_ID` - Firebase project ID
- `REACT_APP_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `REACT_APP_FIREBASE_APP_ID` - Firebase app ID
- `REACT_APP_API_URL` - Your backend URL (https://naturinex-app.onrender.com)
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key

## Troubleshooting

**Build Fails:**
- Make sure root directory is set to `client`
- Check build logs for specific errors

**404 Errors:**
- The vercel.json file handles this
- Make sure it's in the client directory

**API Calls Failing:**
- Verify REACT_APP_API_URL is set correctly
- Check CORS settings on backend

**Domain Not Working:**
- DNS changes can take up to 48 hours
- Use DNS checker tools to verify propagation