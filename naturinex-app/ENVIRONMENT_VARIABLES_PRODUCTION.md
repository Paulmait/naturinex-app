# 🔐 Production Environment Variables for 1M+ Users

## Critical Environment Variables Required

### 1. **Supabase (Primary Database) - REQUIRED**
```env
# Get from: https://app.supabase.com/project/YOUR_PROJECT/settings/api
EXPO_PUBLIC_SUPABASE_URL=https://hxhbsxzkzarqwksbjpce.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Server-side only
```

### 2. **Firebase (Authentication & Analytics) - REQUIRED**
```env
# Get from: https://console.firebase.google.com/project/YOUR_PROJECT/settings
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=naturinex-app.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=naturinex-app
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=naturinex-app.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Server-side Firebase Admin
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

### 3. **Stripe Payment Processing - REQUIRED**
```env
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Price IDs from Stripe Dashboard
STRIPE_PRICE_BASIC=price_basic_monthly_id
STRIPE_PRICE_PREMIUM=price_premium_monthly_id
STRIPE_PRICE_PROFESSIONAL=price_professional_monthly_id
```

### 4. **AI Services - REQUIRED**
```env
# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Google Vision for OCR
GOOGLE_VISION_API_KEY=your_vision_api_key_here

# OpenAI (optional backup)
OPENAI_API_KEY=your_openai_key_here
```

### 5. **API Configuration - REQUIRED**
```env
# Production API URLs
EXPO_PUBLIC_API_URL=https://naturinex-app-zsga.onrender.com
REACT_APP_API_URL=https://naturinex-app-zsga.onrender.com
API_BASE_URL=https://naturinex-app-zsga.onrender.com

# CORS Origins (comma-separated)
CORS_ORIGIN=https://naturinex.com,https://www.naturinex.com,https://app.naturinex.com
```

### 6. **Security & Monitoring - REQUIRED for 1M+ Users**
```env
# Sentry Error Tracking
SENTRY_DSN=https://your_key@sentry.io/project_id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_ORG=naturinex
SENTRY_PROJECT=naturinex-app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
API_RATE_LIMIT_PER_MINUTE=60

# Session Security
JWT_SECRET=your_very_long_random_jwt_secret_key
SESSION_SECRET=your_very_long_random_session_secret
ENCRYPTION_KEY=your_32_char_encryption_key_here
```

### 7. **Scaling & Performance - CRITICAL for 1M+ Users**
```env
# Database Connection Pooling
DATABASE_POOL_MIN=10
DATABASE_POOL_MAX=100
DATABASE_CONNECTION_TIMEOUT=60000

# Redis Cache (Required for 1M+ users)
REDIS_URL=redis://your-redis-instance:6379
REDIS_PASSWORD=your_redis_password
CACHE_TTL=3600  # 1 hour

# CDN Configuration
CDN_URL=https://cdn.naturinex.com
CLOUDFLARE_API_KEY=your_cloudflare_key
CLOUDFLARE_ZONE_ID=your_zone_id
```

### 8. **Email & Notifications - REQUIRED**
```env
# SendGrid for Transactional Emails
SENDGRID_API_KEY=SG.your_sendgrid_key_here
SENDGRID_FROM_EMAIL=noreply@naturinex.com
SENDGRID_VERIFIED_SENDER=support@naturinex.com

# Push Notifications
EXPO_PUBLIC_PUSH_NOTIFICATION_KEY=your_expo_push_key
FCM_SERVER_KEY=your_fcm_server_key
APNS_KEY_ID=your_apple_push_key_id
APNS_TEAM_ID=your_apple_team_id
```

### 9. **Third-Party Integrations**
```env
# Health APIs
APPLE_HEALTHKIT_CLIENT_ID=your_healthkit_id
GOOGLE_FIT_CLIENT_ID=your_google_fit_id

# OAuth Providers
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_secret
APPLE_CLIENT_ID=com.naturinex.app
APPLE_TEAM_ID=your_apple_team_id

