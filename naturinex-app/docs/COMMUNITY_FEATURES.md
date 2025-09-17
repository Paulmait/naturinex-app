# NaturineX Community Features

## Overview

NaturineX includes a comprehensive community platform designed to boost user retention and engagement through social features, gamification, and expert interactions. The community system enables users to connect, share experiences, learn from experts, and participate in wellness-focused discussions.

## Key Features

### 1. Support Groups
- **Condition-specific communities** for different health conditions
- **Private and public groups** with approval workflows
- **Moderation tools** and community guidelines enforcement
- **Group management** with member roles and permissions

### 2. Community Feed
- **Real-time content feed** with posts, comments, and reactions
- **Content types**: General posts, success stories, questions, progress updates, reviews
- **Advanced filtering** by content type, condition, and tags
- **Anonymous posting** options for privacy

### 3. Expert Q&A System
- **Verified medical professionals** can answer user questions
- **Question categorization** by health topics
- **Urgency levels** for prioritizing questions
- **Peer review system** for expert answers

### 4. Recipe & Content Sharing
- **Natural remedy recipes** with ingredients and instructions
- **Safety information** and health warnings
- **User ratings and reviews** for shared content
- **Progress tracking** and journey documentation

### 5. Gamification System
- **Points and levels** based on community participation
- **Achievement badges** for various milestones
- **Leaderboards** and community rankings
- **Activity streaks** and engagement rewards

### 6. Content Moderation
- **AI-powered content filtering** for harmful content
- **Community reporting** system
- **Moderation queue** for manual review
- **Automated flagging** of medical advice and misinformation

## Technical Architecture

### Database Schema

The community features use the following main database tables:

#### Core Community Tables
- `support_groups` - Health condition support groups
- `group_members` - User memberships in groups
- `posts` - User-generated content posts
- `comments` - Comments on posts with threading
- `reactions` - User reactions to posts and comments

#### Content Management
- `remedy_recipes` - User-shared natural remedy recipes
- `user_journeys` - Health and wellness journey tracking
- `journey_updates` - Progress updates on user journeys

#### Gamification
- `user_achievements` - User points, levels, and achievements
- `point_transactions` - Detailed point earning history
- `badges` - Available achievement badges

#### Expert System
- `expert_questions` - Questions submitted to experts
- `expert_answers` - Expert responses to questions
- `medical_professionals` - Verified expert profiles

#### Moderation
- `content_reports` - User reports of inappropriate content
- `moderation_queue` - Content pending moderation review
- `community_analytics` - Engagement and usage analytics

### Service Layer

#### CommunityService
The main service class that handles all community operations:

```javascript
import CommunityService from './services/CommunityService';

// Support Groups
await CommunityService.createSupportGroup(groupData, userId);
await CommunityService.joinSupportGroup(groupId, userId);

// Posts and Content
await CommunityService.createPost(postData, userId);
await CommunityService.addReaction(postId, userId, reactionType);

// Gamification
await CommunityService.awardPoints(userId, action, points);
await CommunityService.getUserProfile(userId);

// Expert Q&A
await CommunityService.submitQuestion(questionData, userId);
await CommunityService.answerQuestion(questionId, answer, expertId);
```

### Component Architecture

#### Main Components
- **CommunityDashboard** - Central hub for all community features
- **CommunityFeed** - Real-time content feed with interactions
- **SupportGroups** - Browse and manage support groups
- **UserProfile** - User achievements and community stats
- **ExpertQA** - Expert question and answer platform
- **RecipeSharing** - Natural remedy recipe platform
- **AchievementSystem** - Gamification dashboard

#### Supporting Components
- **PostCard** - Individual post display with interactions
- **CreatePostModal** - Modal for creating new posts
- **CreateGroupModal** - Modal for creating support groups

## Content Moderation Guidelines

### Automated Moderation
The system automatically flags content containing:
- Medical advice or diagnosis attempts
- Harmful keywords (suicide, self-harm, illegal drugs)
- Excessive negative sentiment
- Personal information disclosure

### Community Guidelines
- Be respectful and supportive
- Share evidence-based information only
- No medical advice or diagnosis
- Respect privacy and confidentiality
- Stay wellness-focused and on-topic
- No spam or promotional content

