# MongoDB Atlas Setup Guide for Naturinex

## Step 1: Access Your Cluster

1. From your MongoDB Atlas dashboard, click on "Project 0" (or your project name)
2. You should see "1 Cluster" - click on it to access your cluster

## Step 2: Get Your Connection URI

1. In your cluster view, click the **"Connect"** button
2. Choose **"Connect your application"**
3. Select:
   - Driver: **Node.js**
   - Version: **4.1 or later**
4. You'll see a connection string like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 3: Create Database User

1. In the left sidebar, go to **"Database Access"** under Security
2. Click **"Add New Database User"**
3. Choose authentication method: **"Password"**
4. Set:
   - Username: `naturinex-admin` (or your preferred username)
   - Password: Create a strong password (save this!)
   - Database User Privileges: **"Atlas Admin"** or **"Read and write to any database"**
5. Click **"Add User"**

## Step 4: Configure Network Access

1. In the left sidebar, go to **"Network Access"** under Security
2. Click **"Add IP Address"**
3. For development: Click **"Add Current IP Address"**
4. For production (Render): Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Note: This is necessary for Render deployment
5. Click **"Confirm"**

## Step 5: Create Your Database

1. Go back to your cluster (click "Clusters" in sidebar)
2. Click **"Browse Collections"**
3. Click **"Add My Own Data"**
4. Create:
   - Database name: `naturinex`
   - Collection name: `naturalRemedies`
5. Click **"Create"**

## Step 6: Construct Your Connection URI

Replace the placeholders in your connection string:
```
mongodb+srv://naturinex-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/naturinex?retryWrites=true&w=majority
```

Note the `/naturinex` after the host - this specifies the database name.

## Step 7: Configure Environment Variables

### For Local Development (.env file)
Create or update `.env` in your project root:
```env
MONGODB_URI=mongodb+srv://naturinex-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/naturinex?retryWrites=true&w=majority
```

### For Render Deployment
1. Go to your Render dashboard
2. Select your web service
3. Go to **"Environment"** tab
4. Click **"Add Environment Variable"**
5. Add:
   - Key: `MONGODB_URI`
   - Value: Your complete connection string
6. Click **"Save Changes"**

## Step 8: Test Your Connection

Run this test script to verify your connection:

```javascript
// test-mongodb.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'your-connection-string-here');
    console.log('✅ MongoDB connected successfully!');
    
    // Test creating a document
    const TestModel = mongoose.model('Test', { name: String });
    const doc = await TestModel.create({ name: 'Connection Test' });
    console.log('✅ Test document created:', doc);
    
    // Clean up
    await TestModel.deleteOne({ _id: doc._id });
    console.log('✅ Test document deleted');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
}

testConnection();
```

Run with: `node test-mongodb.js`

## Step 9: Verify Routes Using MongoDB

Your app uses MongoDB in these key areas:

1. **Data Ingestion** (`/api/admin/ingest-data`)
   - Stores natural remedies from PubChem, WHO, MSKCC
   - Uses the `naturalRemedies` collection

2. **Natural Remedies Search** (`/api/natural-search`)
   - Queries the MongoDB database for alternatives
   - Falls back to Firestore if MongoDB fails

3. **Admin Analytics** (`/api/admin/analytics`)
   - Retrieves ingestion logs and remedy statistics

## Troubleshooting

### Common Issues:

1. **"Authentication failed"**
   - Double-check username and password
   - Ensure user has proper database access

2. **"Connection timeout"**
   - Check Network Access settings
   - Ensure IP whitelist includes your current IP or 0.0.0.0/0

3. **"Database not found"**
   - Verify database name in connection string
   - Create the database if it doesn't exist

### MongoDB Atlas Free Tier Limits:
- 512 MB storage
- Shared RAM
- Good for ~50,000 natural remedy documents

## Security Best Practices

1. **Never commit connection strings** to GitHub
2. Use environment variables for all credentials
3. For production, consider:
   - Restricting IP access to Render's IPs only
   - Using MongoDB connection string with specific database
   - Rotating passwords regularly
   - Setting up database-level authentication

## Next Steps

After setup:
1. Run the data ingestion to populate your database
2. Test the natural remedies search endpoint
3. Monitor usage in MongoDB Atlas dashboard
4. Set up alerts for approaching free tier limits