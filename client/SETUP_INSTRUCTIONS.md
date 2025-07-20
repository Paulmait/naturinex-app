# Naturinex React Native App Setup Instructions

## Overview
This is a refactored React Native app for Naturinex that works with Expo Go for iPhone testing. The app provides medication scanning and natural alternative analysis.

## Prerequisites
- Node.js (v16 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- Expo Go app installed on your iPhone
- Firebase project configured

## Environment Setup

### 1. Firebase Configuration
Create a `.env` file in the `client` directory with your Firebase credentials:

```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 2. Google OAuth Setup
Update the `app.json` file with your Google OAuth client IDs:

```json
"extra": {
  "googleExpoClientId": "your_expo_client_id",
  "googleIosClientId": "your_ios_client_id",
  "googleAndroidClientId": "your_android_client_id"
}
```

### 3. Install Dependencies
```bash
cd client
npm install
```

## Running the App

### 1. Start the Development Server
```bash
npm start
```

### 2. Connect with Expo Go
- Open Expo Go on your iPhone
- Scan the QR code displayed in the terminal
- The app will load on your iPhone

## App Features

### Authentication
- Email/password login
- Google OAuth integration
- Secure token storage

### Core Features
- **Home Screen**: Dashboard with scan statistics and quick actions
- **Camera Screen**: Medication scanning with camera or image upload
- **Analysis Screen**: Detailed results with natural alternatives
- **Profile Screen**: User settings and subscription management
- **Subscription Screen**: Premium upgrade options
- **Onboarding**: New user tutorial

### Security Features
- Secure token storage with Expo SecureStore
- Auto-logout functionality
- Privacy-focused design
- HIPAA-compliant data handling

## Testing Checklist

### Authentication Flow
- [ ] Email/password login works
- [ ] Google OAuth works (if configured)
- [ ] Logout functionality works
- [ ] Onboarding shows for new users

### Core Functionality
- [ ] Camera permissions work
- [ ] Image capture and upload works
- [ ] Analysis results display correctly
- [ ] Navigation between screens works

### Premium Features
- [ ] Subscription screen loads
- [ ] Premium status updates correctly
- [ ] Scan limits work for free tier

### Settings
- [ ] Profile screen displays user info
- [ ] Settings toggles work
- [ ] Clear history functionality works

## Troubleshooting

### Common Issues

1. **Firebase not configured**
   - Ensure all Firebase environment variables are set
   - Check Firebase project settings

2. **Camera not working**
   - Ensure camera permissions are granted
   - Check app.json camera configuration

3. **Google OAuth not working**
   - Verify Google OAuth client IDs in app.json
   - Check Google Cloud Console configuration

4. **App crashes on startup**
   - Clear Expo Go cache
   - Restart development server
   - Check console for error messages

### Development Tips

1. **Hot Reload**: Changes will automatically reload in Expo Go
2. **Debugging**: Use React Native Debugger or Chrome DevTools
3. **Performance**: Monitor app performance in Expo Go
4. **Testing**: Test on both iPhone and iPad for responsive design

## Security Notes

- All sensitive data is stored using Expo SecureStore
- API calls use HTTPS
- User data is encrypted in transit
- App follows privacy best practices

## Next Steps

1. Configure Firebase project
2. Set up Google OAuth
3. Test all features on iPhone
4. Deploy to App Store (when ready)

## Support

For issues or questions:
- Check Expo documentation
- Review Firebase setup guides
- Test with different iPhone models 