### Moderation Actions
- **Approved** - Content visible to all users
- **Pending** - Content under review
- **Flagged** - Content reported by users
- **Rejected** - Content violates guidelines
- **Hidden** - Content temporarily hidden

## Gamification System

### Point System
- **Create Post**: 10 points
- **Create Comment**: 5 points
- **Add Reaction**: 2 points
- **Ask Question**: 5 points
- **Answer Question** (Expert): 20 points
- **Share Recipe**: 15 points

### Achievement Badges
- **Welcome Aboard** - Join the community
- **First Voice** - Create first post
- **Prolific Poster** - Create 10 posts
- **Helpful Commenter** - Make 50 helpful comments
- **Community Supporter** - Give 100 supportive reactions
- **Recipe Master** - Share 5 recipes
- **Wisdom Seeker** - Ask 10 expert questions
- **Community Mentor** - Reach level 10
- **Streak Warrior** - 30-day activity streak

### Levels and Titles
1. Newcomer
2. Explorer
3. Member
4. Active Member
5. Contributor
6. Regular Contributor
7. Valued Member
8. Community Helper
9. Community Leader
10. Wellness Mentor

## Privacy and Security

### Data Protection
- **Encrypted storage** for sensitive content (posts, comments, personal info)
- **Anonymous posting** options for privacy
- **Data retention policies** with automatic cleanup
- **User consent tracking** for data usage

### Safety Features
- **Content filtering** for harmful information
- **Medical disclaimer** enforcement
- **Expert verification** for medical professionals
- **Reporting system** for inappropriate content

## Analytics and Insights

### Community Metrics
- Active users (daily, weekly, monthly)
- Content creation rates
- Engagement metrics (reactions, comments, shares)
- User retention and activity patterns

### Individual Metrics
- User engagement scores
- Contribution quality ratings
- Community impact measurements
- Achievement progress tracking

## Integration with Main App

### Navigation
Community features are integrated into the main app navigation:
- Dashboard tab includes community quick actions
- Dedicated community section in main navigation
- Context-aware community suggestions based on user conditions

### Data Sync
- User health data informs community recommendations
- Community insights enhance personalized recommendations
- Shared content contributes to knowledge base

## Future Enhancements

### Planned Features
- **Video content** support for recipe demonstrations
- **Live chat** and real-time messaging
- **Event scheduling** for virtual support group meetings
- **AI-powered** content recommendations
- **Integration** with telemedicine services
- **Multi-language** support for global community

### Technical Improvements
- **Real-time notifications** using WebSockets
- **Offline support** for content viewing
- **Advanced search** with machine learning
- **Performance optimizations** for large-scale usage
- **Mobile app** native implementations

## Usage Examples

### Creating a Support Group
```javascript
const groupData = {
  name: "Type 2 Diabetes Support",
  description: "A supportive community for managing diabetes naturally",
  conditionCategory: "diabetes",
  tags: ["diabetes", "natural", "diet", "exercise"],
  isPrivate: false,
  requiresApproval: true,
  maxMembers: 500
};

await CommunityService.createSupportGroup(groupData, userId);
```

### Sharing a Recipe
```javascript
const recipeData = {
  title: "Anti-Inflammatory Golden Milk",
  description: "Turmeric-based drink for inflammation relief",
  category: "teas_beverages",
  ingredients: [
    { name: "Turmeric powder", amount: "1", unit: "tsp" },
    { name: "Coconut milk", amount: "1", unit: "cup" }
  ],
  instructions: ["Heat coconut milk", "Add turmeric", "Stir well"],
  conditions_helped: ["Inflammation", "Joint Pain"],
  difficulty: "easy",
  prep_time_minutes: 5
};

await CommunityService.createRemedyRecipe(recipeData, userId);
```

### Tracking User Progress
```javascript
// Award points for user actions
await CommunityService.awardPoints(userId, 'create_post', 10);

// Check for new achievements
const achievements = await CommunityService.checkAndAwardAchievements(
  userId,
  'create_post',
  totalPoints,
  userLevel
);

// Update user profile
const profile = await CommunityService.getUserProfile(userId);
```

This comprehensive community system provides a robust platform for user engagement, knowledge sharing, and peer support within the NaturineX ecosystem.