# 🚀 Google Cloud Setup Guide for Naturinex

## Overview
This guide will help you set up Google Cloud services for Naturinex's data ingestion architecture. You can skip this if you're not ready to implement the advanced features yet.

## 📋 What You'll Need

### 1. **Google Cloud Account**
- Sign up at: https://cloud.google.com
- New users get $300 free credits (plenty for testing)
- Credit card required but won't be charged during free trial

### 2. **Project Setup Information**
When creating your Google Cloud project, you'll need:

```yaml
Project Name: naturinex-app
Project ID: naturinex-app-[random-suffix]  # Must be globally unique
Billing Account: Your billing account
Location: us-central1  # Or your preferred region
```

## 🔧 Step-by-Step Setup

### Step 1: Create Google Cloud Project
```bash
# Install Google Cloud CLI first
# Download from: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Create new project
gcloud projects create naturinex-app-prod --name="Naturinex Production"

# Set as default project
gcloud config set project naturinex-app-prod
```

### Step 2: Enable Required APIs
```bash
# Enable all necessary APIs
gcloud services enable firestore.googleapis.com
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudtasks.googleapis.com
gcloud services enable cloudscheduler.googleapis.com
gcloud services enable storage.googleapis.com
```

### Step 3: Set Up Firestore Database
```bash
# Create Firestore database
gcloud firestore databases create --location=us-central1

# The database will be created with default settings
# You can manage it at: https://console.cloud.google.com/firestore
```

### Step 4: Create Service Account for API Access
```bash
# Create service account
gcloud iam service-accounts create naturinex-service \
    --display-name="Naturinex Service Account"

# Download credentials
gcloud iam service-accounts keys create naturinex-service-key.json \
    --iam-account=naturinex-service@naturinex-app-prod.iam.gserviceaccount.com

# IMPORTANT: Keep this file secure! Add to .gitignore
```

### Step 5: Set Up Cloud Tasks Queue
```bash
# Create the queue for substance ingestion
gcloud tasks queues create substance-ingestion \
    --location=us-central1 \
    --max-dispatches-per-second=10 \
    --max-concurrent-dispatches=100 \
    --max-attempts=3 \
    --min-backoff=10s
```

### Step 6: Deploy Cloud Functions (Optional - For Data Ingestion)
```bash
# Deploy the ingestion function
gcloud functions deploy ingestSubstance \
    --runtime nodejs18 \
    --trigger-http \
    --entry-point handleIngestionTask \
    --source ./server/functions \
    --set-env-vars PUBCHEM_API_KEY=your_key,WHO_API_KEY=your_key
```

## 🔑 Environment Variables Needed

### For Your Server (.env file)
```env
# Google Cloud
GOOGLE_CLOUD_PROJECT=naturinex-app-prod
GOOGLE_APPLICATION_CREDENTIALS=./naturinex-service-key.json

# Cloud Tasks (if using)
CLOUD_TASKS_LOCATION=us-central1
CLOUD_TASKS_QUEUE=substance-ingestion
CLOUD_TASKS_SERVICE_KEY=your_generated_key

# External APIs (optional)
PUBCHEM_API_KEY=not_required_for_public_api
WHO_API_KEY=contact_who_for_access
MSKCC_API_KEY=not_required_for_public_data

# Firebase Admin SDK
FIREBASE_ADMIN_SDK_KEY=./path/to/firebase-adminsdk.json
```

## 💰 Cost Estimates

### Free Tier Limits (Monthly)
- **Firestore**: 
  - 1GB storage
  - 50,000 reads/day
  - 20,000 writes/day
- **Cloud Functions**: 
  - 2 million invocations
  - 400,000 GB-seconds
- **Cloud Tasks**: 
  - 1 million operations

### Estimated Monthly Costs (After Free Tier)
- Small app (1,000 users): ~$10-20/month
- Medium app (10,000 users): ~$50-100/month
- Large app (100,000 users): ~$200-500/month

## 🚦 Quick Start (Without Google Cloud)

If you're not ready for Google Cloud, you can still use Naturinex with:

1. **Basic Mode** (Current Setup)
   - Real-time API calls
   - Local caching with node-cache
   - Works fine for < 1,000 users/day

2. **Firebase Only Mode**
   - Use Firebase Firestore for data storage
   - Manual data updates via admin panel
   - Good for < 10,000 users/day

## 📊 When to Upgrade to Full Architecture

Consider implementing the full Google Cloud architecture when:
- You have > 1,000 daily active users
- Response times become slow
- API costs exceed $50/month
- You need scheduled data updates
- You want offline functionality

## 🛠️ Simplified Setup for Now

For immediate deployment without Google Cloud:

1. **Keep using current setup**
   - The app works fine without Cloud Tasks
   - External APIs are called on-demand
   - Data is cached for 24 hours

2. **Environment variables you need NOW**:
```env
# Required
NODE_ENV=production
PORT=5000
JWT_SECRET=your_secret_key_here

# Firebase (you already have these)
FIREBASE_API_KEY=your_key
FIREBASE_AUTH_DOMAIN=your_domain
FIREBASE_PROJECT_ID=your_project

# Stripe (you already have these)
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_secret

# APIs (optional - app works without them)
GEMINI_API_KEY=your_key
GOOGLE_VISION_API_KEY=your_key
```

## 📞 Support

### Google Cloud Support
- Documentation: https://cloud.google.com/docs
- Community: https://stackoverflow.com/questions/tagged/google-cloud-platform
- Support: https://cloud.google.com/support

### Naturinex Specific
- Email: support@naturinex.com
- GitHub: https://github.com/naturinex/issues

## 🎯 Next Steps

1. **For Now**: Deploy with current setup (works great!)
2. **Later**: When you have > 1,000 users, implement Cloud Tasks
3. **Future**: Add Cloud Scheduler for automated updates

---

**Note**: The app works perfectly fine without Google Cloud! These are optional enhancements for scaling.

**Last Updated**: January 2024
**Version**: 1.0