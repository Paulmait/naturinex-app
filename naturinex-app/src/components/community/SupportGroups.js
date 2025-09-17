/**
 * Support Groups Component
 * Browse and manage support groups for different health conditions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import CommunityService from '../../services/CommunityService';
import LoadingAnimation from '../LoadingAnimation';
import CreateGroupModal from './CreateGroupModal';

const SupportGroups = ({ user, navigation }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userGroups, setUserGroups] = useState([]);

  const conditionCategories = [
    { id: 'all', name: 'All Categories', icon: 'apps' },
    { id: 'diabetes', name: 'Diabetes', icon: 'healing' },
    { id: 'anxiety', name: 'Anxiety & Mental Health', icon: 'psychology' },
    { id: 'arthritis', name: 'Arthritis & Joint Health', icon: 'accessibility' },
    { id: 'heart_health', name: 'Heart Health', icon: 'favorite' },
    { id: 'digestive', name: 'Digestive Health', icon: 'restaurant' },
    { id: 'sleep', name: 'Sleep Disorders', icon: 'bedtime' },
    { id: 'weight_management', name: 'Weight Management', icon: 'fitness-center' },
    { id: 'chronic_pain', name: 'Chronic Pain', icon: 'medical-services' },
    { id: 'respiratory', name: 'Respiratory Health', icon: 'air' },
    { id: 'immune', name: 'Immune Support', icon: 'shield' },
    { id: 'womens_health', name: "Women's Health", icon: 'woman' },
    { id: 'mens_health', name: "Men's Health", icon: 'man' },
    { id: 'seniors', name: 'Senior Health', icon: 'elderly' },
    { id: 'general', name: 'General Wellness', icon: 'spa' }
  ];

  const loadGroups = useCallback(async () => {
    try {
      setLoading(true);

      const category = selectedCategory === 'all' ? null : selectedCategory;
      const groupsData = await CommunityService.getSupportGroupsByCondition(
        category,
        user?.uid
      );

      setGroups(groupsData);

      // Load user's groups
      if (user?.uid) {
        // This would need to be implemented in CommunityService
        // const userGroupsData = await CommunityService.getUserGroups(user.uid);
        // setUserGroups(userGroupsData);
      }
    } catch (error) {
      console.error('Error loading support groups:', error);
      Alert.alert('Error', 'Failed to load support groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, user?.uid]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadGroups();
  };

  const handleJoinGroup = async (groupId) => {
    try {
      if (!user) {
        Alert.alert('Login Required', 'Please log in to join support groups');
        return;
      }

      await CommunityService.joinSupportGroup(groupId, user.uid);

      // Update local state
      setGroups(prev => prev.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            member_count: group.member_count + 1,
            user_is_member: true
          };
        }
        return group;
      }));

      Alert.alert('Success', 'You have joined the support group!');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join support group');
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const newGroup = await CommunityService.createSupportGroup(groupData, user.uid);
      setGroups(prev => [newGroup, ...prev]);
      setShowCreateGroup(false);

      // Navigate to the new group
      navigation.navigate('SupportGroupDetail', { groupId: newGroup.id });
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create support group');
    }
  };

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const renderCategorySelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categorySelector}
      contentContainerStyle={styles.categorySelectorContent}
    >
      {conditionCategories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            selectedCategory === category.id && styles.categoryChipActive
          ]}
          onPress={() => setSelectedCategory(category.id)}
        >
          <MaterialIcons
            name={category.icon}
            size={18}
            color={selectedCategory === category.id ? '#fff' : '#666'}
          />
          <Text style={[
            styles.categoryText,
            selectedCategory === category.id && styles.categoryTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderGroupCard = ({ item: group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => navigation.navigate('SupportGroupDetail', { groupId: group.id })}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <View style={styles.groupIconContainer}>
            <MaterialIcons
              name={conditionCategories.find(c => c.id === group.condition_category)?.icon || 'group'}
              size={24}
              color="#2E7D32"
            />
          </View>
          <View style={styles.groupDetails}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupCategory}>
              {conditionCategories.find(c => c.id === group.condition_category)?.name || group.condition_category}
            </Text>
          </View>
        </View>

        <View style={styles.groupBadges}>
          {group.verified && (
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color="#2E7D32" />
            </View>
          )}
          {group.is_private && (
            <View style={styles.privateBadge}>
              <MaterialIcons name="lock" size={16} color="#666" />
            </View>
          )}
        </View>
      </View>

      <Text style={styles.groupDescription} numberOfLines={2}>
        {group.description}
      </Text>

      <View style={styles.groupStats}>
        <View style={styles.stat}>
          <MaterialIcons name="people" size={16} color="#666" />
          <Text style={styles.statText}>{group.member_count} members</Text>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="chat" size={16} color="#666" />
          <Text style={styles.statText}>{group.post_count || 0} posts</Text>
        </View>
        <View style={styles.stat}>
          <MaterialIcons name="schedule" size={16} color="#666" />
          <Text style={styles.statText}>
            {group.last_activity ? 'Active' : 'New'}
          </Text>
        </View>
      </View>

      <View style={styles.groupActions}>
        {group.user_is_member ? (
          <TouchableOpacity style={styles.memberButton}>
            <MaterialIcons name="check" size={16} color="#2E7D32" />
            <Text style={styles.memberButtonText}>Member</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoinGroup(group.id)}
          >
            <MaterialIcons name="add" size={16} color="#fff" />
            <Text style={styles.joinButtonText}>Join Group</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.previewButton}>
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
      </View>

      {group.tags && group.tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.groupTags}
        >
          {group.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Support Groups</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateGroup(true)}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search support groups..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {renderCategorySelector()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredGroups.length} groups found
        </Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowFilters(true)}
        >
          <MaterialIcons name="sort" size={18} color="#666" />
          <Text style={styles.sortText}>Sort</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="group-add" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Groups Found</Text>
      <Text style={styles.emptyText}>
        {selectedCategory === 'all'
          ? 'Be the first to create a support group for your community!'
          : `No support groups found for ${conditionCategories.find(c => c.id === selectedCategory)?.name}. Create one now!`
        }
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowCreateGroup(true)}
      >
        <Text style={styles.emptyButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading support groups...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2E7D32']}
            tintColor="#2E7D32"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredGroups.length === 0 ? styles.emptyContent : null}
      />

      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSubmit={handleCreateGroup}
        categories={conditionCategories.filter(c => c.id !== 'all')}
        user={user}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  categorySelector: {
    marginBottom: 16,
  },
  categorySelectorContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  categoryTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  groupCategory: {
    fontSize: 14,
    color: '#666',
  },
  groupBadges: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    marginLeft: 8,
  },
  privateBadge: {
    marginLeft: 8,
  },
  groupDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  groupStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  memberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  memberButtonText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  previewButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  groupTags: {
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
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

export default SupportGroups;