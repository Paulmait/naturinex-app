# Naturinex Functions Deployment Guide

## Pre-Deployment Checklist

### 1. Install Dependencies
```bash
cd naturinex-app/functions
npm install
```

### 2. Build TypeScript
```bash
npm run build
```

### 3. Test Locally (Optional)
```bash
npm run serve
```

## Deployment Steps

### Option 1: Deploy via npm script
```bash
npm run deploy
```

### Option 2: Deploy specific functions
```bash
# Deploy only the main API
firebase deploy --only functions:api

# Deploy scheduled functions
firebase deploy --only functions:processOfflineQueue,functions:cleanupOldQueueItems,functions:sendScheduledEmails
```

### Option 3: Manual deployment if CLI fails
```bash
# Build the project
npm run build

# Copy the built files to a deployment folder
cp -r lib/ deploy-temp/
cp package.json deploy-temp/
cp package-lock.json deploy-temp/
cp .env deploy-temp/

# Create a deployment script
echo "firebase deploy --only functions" > deploy.sh
chmod +x deploy.sh
./deploy.sh
```

## Environment Variables

Ensure your `.env` file contains all required variables:
```env
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_51QeRqeIwUuNq64Np...
STRIPE_WEBHOOK_SECRET=whsec_0V6107GsHBfGlMEpTH1ooLyWXiVZIsr5

# Stripe Price IDs
STRIPE_PRICE_BASIC_MONTHLY=price_1Rn7erIwUuNq64Np5N2Up5TA
STRIPE_PRICE_PREMIUM_MONTHLY=price_1Rn7fFIwUuNq64NpPphsE4Cg
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1Rn7fpIwUuNq64Np6MJCQAx8
STRIPE_PRICE_BASIC_YEARLY=price_1Rn7j4IwUuNq64NpXTv3lkwU
STRIPE_PRICE_PREMIUM_YEARLY=price_1Rn7jbIwUuNq64NpooI9IPsF
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_1Rn7jwIwUuNq64NpDIgCKq2G

# Other configs
SUPPORT_EMAIL=support@naturinex.com
APP_URL=https://app.naturinex.com
```

## Firebase Configuration

Set Firebase config if needed:
```bash
firebase functions:config:set stripe.secret_key="sk_live_..."
firebase functions:config:set stripe.webhook_secret="whsec_..."
```

## Post-Deployment Verification

### 1. Check Health Endpoint
```bash
curl https://your-project.cloudfunctions.net/api/health
```

### 2. Verify Stripe Webhook
Go to Stripe Dashboard > Webhooks and send a test event

### 3. Monitor Logs
```bash
firebase functions:log --only api
```

## Troubleshooting

### Common Issues:

1. **TypeScript Errors**
   ```bash
   npm run build
   # Fix any TypeScript errors before deploying
   ```

2. **Missing Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Firebase CLI Issues**
   ```bash
   # Update Firebase tools
   npm install -g firebase-tools
   
   # Re-login
   firebase logout
   firebase login
   ```

4. **Memory/Timeout Issues**
   - Functions are configured with appropriate memory and timeout settings
   - Main API: 1GB memory, 300s timeout
   - Scheduled functions: 512MB memory

## Security Notes

1. **API Keys**: Never commit API keys to git
2. **CORS**: Currently allows all origins (`origin: true`). Restrict in production
3. **Rate Limiting**: Configured for all endpoints
4. **Privacy Consent**: Required for most endpoints
5. **Request Logging**: All requests are logged for debugging

## Monitoring

1. **Firebase Console**: Monitor function executions
2. **Firestore**: Check these collections for logs:
   - `api_logs` - All API requests
   - `error_logs` - Error tracking
   - `security_logs` - Security events
   - `privacy_logs` - Privacy-related events
   - `queue_logs` - Offline queue activity

## Beta Testing Features

The following features are enabled for beta testing:
- Comprehensive request/response logging
- Beta feedback system
- Error tracking and crash reporting
- Offline queue for reliability
- Medical disclaimer enforcement
- Privacy consent management

## Production Readiness

Before going to production:
1. Review and restrict CORS settings
2. Add authentication for admin endpoints
3. Set up monitoring alerts
4. Configure backup strategies
5. Review rate limits
6. Set up CDN for static assets
7. Enable Cloud Armor for DDoS protection