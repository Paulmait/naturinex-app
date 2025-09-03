# Complete Vercel Setup & Deployment Guide

## 🎯 Domain Strategy

### Recommended Setup:
- **Primary Domain**: `naturinex.com` (main brand)
- **Secondary Domain**: `naturinex.ai` (redirects to .com)

This gives you AI branding flexibility while maintaining .com as primary.

## ⚙️ Vercel Project Settings

### 1. Framework Preset
```
Framework Preset: Other
```

### 2. Root Directory
```
Root Directory: ./
```
⚠️ **IMPORTANT**: Leave as `./` (repository root) because vercel.json handles the paths

### 3. Build & Development Settings
```
Build Command: cd naturinex-app && npm install && npm run build:web
Output Directory: naturinex-app/build
Install Command: npm install && cd server && npm install && cd ../naturinex-app && npm install
Development Command: cd naturinex-app && npm start
```

### 4. Node.js Version
```
Node.js Version: 20.x (or 18.x)
```

## 🌐 Environment Variables for Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# REQUIRED - Copy exactly as shown, replace values
REACT_APP_API_URL=https://naturinex-server.onrender.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
NODE_ENV=production
CI=false

# OPTIONAL - But recommended
REACT_APP_VERSION=2.0.0
REACT_APP_NAME=Naturinex
GENERATE_SOURCEMAP=false
```

## 🔗 Domain Configuration

### For naturinex.com (Primary)

#### In Vercel:
1. Go to Settings → Domains
2. Add domain: `naturinex.com`
3. Add domain: `www.naturinex.com`

#### In GoDaddy DNS Management:

**Delete all existing A, AAAA, and CNAME records for @ and www first!**

Then add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

### For naturinex.ai (Secondary - Redirects to .com)

#### In Vercel:
1. Add domain: `naturinex.ai`
2. Add domain: `www.naturinex.ai`
3. Set up redirect (in Vercel):
   - From: `naturinex.ai`
   - To: `naturinex.com`
   - Type: 308 Permanent Redirect

#### In GoDaddy DNS Management (for naturinex.ai):

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 76.76.21.21 | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

## 📝 Vercel.json Configuration

Your `vercel.json` is already configured correctly:

```json
{
  "version": 2,
  "name": "naturinex-app",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/index.js"
    },
    {
      "source": "/suggest",
      "destination": "/server/index.js"
    },
    {
      "source": "/webhook",
      "destination": "/server/index.js"
    },
    {
      "source": "/health",
      "destination": "/server/index.js"
    }
  ],
  "functions": {
    "server/index.js": {
      "maxDuration": 30,
      "runtime": "nodejs20.x"
    }
  },
  "buildCommand": "cd naturinex-app && npm install && npm run build:web",
  "outputDirectory": "naturinex-app/build",
  "installCommand": "npm install && cd server && npm install && cd ../naturinex-app && npm install"
}
```

## 🚀 Deployment Steps

### Step 1: Import Project
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import: `Paulmait/naturinex-app`

### Step 2: Configure Build Settings
Use these exact settings:

```
Configure Project:
├── Framework Preset: Other
├── Root Directory: ./
├── Environment Variables: [Add from list above]
└── Build and Output Settings:
    ├── Build Command: (override) cd naturinex-app && npm install && npm run build:web
    ├── Output Directory: (override) naturinex-app/build
    └── Install Command: (override) npm install && cd server && npm install && cd ../naturinex-app && npm install
```

### Step 3: Deploy
Click "Deploy" and wait 3-5 minutes

### Step 4: Add Domains
After deployment:
1. Go to Settings → Domains
2. Add `naturinex.com`
3. Add `www.naturinex.com`
4. Add `naturinex.ai`
5. Add `www.naturinex.ai`

### Step 5: Configure GoDaddy
For BOTH domains in GoDaddy:
1. Go to DNS Management
2. Delete existing A and CNAME records
3. Add records from tables above
4. Save changes

## ✅ Verification Checklist

After deployment, verify these work:

### Frontend Routes:
```
https://naturinex.com ✓
https://www.naturinex.com ✓
https://naturinex.ai → redirects to naturinex.com ✓
https://www.naturinex.ai → redirects to naturinex.com ✓
```

### API Endpoints (via Vercel Functions):
```
https://naturinex.com/api/health
https://naturinex.com/api/subscriptions/tiers
https://naturinex.com/health
```

### Backend API (Render):
```
https://naturinex-server.onrender.com/health
https://naturinex-server.onrender.com/api/subscriptions/tiers
```

## 🔧 Troubleshooting

### Build Failing?
```bash
# Add to Environment Variables:
CI=false
SKIP_PREFLIGHT_CHECK=true
```

### API Not Working?
```bash
# Check REACT_APP_API_URL has no trailing slash:
✅ REACT_APP_API_URL=https://naturinex-server.onrender.com
❌ REACT_APP_API_URL=https://naturinex-server.onrender.com/
```

### Domain Not Working?
1. Wait 5-48 hours for DNS propagation
2. Check at: https://www.whatsmydns.net
3. Clear browser cache
4. Try incognito mode

### Functions Timeout?
```json
// Increase in vercel.json:
"functions": {
  "server/index.js": {
    "maxDuration": 60  // Increase from 30
  }
}
```

## 📊 Alternative: Serverless API

If you want to run the API on Vercel instead of Render:

1. Change `REACT_APP_API_URL` to just `/api`
2. Remove `REACT_APP_API_URL` from env vars
3. Vercel will handle API routes automatically

But Render is recommended for:
- Better performance
- Persistent connections
- WebSocket support
- Lower costs at scale

## 🎯 Final Configuration Summary

**Root Directory**: `./` (repository root)
**Build Command**: `cd naturinex-app && npm install && npm run build:web`
**Output Directory**: `naturinex-app/build`
**Primary Domain**: `naturinex.com`
**API Backend**: Render (separate deployment)

## 💡 Pro Tips

1. **Use naturinex.com as primary** - Better for SEO and trust
2. **Keep naturinex.ai for marketing** - Use in AI-focused campaigns
3. **Set up analytics** - Add Google Analytics to track both domains
4. **Monitor performance** - Use Vercel Analytics (free tier)
5. **Enable Web Analytics** in Vercel project settings

## 🚦 Expected Result

After following this guide:
- ✅ naturinex.com loads your app
- ✅ naturinex.ai redirects to naturinex.com
- ✅ API calls work from frontend to Render backend
- ✅ Both www and non-www versions work
- ✅ SSL certificates auto-configured
- ✅ Global CDN active

Your deployment is ready! 🚀