/**
 * User Data Controller
 * Implements privacy best practices and user data rights
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const DataPrivacyManager = require('./data-privacy-manager');

const privacyManager = new DataPrivacyManager();

/**
 * Middleware to verify user authentication
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

/**
 * GET /api/privacy/status
 * Get user's privacy settings and data status
 */
router.get('/privacy/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    
    // Get privacy settings
    const privacyDoc = await db.collection('privacy').doc(userId).get();
    const privacySettings = privacyDoc.exists ? privacyDoc.data() : {
      dataCollection: true,
      analytics: true,
      marketing: false,
      thirdPartySharing: false,
      retentionPeriod: 30,
      autoDelete: true
    };
    
    // Get data statistics
    const scansCount = await db.collection('scans')
      .where('userId', '==', userId)
      .count()
      .get();
    
    const userData = await db.collection('userData')
      .where('userId', '==', userId)
      .count()
      .get();
    
    // Calculate data size
    const storageStats = await calculateUserStorage(userId);
    
    res.json({
      privacySettings,
      dataStatus: {
        totalScans: scansCount.data().count,
        totalRecords: userData.data().count,
        storageUsed: storageStats.totalSize,
        oldestData: storageStats.oldestDate,
        nextDeletion: calculateNextDeletion(privacySettings.retentionPeriod)
      },
      rights: {
        canExport: true,
        canDelete: true,
        canModify: true,
        canOptOut: true
      }
    });
  } catch (error) {
    console.error('Privacy status error:', error);
    res.status(500).json({ error: 'Failed to get privacy status' });
  }
});

/**
 * PUT /api/privacy/settings
 * Update privacy settings
 */
