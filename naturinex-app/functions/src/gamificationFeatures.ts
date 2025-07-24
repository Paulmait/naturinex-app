import * as admin from 'firebase-admin';
import { Request, Response } from 'express';

/**
 * Gamification and engagement features to boost retention
 */

// Achievement definitions
const ACHIEVEMENTS = {
  first_scan: {
    id: 'first_scan',
    name: 'Health Journey Begins',
    description: 'Complete your first health scan',
    icon: '🌱',
    points: 10,
    tier: 'bronze'
  },
  scan_streak_7: {
    id: 'scan_streak_7',
    name: 'Week Warrior',
    description: 'Scan for 7 days in a row',
    icon: '🔥',
    points: 50,
    tier: 'silver'
  },
  scan_streak_30: {
    id: 'scan_streak_30',
    name: 'Monthly Master',
    description: 'Scan for 30 days in a row',
    icon: '⚡',
    points: 200,
    tier: 'gold'
  },
  variety_scanner: {
    id: 'variety_scanner',
    name: 'Curious Explorer',
    description: 'Scan 10 different types of products',
    icon: '🔍',
    points: 75,
    tier: 'silver'
  },
  health_improver: {
    id: 'health_improver',
    name: 'Health Optimizer',
    description: 'Make 5 healthier choices based on scan results',
    icon: '💪',
    points: 100,
    tier: 'gold'
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Community Builder',
    description: 'Refer 3 friends who subscribe',
    icon: '🦋',
    points: 300,
    tier: 'platinum'
  },
  scan_centurion: {
    id: 'scan_centurion',
    name: 'Centurion',
    description: 'Complete 100 total scans',
    icon: '💯',
    points: 150,
    tier: 'gold'
  }
};

// Streak bonuses
const STREAK_BONUSES = {
  3: { points: 15, message: '3-day streak! Keep it up!' },
  7: { points: 50, message: 'Week streak achieved! 🔥' },
  14: { points: 100, message: '2 weeks strong! Amazing!' },
  30: { points: 250, message: 'Monthly streak master! 🏆' },
  60: { points: 500, message: 'Legendary 60-day streak! 🌟' },
  100: { points: 1000, message: 'EPIC 100-day streak! You\'re unstoppable! 🚀' }
};

/**
 * Track user action and award points/achievements
 */
