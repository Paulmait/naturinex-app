# Vercel Deployment Guide with GoDaddy Domain

## Step 1: Deploy to Vercel

### A. Using Vercel Dashboard (Recommended)
1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Add New..." → "Project"
4. Import `naturinex-app` repository
5. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: Already configured in vercel.json
   - **Output Directory**: Already configured in vercel.json

### B. Add Environment Variables in Vercel
Click "Environment Variables" and add:

```
GEMINI_API_KEY=your_gemini_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
RESEND_API_KEY=your_resend_api_key (optional)
GOOGLE_VISION_API_KEY=your_vision_api_key (optional)
```

### C. Deploy
Click "Deploy" and wait for deployment to complete (3-5 minutes)

Your app will be available at: `https://naturinex-app.vercel.app`

## Step 2: Configure Custom Domain in Vercel

1. In your Vercel project dashboard, go to "Settings" → "Domains"
2. Add your domain: `naturinex.com` (or your domain)
3. Vercel will show you DNS records to add

## Step 3: Configure GoDaddy DNS

### Login to GoDaddy
1. Go to [https://www.godaddy.com](https://www.godaddy.com)
2. Sign in to your account
3. Go to "My Products" → "Domains"
4. Click "DNS" next to your domain

### Remove Existing Records
Delete any existing A records and CNAME records for @ and www

### Add Vercel DNS Records

#### For Root Domain (naturinex.com):
**Type**: A  
**Name**: @  
**Value**: 76.76.21.21  
**TTL**: 600

#### For WWW Subdomain:
**Type**: CNAME  
**Name**: www  
**Value**: cname.vercel-dns.com  
**TTL**: 600

### Alternative: Using Vercel's Nameservers (Faster)
Instead of individual records, you can change nameservers in GoDaddy:

1. In GoDaddy, go to "Nameservers"
2. Click "Change"
3. Select "Custom"
4. Add Vercel's nameservers:
   - ns1.vercel-dns.com
   - ns2.vercel-dns.com

## Step 4: Configure Backend API URL

Since your backend is on Render, update the API URL in your frontend:

1. In Vercel dashboard, go to "Settings" → "Environment Variables"
2. Add: `REACT_APP_API_URL=https://your-render-backend.onrender.com`
3. Redeploy to apply changes

## Step 5: Verify Deployment

### Check these endpoints:
- Main site: `https://naturinex.com`
- API Health: `https://naturinex.com/api/health`
- Subscription tiers: `https://naturinex.com/api/subscriptions/tiers`

### DNS Propagation
DNS changes can take 5 minutes to 48 hours to propagate globally.
Check status at: [https://www.whatsmydns.net](https://www.whatsmydns.net)

## Step 6: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://naturinex.com/webhook`
3. Select events:
   - checkout.session.completed
   - customer.subscription.deleted
4. Copy the signing secret
5. Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET=whsec_...`

## Troubleshooting

### Domain Not Working?
- Check DNS propagation status
- Verify records in GoDaddy match exactly
- Clear browser cache
- Try in incognito mode

### API Calls Failing?
- Check CORS settings in backend
- Verify API URL in environment variables
- Check Render backend is running

### Build Failing?
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Check Node version compatibility

## Support Resources

- **Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
- **GoDaddy Support**: [https://www.godaddy.com/help](https://www.godaddy.com/help)
- **DNS Checker**: [https://www.whatsmydns.net](https://www.whatsmydns.net)

## Post-Deployment Checklist

- [ ] Site loads on custom domain
- [ ] API endpoints working
- [ ] Stripe payments functional
- [ ] Email service sending (if configured)
- [ ] Mobile app can connect to API
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics/monitoring setup

## Estimated Time
- Vercel deployment: 5 minutes
- DNS configuration: 10 minutes
- DNS propagation: 5 minutes to 48 hours (usually < 1 hour)

Your site is now LIVE! 🚀