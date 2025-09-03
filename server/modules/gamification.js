/**
 * Gamification & Engagement System
 * Rewards, achievements, and challenges to boost user retention
 */

const admin = require('firebase-admin');

class GamificationSystem {
  constructor() {
    this.achievements = {
      // Onboarding
      FIRST_SCAN: { id: 'first_scan', name: 'First Steps', points: 10, icon: '🎯' },
      COMPLETE_PROFILE: { id: 'complete_profile', name: 'Profile Pro', points: 20, icon: '📝' },
      
      // Adherence
      STREAK_7: { id: 'streak_7', name: 'Week Warrior', points: 50, icon: '🔥' },
      STREAK_30: { id: 'streak_30', name: 'Monthly Master', points: 200, icon: '🏆' },
      STREAK_100: { id: 'streak_100', name: 'Century Champion', points: 1000, icon: '👑' },
      
      // Knowledge
      QUIZ_MASTER: { id: 'quiz_master', name: 'Quiz Master', points: 30, icon: '🧠' },
      EDUCATED: { id: 'educated', name: 'Well Educated', points: 50, icon: '🎓' },
      
      // Social
      HELPER: { id: 'helper', name: 'Community Helper', points: 40, icon: '🤝' },
      REVIEWER: { id: 'reviewer', name: 'Trusted Reviewer', points: 25, icon: '⭐' },
      
      // Health
      NATURAL_EXPLORER: { id: 'natural_explorer', name: 'Natural Explorer', points: 60, icon: '🌿' },
      PRICE_SAVER: { id: 'price_saver', name: 'Smart Saver', points: 35, icon: '💰' },
      INTERACTION_CHECKER: { id: 'interaction_checker', name: 'Safety First', points: 45, icon: '🛡️' },
      
      // Milestones
      SCANS_10: { id: 'scans_10', name: '10 Medications Scanned', points: 30, icon: '📸' },
      SCANS_50: { id: 'scans_50', name: '50 Medications Scanned', points: 150, icon: '📷' },
      SAVED_100: { id: 'saved_100', name: 'Saved $100', points: 100, icon: '💵' },
      SAVED_500: { id: 'saved_500', name: 'Saved $500', points: 500, icon: '💎' }
    };

    this.challenges = {
      daily: [
        { id: 'daily_scan', name: 'Daily Scan', points: 5, requirement: 'Scan 1 medication' },
        { id: 'daily_adherence', name: 'Perfect Day', points: 10, requirement: 'Take all medications' },
        { id: 'daily_learn', name: 'Learn Something', points: 5, requirement: 'Read 1 health tip' }
      ],
      weekly: [
        { id: 'weekly_streak', name: '7-Day Streak', points: 50, requirement: 'Perfect adherence for 7 days' },
        { id: 'weekly_natural', name: 'Go Natural', points: 30, requirement: 'Try 1 natural alternative' },
        { id: 'weekly_save', name: 'Money Saver', points: 40, requirement: 'Find cheaper alternative' }
      ],
      monthly: [
        { id: 'monthly_review', name: 'Health Review', points: 100, requirement: 'Complete monthly health assessment' },
        { id: 'monthly_community', name: 'Community Star', points: 80, requirement: 'Help 5 community members' },
        { id: 'monthly_education', name: 'Health Scholar', points: 120, requirement: 'Complete 10 health quizzes' }
      ]
    };

    this.levels = [
      { level: 1, name: 'Beginner', minPoints: 0, perks: [] },
      { level: 2, name: 'Novice', minPoints: 100, perks: ['Extra scan per day'] },
      { level: 3, name: 'Apprentice', minPoints: 250, perks: ['Priority support'] },
      { level: 4, name: 'Adept', minPoints: 500, perks: ['5 free credits monthly'] },
      { level: 5, name: 'Expert', minPoints: 1000, perks: ['10% discount on credits'] },
      { level: 6, name: 'Master', minPoints: 2000, perks: ['Free PDF reports'] },
      { level: 7, name: 'Grand Master', minPoints: 5000, perks: ['Free monthly consultation'] },
      { level: 8, name: 'Legend', minPoints: 10000, perks: ['Lifetime Pro features'] }
    ];
  }

