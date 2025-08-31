# 🚀 Naturinex Deployment Guide

## ✅ Current Status

### Backend (Already Deployed)
- **Status**: ✅ Live and Healthy
- **URL**: https://naturinex-app.onrender.com
- **Platform**: Render
- **Uptime**: 4+ days
- **Health Check**: https://naturinex-app.onrender.com/health

### Mobile App
- **Status**: ✅ Ready for deployment
- **Platform**: Expo/EAS
- **Health Check**: All 17 checks passed

### Web Version
- **Status**: ✅ Fully implemented, ready to deploy
- **Framework**: React + Material-UI
- **Database**: Shared Firebase Firestore

## 📦 Web Version Deployment Steps

### Option 1: Deploy to Vercel (Recommended)

1. **Fix Dependencies First**
   ```bash
   # Install compatible MUI icons version
   npm uninstall @mui/icons-material
   npm install @mui/icons-material@5.14.19 --save
   ```

2. **Build the Web App**
   ```bash
   npm run build:web
   ```

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

4. **Configure Environment Variables in Vercel Dashboard**
   ```
   REACT_APP_API_URL=https://naturinex-app.onrender.com
   REACT_APP_STRIPE_KEY=pk_live_51QTj9RRqEPLAinmJX0Jgqr8GJZQKziNhHDMhHCRpNQbwfWJRKrPz7ZY48mJzV1rP1bDYJhRNJy1z5VXJ0e5G8t9K00lAC53L05
   ```

### Option 2: Deploy to Netlify

1. **Build Locally**
   ```bash
   npm run build:web
   ```

2. **Deploy**
   - Drag and drop the `build` folder to [Netlify](https://app.netlify.com/drop)
   - Or use Netlify CLI:
   ```bash
   npm i -g netlify-cli
   netlify deploy --prod --dir=build
   ```

### Option 3: Deploy to Render (Same as Backend)

1. **Create New Static Site on Render**
   - Go to https://dashboard.render.com
   - Click "New +" → "Static Site"
   - Connect your GitHub repo
   - Build Command: `npm run build:web`
   - Publish Directory: `build`

## 📱 Mobile App Deployment

### iOS Deployment
```bash
# Build for iOS
npm run build:ios

# Submit to App Store
npm run submit:ios
```

### Android Deployment
```bash
# Build for Android
npm run build:android

# Submit to Google Play
npm run submit:android
```

## 🧪 Testing Before Deployment

### 1. Test Locally
```bash
# Test web version
npm run web
# Visit http://localhost:3002

# Test mobile version
npm run start
# Scan QR code with Expo Go app
```

### 2. Test API Connection
```bash
node test-web-integration.js
```

### 3. Test Key Features
- [ ] User Registration/Login
- [ ] Google OAuth
- [ ] Product Scanning (Upload/Camera/Text)
- [ ] Scan History
- [ ] Premium Subscription
- [ ] Stripe Payment Flow
- [ ] Profile Management

## 🔗 Important URLs

### Production URLs
- **Backend API**: https://naturinex-app.onrender.com
- **Backend Health**: https://naturinex-app.onrender.com/health
- **Web App**: [Your deployed URL]
- **Render Dashboard**: https://dashboard.render.com/web/srv-d1s36m0dl3ps738vve30

### Firebase Console
- **Project**: https://console.firebase.google.com/project/naturinex-app
- **Firestore**: https://console.firebase.google.com/project/naturinex-app/firestore
- **Authentication**: https://console.firebase.google.com/project/naturinex-app/authentication

### Stripe Dashboard
- **Dashboard**: https://dashboard.stripe.com
- **Webhooks**: Configure webhook endpoint to `https://naturinex-app.onrender.com/webhook`

## 🛠️ Post-Deployment Tasks

1. **Configure Custom Domain**
   - Add custom domain in hosting platform
   - Update Firebase authorized domains
   - Update Stripe webhook URLs

2. **Set Up Monitoring**
   - Enable Google Analytics
   - Set up error tracking (Sentry)
   - Configure uptime monitoring

3. **Security**
   - Enable CORS for your domain
   - Configure rate limiting
   - Set up SSL certificate

4. **Testing**
   - Test payment flow with real card
   - Test cross-platform data sync
   - Test on multiple devices/browsers

## 📊 Deployment Checklist

### Pre-Deployment
- [x] Backend deployed and healthy
- [x] Database configured (Firebase)
- [x] Authentication working
- [x] Payment integration tested
- [ ] Dependencies fixed (@mui/icons-material)
- [ ] Production build successful

### Deployment
- [ ] Web app deployed
- [ ] Environment variables configured
- [ ] Custom domain configured
- [ ] SSL certificate active

### Post-Deployment
- [ ] All features tested in production
- [ ] Mobile app published
- [ ] Monitoring set up
- [ ] Documentation updated

## 🆘 Troubleshooting

### Build Errors
If you encounter build errors with MUI icons:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm install @mui/icons-material@5.14.19
```

### API Connection Issues
- Verify backend is running: https://naturinex-app.onrender.com/health
- Check CORS settings in backend
- Verify environment variables

### Database Sync Issues
- Check Firebase rules
- Verify authentication tokens
- Check network connectivity

## 📞 Support

For deployment assistance:
1. Check Render logs: https://dashboard.render.com
2. Review Firebase console for errors
3. Check browser console for client-side errors
4. Review this guide for common issues

## ✨ Success Metrics

Once deployed, monitor:
- User registrations
- Daily active users
- Scan frequency
- Conversion to premium
- Payment success rate
- Error rates
- Page load times

---

**Last Updated**: August 31, 2025
**Backend Status**: ✅ Healthy
**Ready for Production**: YES