# Medical Database APIs
PUBCHEM_API_KEY=your_pubchem_key
FDA_API_KEY=your_fda_api_key
WHO_API_KEY=your_who_api_key
```

### 10. **App Store Configuration**
```env
# iOS
IOS_BUNDLE_ID=com.naturinex.app
APPLE_ID=your-apple-id@email.com
ASCAPP_ID=your_app_store_connect_id
APPLE_TEAM_ID=your_team_id

# Android
ANDROID_PACKAGE=com.naturinex.app
GOOGLE_PLAY_KEY_FILE=./secrets/google-play-key.json
```

### 11. **Legal & Compliance URLs - REQUIRED**
```env
PRIVACY_POLICY_URL=https://naturinex.com/privacy-policy
TERMS_OF_SERVICE_URL=https://naturinex.com/terms
SUPPORT_URL=https://naturinex.com/support
SUPPORT_EMAIL=support@naturinex.com
```

### 12. **Performance Optimization for 1M+ Users**
```env
# Node.js Optimization
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096
UV_THREADPOOL_SIZE=128

# Clustering
CLUSTER_WORKERS=auto  # Uses CPU cores
PM2_INSTANCES=max

# Request Timeouts
REQUEST_TIMEOUT=30000
UPLOAD_TIMEOUT=120000
```

## 🚀 Deployment Platforms Configuration

### Render.com Environment Variables
Add these in Render Dashboard > Environment:
```bash
# All EXPO_PUBLIC_* and REACT_APP_* variables
# Plus server-side secrets
```

### Expo EAS Build Secrets
```bash
# Add secrets via EAS CLI
eas secret:create SUPABASE_ANON_KEY --value "your_key"
eas secret:create STRIPE_PUBLISHABLE_KEY --value "your_key"
eas secret:create FIREBASE_API_KEY --value "your_key"
```

### Vercel Environment Variables (if using)
```bash
# Add via Vercel Dashboard or CLI
vercel env add EXPO_PUBLIC_SUPABASE_URL production
```

## 📊 Monitoring Setup for 1M+ Users

### Required Services:
1. **Sentry** - Error tracking
2. **DataDog/New Relic** - APM monitoring
3. **CloudFlare** - CDN & DDoS protection
4. **Redis** - Caching layer
5. **PostgreSQL** - Read replicas for Supabase
6. **Load Balancer** - AWS ALB or CloudFlare Load Balancing

### Infrastructure Requirements:
- **Database**: Supabase Pro plan minimum ($25/mo)
- **Server**: 8GB+ RAM, 4+ CPU cores
- **CDN**: CloudFlare Pro ($20/mo)
- **Redis**: 2GB+ memory
- **Monitoring**: Sentry Team plan ($26/mo)

## 🔒 Security Checklist

- [ ] All API keys are environment variables
- [ ] No hardcoded secrets in code
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] SSL/TLS enforced everywhere
- [ ] Database connection pooling enabled
- [ ] Redis caching implemented
- [ ] CDN configured for static assets
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Backup strategy in place
- [ ] Disaster recovery plan ready

## 📝 Quick Setup Commands

```bash
# Create .env.production file
cp .env.example .env.production

# Add to Render
cat .env.production | while read line; do
  render env:set "$line"
done

# Verify all variables
node scripts/verify-env.js
```

## ⚠️ Critical Notes

1. **Never commit .env files** to version control
2. **Use different keys** for development and production
3. **Rotate keys** every 90 days
4. **Enable 2FA** on all service accounts
5. **Monitor usage** to prevent quota exceeded errors
6. **Set up alerts** for error rates and performance

## 🎯 Performance Targets for 1M+ Users

- API Response Time: < 200ms (p95)
- Database Query Time: < 50ms (p95)
- Page Load Time: < 2 seconds
- Error Rate: < 0.1%
- Uptime: 99.9%
- Concurrent Users: 10,000+
- Requests/Second: 1,000+

---

**Last Updated:** September 2025
**Next Review:** Before launch