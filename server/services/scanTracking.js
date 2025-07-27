const { isFirebaseAvailable, getFirestore } = require('../config/firebase-init');
const admin = require('firebase-admin');

// Get Firestore instance lazily
let db;
function getDb() {
  if (!db) {
    db = getFirestore();
  }
  return db;
}

/**
 * Save scan to user's history
 */
async function saveScanToHistory(userId, scanData) {
  try {
    // Check if Firebase is available
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, skipping scan history');
      return null;
    }
    
    const firestore = getDb();
    if (!firestore) {
      console.log('Firestore not available, skipping scan history');
      return null;
    }
    const scanRef = firestore.collection('scanHistory').doc();
    const scanId = scanRef.id;
    
    const scanRecord = {
      scanId,
      userId,
      deviceId: scanData.deviceId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      productInfo: {
        name: scanData.productInfo.productName,
        brand: scanData.productInfo.brandName || null,
        activeIngredient: scanData.productInfo.activeIngredient || null,
        dosage: scanData.productInfo.dosage || null,
        category: scanData.productInfo.category || 'unknown',
        ocrConfidence: scanData.ocrConfidence || 'low',
        fullOcrText: scanData.productInfo.fullText || null
      },
      imageUrl: scanData.imageUrl || null,
      analysisResult: {
        alternatives: scanData.alternatives || [],
        warnings: scanData.warnings || [],
        medicationType: scanData.medicationType || null
      },
      location: {
        ip: scanData.ipAddress,
        country: scanData.country || null,
        city: scanData.city || null
      },
      // AI training data
      aiTrainingData: {
        ocrRawText: scanData.ocrRawText || null,
        userFeedback: null, // To be updated if user provides feedback
        scanMethod: scanData.scanMethod || 'camera', // camera, barcode, manual
        processingTime: scanData.processingTime || null,
        modelVersion: 'v1.0'
      }
    };
    
    await scanRef.set(scanRecord);
    
    // Update user's scan count - create document if it doesn't exist
    const userRef = firestore.collection('users').doc(userId);
    
    try {
      await userRef.update({
        'metadata.totalScans': admin.firestore.FieldValue.increment(1),
        'metadata.lastScanDate': admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (updateError) {
      // If user document doesn't exist, create it
      if (updateError.code === 5) { // NOT_FOUND
        await userRef.set({
          userId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            totalScans: 1,
            lastScanDate: admin.firestore.FieldValue.serverTimestamp(),
            accountType: 'anonymous'
          }
        });
      } else {
        throw updateError;
      }
    }
    
    // Update daily analytics
    await updateDailyAnalytics(scanData.productInfo.productName);
    
    return scanId;
  } catch (error) {
    console.error('Error saving scan to history:', error);
    throw error;
  }
}

/**
 * Get user's scan history
 */
async function getUserScanHistory(userId, limit = 50, startAfter = null) {
  try {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, returning empty history');
      return [];
    }
    let query = getDb().collection('scanHistory')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);
    
    if (startAfter) {
      query = query.startAfter(startAfter);
    }
    
    const snapshot = await query.get();
    const scans = [];
    
    snapshot.forEach(doc => {
      scans.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return scans;
  } catch (error) {
    console.error('Error fetching scan history:', error);
    throw error;
  }
}

/**
 * Update user subscription status
 */
async function updateUserSubscription(userId, subscriptionData) {
  try {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, skipping subscription update');
      return;
    }
    const userRef = getDb().collection('users').doc(userId);
    
    await userRef.update({
      subscription: {
        status: subscriptionData.status,
        plan: subscriptionData.plan,
        startDate: subscriptionData.startDate,
        endDate: subscriptionData.endDate,
        stripeCustomerId: subscriptionData.stripeCustomerId,
        stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD'
      },
      'metadata.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Log subscription event
    await getDb().collection('subscriptionEvents').add({
      userId,
      type: subscriptionData.eventType || 'updated',
      plan: subscriptionData.plan,
      amount: subscriptionData.amount,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      stripeEventId: subscriptionData.stripeEventId || null,
      metadata: subscriptionData.metadata || {}
    });
    
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Check if user has premium subscription
 */
async function checkPremiumStatus(userId) {
  try {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, returning false for premium status');
      return false;
    }
    const userDoc = await getDb().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    const subscription = userData.subscription;
    
    if (!subscription || subscription.status !== 'premium') {
      return false;
    }
    
    // Check if subscription is still valid
    const endDate = subscription.endDate.toDate();
    return endDate > new Date();
    
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
}

/**
 * Update daily analytics
 */
async function updateDailyAnalytics(productName) {
  try {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, skipping analytics update');
      return;
    }
    
    // Skip if productName is undefined or null
    if (!productName) {
      console.log('Product name is undefined, skipping analytics update');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const analyticsRef = getDb().collection('analytics').doc(today);
    
    await getDb().runTransaction(async (transaction) => {
      const doc = await transaction.get(analyticsRef);
      
      if (!doc.exists) {
        // Create new daily record
        transaction.set(analyticsRef, {
          date: today,
          metrics: {
            totalScans: 1,
            popularProducts: [{
              name: productName,
              scanCount: 1
            }]
          }
        });
      } else {
        // Update existing record
        const data = doc.data();
        const popularProducts = data.metrics.popularProducts || [];
        
        // Update product count
        const productIndex = popularProducts.findIndex(p => p.name === productName);
        if (productIndex >= 0) {
          popularProducts[productIndex].scanCount++;
        } else {
          popularProducts.push({
            name: productName,
            scanCount: 1
          });
        }
        
        // Sort by scan count and keep top 20
        popularProducts.sort((a, b) => b.scanCount - a.scanCount);
        const topProducts = popularProducts.slice(0, 20);
        
        transaction.update(analyticsRef, {
          'metrics.totalScans': admin.firestore.FieldValue.increment(1),
          'metrics.popularProducts': topProducts
        });
      }
    });
    
  } catch (error) {
    console.error('Error updating analytics:', error);
  }
}

/**
 * Get admin analytics
 */
async function getAdminAnalytics(startDate, endDate) {
  try {
    if (!isFirebaseAvailable()) {
      console.log('Firebase not available, returning empty analytics');
      return {
        totalUsers: 0,
        premiumUsers: 0,
        dailyMetrics: []
      };
    }
    const analytics = await getDb().collection('analytics')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get();
    
    const users = await getDb().collection('users').get();
    const premiumUsers = users.docs.filter(doc => 
      doc.data().subscription?.status === 'premium'
    ).length;
    
    return {
      totalUsers: users.size,
      premiumUsers,
      dailyMetrics: analytics.docs.map(doc => doc.data())
    };
    
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

module.exports = {
  saveScanToHistory,
  getUserScanHistory,
  updateUserSubscription,
  checkPremiumStatus,
  updateDailyAnalytics,
  getAdminAnalytics
};