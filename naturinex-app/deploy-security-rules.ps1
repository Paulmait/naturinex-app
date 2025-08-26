# 🚀 Quick Security Rules Deployment Script

Write-Host "🔒 Deploying Firebase Security Rules..." -ForegroundColor Yellow

# Check if Firebase CLI is installed
try {
    firebase --version | Out-Null
    Write-Host "✅ Firebase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Firebase CLI not found. Installing..." -ForegroundColor Red
    npm install -g firebase-tools
}

# Login to Firebase (if not already logged in)
Write-Host "🔑 Checking Firebase authentication..." -ForegroundColor Yellow
firebase login --no-localhost

# Deploy security rules
Write-Host "📤 Deploying Firestore security rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

Write-Host "✅ Security rules deployed successfully!" -ForegroundColor Green
Write-Host "🛡️ Your database is now protected!" -ForegroundColor Green

# Test the deployment
Write-Host "🧪 Testing security rules..." -ForegroundColor Yellow
Write-Host "Please test your application to ensure everything works correctly." -ForegroundColor Cyan
Write-Host "Check Firebase Console > Firestore Database > Rules to verify deployment." -ForegroundColor Cyan
