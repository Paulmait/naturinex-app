# 🔐 MongoDB Password Update Guide

## Step 1: Go to MongoDB Atlas
1. Visit https://cloud.mongodb.com
2. Sign in with your account
3. You should see your cluster: **NaturinexCluster**

## Step 2: Update Database User Password
1. Click on **"Database Access"** in the left sidebar
2. Find your user: **guampaul**
3. Click **"Edit"** button (pencil icon)
4. Click **"Edit Password"**
5. Either:
   - Enter a new password
   - Or click "Autogenerate Secure Password" (recommended)
6. **COPY THE PASSWORD** before clicking Update
7. Click **"Update User"**

## Step 3: Get Your Connection String
1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. You'll see a connection string like:
   ```
   mongodb+srv://guampaul:<password>@naturinexcluster.x31qguv.mongodb.net/?retryWrites=true&w=majority&appName=NaturinexCluster
   ```

## Step 4: Update Your .env File
Replace `<password>` with your new password:

### Current (broken):
```env
MONGODB_URI=mongodb+srv://guampaul:AeJGR5ssbQFeaP4w@naturinexcluster.x31qguv.mongodb.net/naturinex?retryWrites=true&w=majority&appName=NaturinexCluster
```

### Updated (with new password):
```env
MONGODB_URI=mongodb+srv://guampaul:YOUR_NEW_PASSWORD@naturinexcluster.x31qguv.mongodb.net/naturinex?retryWrites=true&w=majority&appName=NaturinexCluster
```

## Step 5: Test Connection
```bash
cd server
node test-mongodb-connection.js
```

## Step 6: Update on Render
1. Go to Render Dashboard
2. Environment tab
3. Update MONGODB_URI with the new connection string
4. Save Changes

## 🔍 Finding Your MongoDB URI Components:

Your current URI broken down:
- **Username**: guampaul
- **Password**: AeJGR5ssbQFeaP4w (this needs updating)
- **Cluster**: naturinexcluster.x31qguv.mongodb.net
- **Database**: naturinex
- **Options**: ?retryWrites=true&w=majority&appName=NaturinexCluster

## 💡 Pro Tips:
1. Use a strong password without special characters that need URL encoding
2. If password has special characters (@, #, etc.), URL encode them:
   - @ becomes %40
   - # becomes %23
   - $ becomes %24
3. Test locally before updating Render

## 🚨 If You Can't Remember MongoDB Login:
Check if you have access to the email used for MongoDB Atlas signup. You can reset your Atlas account password (different from database password) there.