/**
 * Expert Q&A Component
 * Platform for users to ask questions and receive answers from verified medical experts
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

const ExpertQA = ({ user, navigation }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAskQuestion, setShowAskQuestion] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [questionText, setQuestionText] = useState('');
  const [questionCategory, setQuestionCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [urgency, setUrgency] = useState('normal');

  const categories = [
    { id: 'all', name: 'All Questions', icon: 'help' },
    { id: 'nutrition', name: 'Nutrition & Diet', icon: 'restaurant' },
    { id: 'supplements', name: 'Supplements & Herbs', icon: 'medication' },
    { id: 'exercise', name: 'Exercise & Fitness', icon: 'fitness-center' },
    { id: 'mental_health', name: 'Mental Health', icon: 'psychology' },
    { id: 'chronic_conditions', name: 'Chronic Conditions', icon: 'healing' },
    { id: 'preventive_care', name: 'Preventive Care', icon: 'health-and-safety' },
    { id: 'alternative_medicine', name: 'Alternative Medicine', icon: 'spa' },
    { id: 'womens_health', name: "Women's Health", icon: 'woman' },
    { id: 'mens_health', name: "Men's Health", icon: 'man' },
    { id: 'pediatric', name: 'Pediatric Health', icon: 'child-care' },
    { id: 'senior_health', name: 'Senior Health', icon: 'elderly' }
  ];

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      // This would need to be implemented in CommunityService
      // const questionsData = await CommunityService.getExpertQuestions({
      //   category: categoryFilter === 'all' ? null : categoryFilter,
      //   status: activeTab === 'recent' ? null : activeTab,
      //   limit: 20
      // });
      // setQuestions(questionsData);

      // Mock data for now
      const mockQuestions = [
        {
          id: '1',
          question: 'What are the best natural alternatives for managing type 2 diabetes?',
          category: 'chronic_conditions',
          author_id: 'user1',
          is_anonymous: false,
          urgency: 'normal',
          status: 'answered',
          created_at: '2024-01-15T10:00:00Z',
          upvote_count: 5,
          view_count: 120,
          profiles: { display_name: 'Sarah M.' },
          expert_answers: [{
            id: 'ans1',
            answer: 'There are several evidence-based natural approaches...',
            expert_id: 'expert1',
            created_at: '2024-01-15T14:00:00Z',
            helpful_votes: 8,
            profiles: { display_name: 'Dr. Johnson, MD' }
          }]
        },
        {
          id: '2',
          question: 'Is turmeric safe to take with blood pressure medications?',
          category: 'supplements',
          author_id: 'user2',
          is_anonymous: true,
          urgency: 'high',
          status: 'open',
          created_at: '2024-01-16T09:00:00Z',
          upvote_count: 3,
          view_count: 45,
          profiles: null,
          expert_answers: []
        }
      ];
      setQuestions(mockQuestions);
    } catch (error) {
      console.error('Error loading questions:', error);
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryFilter, activeTab]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadQuestions();
  };

  const handleAskQuestion = async () => {
    if (!questionText.trim()) {
      Alert.alert('Error', 'Please enter your question');
      return;
    }

    if (!questionCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    try {
      const questionData = {
        question: questionText,
        category: questionCategory,
        isAnonymous,
        urgency,
        tags: []
      };

      const newQuestion = await CommunityService.submitQuestion(questionData, user.uid);
      setQuestions(prev => [newQuestion, ...prev]);
      setShowAskQuestion(false);
      setQuestionText('');
      setQuestionCategory('');
      setIsAnonymous(false);
      setUrgency('normal');

      Alert.alert('Success', 'Your question has been submitted and will be reviewed by our experts.');
    } catch (error) {
      console.error('Error submitting question:', error);
      Alert.alert('Error', 'Failed to submit question');
    }
  };

  const handleUpvoteQuestion = async (questionId) => {
    try {
      // Implement upvote functionality
      setQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, upvote_count: q.upvote_count + 1 }
          : q
      ));
    } catch (error) {
      console.error('Error upvoting question:', error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return time.toLocaleDateString();
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'normal': return '#4CAF50';
      case 'low': return '#9E9E9E';
      default: return '#4CAF50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered': return '#4CAF50';
      case 'open': return '#2196F3';
      case 'closed': return '#9E9E9E';
      case 'flagged': return '#F44336';
      default: return '#2196F3';
    }
  };

  const renderCategoryFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryFilter}
      contentContainerStyle={styles.categoryFilterContent}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            categoryFilter === category.id && styles.categoryChipActive
          ]}
          onPress={() => setCategoryFilter(category.id)}
        >
          <MaterialIcons
            name={category.icon}
            size={16}
            color={categoryFilter === category.id ? '#fff' : '#666'}
          />
          <Text style={[
            styles.categoryText,
            categoryFilter === category.id && styles.categoryTextActive
          ]}>
            {category.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderQuestionCard = ({ item: question }) => (
    <TouchableOpacity
      style={styles.questionCard}
      onPress={() => navigation.navigate('QuestionDetail', { questionId: question.id })}
    >
      <View style={styles.questionHeader}>
        <View style={styles.questionMeta}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {question.is_anonymous ? 'Anonymous' : question.profiles?.display_name || 'Community Member'}
            </Text>
            <Text style={styles.timestamp}>{formatTimeAgo(question.created_at)}</Text>
          </View>
          <View style={styles.statusBadges}>
            <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(question.urgency) }]}>
              <Text style={styles.urgencyText}>{question.urgency}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(question.status) }]}>
              <Text style={styles.statusText}>{question.status}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.questionText} numberOfLines={3}>
        {question.question}
      </Text>

      <View style={styles.categoryTag}>
        <MaterialIcons
          name={categories.find(c => c.id === question.category)?.icon || 'help'}
          size={14}
          color="#666"
        />
        <Text style={styles.categoryTagText}>
          {categories.find(c => c.id === question.category)?.name || question.category}
        </Text>
      </View>

      <View style={styles.questionFooter}>
        <View style={styles.questionStats}>
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => handleUpvoteQuestion(question.id)}
          >
            <MaterialIcons name="thumb-up" size={16} color="#666" />
            <Text style={styles.statText}>{question.upvote_count}</Text>
          </TouchableOpacity>

          <View style={styles.statItem}>
            <MaterialIcons name="visibility" size={16} color="#666" />
            <Text style={styles.statText}>{question.view_count}</Text>
          </View>

          <View style={styles.statItem}>
            <MaterialIcons name="chat-bubble-outline" size={16} color="#666" />
            <Text style={styles.statText}>{question.expert_answers?.length || 0}</Text>
          </View>
        </View>

        {question.expert_answers && question.expert_answers.length > 0 && (
          <View style={styles.answerPreview}>
            <MaterialIcons name="verified-user" size={16} color="#4CAF50" />
            <Text style={styles.answerText}>
              Answered by {question.expert_answers[0].profiles?.display_name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
        onPress={() => setActiveTab('recent')}
      >
        <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>
          Recent
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'open' && styles.activeTab]}
        onPress={() => setActiveTab('open')}
      >
        <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
          Open
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'answered' && styles.activeTab]}
        onPress={() => setActiveTab('answered')}
      >
        <Text style={[styles.tabText, activeTab === 'answered' && styles.activeTabText]}>
          Answered
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Expert Q&A</Text>
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => setShowAskQuestion(true)}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.askButtonText}>Ask</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        Get answers from verified medical professionals
      </Text>

      {renderTabNavigation()}
      {renderCategoryFilter()}
    </View>
  );

  const renderAskQuestionModal = () => (
    <Modal
      visible={showAskQuestion}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAskQuestion(false)}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Ask a Question</Text>
          <TouchableOpacity onPress={handleAskQuestion}>
            <Text style={styles.submitText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Your Question *</Text>
            <TextInput
              style={styles.questionInput}
              placeholder="What would you like to ask our experts?"
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <Text style={styles.charCount}>{questionText.length}/500</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.filter(c => c.id !== 'all').map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    questionCategory === category.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => setQuestionCategory(category.id)}
                >
                  <MaterialIcons
                    name={category.icon}
                    size={16}
                    color={questionCategory === category.id ? '#fff' : '#666'}
                  />
                  <Text style={[
                    styles.categoryOptionText,
                    questionCategory === category.id && styles.categoryOptionTextSelected
                  ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Urgency</Text>
            <View style={styles.urgencyOptions}>
              {['low', 'normal', 'high', 'urgent'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyOption,
                    urgency === level && styles.urgencyOptionSelected,
                    { backgroundColor: urgency === level ? getUrgencyColor(level) : '#f0f0f0' }
                  ]}
                  onPress={() => setUrgency(level)}
                >
                  <Text style={[
                    styles.urgencyOptionText,
                    urgency === level && styles.urgencyOptionTextSelected
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <MaterialIcons
                name={isAnonymous ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#2E7D32"
              />
              <Text style={styles.checkboxLabel}>Ask anonymously</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disclaimer}>
            <MaterialIcons name="info" size={16} color="#666" />
            <Text style={styles.disclaimerText}>
              This is for educational purposes only and not a substitute for professional medical advice.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="help-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Questions Yet</Text>
      <Text style={styles.emptyText}>
        Be the first to ask a question to our expert community!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowAskQuestion(true)}
      >
        <Text style={styles.emptyButtonText}>Ask First Question</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingAnimation />
        <Text style={styles.loadingText}>Loading expert Q&A...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={questions}
        renderItem={renderQuestionCard}
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
        contentContainerStyle={questions.length === 0 ? styles.emptyContent : null}
      />

      {renderAskQuestionModal()}
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  askButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  askButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  tabNavigation: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
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
  categoryFilter: {
    marginBottom: 8,
  },
  categoryFilterContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2E7D32',
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryTextActive: {
    color: '#fff',
  },
  questionCard: {
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
  questionHeader: {
    marginBottom: 12,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  statusBadges: {
    flexDirection: 'row',
  },
  urgencyBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  urgencyText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginBottom: 12,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionStats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  answerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  answerText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  submitText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formGroup: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  questionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  categoryOptionTextSelected: {
    color: '#fff',
  },
  urgencyOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urgencyOption: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  urgencyOptionSelected: {
    backgroundColor: '#2E7D32',
  },
  urgencyOptionText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  urgencyOptionTextSelected: {
    color: '#fff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
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

export default ExpertQA;