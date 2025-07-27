# Complete MongoDB Atlas Setup for Naturinex

## 1. Project Creation
✅ **Project Name:** Naturinex Wellness Guide
- Tags (optional but recommended):
  - `environment`: `production`
  - `app`: `naturinex`
  - `type`: `wellness`

## 2. Cluster Configuration
After creating the project:

### Choose Cloud Provider & Region:
- **Provider:** AWS (recommended)
- **Region:** Choose closest to your users (e.g., us-east-1)
- **Cluster Tier:** M0 Sandbox (FREE)

### Cluster Name:
- Name: `NaturinexCluster` (or keep default `Cluster0`)

## 3. Security Setup

### A. Database User Creation
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Configure:
   ```
   Username: naturinex-admin
   Password: [Generate secure password - SAVE THIS!]
   Built-in Role: Atlas Admin
   ```
4. Click **"Add User"**

### B. Network Access Configuration
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Add TWO entries:

   **For Local Development:**
   - Click "Add Current IP Address"
   - Description: "Local Development"

   **For Render Deployment:**
   - Click "Allow Access from Anywhere"
   - IP: `0.0.0.0/0`
   - Description: "Render Production"

## 4. Database Creation
1. Go to **Databases** → Your cluster → **"Browse Collections"**
2. Click **"Add My Own Data"**
3. Create:
   ```
   Database Name: naturinex
   Collection Name: naturalRemedies
   ```

## 5. Connection String Setup

### Get Your Connection String:
1. Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Select:
   - Driver: Node.js
   - Version: 4.1 or later
4. Copy the connection string

### Format Your Connection String:
```
mongodb+srv://naturinex-admin:<password>@cluster0.xxxxx.mongodb.net/naturinex?retryWrites=true&w=majority
```

Replace:
- `<password>` with your actual password
- Add `/naturinex` before the `?` to specify the database

## 6. Environment Configuration

### Local Development (.env file):
```env
MONGODB_URI=mongodb+srv://naturinex-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/naturinex?retryWrites=true&w=majority
```

### Render Deployment:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your web service
3. Go to **"Environment"** tab
4. Add environment variable:
   - **Key:** `MONGODB_URI`
   - **Value:** Your complete connection string
5. Save changes (will trigger redeploy)

## 7. Verification Steps

### A. Test Local Connection:
```bash
# In your project root
node test-mongodb.js
```

Expected output:
```
✅ MongoDB connected successfully!
✅ Test document created
✅ Test document deleted
✅ All tests passed!
```

### B. Verify Collections Created:
The following collections will be auto-created on first use:
- `naturalRemedies` - Stores scraped remedy data
- `ingestionLogs` - Tracks data ingestion history
- `users` - User profiles (if migrating from Firebase)

### C. Test API Endpoints:
```bash
# Test natural search (after deployment)
curl https://naturinex-app.onrender.com/api/natural-search \
  -H "Content-Type: application/json" \
  -d '{"medicationName": "aspirin"}'
```

## 8. Data Ingestion Setup

### Initial Data Population:
Once connected, you can populate the database:

1. **Test Ingestion (3 remedies):**
   ```bash
   curl https://naturinex-app.onrender.com/api/admin/test-ingestion \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

2. **Full Ingestion (all remedies):**
   ```bash
   curl https://naturinex-app.onrender.com/api/admin/ingest-data \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

## 9. Monitoring & Maintenance

### MongoDB Atlas Dashboard:
- **Metrics:** Monitor storage, connections, operations
- **Alerts:** Set up alerts for:
  - Storage approaching 512MB limit
  - High connection count
  - Slow queries

### Free Tier Limits:
- **Storage:** 512 MB
- **Connections:** 100 concurrent
- **Network:** 10GB/month transfer

### When to Upgrade:
- Storage exceeds 400MB
- Need backup/restore features
- Require dedicated resources
- Need advanced security features

## 10. Security Best Practices

1. **Credentials:**
   - Never commit MongoDB URI to git
   - Rotate passwords quarterly
   - Use strong, unique passwords

2. **Access Control:**
   - Limit database user permissions
   - Use read-only users where possible
   - Enable 2FA on Atlas account

3. **Monitoring:**
   - Enable audit logs (paid tier)
   - Monitor failed authentication attempts
   - Set up email alerts for suspicious activity

## Troubleshooting Common Issues

### "Authentication Failed"
- Verify username/password
- Check user exists in Database Access
- Ensure password doesn't contain special characters that need URL encoding

### "Network Timeout"
- Check Network Access includes your IP or 0.0.0.0/0
- Verify cluster is not paused
- Check internet connectivity

### "Database not found"
- Ensure `/naturinex` is in connection string
- Create database manually if needed
- Check spelling and case sensitivity

### "Quota Exceeded"
- Check storage usage in Atlas dashboard
- Delete old ingestion logs
- Consider upgrading to M10 tier

## Next Steps After Setup

1. ✅ Verify MongoDB connection works locally
2. ✅ Update Render environment variables
3. ✅ Deploy and check server logs
4. ✅ Test natural remedy search endpoint
5. ✅ Run initial data ingestion
6. ✅ Set up monitoring alerts

## Support Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Node.js Driver Docs](https://docs.mongodb.com/drivers/node/)
- [Connection Troubleshooting](https://docs.atlas.mongodb.com/troubleshoot-connection/)
- [Free Tier FAQ](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/)