import { getFirestore, collection, addDoc, updateDoc, doc, increment, setDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { safeUpdateUserDoc } from '../utils/firebaseUserUtils';

const db = getFirestore();

class EngagementTracker {
  constructor() {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.sessionEvents = [];
  }


  // Track when user completes a scan
  async trackScan(productName, scanResult) {
    try {
      const user = getAuth().currentUser;
      
      // Skip tracking if user is not authenticated
      if (!user) {
        console.log('Skipping scan tracking - user not authenticated');
        return;
      }
      
      const isPremium = await SecureStore.getItemAsync('is_premium') === 'true';
      
      const event = {
        type: 'scan_completed',
        productName,
        isPremium,
        timestamp: new Date(),
        hasAlternatives: scanResult?.alternatives?.length > 0,
        userId: user.uid
      };
      
      this.sessionEvents.push(event);
      
      // Save to Firestore for premium users
      if (isPremium) {
        try {
          await addDoc(collection(db, 'engagement'), event);
          
          // Update user stats using safe update
          await safeUpdateUserDoc(user.uid, {
            'stats.totalScans': increment(1),
            'stats.lastScanDate': new Date(),
            'stats.mostScannedCategory': scanResult?.category || 'unknown'
          });
        } catch (firestoreError) {
          // Handle permission errors gracefully
          if (firestoreError.code === 'permission-denied') {
            console.log('Firestore permission denied - check security rules');
          } else if (firestoreError.message?.includes('No document to update')) {
            console.log('User document not found - skipping stats update');
          } else {
            console.error('Firestore error:', firestoreError.message);
          }
        }
      }
      
      // Check for milestones
      await this.checkMilestones(user);
      
    } catch (error) {
      console.error('Error tracking scan:', error);
    }
  }

  // Track feature usage
  async trackFeatureUse(feature) {
    try {
      const user = getAuth().currentUser;
      const isPremium = await SecureStore.getItemAsync('is_premium') === 'true';
      
      if (!isPremium) return;
      
      const event = {
        type: 'feature_used',
        feature, // 'pdf_export', 'share', 'history_view', 'offline_mode'
        timestamp: new Date(),
        userId: user?.uid
      };
      
      this.sessionEvents.push(event);
      
      if (user) {
        try {
          await addDoc(collection(db, 'engagement'), event);
          
          // Track feature popularity using safe update
          const featureKey = `stats.featuresUsed.${feature}`;
          await safeUpdateUserDoc(user.uid, {
            [featureKey]: increment(1)
          });
        } catch (firestoreError) {
          if (firestoreError.message?.includes('No document to update')) {
            console.log('User document not found - skipping feature tracking');
          } else {
            console.error('Error updating feature stats:', firestoreError);
          }
        }
      }
      
    } catch (error) {
      console.error('Error tracking feature:', error);
    }
  }

  // Track session duration
  async trackSession() {
    try {
      const user = getAuth().currentUser;
      const isPremium = await SecureStore.getItemAsync('is_premium') === 'true';
      
      if (!user || !isPremium) return;
      
      const sessionDuration = Date.now() - this.sessionStartTime;
      
      const sessionData = {
        type: 'session',
        duration: sessionDuration,
        eventsCount: this.sessionEvents.length,
        timestamp: new Date(),
        userId: user.uid
      };
      
      await addDoc(collection(db, 'engagement'), sessionData);
      
      // Update average session time using safe update
      try {
        await safeUpdateUserDoc(user.uid, {
          'stats.totalSessionTime': increment(sessionDuration),
          'stats.sessionCount': increment(1),
          'stats.lastActiveDate': new Date()
        });
      } catch (updateError) {
        console.log('Could not update session stats:', updateError.message);
      }
      
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  }

  // Check for user milestones
  async checkMilestones(user) {
    if (!user) return;
    
    try {
      const { getDoc } = require('firebase/firestore');
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        console.log('User document not found');
        return;
      }
      
      const stats = userDoc.data()?.stats || {};
      
      const milestones = [
        { count: 10, message: '🎉 10 scans completed!', reward: 'scan_streak_10' },
        { count: 50, message: '🌟 50 scans - You are a wellness pro!', reward: 'scan_streak_50' },
        { count: 100, message: '💯 100 scans - Wellness master!', reward: 'scan_streak_100' },
      ];
      
      for (const milestone of milestones) {
        if (stats.totalScans === milestone.count) {
          // Trigger celebration
          this.celebrateMilestone(milestone);
          
          // Save achievement
          try {
            await safeUpdateUserDoc(user.uid, {
              [`achievements.${milestone.reward}`]: true,
              [`achievements.${milestone.reward}_date`]: new Date()
            });
          } catch (updateError) {
            console.log('Could not update achievement:', updateError.message);
          }
        }
      }
      
    } catch (error) {
      console.error('Error checking milestones:', error);
    }
  }

  // Celebrate user achievements
  celebrateMilestone(milestone) {
    // This would trigger an in-app notification
    // For now, we'll use console.log
    console.log('🎊 Milestone reached:', milestone.message);
  }

  // Get engagement insights for premium users
  async getInsights(userId) {
    try {
      const userDoc = await doc(db, 'users', userId).get();
      const stats = userDoc.data()?.stats || {};
      
      return {
        totalScans: stats.totalScans || 0,
        averageSessionTime: stats.sessionCount > 0 
          ? Math.round(stats.totalSessionTime / stats.sessionCount / 1000 / 60) 
          : 0, // in minutes
        favoriteCategory: stats.mostScannedCategory || 'Not determined',
        mostUsedFeature: this.getMostUsedFeature(stats.featuresUsed || {}),
        scanStreak: await this.calculateStreak(userId),
        achievements: stats.achievements || {}
      };
      
    } catch (error) {
      console.error('Error getting insights:', error);
      return null;
    }
  }

  // Calculate scan streak
  async calculateStreak(userId) {
    // Implementation would check daily scan history
    // For now, return mock data
    return 7; // 7-day streak
  }

  // Get most used feature
  getMostUsedFeature(featuresUsed) {
    let maxFeature = 'None';
    let maxCount = 0;
    
    for (const [feature, count] of Object.entries(featuresUsed)) {
      if (count > maxCount) {
        maxCount = count;
        maxFeature = feature;
      }
    }
    
    return maxFeature;
  }

  // Track when user views their history
  async trackHistoryView() {
    await this.trackFeatureUse('history_view');
  }

  // Track PDF export
  async trackPDFExport() {
    await this.trackFeatureUse('pdf_export');
  }

  // Track share action
  async trackShare() {
    await this.trackFeatureUse('share');
  }

  // Track offline mode usage
  async trackOfflineMode() {
    await this.trackFeatureUse('offline_mode');
  }
}

// Create singleton instance
const engagementTracker = new EngagementTracker();

// Track app lifecycle
export const startSession = () => {
  engagementTracker.sessionStartTime = Date.now();
};

export const endSession = async () => {
  await engagementTracker.trackSession();
};

export default engagementTracker;