export async function trackUserAction(
  userId: string,
  action: string,
  metadata?: any
): Promise<any> {
  const batch = admin.firestore().batch();
  const userRef = admin.firestore().collection('users').doc(userId);
  const rewards = {
    points: 0,
    achievements: [],
    streakBonus: null,
    levelUp: false
  };

  try {
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    
    // Initialize gamification data if needed
    if (!userData.gamification) {
      userData.gamification = {
        points: 0,
        level: 1,
        achievements: [],
        currentStreak: 0,
        longestStreak: 0,
        lastActionDate: null,
        totalScans: 0,
        uniqueProductTypes: [],
        healthierChoices: 0,
        referralsCompleted: 0
      };
    }

    const gameData = userData.gamification;

    switch (action) {
      case 'scan_completed':
        rewards.points += 5; // Base points for scanning
        gameData.totalScans += 1;
        
        // Track product variety
        if (metadata?.productType && !gameData.uniqueProductTypes.includes(metadata.productType)) {
          gameData.uniqueProductTypes.push(metadata.productType);
        }
        
        // Update streak
        const lastAction = gameData.lastActionDate?.toDate();
        const now = new Date();
        const daysSinceLastAction = lastAction ? 
          Math.floor((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        
        if (daysSinceLastAction <= 1) {
          gameData.currentStreak += 1;
          gameData.longestStreak = Math.max(gameData.currentStreak, gameData.longestStreak);
          
          // Check streak bonuses
          if (STREAK_BONUSES[gameData.currentStreak]) {
            rewards.streakBonus = STREAK_BONUSES[gameData.currentStreak];
            rewards.points += rewards.streakBonus.points;
          }
        } else {
          gameData.currentStreak = 1;
        }
        
        gameData.lastActionDate = admin.firestore.FieldValue.serverTimestamp();
        
        // Check achievements
        if (gameData.totalScans === 1) {
          rewards.achievements.push(ACHIEVEMENTS.first_scan);
        }
        if (gameData.totalScans === 100) {
          rewards.achievements.push(ACHIEVEMENTS.scan_centurion);
        }
        if (gameData.currentStreak === 7) {
          rewards.achievements.push(ACHIEVEMENTS.scan_streak_7);
        }
        if (gameData.currentStreak === 30) {
          rewards.achievements.push(ACHIEVEMENTS.scan_streak_30);
        }
        if (gameData.uniqueProductTypes.length === 10) {
          rewards.achievements.push(ACHIEVEMENTS.variety_scanner);
        }
        break;

      case 'healthier_choice_made':
        rewards.points += 20;
        gameData.healthierChoices += 1;
        
        if (gameData.healthierChoices === 5) {
          rewards.achievements.push(ACHIEVEMENTS.health_improver);
        }
        break;

      case 'referral_completed':
        rewards.points += 100;
        gameData.referralsCompleted += 1;
        
        if (gameData.referralsCompleted === 3) {
          rewards.achievements.push(ACHIEVEMENTS.social_butterfly);
        }
        break;

      case 'daily_check_in':
        rewards.points += 2;
        break;
    }

    // Calculate total points and check for level up
    gameData.points += rewards.points;
    for (const achievement of rewards.achievements) {
      gameData.points += achievement.points;
      gameData.achievements.push(achievement.id);
    }

    // Level calculation (100 points per level, exponential growth)
    const newLevel = Math.floor(Math.sqrt(gameData.points / 50)) + 1;
    if (newLevel > gameData.level) {
      rewards.levelUp = true;
      gameData.level = newLevel;
      
      // Level up rewards
      rewards.points += 50 * newLevel;
      gameData.points += 50 * newLevel;
    }

    // Update user document
    batch.update(userRef, {
      gamification: gameData
    });

    // Log the action
    const actionRef = admin.firestore().collection('user_actions').doc();
    batch.set(actionRef, {
      userId,
      action,
      metadata,
      rewards,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create notifications for achievements
    for (const achievement of rewards.achievements) {
      const notifRef = admin.firestore().collection('notifications').doc();
      batch.set(notifRef, {
        userId,
        type: 'achievement_unlocked',
        title: `🏆 Achievement Unlocked!`,
        message: `${achievement.name}: ${achievement.description}`,
        data: achievement,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Level up notification
    if (rewards.levelUp) {
      const levelNotifRef = admin.firestore().collection('notifications').doc();
      batch.set(levelNotifRef, {
        userId,
        type: 'level_up',
        title: `🎉 Level ${newLevel} Reached!`,
        message: `Congratulations! You've reached level ${newLevel} and earned ${50 * newLevel} bonus points!`,
        data: { level: newLevel, bonusPoints: 50 * newLevel },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    
    return rewards;

  } catch (error) {
    console.error('Error tracking user action:', error);
    throw error;
  }
}

/**
 * Get user's gamification profile
 */
export async function getGamificationProfile(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.gamification) {
      return res.json({
        points: 0,
        level: 1,
        achievements: [],
        currentStreak: 0,
        longestStreak: 0,
        nextLevelPoints: 50,
        leaderboardRank: null
      });
    }

    const gameData = userData.gamification;
    
    // Calculate next level points
    const currentLevelBase = Math.pow(gameData.level - 1, 2) * 50;
    const nextLevelPoints = Math.pow(gameData.level, 2) * 50;
    const progressToNextLevel = ((gameData.points - currentLevelBase) / (nextLevelPoints - currentLevelBase)) * 100;

    // Get achievement details
    const unlockedAchievements = gameData.achievements.map((id: string) => ACHIEVEMENTS[id]).filter(Boolean);
    const availableAchievements = Object.values(ACHIEVEMENTS).filter(
      a => !gameData.achievements.includes(a.id)
    );

    // Get leaderboard rank
    const rank = await getLeaderboardRank(userId, gameData.points);

    res.json({
      points: gameData.points,
      level: gameData.level,
      currentStreak: gameData.currentStreak,
      longestStreak: gameData.longestStreak,
      progressToNextLevel,
      nextLevelPoints,
      achievements: {
        unlocked: unlockedAchievements,
        available: availableAchievements,
        total: Object.keys(ACHIEVEMENTS).length
      },
      stats: {
        totalScans: gameData.totalScans,
        healthierChoices: gameData.healthierChoices,
        referralsCompleted: gameData.referralsCompleted,
        uniqueProducts: gameData.uniqueProductTypes?.length || 0
      },
      leaderboardRank: rank
    });

  } catch (error) {
    console.error('Error getting gamification profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const { timeframe = 'all', limit = 10 } = req.query;
    
    let query = admin.firestore()
      .collection('users')
      .orderBy('gamification.points', 'desc')
      .limit(Number(limit));
    
    // For weekly/monthly leaderboards, you'd filter by recent activity
    
    const snapshot = await query.get();
    const leaderboard = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        rank: index + 1,
        userId: doc.id,
        username: data.displayName || 'Anonymous',
        avatar: data.photoURL,
        points: data.gamification?.points || 0,
        level: data.gamification?.level || 1,
        currentStreak: data.gamification?.currentStreak || 0
      };
    });
    
    res.json({ leaderboard, timeframe });
    
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
}

/**
 * Daily bonus claim
 */
export async function claimDailyBonus(req: Request, res: Response) {
  try {
    const { userId } = req.body;
    
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    const lastClaim = userData?.lastDailyBonusClaim?.toDate();
    const now = new Date();
    
    if (lastClaim) {
      const hoursSinceLastClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastClaim < 24) {
        const hoursUntilNext = 24 - hoursSinceLastClaim;
        return res.status(400).json({
          error: 'Daily bonus already claimed',
          hoursUntilNext: Math.ceil(hoursUntilNext)
        });
      }
    }
    
    // Award daily bonus
    const bonusPoints = 10;
    await userRef.update({
      'gamification.points': admin.firestore.FieldValue.increment(bonusPoints),
      lastDailyBonusClaim: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({
      success: true,
      pointsAwarded: bonusPoints,
      message: 'Daily bonus claimed!'
    });
    
  } catch (error) {
    console.error('Error claiming daily bonus:', error);
    res.status(500).json({ error: 'Failed to claim bonus' });
  }
}

/**
 * Get user's rank in leaderboard
 */
async function getLeaderboardRank(userId: string, userPoints: number): Promise<number | null> {
  try {
    const higherScoreCount = await admin.firestore()
      .collection('users')
      .where('gamification.points', '>', userPoints)
      .count()
      .get();
    
    return higherScoreCount.data().count + 1;
  } catch (error) {
    console.error('Error getting leaderboard rank:', error);
    return null;
  }
}