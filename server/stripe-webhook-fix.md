# Stripe Webhook Fix Guide

## Issue Summary
Stripe is receiving HTTP 301 redirects when trying to send webhooks to `https://www.naturinex.com/webhooks/stripe`. This prevents webhook events from being processed.

## Solutions

### 1. Update Your Code (Already Done)
✅ The server now accepts webhooks at both paths:
- `/webhook` (original path)
- `/webhooks/stripe` (Stripe's expected path)

### 2. Check Your Hosting Configuration

#### If using Vercel:
Add a `vercel.json` file to your project root:
```json
{
  "redirects": [],
  "rewrites": [
    {
      "source": "/webhooks/stripe",
      "destination": "/api/webhooks/stripe"
    }
  ],
  "headers": [
    {
      "source": "/webhooks/stripe",
      "headers": [
        {
          "key": "X-Webhook-Path",
          "value": "stripe"
        }
      ]
    }
  ]
}
```

#### If using Netlify:
Add a `_redirects` file to your public folder:
```
/webhooks/stripe /webhooks/stripe 200!
```

#### If using Nginx:
Update your nginx configuration:
```nginx
location = /webhooks/stripe {
    proxy_pass http://localhost:5000/webhooks/stripe;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Test Your Webhook Endpoint

Use Stripe CLI to test locally:
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:5000/webhooks/stripe

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

### 4. Update Stripe Dashboard

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Find the webhook endpoint for `https://www.naturinex.com/webhooks/stripe`
3. Click on the endpoint
4. If needed, update the URL to remove any redirects:
   - Try `https://naturinex.com/webhooks/stripe` (without www)
   - Or `https://www.naturinex.com/webhooks/stripe/` (with trailing slash)
   - Or `https://api.naturinex.com/webhooks/stripe` (if using subdomain)

### 5. Debug the Redirect

To find out exactly where the redirect is happening:

1. **Use curl to test:**
```bash
curl -I -X POST https://www.naturinex.com/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{}'
```

2. **Check the response headers:**
- Look for `Location` header to see where it's redirecting
- Check the status code (301, 302, etc.)

### 6. Common Redirect Causes and Fixes

#### www to non-www redirect:
- Update Stripe webhook URL to use `https://naturinex.com` (without www)

#### Trailing slash redirect:
- Try adding a trailing slash: `https://www.naturinex.com/webhooks/stripe/`

#### HTTP to HTTPS redirect:
- Ensure Stripe webhook URL uses `https://` not `http://`

### 7. Environment Variables

Ensure these are set correctly in your production environment:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
```

### 8. Temporary Workaround

If you can't fix the redirect immediately, create a new webhook endpoint:
1. Deploy your updated server code
2. In Stripe Dashboard, add a new webhook endpoint:
   - URL: `https://www.naturinex.com/webhook` (without the 's' and '/stripe')
   - Or try a different subdomain: `https://api.naturinex.com/webhooks/stripe`
3. Select the same events as your current webhook
4. Delete the old failing webhook once the new one works

## Testing the Fix

1. After implementing the fix, test with Stripe's webhook tester:
   - Go to your webhook endpoint in Stripe Dashboard
   - Click "Send test webhook"
   - Select an event type and send

2. Check your server logs to confirm the webhook was received

3. Monitor for 24 hours to ensure no more 301 errors

## Contact Your Hosting Provider

If none of the above solutions work, contact your hosting provider and ask:
1. Are there any automatic redirects configured for your domain?
2. Is there a load balancer or CDN that might be redirecting?
3. Can they provide the exact redirect rules for your domain?

Remember: Stripe needs a direct 2xx response, not a redirect!