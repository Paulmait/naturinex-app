# Production Deployment Guide for Naturinex App

## Overview
This guide covers deploying the Naturinex app to production with separate deployments for:
- **Backend API**: Express server (Vercel/Render)
- **Mobile App**: React Native/Expo (App Store/Google Play)

## 🚀 Quick Deployment Steps

### 1. Backend API Deployment (Vercel)

#### Prerequisites
- Vercel account
- All environment variables ready

#### Steps
1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**:
   - Copy `server/env.example` to `server/.env`
   - Fill in all required values:
     ```
     GOOGLE_AI_API_KEY=your_gemini_api_key
     STRIPE_SECRET_KEY=your_stripe_secret_key
     STRIPE_WEBHOOK_SECRET=your_webhook_secret
     FIREBASE_SERVICE_ACCOUNT_KEY=your_firebase_service_account_json
     ```

3. **Deploy to Vercel**:
   ```bash
   cd naturinex-app
   vercel
   ```

4. **Set Production Environment Variables**:
   ```bash
   vercel env add GOOGLE_AI_API_KEY production
   vercel env add STRIPE_SECRET_KEY production
   vercel env add STRIPE_WEBHOOK_SECRET production
   vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
   ```

5. **Update API URL in App**:
   - Update `app.json` extra.apiUrl with your Vercel deployment URL

### 2. Mobile App Deployment

#### iOS App Store

1. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

2. **Submit to App Store**:
   ```bash
   eas submit -p ios
   ```

#### Google Play Store

1. **Build for Android**:
   ```bash
   eas build --platform android
   ```

2. **Submit to Google Play**:
   ```bash
   eas submit -p android
   ```

## 📋 Pre-Deployment Checklist

### Backend
- [ ] All environment variables configured
- [ ] Firebase service account configured
- [ ] Stripe webhook endpoint configured
- [ ] API rate limiting configured
- [ ] CORS settings updated for production

### Mobile App
- [ ] Remove placeholder API keys from app.json
- [ ] Update bundle identifiers
- [ ] App icons and splash screens ready
- [ ] Privacy policy and terms URLs updated
- [ ] EAS Build configured

### Security
- [ ] Firebase security rules deployed
- [ ] API authentication enabled
- [ ] Sensitive data removed from source
- [ ] SSL certificates configured

## 🔧 Configuration Files

### Server Environment Variables
Create `server/.env` with:
```env
PORT=3000
NODE_ENV=production
GOOGLE_AI_API_KEY=your_key_here
STRIPE_SECRET_KEY=your_key_here
STRIPE_WEBHOOK_SECRET=your_webhook_secret
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### App Configuration
Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://your-api-domain.vercel.app",
      "stripePublishableKey": "pk_live_your_key",
      // Remove placeholder Firebase keys
    }
  }
}
```

## 🚨 Important Notes

1. **API Keys**: Never commit real API keys to source control
2. **Firebase**: Ensure Firebase project is properly configured with:
   - Authentication enabled
   - Firestore database created
   - Security rules deployed
3. **Stripe**: Configure webhook endpoint in Stripe dashboard
4. **Testing**: Test thoroughly in production environment before launch

## 📱 Post-Deployment

1. **Monitor API**: Check Vercel dashboard for errors
2. **Test Payments**: Verify Stripe integration works
3. **Check Analytics**: Ensure Firebase Analytics is tracking
4. **User Testing**: Have beta users test the production app

## 🆘 Troubleshooting

### API Not Responding
- Check Vercel logs
- Verify environment variables
- Test API endpoints manually

### App Crashes
- Check Firebase configuration
- Verify API URL is correct
- Review crash reports in app stores

### Payment Issues
- Verify Stripe keys
- Check webhook configuration
- Review Stripe logs

## 📞 Support
For deployment issues, check:
- Vercel documentation
- Expo EAS Build docs
- Firebase console
- Stripe dashboard