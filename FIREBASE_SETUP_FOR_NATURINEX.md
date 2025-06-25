# 🔥 Firebase Project Update Guide for Naturinex

## 🎯 **CRITICAL: Firebase Project Setup Required**

Your application has been successfully rebranded to **Naturinex**, but you need to update your Firebase project settings to match.

## 📋 **OPTION 1: Update Existing Project (Recommended)**

### **Step 1: Update Project Settings**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your current project: `mediscan-b6252`
3. Click **Project Settings** (gear icon)
4. **Project Name**: Change to "Naturinex"
5. **Project ID**: Cannot be changed (keep `mediscan-b6252` or see Option 2)

### **Step 2: Update Authentication Domains**
1. Go to **Authentication** → **Settings** → **Authorized Domains**
2. Add your new domains:
   - `naturinex-b6252.firebaseapp.com` (if creating new project)
   - Your production domain (when ready)
3. Keep existing domains for now to avoid breaking the app

### **Step 3: Deploy Security Rules**
```bash
cd c:\Users\maito\mediscan-app
firebase deploy --only firestore:rules
```

## 📋 **OPTION 2: Create New Project (Clean Slate)**

### **Step 1: Create New Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Create a project**
3. **Project Name**: "Naturinex"
4. **Project ID**: Try `naturinex-b6252` (or closest available)
5. Enable Google Analytics (optional)

### **Step 2: Enable Services**
1. **Authentication**:
   - Enable Google Sign-in provider
   - Add authorized domains: `localhost`, your production domain

2. **Firestore Database**:
   - Create database in production mode
   - Deploy security rules: `firebase deploy --only firestore:rules`

3. **Hosting** (optional):
   - Enable Firebase Hosting for easy deployment

### **Step 3: Update App Configuration**
If you created a new project with different ID, update:
```javascript
// client/src/firebase.js
const firebaseConfig = {
  apiKey: "your-new-api-key",
  authDomain: "your-new-project-id.firebaseapp.com",
  projectId: "your-new-project-id",
  storageBucket: "your-new-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-new-app-id"
};
```

## 🧪 **TESTING CHECKLIST**

### **After Firebase Update**
- [ ] **Authentication**: Google sign-in works
- [ ] **Database**: User data saves correctly
- [ ] **Security Rules**: Only authenticated users can access data
- [ ] **Admin Access**: Your email can access analytics
- [ ] **All Branding**: Shows "Naturinex" throughout app

### **Test Commands**
```bash
# Install dependencies
cd c:\Users\maito\mediscan-app
npm install

# Start development servers
npm start

# Test in browser
# http://localhost:3000
```

## 🚀 **DEPLOYMENT READY**

Once Firebase is configured:

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting (optional)
firebase deploy

# Or deploy your way to your preferred hosting platform
```

## 📊 **WHAT'S BEEN UPDATED**

✅ **Application Code**: 100% rebranded to Naturinex  
✅ **Documentation**: All files updated  
✅ **Package Files**: Names and descriptions updated  
✅ **Security Rules**: Admin email updated  
✅ **Client Configuration**: Ready for new project ID  
✅ **HTML Meta Tags**: Title and description updated  
✅ **Component Text**: All user-facing text updated  

🔄 **Pending**: Firebase project configuration only

## 📞 **SUPPORT**

If you encounter issues:
1. **Firebase Console**: Check project settings and service status
2. **Browser Console**: Look for authentication or database errors
3. **Server Logs**: Check for API or configuration issues

**🎯 Your Naturinex app is 99% ready - just need Firebase project setup!**
