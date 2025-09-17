/**
 * User Profile Component
 * Display user achievements, badges, activity, and community stats
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Dimensions
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CommunityService from '../../services/CommunityService';
import LoadingAnimation from '../LoadingAnimation';

const { width: screenWidth } = Dimensions.get('window');

const UserProfile = ({ route, navigation, currentUser }) => {
  const { userId } = route.params;
  const isOwnProfile = currentUser?.uid === userId;

  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const badgeDescriptions = {
    newcomer: { name: 'Getting Started', description: 'Joined the community', icon: 'emoji-events', color: '#4CAF50' },
    member: { name: 'Community Member', description: '500 points earned', icon: 'group', color: '#2196F3' },
    contributor: { name: 'Active Contributor', description: '1,000 points earned', icon: 'star', color: '#FF9800' },
    leader: { name: 'Community Leader', description: '5,000 points earned', icon: 'military-tech', color: '#9C27B0' },
    prolific_poster: { name: 'Prolific Poster', description: '10+ posts shared', icon: 'edit', color: '#F44336' },
    helpful_commenter: { name: 'Helpful Commenter', description: '50+ helpful comments', icon: 'chat', color: '#00BCD4' },
    support_giver: { name: 'Support Giver', description: 'Highly supportive member', icon: 'favorite', color: '#E91E63' },
    recipe_master: { name: 'Recipe Master', description: '5+ recipes shared', icon: 'restaurant', color: '#FF5722' },
    journey_sharer: { name: 'Journey Sharer', description: 'Shared wellness journey', icon: 'timeline', color: '#795548' },
    verified_expert: { name: 'Verified Expert', description: 'Medical professional', icon: 'verified-user', color: '#3F51B5' }
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
    10: 'Wellness Mentor'
  };

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      // Load user achievements and profile
      const userProfile = await CommunityService.getUserProfile(userId);
      setProfile(userProfile?.profiles);
      setAchievements(userProfile);

      // Load user's recent posts if it's their own profile or public
      if (isOwnProfile) {
        // Load user's posts - this would need to be implemented in CommunityService
        // const posts = await CommunityService.getUserPosts(userId);
        // setUserPosts(posts);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserProfile();
  };

  const getProgressToNextLevel = () => {
    if (!achievements) return 0;
    const currentLevel = achievements.level || 1;
    const totalPoints = achievements.total_points || 0;
    const pointsForCurrentLevel = (currentLevel - 1) * 100;
    const pointsForNextLevel = currentLevel * 100;
    const progressPoints = totalPoints - pointsForCurrentLevel;
    const neededPoints = pointsForNextLevel - pointsForCurrentLevel;
    return Math.min(progressPoints / neededPoints, 1);
  };

  const renderProfileHeader = () => (
    <LinearGradient
      colors={['#2E7D32', '#4CAF50']}
      style={styles.profileHeader}
    >
      <View style={styles.profileContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri: profile?.avatar_url || 'https://via.placeholder.com/80'
            }}
            style={styles.avatar}
          />
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{achievements?.level || 1}</Text>
          </View>
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.userName}>
            {profile?.display_name || 'Community Member'}
          </Text>
          <Text style={styles.userTitle}>
            {levelTitles[achievements?.level] || 'Newcomer'}
          </Text>
          <Text style={styles.userPoints}>
            {achievements?.total_points || 0} points
          </Text>
        </View>

        {isOwnProfile && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <MaterialIcons name="edit" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Level Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>
            Level {achievements?.level || 1} Progress
          </Text>
          <Text style={styles.progressPoints}>
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
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{achievements?.posts_created || 0}</Text>
        <Text style={styles.statLabel}>Posts</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{achievements?.comments_created || 0}</Text>
        <Text style={styles.statLabel}>Comments</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{achievements?.reactions_received || 0}</Text>
        <Text style={styles.statLabel}>Reactions</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{achievements?.helpful_votes || 0}</Text>
        <Text style={styles.statLabel}>Helpful</Text>
      </View>
    </View>
  );

  const renderBadges = () => {
    const userBadges = achievements?.badges || [];

    if (userBadges.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.noBadges}>
            <MaterialIcons name="emoji-events" size={48} color="#ccc" />
            <Text style={styles.noBadgesText}>No badges earned yet</Text>
            {isOwnProfile && (
              <Text style={styles.noBadgesSubtext}>
                Start participating to earn your first badge!
              </Text>
            )}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges ({userBadges.length})</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.badgesContainer}
        >
          {userBadges.map((badgeId, index) => {
            const badge = badgeDescriptions[badgeId];
            if (!badge) return null;

            return (
              <View key={index} style={styles.badge}>
                <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}>
                  <MaterialIcons name={badge.icon} size={24} color="#fff" />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderAchievements = () => {
    const userAchievements = achievements?.achievements || [];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Achievements</Text>
        {userAchievements.length === 0 ? (
          <View style={styles.noAchievements}>
            <Text style={styles.noAchievementsText}>No achievements yet</Text>
          </View>
        ) : (
          <View style={styles.achievementsList}>
            {userAchievements.slice(-3).reverse().map((achievementId, index) => {
              const badge = badgeDescriptions[achievementId];
              if (!badge) return null;

              return (
                <View key={index} style={styles.achievementItem}>
                  <View style={[styles.achievementIcon, { backgroundColor: badge.color }]}>
                    <MaterialIcons name={badge.icon} size={20} color="#fff" />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementName}>{badge.name}</Text>
                    <Text style={styles.achievementDescription}>{badge.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  const renderStreakInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Activity Streak</Text>
      <View style={styles.streakContainer}>
        <View style={styles.streakItem}>
          <MaterialIcons name="local-fire-department" size={32} color="#FF5722" />
          <Text style={styles.streakNumber}>{achievements?.daily_streak || 0}</Text>
          <Text style={styles.streakLabel}>Current Streak</Text>
        </View>
        <View style={styles.streakItem}>
          <MaterialIcons name="emoji-events" size={32} color="#FFC107" />
          <Text style={styles.streakNumber}>{achievements?.longest_streak || 0}</Text>
          <Text style={styles.streakLabel}>Best Streak</Text>
        </View>
      </View>
    </View>
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
      {isOwnProfile && (
        <TouchableOpacity
          style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
          onPress={() => setActiveTab('activity')}
        >
          <Text style={[styles.tabText, activeTab === 'activity' && styles.activeTabText]}>
            Activity
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {renderStats()}
            {renderAchievements()}
            {renderStreakInfo()}
          </>
        );
      case 'badges':
        return renderBadges();
      case 'activity':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.comingSoon}>Coming Soon</Text>
          </View>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#2E7D32']}
          tintColor="#2E7D32"
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {renderProfileHeader()}
      {renderTabNavigation()}
      {renderTabContent()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFC107',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userTitle: {
    fontSize: 16,
    color: '#E8F5E8',
    marginBottom: 4,
  },
  userPoints: {
    fontSize: 14,
    color: '#E8F5E8',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
  progressPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFC107',
    borderRadius: 3,
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  badgesContainer: {
    paddingBottom: 8,
  },
  badge: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  noBadges: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noBadgesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noBadgesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  achievementsList: {
    paddingBottom: 8,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  noAchievements: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noAchievementsText: {
    fontSize: 16,
    color: '#666',
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  comingSoon: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 40,
    fontStyle: 'italic',
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

export default UserProfile;