  /**
   * Award points to user
   */
  async awardPoints(userId, points, reason) {
    try {
      const userStats = await this.getUserStats(userId);
      
      const newPoints = (userStats.totalPoints || 0) + points;
      const oldLevel = this.calculateLevel(userStats.totalPoints);
      const newLevel = this.calculateLevel(newPoints);

      // Update user stats
      await this.updateUserStats(userId, {
        totalPoints: newPoints,
        level: newLevel.level,
        pointsHistory: admin.firestore.FieldValue.arrayUnion({
          points,
          reason,
          timestamp: new Date()
        })
      });

      // Check for level up
      if (newLevel.level > oldLevel.level) {
        await this.handleLevelUp(userId, oldLevel, newLevel);
      }

      return {
        success: true,
        points,
        totalPoints: newPoints,
        level: newLevel
      };
    } catch (error) {
      console.error('Award points error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check and award achievements
   */
  async checkAchievements(userId, action, data) {
    try {
      const userAchievements = await this.getUserAchievements(userId);
      const newAchievements = [];

      switch (action) {
        case 'medication_scanned':
          if (!userAchievements.includes('first_scan')) {
            newAchievements.push(this.achievements.FIRST_SCAN);
          }
          
          const scanCount = await this.getUserScanCount(userId);
          if (scanCount === 10 && !userAchievements.includes('scans_10')) {
            newAchievements.push(this.achievements.SCANS_10);
          }
          if (scanCount === 50 && !userAchievements.includes('scans_50')) {
            newAchievements.push(this.achievements.SCANS_50);
          }
          break;

        case 'streak_maintained':
          if (data.days === 7 && !userAchievements.includes('streak_7')) {
            newAchievements.push(this.achievements.STREAK_7);
          }
          if (data.days === 30 && !userAchievements.includes('streak_30')) {
            newAchievements.push(this.achievements.STREAK_30);
          }
          if (data.days === 100 && !userAchievements.includes('streak_100')) {
            newAchievements.push(this.achievements.STREAK_100);
          }
          break;

        case 'money_saved':
          const totalSaved = await this.getUserSavings(userId);
          if (totalSaved >= 100 && !userAchievements.includes('saved_100')) {
            newAchievements.push(this.achievements.SAVED_100);
          }
          if (totalSaved >= 500 && !userAchievements.includes('saved_500')) {
            newAchievements.push(this.achievements.SAVED_500);
          }
          break;

        case 'interaction_checked':
          if (!userAchievements.includes('interaction_checker')) {
            newAchievements.push(this.achievements.INTERACTION_CHECKER);
          }
          break;

        case 'natural_alternative_tried':
          if (!userAchievements.includes('natural_explorer')) {
            newAchievements.push(this.achievements.NATURAL_EXPLORER);
          }
          break;
      }

      // Award achievements
      for (const achievement of newAchievements) {
        await this.awardAchievement(userId, achievement);
      }

      return {
        success: true,
        newAchievements,
        totalAchievements: userAchievements.length + newAchievements.length
      };
    } catch (error) {
      console.error('Check achievements error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get daily challenges
   */
  async getDailyChallenges(userId) {
    try {
      const userChallenges = await this.getUserChallenges(userId, 'daily');
      const today = new Date().toDateString();

      // Reset if new day
      if (userChallenges.date !== today) {
        userChallenges.completed = [];
        userChallenges.date = today;
      }

      const challenges = this.challenges.daily.map(challenge => ({
        ...challenge,
        completed: userChallenges.completed.includes(challenge.id),
        progress: this.getChallengeProgress(userId, challenge)
      }));

      return {
        success: true,
        challenges,
        completedToday: userChallenges.completed.length,
        totalAvailable: challenges.length
      };
    } catch (error) {
      console.error('Get daily challenges error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete a challenge
   */
  async completeChallenge(userId, challengeId) {
    try {
      const challenge = this.findChallenge(challengeId);
      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Award points
      await this.awardPoints(userId, challenge.points, `Completed: ${challenge.name}`);

      // Update user challenges
      await this.updateUserChallenges(userId, challengeId);

      // Check for bonus rewards
      const bonusRewards = await this.checkBonusRewards(userId);

      return {
        success: true,
        challenge,
        bonusRewards
      };
    } catch (error) {
      console.error('Complete challenge error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(type = 'global', timeframe = 'all') {
    try {
      let query = admin.firestore().collection('userStats');

      // Filter by timeframe
      if (timeframe === 'weekly') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        query = query.where('lastActive', '>=', weekAgo);
      } else if (timeframe === 'monthly') {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        query = query.where('lastActive', '>=', monthAgo);
      }

      // Get top users
      const snapshot = await query
        .orderBy('totalPoints', 'desc')
        .limit(100)
        .get();

      const leaderboard = [];
      let rank = 1;

      snapshot.forEach(doc => {
        const data = doc.data();
        leaderboard.push({
          rank: rank++,
          userId: doc.id,
          username: data.username || 'Anonymous',
          level: this.calculateLevel(data.totalPoints),
          totalPoints: data.totalPoints,
          streak: data.currentStreak || 0,
          achievements: data.achievements?.length || 0
        });
      });

      return {
        success: true,
        leaderboard,
        type,
        timeframe
      };
    } catch (error) {
      console.error('Get leaderboard error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Medication adherence streak tracking
   */
  async updateAdherenceStreak(userId, taken) {
    try {
      const userStats = await this.getUserStats(userId);
      const today = new Date().toDateString();
      
      let streak = userStats.currentStreak || 0;
      let bestStreak = userStats.bestStreak || 0;

      if (taken) {
        // Check if already updated today
        if (userStats.lastStreakUpdate !== today) {
          streak++;
          bestStreak = Math.max(streak, bestStreak);
          
          // Award points for streak
          const streakPoints = Math.min(streak * 2, 50); // Cap at 50 points
          await this.awardPoints(userId, streakPoints, `${streak} day streak!`);
          
          // Check streak achievements
          await this.checkAchievements(userId, 'streak_maintained', { days: streak });
        }
      } else {
        // Reset streak
        streak = 0;
      }

      await this.updateUserStats(userId, {
        currentStreak: streak,
        bestStreak,
        lastStreakUpdate: today
      });

      return {
        success: true,
        streak,
        bestStreak
      };
    } catch (error) {
      console.error('Update streak error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Health quiz system
   */
  async startQuiz(userId, category) {
    try {
      const questions = await this.getQuizQuestions(category);
      
      const quiz = {
        id: `quiz_${Date.now()}`,
        userId,
        category,
        questions,
        answers: [],
        startTime: new Date(),
        status: 'in_progress'
      };

      await this.saveQuiz(quiz);

      return {
        success: true,
        quiz: {
          id: quiz.id,
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            options: q.options
          }))
        }
      };
    } catch (error) {
      console.error('Start quiz error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit quiz answers
   */
  async submitQuiz(userId, quizId, answers) {
    try {
      const quiz = await this.getQuiz(quizId);
      
      if (!quiz || quiz.userId !== userId) {
        throw new Error('Quiz not found');
      }

      // Calculate score
      let correct = 0;
      quiz.questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          correct++;
        }
      });

      const score = Math.round((correct / quiz.questions.length) * 100);
      const points = Math.round(score / 2); // 50 points for 100% score

      // Update quiz
      quiz.answers = answers;
      quiz.score = score;
      quiz.endTime = new Date();
      quiz.status = 'completed';
      
      await this.updateQuiz(quiz);

      // Award points
      await this.awardPoints(userId, points, `Quiz score: ${score}%`);

      // Check achievements
      if (score === 100) {
        await this.checkAchievements(userId, 'perfect_quiz', { category });
      }

      return {
        success: true,
        score,
        correct,
        total: quiz.questions.length,
        points,
        feedback: this.generateQuizFeedback(score)
      };
    } catch (error) {
      console.error('Submit quiz error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper methods
   */
  calculateLevel(points) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (points >= this.levels[i].minPoints) {
        return this.levels[i];
      }
    }
    return this.levels[0];
  }

  async getUserStats(userId) {
    if (!admin.apps.length) return {};

    const doc = await admin.firestore()
      .collection('userStats')
      .doc(userId)
      .get();

    return doc.exists ? doc.data() : {};
  }

  async updateUserStats(userId, updates) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('userStats')
      .doc(userId)
      .set({
        ...updates,
        lastActive: new Date()
      }, { merge: true });
  }

  async handleLevelUp(userId, oldLevel, newLevel) {
    // Send notification
    console.log(`User ${userId} leveled up from ${oldLevel.name} to ${newLevel.name}!`);
    
    // Unlock perks
    for (const perk of newLevel.perks) {
      await this.unlockPerk(userId, perk);
    }
    
    // Award bonus points
    await this.awardPoints(userId, 100, `Level up to ${newLevel.name}!`);
  }

  async unlockPerk(userId, perk) {
    // Apply perk benefits
    console.log(`Unlocked perk for ${userId}: ${perk}`);
  }

  async getUserAchievements(userId) {
    const stats = await this.getUserStats(userId);
    return stats.achievements || [];
  }

  async getUserScanCount(userId) {
    // Mock count - in production, query from database
    return Math.floor(Math.random() * 60);
  }

  async getUserSavings(userId) {
    // Mock savings - in production, calculate from price comparison usage
    return Math.floor(Math.random() * 600);
  }

  async awardAchievement(userId, achievement) {
    // Award achievement
    await this.updateUserStats(userId, {
      achievements: admin.firestore.FieldValue.arrayUnion(achievement.id)
    });
    
    // Award points
    await this.awardPoints(userId, achievement.points, `Achievement: ${achievement.name}`);
    
    // Send notification
    console.log(`Achievement unlocked: ${achievement.name} ${achievement.icon}`);
  }

  async getUserChallenges(userId, type) {
    // Mock user challenges - in production, from database
    return {
      date: new Date().toDateString(),
      completed: []
    };
  }

  getChallengeProgress(userId, challenge) {
    // Mock progress - in production, calculate actual progress
    return {
      current: Math.floor(Math.random() * 10),
      target: 10
    };
  }

  findChallenge(challengeId) {
    for (const type of Object.values(this.challenges)) {
      const challenge = type.find(c => c.id === challengeId);
      if (challenge) return challenge;
    }
    return null;
  }

  async updateUserChallenges(userId, challengeId) {
    // Update completed challenges
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('userChallenges')
      .doc(userId)
      .update({
        completed: admin.firestore.FieldValue.arrayUnion(challengeId)
      });
  }

  async checkBonusRewards(userId) {
    // Check for special bonus rewards
    const bonuses = [];
    
    const userChallenges = await this.getUserChallenges(userId, 'daily');
    if (userChallenges.completed.length === this.challenges.daily.length) {
      bonuses.push({
        type: 'daily_completion',
        points: 20,
        message: 'Completed all daily challenges!'
      });
    }
    
    return bonuses;
  }

  async getQuizQuestions(category) {
    // Mock quiz questions - in production, from question bank
    return [
      {
        id: 'q1',
        question: 'What is the most common side effect of aspirin?',
        options: ['Headache', 'Stomach upset', 'Dizziness', 'Fatigue'],
        correctAnswer: 1
      },
      {
        id: 'q2',
        question: 'When should you take medications labeled "with food"?',
        options: ['On empty stomach', 'With or after meals', 'Before bed', 'Anytime'],
        correctAnswer: 1
      }
    ];
  }

  async saveQuiz(quiz) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('quizzes')
      .doc(quiz.id)
      .set(quiz);
  }

  async getQuiz(quizId) {
    if (!admin.apps.length) return null;

    const doc = await admin.firestore()
      .collection('quizzes')
      .doc(quizId)
      .get();

    return doc.exists ? doc.data() : null;
  }

  async updateQuiz(quiz) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('quizzes')
      .doc(quiz.id)
      .update(quiz);
  }

  generateQuizFeedback(score) {
    if (score === 100) {
      return 'Perfect! You really know your medications!';
    } else if (score >= 80) {
      return 'Great job! You have strong medication knowledge.';
    } else if (score >= 60) {
      return 'Good effort! Keep learning about your health.';
    } else {
      return 'Keep practicing! Knowledge is power for your health.';
    }
  }
}

module.exports = GamificationSystem;