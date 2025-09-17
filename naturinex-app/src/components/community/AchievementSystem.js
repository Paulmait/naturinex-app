/**
 * Achievement System Component
 * Gamification features including badges, points, levels, and leaderboards
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CommunityService from '../../services/CommunityService';
import LoadingAnimation from '../LoadingAnimation';

const AchievementSystem = ({ user, navigation }) => {
  const [userAchievements, setUserAchievements] = useState(null);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showNewAchievement, setShowNewAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);

  // Animation values
  const scaleAnim = new Animated.Value(0);
  const fadeAnim = new Animated.Value(0);

  const badgeDefinitions = {
    newcomer: {
      id: 'newcomer',
      name: 'Welcome Aboard',
      description: 'Joined the NaturineX community',
      icon: 'emoji-events',
      color: '#4CAF50',
      category: 'milestone',
      rarity: 'common',
      points_required: 0,
      criteria: { action: 'register', count: 1 }
    },
    first_post: {
      id: 'first_post',
      name: 'First Voice',
      description: 'Created your first community post',
      icon: 'create',
      color: '#2196F3',
      category: 'content',
      rarity: 'common',
      points_required: 10,
      criteria: { action: 'create_post', count: 1 }
    },
    prolific_poster: {
      id: 'prolific_poster',
      name: 'Prolific Poster',
      description: 'Created 10 community posts',
      icon: 'edit',
      color: '#FF5722',
      category: 'content',
      rarity: 'rare',
      points_required: 100,
      criteria: { action: 'create_post', count: 10 }
    },
    helpful_commenter: {
      id: 'helpful_commenter',
      name: 'Helpful Commenter',
      description: 'Made 50 helpful comments',
      icon: 'chat',
      color: '#00BCD4',
      category: 'engagement',
      rarity: 'rare',
      points_required: 250,
      criteria: { action: 'create_comment', count: 50 }
    },
    community_supporter: {
      id: 'community_supporter',
      name: 'Community Supporter',
      description: 'Gave 100 supportive reactions',
      icon: 'favorite',
      color: '#E91E63',
      category: 'engagement',
      rarity: 'epic',
      points_required: 200,
      criteria: { action: 'add_reaction', count: 100 }
    },
    recipe_master: {
      id: 'recipe_master',
      name: 'Recipe Master',
      description: 'Shared 5 natural remedy recipes',
      icon: 'restaurant',
      color: '#FF9800',
      category: 'content',
      rarity: 'epic',
      points_required: 250,
      criteria: { action: 'share_recipe', count: 5 }
    },
    wisdom_seeker: {
      id: 'wisdom_seeker',
      name: 'Wisdom Seeker',
      description: 'Asked 10 expert questions',
      icon: 'help',
      color: '#9C27B0',
      category: 'learning',
      rarity: 'rare',
      points_required: 50,
      criteria: { action: 'ask_question', count: 10 }
    },
    mentor: {
      id: 'mentor',
      name: 'Community Mentor',
      description: 'Reached level 10',
      icon: 'school',
      color: '#3F51B5',
      category: 'milestone',
      rarity: 'legendary',
      points_required: 1000,
      criteria: { level: 10 }
    },
    streak_warrior: {
      id: 'streak_warrior',
      name: 'Streak Warrior',
      description: 'Maintained a 30-day activity streak',
      icon: 'local-fire-department',
      color: '#FF5722',
      category: 'consistency',
      rarity: 'epic',
      points_required: 300,
      criteria: { streak: 30 }
    },
    knowledge_sharer: {
      id: 'knowledge_sharer',
      name: 'Knowledge Sharer',
      description: 'Shared helpful content that received 100+ reactions',
      icon: 'share',
      color: '#607D8B',
      category: 'impact',
      rarity: 'legendary',
      points_required: 500,
      criteria: { reactions_received: 100 }
    }
  };

  const levelTitles = {
    1: 'Newcomer',
    2: 'Explorer',
    3: 'Member',
    4: 'Active Member',
    5: 'Contributor',
    6: 'Regular Contributor',
    7: 'Valued Member',
    8: 'Community Helper',
    9: 'Community Leader',
    10: 'Wellness Mentor',
    11: 'Wisdom Keeper',
    12: 'Master Contributor',
    13: 'Community Champion',
    14: 'Wellness Guide',
    15: 'Grand Master'
  };

  useEffect(() => {
    loadAchievementData();
  }, []);

  const loadAchievementData = async () => {
    try {
      setLoading(true);

      // Load user achievements
      const userProfile = await CommunityService.getUserProfile(user.uid);
      setUserAchievements(userProfile);

      // Load leaderboard
      const leaderboardData = await CommunityService.getLeaderboard('all_time', 10);
      setLeaderboard(leaderboardData);

      // Set available badges
      setAvailableBadges(Object.values(badgeDefinitions));
    } catch (error) {
      console.error('Error loading achievement data:', error);
      Alert.alert('Error', 'Failed to load achievement data');
    } finally {
      setLoading(false);
    }
  };

  const showAchievementUnlocked = (achievement) => {
    setNewAchievement(achievement);
    setShowNewAchievement(true);

    // Animate achievement popup
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after 3 seconds
    setTimeout(() => {
      hideAchievementPopup();
    }, 3000);
  };

  const hideAchievementPopup = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNewAchievement(false);
      setNewAchievement(null);
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    });
  };

  const getProgressToNextLevel = () => {
    if (!userAchievements) return 0;
    const currentLevel = userAchievements.level || 1;
    const totalPoints = userAchievements.total_points || 0;
    const pointsForCurrentLevel = (currentLevel - 1) * 100;
    const pointsForNextLevel = currentLevel * 100;
    const progressPoints = totalPoints - pointsForCurrentLevel;
    const neededPoints = pointsForNextLevel - pointsForCurrentLevel;
    return Math.min(progressPoints / neededPoints, 1);
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#666';
    }
  };

  const renderOverview = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Level Progress */}
      <LinearGradient
        colors={['#2E7D32', '#4CAF50']}
        style={styles.levelCard}
      >
        <View style={styles.levelInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{userAchievements?.level || 1}</Text>
          </View>
          <View style={styles.levelDetails}>
            <Text style={styles.levelTitle}>
              {levelTitles[userAchievements?.level] || 'Newcomer'}
            </Text>
            <Text style={styles.levelPoints}>
              {userAchievements?.total_points || 0} points
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>
              Progress to Level {(userAchievements?.level || 1) + 1}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(getProgressToNextLevel() * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgressToNextLevel() * 100}%` }
              ]}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Recent Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(userAchievements?.achievements || []).slice(-5).reverse().map((achievementId, index) => {
            const badge = badgeDefinitions[achievementId];
            if (!badge) return null;

            return (
              <TouchableOpacity
                key={index}
                style={styles.recentAchievement}
                onPress={() => {
                  setSelectedBadge(badge);
                  setShowBadgeModal(true);
                }}
              >
                <View style={[styles.achievementIcon, { backgroundColor: badge.color }]}>
                  <MaterialIcons name={badge.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.achievementName}>{badge.name}</Text>
              </TouchableOpacity>
            );
          })}
          {(userAchievements?.achievements || []).length === 0 && (
            <View style={styles.noAchievements}>
              <Text style={styles.noAchievementsText}>No achievements yet</Text>
              <Text style={styles.noAchievementsSubtext}>Start participating to earn your first badge!</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Activity Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="create" size={24} color="#2196F3" />
            <Text style={styles.statNumber}>{userAchievements?.posts_created || 0}</Text>
            <Text style={styles.statLabel}>Posts Created</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="chat" size={24} color="#4CAF50" />
            <Text style={styles.statNumber}>{userAchievements?.comments_created || 0}</Text>
            <Text style={styles.statLabel}>Comments Made</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="favorite" size={24} color="#E91E63" />
            <Text style={styles.statNumber}>{userAchievements?.reactions_given || 0}</Text>
            <Text style={styles.statLabel}>Reactions Given</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={24} color="#FF5722" />
            <Text style={styles.statNumber}>{userAchievements?.daily_streak || 0}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>
      </View>

      {/* Next Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Next Goals</Text>
        {renderNextGoals()}
      </View>
    </ScrollView>
  );

  const renderNextGoals = () => {
    const userBadges = userAchievements?.badges || [];
    const nextGoals = availableBadges
      .filter(badge => !userBadges.includes(badge.id))
      .slice(0, 3);

    return (
      <View style={styles.goalsList}>
        {nextGoals.map((badge, index) => {
          const progress = calculateBadgeProgress(badge);
          return (
            <View key={index} style={styles.goalItem}>
              <View style={[styles.goalIcon, { backgroundColor: badge.color }]}>
                <MaterialIcons name={badge.icon} size={20} color="#fff" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalName}>{badge.name}</Text>
                <Text style={styles.goalDescription}>{badge.description}</Text>
                <View style={styles.goalProgress}>
                  <View style={styles.goalProgressBar}>
                    <View
                      style={[
                        styles.goalProgressFill,
                        { width: `${progress * 100}%`, backgroundColor: badge.color }
                      ]}
                    />
                  </View>
                  <Text style={styles.goalProgressText}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const calculateBadgeProgress = (badge) => {
    if (!userAchievements) return 0;

    const criteria = badge.criteria;
    if (criteria.action) {
      const currentCount = getCurrentActionCount(criteria.action);
      return Math.min(currentCount / criteria.count, 1);
    } else if (criteria.level) {
      return Math.min((userAchievements.level || 1) / criteria.level, 1);
    } else if (criteria.streak) {
      return Math.min((userAchievements.daily_streak || 0) / criteria.streak, 1);
    } else if (criteria.reactions_received) {
      return Math.min((userAchievements.reactions_received || 0) / criteria.reactions_received, 1);
    }
    return 0;
  };

  const getCurrentActionCount = (action) => {
    switch (action) {
      case 'create_post':
        return userAchievements?.posts_created || 0;
      case 'create_comment':
        return userAchievements?.comments_created || 0;
      case 'add_reaction':
        return userAchievements?.reactions_given || 0;
      default:
        return 0;
    }
  };

  const renderBadges = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.badgesGrid}>
        {availableBadges.map((badge, index) => {
          const isEarned = (userAchievements?.badges || []).includes(badge.id);
          const progress = calculateBadgeProgress(badge);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.badgeCard,
                isEarned && styles.badgeCardEarned
              ]}
              onPress={() => {
                setSelectedBadge(badge);
                setShowBadgeModal(true);
              }}
            >
              <View
                style={[
                  styles.badgeCardIcon,
                  {
                    backgroundColor: isEarned ? badge.color : '#f0f0f0',
                    opacity: isEarned ? 1 : 0.5
                  }
                ]}
              >
                <MaterialIcons
                  name={badge.icon}
                  size={24}
                  color={isEarned ? '#fff' : '#ccc'}
                />
              </View>

              <Text style={[
                styles.badgeCardName,
                { color: isEarned ? '#333' : '#999' }
              ]}>
                {badge.name}
              </Text>

              <View style={[
                styles.rarityBadge,
                { backgroundColor: getRarityColor(badge.rarity) }
              ]}>
                <Text style={styles.rarityText}>{badge.rarity}</Text>
              </View>

              {!isEarned && progress > 0 && (
                <View style={styles.badgeProgressContainer}>
                  <View style={styles.badgeProgressBar}>
                    <View
                      style={[
                        styles.badgeProgressFill,
                        { width: `${progress * 100}%`, backgroundColor: badge.color }
                      ]}
                    />
                  </View>
                  <Text style={styles.badgeProgressText}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderLeaderboard = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>Community Leaders</Text>
        <Text style={styles.leaderboardSubtitle}>Top contributors this month</Text>
      </View>

      {leaderboard.map((user, index) => (
        <View key={index} style={styles.leaderboardItem}>
          <View style={styles.rankContainer}>
            <Text style={[
              styles.rankNumber,
              index < 3 && styles.topRank
            ]}>
              {index + 1}
            </Text>
            {index < 3 && (
              <MaterialIcons
                name={index === 0 ? 'emoji-events' : index === 1 ? 'star' : 'grade'}
                size={16}
                color={index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}
              />
            )}
          </View>

          <View style={styles.userAvatar}>
            <MaterialIcons name="person" size={20} color="#666" />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.profiles?.display_name || 'Community Member'}
            </Text>
            <Text style={styles.userLevel}>
              Level {user.level} • {user.total_points} points
            </Text>
          </View>

          <View style={styles.badgeCount}>
            <MaterialIcons name="emoji-events" size={16} color="#FF9800" />
            <Text style={styles.badgeCountText}>
              {user.badges?.length || 0}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'badges' && styles.activeTab]}
        onPress={() => setActiveTab('badges')}
      >
        <Text style={[styles.tabText, activeTab === 'badges' && styles.activeTabText]}>
          Badges
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
        onPress={() => setActiveTab('leaderboard')}
      >
        <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
          Leaderboard
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderBadgeModal = () => (
    <Modal
      visible={showBadgeModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowBadgeModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.badgeModalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowBadgeModal(false)}
          >
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>

          {selectedBadge && (
            <>
              <View style={[styles.modalBadgeIcon, { backgroundColor: selectedBadge.color }]}>
                <MaterialIcons name={selectedBadge.icon} size={48} color="#fff" />
              </View>

              <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>
              <Text style={styles.modalBadgeDescription}>{selectedBadge.description}</Text>

              <View style={[
                styles.modalRarityBadge,
                { backgroundColor: getRarityColor(selectedBadge.rarity) }
              ]}>
                <Text style={styles.modalRarityText}>{selectedBadge.rarity}</Text>
              </View>

              <Text style={styles.modalBadgePoints}>
                {selectedBadge.points_required} points required
              </Text>

              {(userAchievements?.badges || []).includes(selectedBadge.id) ? (
                <View style={styles.earnedIndicator}>
                  <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                  <Text style={styles.earnedText}>Earned!</Text>
                </View>
              ) : (
                <View style={styles.progressIndicator}>
                  <Text style={styles.progressText}>
                    Progress: {Math.round(calculateBadgeProgress(selectedBadge) * 100)}%
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderNewAchievementPopup = () => (
    <Modal
      visible={showNewAchievement}
      transparent
      animationType="none"
    >
      <View style={styles.achievementOverlay}>
        <Animated.View
          style={[
            styles.achievementPopup,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.achievementPopupTitle}>Achievement Unlocked!</Text>
          {newAchievement && (
            <>
              <View style={[styles.achievementPopupIcon, { backgroundColor: newAchievement.color }]}>
                <MaterialIcons name={newAchievement.icon} size={32} color="#fff" />
              </View>
              <Text style={styles.achievementPopupName}>{newAchievement.name}</Text>
              <Text style={styles.achievementPopupDescription}>{newAchievement.description}</Text>
            </>
          )}
          <TouchableOpacity
            style={styles.achievementPopupClose}
            onPress={hideAchievementPopup}
          >
            <Text style={styles.achievementPopupCloseText}>Awesome!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'badges':
        return renderBadges();
      case 'leaderboard':
        return renderLeaderboard();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading achievements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderTabNavigation()}
      {renderTabContent()}
      {renderBadgeModal()}
      {renderNewAchievementPopup()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2E7D32',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  levelCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  levelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelDetails: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  levelPoints: {
    fontSize: 16,
    color: '#E8F5E8',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recentAchievement: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  noAchievements: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAchievementsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  noAchievementsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  goalsList: {
    paddingBottom: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  goalDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  goalProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginRight: 8,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalProgressText: {
    fontSize: 10,
    color: '#666',
    width: 30,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  badgeCardEarned: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  badgeCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeCardName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  rarityBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 8,
  },
  rarityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  badgeProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  badgeProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    marginBottom: 4,
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressText: {
    fontSize: 10,
    color: '#666',
  },
  leaderboardHeader: {
    padding: 16,
    alignItems: 'center',
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  leaderboardSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 40,
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 4,
  },
  topRank: {
    color: '#FF9800',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userLevel: {
    fontSize: 14,
    color: '#666',
  },
  badgeCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCountText: {
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 4,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    maxWidth: 300,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  modalBadgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalRarityBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  modalRarityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modalBadgePoints: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  earnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earnedText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
  },
  progressIndicator: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  achievementOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementPopup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    maxWidth: 280,
  },
  achievementPopupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 16,
  },
  achievementPopupIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementPopupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementPopupDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  achievementPopupClose: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  achievementPopupCloseText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default AchievementSystem;