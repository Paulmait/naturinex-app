/**
 * Community Service for NaturineX
 * Manages support groups, user-generated content, moderation, and community features
 */

import { supabase } from '../config/firebase';
import { EncryptionService } from './encryptionService';

class CommunityService {
  constructor() {
    this.encryptionService = new EncryptionService();
  }

  // ============================================================================
  // SUPPORT GROUPS MANAGEMENT
  // ============================================================================

  /**
   * Create a new support group
   */
  async createSupportGroup(groupData, userId) {
    try {
      const encryptedData = {
        ...groupData,
        description: await this.encryptionService.encrypt(groupData.description),
        guidelines: groupData.guidelines ? await this.encryptionService.encrypt(groupData.guidelines) : null,
        created_by: userId,
        moderation_level: groupData.moderationLevel || 'moderate',
        is_private: groupData.isPrivate || false,
        requires_approval: groupData.requiresApproval || false,
        max_members: groupData.maxMembers || 1000,
        tags: groupData.tags || [],
        condition_category: groupData.conditionCategory,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('support_groups')
        .insert([encryptedData])
        .select('*')
        .single();

      if (error) throw error;

      // Automatically join creator as admin
      await this.joinSupportGroup(data.id, userId, 'admin');

      return {
        ...data,
        description: await this.encryptionService.decrypt(data.description),
        guidelines: data.guidelines ? await this.encryptionService.decrypt(data.guidelines) : null
      };
    } catch (error) {
      console.error('Error creating support group:', error);
      throw new Error('Failed to create support group');
    }
  }

  /**
   * Get support groups for a condition category
   */
  async getSupportGroupsByCondition(conditionCategory, userId = null) {
    try {
      let query = supabase
        .from('support_groups')
        .select(`
          *,
          group_members!inner(count),
          posts(count)
        `)
        .eq('condition_category', conditionCategory)
        .eq('is_active', true);

      // If user is logged in, include private groups they're a member of
      if (userId) {
        query = query.or(`is_private.eq.false,and(is_private.eq.true,group_members.user_id.eq.${userId})`);
      } else {
        query = query.eq('is_private', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Decrypt sensitive data
      const decryptedGroups = await Promise.all(
        data.map(async (group) => ({
          ...group,
          description: await this.encryptionService.decrypt(group.description),
          guidelines: group.guidelines ? await this.encryptionService.decrypt(group.guidelines) : null
        }))
      );

      return decryptedGroups;
    } catch (error) {
      console.error('Error fetching support groups:', error);
      throw new Error('Failed to fetch support groups');
    }
  }

  /**
   * Join a support group
   */
  async joinSupportGroup(groupId, userId, role = 'member') {
    try {
      // Check if group requires approval
      const { data: group } = await supabase
        .from('support_groups')
        .select('requires_approval')
        .eq('id', groupId)
        .single();

      const membershipData = {
        group_id: groupId,
        user_id: userId,
        role: role,
        status: group?.requires_approval && role === 'member' ? 'pending' : 'active',
        joined_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('group_members')
        .insert([membershipData])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error joining support group:', error);
      throw new Error('Failed to join support group');
    }
  }

  // ============================================================================
  // POSTS AND CONTENT MANAGEMENT
  // ============================================================================

  /**
   * Create a new post
   */
  async createPost(postData, userId) {
    try {
      // Content moderation pre-check
      const moderationResult = await this.moderateContent(postData.content);

      const encryptedData = {
        ...postData,
        content: await this.encryptionService.encrypt(postData.content),
        author_id: userId,
        post_type: postData.postType || 'text',
        group_id: postData.groupId || null,
        tags: postData.tags || [],
        is_anonymous: postData.isAnonymous || false,
        media_urls: postData.mediaUrls || [],
        moderation_status: moderationResult.approved ? 'approved' : 'pending',
        moderation_score: moderationResult.score,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('posts')
        .insert([encryptedData])
        .select('*')
        .single();

      if (error) throw error;

      // Award points for posting
      await this.awardPoints(userId, 'create_post', 10);

      return {
        ...data,
        content: await this.encryptionService.decrypt(data.content)
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw new Error('Failed to create post');
    }
  }

  /**
   * Get community feed posts
   */
  async getCommunityFeed(userId, page = 1, limit = 20, filters = {}) {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_author_id_fkey(id, display_name, avatar_url),
          support_groups(name, condition_category),
          comments(count),
          reactions(count),
          user_reactions:reactions!reactions_user_id_fkey(reaction_type)
        `)
        .eq('moderation_status', 'approved')
        .eq('is_active', true);

      // Apply filters
      if (filters.postType) {
        query = query.eq('post_type', filters.postType);
      }
      if (filters.conditionCategory) {
        query = query.eq('support_groups.condition_category', filters.conditionCategory);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Decrypt content
      const decryptedPosts = await Promise.all(
        data.map(async (post) => ({
          ...post,
          content: await this.encryptionService.decrypt(post.content)
        }))
      );

      return decryptedPosts;
    } catch (error) {
      console.error('Error fetching community feed:', error);
      throw new Error('Failed to fetch community feed');
    }
  }

  /**
   * Create a comment on a post
   */
  async createComment(postId, content, userId) {
    try {
      const moderationResult = await this.moderateContent(content);

      const commentData = {
        post_id: postId,
        author_id: userId,
        content: await this.encryptionService.encrypt(content),
        moderation_status: moderationResult.approved ? 'approved' : 'pending',
        moderation_score: moderationResult.score,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select('*')
        .single();

      if (error) throw error;

      // Award points for commenting
      await this.awardPoints(userId, 'create_comment', 5);

      return {
        ...data,
        content: await this.encryptionService.decrypt(data.content)
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error('Failed to create comment');
    }
  }

  /**
   * Add reaction to a post
   */
  async addReaction(postId, userId, reactionType) {
    try {
      const reactionData = {
        post_id: postId,
        user_id: userId,
        reaction_type: reactionType, // 'like', 'love', 'helpful', 'support'
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('reactions')
        .upsert([reactionData], {
          onConflict: 'post_id,user_id',
          ignoreDuplicates: false
        })
        .select('*')
        .single();

      if (error) throw error;

      // Award points for reactions
      await this.awardPoints(userId, 'add_reaction', 2);

      return data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw new Error('Failed to add reaction');
    }
  }

  // ============================================================================
  // CONTENT MODERATION
  // ============================================================================

  /**
   * Moderate content using AI and rule-based filtering
   */
  async moderateContent(content) {
    try {
      // Basic keyword filtering
      const harmfulKeywords = [
        'suicide', 'self-harm', 'overdose', 'illegal drugs',
        'medical advice', 'diagnosis', 'prescription'
      ];

      const lowercaseContent = content.toLowerCase();
      const hasHarmfulContent = harmfulKeywords.some(keyword =>
        lowercaseContent.includes(keyword)
      );

      // Sentiment analysis (simplified)
      const negativeWords = ['terrible', 'awful', 'horrible', 'disgusting', 'hate'];
      const positiveWords = ['great', 'wonderful', 'amazing', 'helpful', 'love'];

      const negativeCount = negativeWords.filter(word =>
        lowercaseContent.includes(word)
      ).length;

      const positiveCount = positiveWords.filter(word =>
        lowercaseContent.includes(word)
      ).length;

      const sentimentScore = (positiveCount - negativeCount) / (positiveCount + negativeCount + 1);

      // Calculate moderation score
      let score = 0.5; // Neutral starting point

      if (hasHarmfulContent) score -= 0.4;
      if (sentimentScore < -0.3) score -= 0.2;
      if (sentimentScore > 0.3) score += 0.2;

      return {
        approved: score >= 0.3 && !hasHarmfulContent,
        score: Math.max(0, Math.min(1, score)),
        flags: hasHarmfulContent ? ['harmful_content'] : [],
        sentiment: sentimentScore
      };
    } catch (error) {
      console.error('Error moderating content:', error);
      return { approved: false, score: 0, flags: ['moderation_error'] };
    }
  }

  /**
   * Report content for manual review
   */
  async reportContent(contentId, contentType, userId, reason) {
    try {
      const reportData = {
        content_id: contentId,
        content_type: contentType, // 'post', 'comment'
        reporter_id: userId,
        reason: reason,
        description: reason.description || null,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('content_reports')
        .insert([reportData])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error reporting content:', error);
      throw new Error('Failed to report content');
    }
  }

  // ============================================================================
  // GAMIFICATION SYSTEM
  // ============================================================================

  /**
   * Award points to a user
   */
  async awardPoints(userId, action, points) {
    try {
      // First, get or create user achievements record
      let { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!userAchievements) {
        const { data: newRecord } = await supabase
          .from('user_achievements')
          .insert([{
            user_id: userId,
            total_points: 0,
            level: 1,
            achievements: [],
            badges: [],
            created_at: new Date().toISOString()
          }])
          .select('*')
          .single();

        userAchievements = newRecord;
      }

      // Award points
      const newTotalPoints = (userAchievements.total_points || 0) + points;
      const newLevel = Math.floor(newTotalPoints / 100) + 1; // Level up every 100 points

      // Record point transaction
      await supabase.from('point_transactions').insert([{
        user_id: userId,
        action: action,
        points: points,
        created_at: new Date().toISOString()
      }]);

      // Update user achievements
      const { data, error } = await supabase
        .from('user_achievements')
        .update({
          total_points: newTotalPoints,
          level: newLevel,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw error;

      // Check for new achievements
      await this.checkAndAwardAchievements(userId, action, newTotalPoints, newLevel);

      return data;
    } catch (error) {
      console.error('Error awarding points:', error);
      throw new Error('Failed to award points');
    }
  }

  /**
   * Check and award achievements
   */
  async checkAndAwardAchievements(userId, action, totalPoints, level) {
    try {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievements, badges')
        .eq('user_id', userId)
        .single();

      const currentAchievements = userAchievements?.achievements || [];
      const currentBadges = userAchievements?.badges || [];
      const newAchievements = [...currentAchievements];
      const newBadges = [...currentBadges];

      // Point-based achievements
      const pointAchievements = [
        { id: 'first_100', name: 'Getting Started', threshold: 100, badge: 'newcomer' },
        { id: 'first_500', name: 'Community Member', threshold: 500, badge: 'member' },
        { id: 'first_1000', name: 'Active Contributor', threshold: 1000, badge: 'contributor' },
        { id: 'first_5000', name: 'Community Leader', threshold: 5000, badge: 'leader' }
      ];

      pointAchievements.forEach(achievement => {
        if (totalPoints >= achievement.threshold &&
            !currentAchievements.includes(achievement.id)) {
          newAchievements.push(achievement.id);
          if (!currentBadges.includes(achievement.badge)) {
            newBadges.push(achievement.badge);
          }
        }
      });

      // Action-based achievements
      const { data: userStats } = await supabase
        .from('point_transactions')
        .select('action')
        .eq('user_id', userId);

      const actionCounts = userStats.reduce((acc, transaction) => {
        acc[transaction.action] = (acc[transaction.action] || 0) + 1;
        return acc;
      }, {});

      // Post achievements
      if (actionCounts.create_post >= 10 && !currentAchievements.includes('prolific_poster')) {
        newAchievements.push('prolific_poster');
        newBadges.push('prolific_poster');
      }

      // Comment achievements
      if (actionCounts.create_comment >= 50 && !currentAchievements.includes('helpful_commenter')) {
        newAchievements.push('helpful_commenter');
        newBadges.push('helpful_commenter');
      }

      // Update if there are new achievements
      if (newAchievements.length > currentAchievements.length ||
          newBadges.length > currentBadges.length) {
        await supabase
          .from('user_achievements')
          .update({
            achievements: newAchievements,
            badges: newBadges,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      return { newAchievements: newAchievements.filter(a => !currentAchievements.includes(a)) };
    } catch (error) {
      console.error('Error checking achievements:', error);
      return { newAchievements: [] };
    }
  }

  /**
   * Get user profile with achievements
   */
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          profiles!user_achievements_user_id_fkey(display_name, avatar_url)
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Get community leaderboard
   */
  async getLeaderboard(timeframe = 'all_time', limit = 10) {
    try {
      let query = supabase
        .from('user_achievements')
        .select(`
          user_id,
          total_points,
          level,
          badges,
          profiles!user_achievements_user_id_fkey(display_name, avatar_url)
        `)
        .order('total_points', { ascending: false })
        .limit(limit);

      // For weekly/monthly leaderboards, we'd need additional logic
      // to calculate points within the timeframe

      const { data, error } = await query;

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw new Error('Failed to fetch leaderboard');
    }
  }

  // ============================================================================
  // ANALYTICS AND METRICS
  // ============================================================================

  /**
   * Track community engagement metrics
   */
  async trackEngagement(userId, action, metadata = {}) {
    try {
      const engagementData = {
        user_id: userId,
        action: action,
        metadata: metadata,
        timestamp: new Date().toISOString(),
        session_id: metadata.sessionId || null
      };

      const { data, error } = await supabase
        .from('community_analytics')
        .insert([engagementData])
        .select('*')
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error tracking engagement:', error);
      // Don't throw error for analytics, just log it
      return null;
    }
  }

  /**
   * Get community analytics summary
   */
  async getCommunityAnalytics(timeframe = '30days') {
    try {
      const timeframeDays = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeDays);

      const { data: analytics, error } = await supabase
        .from('community_analytics')
        .select('action, user_id, timestamp')
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      // Calculate metrics
      const uniqueUsers = new Set(analytics.map(a => a.user_id)).size;
      const totalActions = analytics.length;
      const actionBreakdown = analytics.reduce((acc, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1;
        return acc;
      }, {});

      // Daily active users
      const dailyActivity = analytics.reduce((acc, item) => {
        const date = new Date(item.timestamp).toDateString();
        if (!acc[date]) acc[date] = new Set();
        acc[date].add(item.user_id);
        return acc;
      }, {});

      const averageDailyUsers = Object.values(dailyActivity)
        .reduce((sum, users) => sum + users.size, 0) / timeframeDays;

      return {
        uniqueUsers,
        totalActions,
        actionBreakdown,
        averageDailyUsers,
        timeframe
      };
    } catch (error) {
      console.error('Error fetching community analytics:', error);
      throw new Error('Failed to fetch community analytics');
    }
  }

  // ============================================================================
  // EXPERT Q&A SYSTEM
  // ============================================================================

  /**
   * Submit a question to experts
   */
  async submitQuestion(questionData, userId) {
    try {
      const encryptedData = {
        ...questionData,
        question: await this.encryptionService.encrypt(questionData.question),
        author_id: userId,
        category: questionData.category,
        tags: questionData.tags || [],
        is_anonymous: questionData.isAnonymous || false,
        urgency: questionData.urgency || 'normal',
        status: 'open',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('expert_questions')
        .insert([encryptedData])
        .select('*')
        .single();

      if (error) throw error;

      // Award points for asking questions
      await this.awardPoints(userId, 'ask_question', 5);

      return {
        ...data,
        question: await this.encryptionService.decrypt(data.question)
      };
    } catch (error) {
      console.error('Error submitting question:', error);
      throw new Error('Failed to submit question');
    }
  }

  /**
   * Answer an expert question (for verified experts)
   */
  async answerQuestion(questionId, answer, userId) {
    try {
      // Verify user is an expert
      const { data: expert } = await supabase
        .from('medical_professionals')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_status', 'verified')
        .single();

      if (!expert) {
        throw new Error('Only verified medical professionals can answer questions');
      }

      const answerData = {
        question_id: questionId,
        expert_id: userId,
        answer: await this.encryptionService.encrypt(answer),
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('expert_answers')
        .insert([answerData])
        .select('*')
        .single();

      if (error) throw error;

      // Mark question as answered
      await supabase
        .from('expert_questions')
        .update({ status: 'answered', answered_at: new Date().toISOString() })
        .eq('id', questionId);

      // Award points for answering
      await this.awardPoints(userId, 'answer_question', 20);

      return {
        ...data,
        answer: await this.encryptionService.decrypt(data.answer)
      };
    } catch (error) {
      console.error('Error answering question:', error);
      throw new Error('Failed to answer question');
    }
  }
}

export default new CommunityService();