router.put('/privacy/settings', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const settings = req.body;
    
    // Validate settings
    const validSettings = {
      dataCollection: typeof settings.dataCollection === 'boolean' ? settings.dataCollection : true,
      analytics: typeof settings.analytics === 'boolean' ? settings.analytics : true,
      marketing: typeof settings.marketing === 'boolean' ? settings.marketing : false,
      thirdPartySharing: false, // Always false - we don't share with third parties
      retentionPeriod: [7, 14, 30, 60, 90].includes(settings.retentionPeriod) ? settings.retentionPeriod : 30,
      autoDelete: typeof settings.autoDelete === 'boolean' ? settings.autoDelete : true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await privacyManager.updatePrivacySettings(userId, validSettings);
    
    // If retention period changed, update existing data expiration
    if (settings.retentionPeriod) {
      await updateDataExpiration(userId, settings.retentionPeriod);
    }
    
    res.json({
      success: true,
      message: 'Privacy settings updated',
      settings: validSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

/**
 * GET /api/privacy/export
 * Export all user data (GDPR compliance)
 */
router.get('/privacy/export', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    
    // Get all user data
    const userData = await privacyManager.exportUserData(userId);
    
    // Add export metadata
    userData.exportMetadata = {
      exportDate: new Date().toISOString(),
      userId: userId,
      format: 'JSON',
      dataCategories: Object.keys(userData),
      privacyPolicy: 'https://naturinex.com/privacy',
      dataRetention: '30 days from collection',
      contactEmail: 'privacy@naturinex.com'
    };
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="naturinex-data-export-${Date.now()}.json"`);
    
    res.json(userData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

/**
 * DELETE /api/privacy/account
 * Delete user account and all data (Right to be Forgotten)
 */
router.delete('/privacy/account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { confirmation, reason } = req.body;
    
    // Require explicit confirmation
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        error: 'Please confirm account deletion',
        confirmationRequired: 'DELETE_MY_ACCOUNT'
      });
    }
    
    // Log deletion request
    await logDeletionRequest(userId, reason);
    
    // Delete all user data
    const result = await privacyManager.deleteUserData(userId, {
      keepAccount: false // Delete everything
    });
    
    // Delete Firebase Auth account
    await admin.auth().deleteUser(userId);
    
    res.json({
      success: true,
      message: 'Your account and all data have been permanently deleted',
      deletionReceipt: {
        userId: userId,
        deletedAt: new Date().toISOString(),
        recordsDeleted: result.deletedRecords,
        confirmationCode: generateDeletionConfirmationCode(userId)
      }
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * DELETE /api/privacy/data/:category
 * Delete specific category of user data
 */
router.delete('/privacy/data/:category', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const category = req.params.category;
    
    const allowedCategories = ['scans', 'analytics', 'preferences'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid data category' });
    }
    
    const db = admin.firestore();
    let deletedCount = 0;
    
    switch (category) {
      case 'scans':
        // Delete all scan history
        const scans = await db.collection('scans')
          .where('userId', '==', userId)
          .get();
        
        const batch = db.batch();
        scans.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
        await batch.commit();
        break;
        
      case 'analytics':
        // Delete analytics data
        const analytics = await db.collection('analytics')
          .where('userId', '==', userId)
          .get();
        
        const analyticsBatch = db.batch();
        analytics.forEach(doc => {
          analyticsBatch.delete(doc.ref);
          deletedCount++;
        });
        await analyticsBatch.commit();
        break;
        
      case 'preferences':
        // Reset preferences to defaults
        await db.collection('users').doc(userId).update({
          preferences: {},
          settings: {}
        });
        deletedCount = 1;
        break;
    }
    
    res.json({
      success: true,
      category: category,
      recordsDeleted: deletedCount,
      message: `${category} data has been deleted`
    });
  } catch (error) {
    console.error('Data deletion error:', error);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

/**
 * GET /api/privacy/report
 * Get privacy compliance report
 */
router.get('/privacy/report', requireAuth, async (req, res) => {
  try {
    const userId = req.user.uid;
    const db = admin.firestore();
    
    // Get all data access logs
    const accessLogs = await db.collection('auditLogs')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const logs = [];
    accessLogs.forEach(doc => {
      logs.push(doc.data());
    });
    
    // Get data processing information
    const report = {
      userId: userId,
      generatedAt: new Date().toISOString(),
      dataProcessing: {
        purposes: [
          'Providing medication analysis services',
          'Improving app functionality',
          'Ensuring safety and security',
          'Legal compliance'
        ],
        legalBasis: 'User consent and legitimate interests',
        dataCategories: [
          'Account information',
          'Medication searches',
          'App usage data',
          'Device information'
        ],
        retention: {
          images: 'Deleted immediately after processing',
          scans: '30 days',
          account: 'Until deletion requested',
          analytics: '90 days (anonymized)'
        },
        thirdParties: [
          {
            name: 'Firebase (Google)',
            purpose: 'Authentication and database',
            dataShared: 'Account data, app usage'
          },
          {
            name: 'Stripe',
            purpose: 'Payment processing',
            dataShared: 'Payment information only (no health data)'
          }
        ]
      },
      userRights: {
        access: 'You can access all your data through the app',
        rectification: 'You can update your information in Settings',
        erasure: 'You can delete your account and all data',
        portability: 'You can export your data in JSON format',
        objection: 'You can opt-out of data collection',
        restriction: 'You can limit how we process your data'
      },
      accessHistory: logs,
      contact: {
        dpo: 'privacy@naturinex.com',
        company: 'Naturinex Wellness Guide',
        responseTime: '48 hours'
      }
    };
    
    res.json(report);
  } catch (error) {
    console.error('Privacy report error:', error);
    res.status(500).json({ error: 'Failed to generate privacy report' });
  }
});

/**
 * Helper Functions
 */

async function calculateUserStorage(userId) {
  const db = admin.firestore();
  let totalSize = 0;
  let oldestDate = new Date();
  
  // Calculate approximate storage size
  const collections = ['scans', 'userData', 'analytics'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection)
      .where('userId', '==', userId)
      .get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      // Rough estimate: 1 character = 1 byte
      totalSize += JSON.stringify(data).length;
      
      if (data.timestamp?.toDate() < oldestDate) {
        oldestDate = data.timestamp.toDate();
      }
    });
  }
  
  return {
    totalSize: formatBytes(totalSize),
    oldestDate: oldestDate.toISOString()
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function calculateNextDeletion(retentionDays) {
  const date = new Date();
  date.setDate(date.getDate() + retentionDays);
  return date.toISOString();
}

async function updateDataExpiration(userId, retentionDays) {
  const db = admin.firestore();
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + retentionDays);
  
  // Update scans expiration
  const scans = await db.collection('scans')
    .where('userId', '==', userId)
    .get();
  
  const batch = db.batch();
  scans.forEach(doc => {
    batch.update(doc.ref, {
      expiresAt: expirationDate
    });
  });
  
  await batch.commit();
}

async function logDeletionRequest(userId, reason) {
  const db = admin.firestore();
  await db.collection('deletionRequests').add({
    userId,
    reason: reason || 'User requested',
    requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'processing'
  });
}

function generateDeletionConfirmationCode(userId) {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(userId + Date.now())
    .digest('hex')
    .substring(0, 16)
    .toUpperCase();
}

module.exports = router;