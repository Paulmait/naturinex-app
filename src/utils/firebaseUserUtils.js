import { getFirestore, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

const db = getFirestore();

/**
 * Ensures a user document exists before performing operations
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} - Returns true if document exists or was created
 */
export async function ensureUserDocument(userId) {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      // Create user document with default values
      await setDoc(userDocRef, {
        createdAt: new Date(),
        stats: {
          totalScans: 0,
          lastScanDate: null,
          mostScannedCategory: 'unknown',
          featuresUsed: {},
          totalSessionTime: 0,
          sessionCount: 0,
          lastActiveDate: new Date()
        },
        achievements: {},
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('Created new user document for:', userId);
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error ensuring user document:', error);
    return false;
  }
}

/**
 * Safely updates a user document, creating it if it doesn't exist
 * @param {string} userId - The user ID
 * @param {object} updates - The fields to update
 * @returns {Promise<void>}
 */
export async function safeUpdateUserDoc(userId, updates) {
  try {
    // First ensure the document exists
    await ensureUserDocument(userId);
    
    // Then perform the update
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      ...updates,
      'metadata.updatedAt': new Date()
    });
  } catch (error) {
    if (error.message?.includes('No document to update')) {
      console.log('User document not found even after creation attempt');
    } else {
      console.error('Error updating user document:', error);
    }
    throw error;
  }
}