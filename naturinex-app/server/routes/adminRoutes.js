const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { verifyAdmin, rateLimit, securityHeaders } = require('../middleware/adminAuth');
const { body, validationResult } = require('express-validator');

// Apply security to all admin routes
router.use(securityHeaders);
router.use(verifyAdmin);
router.use(rateLimit);

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const db = admin.firestore();
    
    // Get various statistics
    const [users, scans, subscriptions] = await Promise.all([
      db.collection('users').get(),
      db.collection('scanHistory').get(),
      db.collection('users').where('isPremium', '==', true).get()
    ]);
    
    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayScans = await db.collection('scanHistory')
      .where('timestamp', '>=', today)
      .get();
    
    res.json({
      stats: {
        totalUsers: users.size,
        totalScans: scans.size,
        premiumUsers: subscriptions.size,
        todayScans: todayScans.size,
        conversionRate: ((subscriptions.size / users.size) * 100).toFixed(2) + '%'
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// View and edit scan history (for AI training data)
router.get('/scans', async (req, res) => {
  try {
    const { limit = 100, startAfter, userId, dateFrom, dateTo } = req.query;
    const db = admin.firestore();
    
    let query = db.collection('scanHistory')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));
    
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    
    if (dateFrom) {
      query = query.where('timestamp', '>=', new Date(dateFrom));
    }
    
    if (dateTo) {
      query = query.where('timestamp', '<=', new Date(dateTo));
    }
    
    if (startAfter) {
      const lastDoc = await db.collection('scanHistory').doc(startAfter).get();
      query = query.startAfter(lastDoc);
    }
    
    const scans = await query.get();
    
    res.json({
      scans: scans.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })),
      hasMore: scans.size === parseInt(limit)
    });
  } catch (error) {
    console.error('Scans fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch scans' });
  }
});

// Update scan data (for corrections/training)
router.patch('/scans/:scanId', [
  body('productInfo.name').optional().isString(),
  body('productInfo.activeIngredient').optional().isString(),
  body('aiTrainingData.userFeedback').optional().isString(),
  body('aiTrainingData.correctedData').optional().isObject()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { scanId } = req.params;
    const updates = req.body;
    
    // Add audit trail
    updates.lastModified = {
      by: req.admin.uid,
      at: admin.firestore.FieldValue.serverTimestamp(),
      reason: updates.modificationReason || 'Data correction'
    };
    
    await admin.firestore()
      .collection('scanHistory')
      .doc(scanId)
      .update(updates);
    
    res.json({ success: true, message: 'Scan updated successfully' });
  } catch (error) {
    console.error('Scan update error:', error);
    res.status(500).json({ error: 'Failed to update scan' });
  }
});

// Manage natural alternatives database
router.get('/alternatives/:medication', async (req, res) => {
  try {
    const { medication } = req.params;
    const db = admin.firestore();
    
    const altDoc = await db.collection('naturalAlternatives')
      .doc(medication.toLowerCase())
      .get();
    
    if (!altDoc.exists) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    res.json(altDoc.data());
  } catch (error) {
    console.error('Alternatives fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alternatives' });
  }
});

// Update natural alternatives
router.put('/alternatives/:medication', [
  body('alternatives').isArray(),
  body('alternatives.*.name').notEmpty(),
  body('alternatives.*.effectiveness').isIn(['High', 'Moderate', 'Low']),
  body('alternatives.*.description').notEmpty(),
  body('alternatives.*.benefits').isArray(),
  body('alternatives.*.precautions').isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { medication } = req.params;
    const data = req.body;
    
    // Add metadata
    data.lastUpdated = admin.firestore.FieldValue.serverTimestamp();
    data.updatedBy = req.admin.uid;
    
    await admin.firestore()
      .collection('naturalAlternatives')
      .doc(medication.toLowerCase())
      .set(data, { merge: true });
    
    res.json({ success: true, message: 'Alternatives updated successfully' });
  } catch (error) {
    console.error('Alternatives update error:', error);
    res.status(500).json({ error: 'Failed to update alternatives' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { limit = 50, startAfter, isPremium } = req.query;
    const db = admin.firestore();
    
    let query = db.collection('users')
      .orderBy('metadata.createdAt', 'desc')
      .limit(parseInt(limit));
    
    if (isPremium !== undefined) {
      query = query.where('isPremium', '==', isPremium === 'true');
    }
    
    if (startAfter) {
      const lastDoc = await db.collection('users').doc(startAfter).get();
      query = query.startAfter(lastDoc);
    }
    
    const users = await query.get();
    
    res.json({
      users: users.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Don't send sensitive data
        password: undefined,
        stripeCustomerId: undefined
      })),
      hasMore: users.size === parseInt(limit)
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Export AI training data
router.get('/export/training-data', async (req, res) => {
  try {
    const { format = 'json', dateFrom, dateTo } = req.query;
    const db = admin.firestore();
    
    let query = db.collection('scanHistory');
    
    if (dateFrom) {
      query = query.where('timestamp', '>=', new Date(dateFrom));
    }
    
    if (dateTo) {
      query = query.where('timestamp', '<=', new Date(dateTo));
    }
    
    const scans = await query.get();
    
    const trainingData = scans.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ocrText: data.aiTrainingData?.ocrRawText,
        extractedProduct: data.productInfo?.name,
        activeIngredient: data.productInfo?.activeIngredient,
        userFeedback: data.aiTrainingData?.userFeedback,
        correctedData: data.aiTrainingData?.correctedData,
        confidence: data.productInfo?.ocrConfidence,
        timestamp: data.timestamp?.toDate()
      };
    });
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(trainingData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=training-data.csv');
      res.send(csv);
    } else {
      res.json({ trainingData, count: trainingData.length });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// Security: View admin logs
router.get('/logs', async (req, res) => {
  try {
    const { limit = 100, adminId } = req.query;
    const db = admin.firestore();
    
    let query = db.collection('adminLogs')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit));
    
    if (adminId) {
      query = query.where('adminId', '==', adminId);
    }
    
    const logs = await query.get();
    
    res.json({
      logs: logs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }))
    });
  } catch (error) {
    console.error('Logs fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Helper function to convert to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  return csv;
}

module.exports = router;