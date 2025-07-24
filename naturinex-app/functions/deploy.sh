#!/bin/bash

echo "🚀 Deploying Firebase Functions..."
echo "================================"

# Build the TypeScript code
echo "📦 Building TypeScript..."
npm run build

# Deploy to Firebase
echo "☁️ Deploying to Firebase (mediscan-b6252)..."
cd ..
firebase deploy --only functions --project mediscan-b6252 --force

echo ""
echo "✅ Deployment complete!"
echo "🔗 Your webhook endpoint is:"
echo "https://us-central1-mediscan-b6252.cloudfunctions.net/api/webhooks/stripe"