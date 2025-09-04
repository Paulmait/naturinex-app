# Render Deployment Guide for NaturineX with Resend Email

## 🚀 Quick Start

### 1. Prerequisites
- Render account: https://render.com
- Resend account: https://resend.com
- GitHub repository connected to Render

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Push the `render.yaml` file to your repository
2. Go to Render Dashboard → New → Blueprint
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to create all services

#### Option B: Manual Setup
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the service settings below

### 3. Environment Variables Setup

Go to your Render service → Environment → Add the following:

#### Required Variables
```bash
# Resend Email (Get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Firebase Admin
FIREBASE_PROJECT_ID=naturinex-app
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@naturinex-app.iam.gserviceaccount.com

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Stripe Payments
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Security (Render can auto-generate these)
JWT_SECRET=<click_generate>
ENCRYPTION_KEY=<click_generate>
```

#### Automatic Variables (Set by Render)
```bash
DATABASE_URL=<automatically_set_from_postgres>
PORT=<automatically_set_by_render>
NODE_ENV=production
```

### 4. Database Setup

#### Create PostgreSQL Database on Render
1. Go to Render Dashboard → New → PostgreSQL
2. Name: `naturinex-db`
3. Region: Same as your web service
4. Plan: Free (or Starter for production)
5. Click "Create Database"

#### Run Migrations
1. Go to your database in Render Dashboard
2. Click "Connect" → "External Connection"
3. Copy the External Database URL
4. Run migrations locally:
```bash
# Set the database URL
export DATABASE_URL="postgresql://user:pass@host:5432/naturinex"

# Run all migrations
psql $DATABASE_URL < server/database/migrations/001_initial_schema.sql
psql $DATABASE_URL < server/database/migrations/002_tier_system.sql
psql $DATABASE_URL < server/database/migrations/003_email_tables.sql
psql $DATABASE_URL < server/database/migrations/004_monitoring_tables.sql
```

Or use the Render Shell:
```bash
# Connect to your service shell
# Go to Render Dashboard → Your Service → Shell
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
psql $DATABASE_URL -f database/migrations/002_tier_system.sql
psql $DATABASE_URL -f database/migrations/003_email_tables.sql
psql $DATABASE_URL -f database/migrations/004_monitoring_tables.sql
```

### 5. Configure Resend Webhooks

1. Go to Resend Dashboard → Webhooks
2. Add endpoint: `https://your-app.onrender.com/api/webhooks/resend`
3. Select events:
   - email.sent
   - email.delivered
   - email.bounced
   - email.complained
   - email.opened
   - email.clicked
4. Copy the webhook secret and add to Render env vars

### 6. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.onrender.com/api/webhooks/stripe`
3. Select events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.deleted
   - payment_intent.succeeded
4. Copy the webhook secret and add to Render env vars

### 7. Domain Setup (Optional)

#### Add Custom Domain
1. Go to Render Dashboard → Your Service → Settings
2. Add custom domain: `api.yourdomain.com`
3. Configure DNS:
   - Type: CNAME
   - Name: api
   - Value: your-app.onrender.com

#### Configure Resend Domain
1. Go to Resend → Domains → Add Domain
2. Add your domain
3. Configure DNS records as shown by Resend:
   - SPF: `TXT` record with `v=spf1 include:amazonses.com ~all`
   - DKIM: `TXT` record with the public key
   - DMARC: `TXT` record with `v=DMARC1; p=none;`

### 8. Build & Start Commands

In Render service settings:

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node index.js
```

### 9. Health Checks

Render will automatically check: `https://your-app.onrender.com/health`

### 10. Monitoring & Logs

#### View Logs
- Go to Render Dashboard → Your Service → Logs
- Filter by: `email`, `error`, `webhook`

#### Monitor Email Health
The app automatically monitors email health every 15 minutes and logs:
- Delivery rates
- Bounce rates
- Failed emails
- Rate limiting

### 11. Testing

#### Test Email Service
```bash
# Test welcome email
curl -X POST https://your-app.onrender.com/api/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "template": "welcome",
    "to": "test@example.com"
  }'

# Test verification email
curl -X POST https://your-app.onrender.com/api/email/resend-verification \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Check Email Stats
```bash
curl https://your-app.onrender.com/api/email/stats?days=7 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### 12. Troubleshooting

#### Email Not Sending
1. Check Resend API key is correct
2. Verify sender domain is verified in Resend
3. Check logs for rate limiting
4. Ensure DNS records are configured

#### Database Connection Issues
1. Check DATABASE_URL is set correctly
2. Ensure migrations have run
3. Check database is in same region as service

#### Webhook Failures
1. Verify webhook secrets match
2. Check webhook URLs are correct
3. Look for signature verification errors in logs

### 13. Production Checklist

- [ ] Upgrade Render plan from Free to Starter/Standard
- [ ] Enable auto-scaling if needed
- [ ] Configure alerting for failures
- [ ] Set up backup strategy for database
- [ ] Configure rate limiting appropriately
- [ ] Enable DDoS protection
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure log retention
- [ ] Test disaster recovery plan
- [ ] Document API endpoints

### 14. Cost Optimization

**Free Tier:**
- Web Service: Free (spins down after 15 min inactivity)
- PostgreSQL: Free (limited storage)
- Bandwidth: 100 GB/month

**Recommended Production:**
- Web Service: Starter ($7/month) - No spin down
- PostgreSQL: Starter ($7/month) - Backups included
- Total: ~$14/month

### 15. API Endpoints Reference

```
Base URL: https://your-app.onrender.com

Email Endpoints:
POST   /api/email/welcome
POST   /api/email/resend-verification  
GET    /api/email/verify-email?token=xxx
POST   /api/email/verify-email-code
POST   /api/email/request-password-reset
POST   /api/email/reset-password
PUT    /api/email/preferences
GET    /api/email/preferences
GET    /api/email/stats (admin)
POST   /api/email/test (admin)

Webhook Endpoints:
POST   /api/webhooks/resend
POST   /api/webhooks/stripe
POST   /api/webhooks/health
```

## 📞 Support

- Render Support: https://render.com/support
- Resend Support: https://resend.com/support
- Documentation: https://docs.render.com

## 🔒 Security Notes

1. Never commit secrets to Git
2. Use Render's secret management
3. Enable 2FA on all services
4. Regularly rotate API keys
5. Monitor for suspicious activity
6. Keep dependencies updated