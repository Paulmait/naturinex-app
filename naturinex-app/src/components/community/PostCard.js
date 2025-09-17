/**
 * Post Card Component
 * Individual post display with interactions, media, and engagement features
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

const PostCard = ({
  post,
  currentUser,
  onReaction,
  onComment,
  onShare,
  onUserPress,
  onGroupPress,
  style
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [imageError, setImageError] = useState({});

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - postTime) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postTime.toLocaleDateString();
  };

  const getPostTypeIcon = (postType) => {
    switch (postType) {
      case 'success_story':
        return { name: 'celebration', color: '#4CAF50' };
      case 'question':
        return { name: 'help-outline', color: '#2196F3' };
      case 'recipe':
        return { name: 'restaurant', color: '#FF9800' };
      case 'progress':
        return { name: 'trending-up', color: '#9C27B0' };
      case 'review':
        return { name: 'star', color: '#FFC107' };
      default:
        return { name: 'article', color: '#666' };
    }
  };

  const getPostTypeLabel = (postType) => {
    switch (postType) {
      case 'success_story':
        return 'Success Story';
      case 'question':
        return 'Question';
      case 'recipe':
        return 'Recipe';
      case 'progress':
        return 'Progress Update';
      case 'review':
        return 'Review';
      default:
        return 'Post';
    }
  };

  const handleReaction = (reactionType) => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please log in to react to posts');
      return;
    }
    onReaction(post.id, reactionType);
  };

  const handleUserPress = () => {
    if (post.is_anonymous) return;
    onUserPress(post.author_id);
  };

  const renderReactionButton = (reactionType, icon, count) => {
    const userReaction = post.user_reactions?.find(r => r.reaction_type === reactionType);
    const isActive = !!userReaction;

    return (
      <TouchableOpacity
        style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
        onPress={() => handleReaction(reactionType)}
      >
        <MaterialIcons
          name={icon}
          size={18}
          color={isActive ? '#2E7D32' : '#666'}
        />
        <Text style={[
          styles.reactionCount,
          isActive && styles.reactionCountActive
        ]}>
          {count || 0}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMedia = () => {
    if (!post.media_urls || post.media_urls.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.mediaContainer}
      >
        {post.media_urls.map((url, index) => (
          <TouchableOpacity
            key={index}
            style={styles.mediaItem}
            onPress={() => {
              // Open image viewer
            }}
          >
            <Image
              source={{ uri: url }}
              style={styles.mediaImage}
              onError={() => setImageError(prev => ({ ...prev, [index]: true }))}
            />
            {imageError[index] && (
              <View style={styles.imageErrorOverlay}>
                <MaterialIcons name="broken-image" size={24} color="#ccc" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderTags = () => {
    if (!post.tags || post.tags.length === 0) return null;

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsContainer}
      >
        {post.tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>#{tag}</Text>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderContent = () => {
    const maxLength = 300;
    const content = post.content || '';
    const shouldTruncate = content.length > maxLength && !showFullContent;

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.content}>
          {shouldTruncate ? `${content.substring(0, maxLength)}...` : content}
        </Text>
        {content.length > maxLength && (
          <TouchableOpacity
            onPress={() => setShowFullContent(!showFullContent)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>
              {showFullContent ? 'Read Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const postTypeInfo = getPostTypeIcon(post.post_type);

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={handleUserPress}
          disabled={post.is_anonymous}
        >
          <View style={styles.avatar}>
            {post.is_anonymous ? (
              <MaterialIcons name="person" size={20} color="#666" />
            ) : (
              <Image
                source={{
                  uri: post.profiles?.avatar_url || 'https://via.placeholder.com/40'
                }}
                style={styles.avatarImage}
              />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>
              {post.is_anonymous ? 'Anonymous' : post.profiles?.display_name || 'Community Member'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
              {post.support_groups && (
                <>
                  <Text style={styles.separator}>•</Text>
                  <TouchableOpacity onPress={() => onGroupPress(post.group_id)}>
                    <Text style={styles.groupName}>{post.support_groups.name}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.postType}>
          <MaterialIcons
            name={postTypeInfo.name}
            size={16}
            color={postTypeInfo.color}
          />
          <Text style={[styles.postTypeText, { color: postTypeInfo.color }]}>
            {getPostTypeLabel(post.post_type)}
          </Text>
        </View>
      </View>

      {/* Title */}
      {post.title && (
        <Text style={styles.title}>{post.title}</Text>
      )}

      {/* Content */}
      {renderContent()}

      {/* Media */}
      {renderMedia()}

      {/* Tags */}
      {renderTags()}

      {/* Engagement Bar */}
      <View style={styles.engagementBar}>
        <View style={styles.reactions}>
          {renderReactionButton('helpful', 'thumb-up', post.helpful_count)}
          {renderReactionButton('support', 'favorite', post.support_count)}
          {renderReactionButton('celebrate', 'celebration', post.celebrate_count)}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onComment(post.id)}
          >
            <MaterialIcons name="chat-bubble-outline" size={18} color="#666" />
            <Text style={styles.actionText}>{post.comment_count || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShare(post)}
          >
            <MaterialIcons name="share" size={18} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="bookmark-border" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Moderation Status */}
      {post.moderation_status === 'flagged' && (
        <View style={styles.moderationBanner}>
          <MaterialIcons name="flag" size={16} color="#FF9800" />
          <Text style={styles.moderationText}>Content under review</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  groupName: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  postType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  postTypeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    marginBottom: 8,
    lineHeight: 24,
  },
  contentContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  content: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  readMoreButton: {
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  mediaContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  mediaItem: {
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  imageErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tagsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '500',
  },
  engagementBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  reactions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  reactionButtonActive: {
    backgroundColor: '#E8F5E8',
  },
  reactionCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  reactionCountActive: {
    color: '#2E7D32',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  moderationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  moderationText: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default PostCard;