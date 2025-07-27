# Database Setup Guide for Naturinex

## MongoDB Setup (Recommended)

### Why MongoDB?
- **Flexible Schema**: Perfect for varied natural remedy data
- **JSON Native**: Direct storage of API responses
- **Scalable**: Handles millions of remedy records
- **AI-Friendly**: Easy storage of embeddings and complex data

### Local Development Setup

1. **Install MongoDB Community Edition**
   - Windows: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Mac: `brew install mongodb-community`
   - Linux: Follow MongoDB docs

2. **Start MongoDB**
   ```bash
   # Windows
   mongod --dbpath C:\data\db

   # Mac/Linux
   mongod --dbpath /usr/local/var/mongodb
   ```

3. **Environment Variable**
   ```bash
   # .env file
   MONGODB_URI=mongodb://localhost:27017/naturinex
   ```

### Production Setup (MongoDB Atlas)

1. **Create Free Cluster**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create free M0 cluster
   - Choose closest region

2. **Get Connection String**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/naturinex
   ```

3. **Add to Render**
   - Add `MONGODB_URI` environment variable
   - Use connection string from Atlas

### Data Structure

```javascript
{
  // Natural Remedy Document
  name: "Turmeric",
  scientificName: "Curcuma longa",
  category: "herb",
  dataSources: [
    { name: "PubChem", sourceId: "5280805", reliability: 95 },
    { name: "WHO", reliability: 100 },
    { name: "MSKCC", reliability: 95 }
  ],
  safety: {
    generalSafety: "safe",
    validationScore: 85,
    sideEffects: [...],
    contraindications: [...]
  },
  conditions: [
    { 
      name: "inflammation", 
      effectiveness: "proven",
      evidence: { studies: 45, quality: "high" }
    }
  ]
}
```

## Firestore (Already Set Up)

Used for:
- User accounts
- Scan history
- Quick access cache
- Real-time updates

## Dual Database Architecture

```
MongoDB (Primary Storage)
  ↓
  Nightly Ingestion
  ↓
  AI Validation
  ↓
Firestore (Quick Access)
  ↓
  Mobile App
```

## Security Configuration

### MongoDB Security
```javascript
// Connection with auth
MONGODB_URI=mongodb+srv://naturinex-user:secure-password@cluster.mongodb.net/naturinex?retryWrites=true&w=majority

// IP Whitelist
- Add Render IPs
- Add development IPs
```

### Firestore Rules (Already configured)
- User data isolation
- Read/write permissions
- Rate limiting

## Testing the Setup

1. **Run Test Script**
   ```bash
   cd server
   node testDataIngestion.js
   ```

2. **Check MongoDB**
   - Use MongoDB Compass
   - Connect to your database
   - View `naturalremedies` collection

3. **Verify Firestore Sync**
   - Check Firebase Console
   - Look for `naturalRemedies` collection

## Performance Optimization

- **Indexes**: Created on common queries
- **Caching**: Firestore acts as cache layer
- **Batch Operations**: Bulk writes for efficiency
- **Connection Pooling**: Automatic with MongoDB driver

## Monitoring

- MongoDB Atlas provides free monitoring
- Track query performance
- Set up alerts for errors
- Monitor storage usage

Your database is now optimized for safe, reliable natural remedy data!