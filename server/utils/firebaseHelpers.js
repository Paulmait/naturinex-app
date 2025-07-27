const { getFirestore, isFirebaseAvailable } = require('../config/firebase-init');

/**
 * Get Firestore instance with error handling
 * Returns null if Firebase is not available
 */
function getDb() {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase not available');
    return null;
  }
  return getFirestore();
}

/**
 * Update user document with error handling
 */
async function updateUser(userId, data) {
  const db = getDb();
  if (!db) {
    console.error('Cannot update user - Firebase not available');
    return false;
  }
  
  try {
    await db.collection('users').doc(userId).update(data);
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
}

/**
 * Get user document with error handling
 */
async function getUser(userId) {
  const db = getDb();
  if (!db) {
    console.error('Cannot get user - Firebase not available');
    return null;
  }
  
  try {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Find users by field with error handling
 */
async function findUsersByField(field, value) {
  const db = getDb();
  if (!db) {
    console.error('Cannot find users - Firebase not available');
    return [];
  }
  
  try {
    const snapshot = await db.collection('users').where(field, '==', value).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error finding users:', error);
    return [];
  }
}

module.exports = {
  getDb,
  updateUser,
  getUser,
  findUsersByField
};