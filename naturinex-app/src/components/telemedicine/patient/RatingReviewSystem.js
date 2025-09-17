/**
 * RatingReviewSystem - Patient rating and review system for healthcare providers
 * Allows patients to rate consultations and provide feedback
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import {
  Star, User, Calendar, Clock, CheckCircle, MessageSquare,
  ThumbsUp, ThumbsDown, Send, Heart, Award
} from 'lucide-react';
import { telemedicineService } from '../../../services/telemedicineService';

const RatingReviewSystem = ({ route, navigation }) => {
  const { consultationId, providerId, providerName } = route.params;

  const [consultation, setConsultation] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isWeb = useMediaQuery({ query: '(min-width: 768px)' });

  const ratingCategories = [
    { id: 'communication', label: 'Clear Communication', icon: MessageSquare },
    { id: 'professionalism', label: 'Professionalism', icon: Award },
    { id: 'knowledge', label: 'Medical Knowledge', icon: User },
    { id: 'timeliness', label: 'Punctuality', icon: Clock },
    { id: 'empathy', label: 'Bedside Manner', icon: Heart },
    { id: 'technology', label: 'Tech Experience', icon: CheckCircle }
  ];

  const quickReviewOptions = [
    'Excellent consultation',
    'Very knowledgeable doctor',
    'Great communication',
    'Solved my problem quickly',
    'Would recommend',
    'Professional and caring',
    'Easy to understand',
    'Thorough examination'
  ];

  useEffect(() => {
    loadConsultationDetails();
  }, [consultationId]);

  const loadConsultationDetails = async () => {
    try {
      setLoading(true);

      // Mock consultation data
      const consultationData = {
        id: consultationId,
        providerId,
        providerName,
        providerSpecialty: 'General Medicine',
        date: '2024-01-15T14:30:00Z',
        duration: 30,
        chiefComplaint: 'Follow-up diabetes management',
        diagnosis: 'Type 2 Diabetes - well controlled',
        consultationFee: 75,
        alreadyRated: false
      };

      setConsultation(consultationData);
    } catch (error) {
      console.error('Error loading consultation details:', error);
      Alert.alert('Error', 'Failed to load consultation details');
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = (selectedRating) => {
    setRating(selectedRating);
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const addQuickReview = (text) => {
    if (review.includes(text)) return;

    setReview(prev => {
      const newReview = prev ? `${prev} ${text}.` : `${text}.`;
      return newReview;
    });
  };

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting');
      return;
    }

    try {
      setSubmitting(true);

      const ratingData = {
        consultationId,
        providerId,
        rating,
        review: review.trim(),
        categories: selectedCategories,
        isAnonymous,
        submittedAt: new Date().toISOString()
      };

      // In real implementation, submit to API
      console.log('Submitting rating:', ratingData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Thank You!',
        'Your rating and review have been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Rate your experience';
    }
  };

  const getRatingColor = (rating) => {
    if (rating <= 2) return '#EF4444';
    if (rating === 3) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading consultation details...</Text>
      </View>
    );
  }

  if (consultation?.alreadyRated) {
    return (
      <View style={styles.container}>
        <View style={styles.alreadyRatedContainer}>
          <CheckCircle size={64} color="#10B981" />
          <Text style={styles.alreadyRatedTitle}>Already Rated</Text>
          <Text style={styles.alreadyRatedText}>
            You have already submitted a rating for this consultation.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.headerBackButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Experience</Text>
        <View />
      </View>

      <ScrollView style={styles.content}>
        {/* Consultation Summary */}
        <View style={styles.consultationSummary}>
          <View style={styles.providerInfo}>
            <View style={styles.providerAvatar}>
              <User size={32} color="#4F46E5" />
            </View>
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>{consultation.providerName}</Text>
              <Text style={styles.providerSpecialty}>{consultation.providerSpecialty}</Text>
              <Text style={styles.consultationDate}>
                {new Date(consultation.date).toLocaleDateString()} • {consultation.duration} min
              </Text>
            </View>
          </View>

          <View style={styles.consultationDetails}>
            <Text style={styles.consultationTitle}>Consultation Details</Text>
            <Text style={styles.consultationComplaint}>{consultation.chiefComplaint}</Text>
            {consultation.diagnosis && (
              <Text style={styles.consultationDiagnosis}>
                Diagnosis: {consultation.diagnosis}
              </Text>
            )}
          </View>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>How would you rate your overall experience?</Text>

          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.starButton}
                onPress={() => handleStarPress(star)}
              >
                <Star
                  size={40}
                  color={star <= rating ? '#F59E0B' : '#E5E7EB'}
                  fill={star <= rating ? '#F59E0B' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 && (
            <View style={styles.ratingFeedback}>
              <Text style={[styles.ratingText, { color: getRatingColor(rating) }]}>
                {getRatingText(rating)}
              </Text>
            </View>
          )}
        </View>

        {/* Category Rating */}
        {rating > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>What did you like most?</Text>
            <Text style={styles.sectionSubtitle}>Select all that apply</Text>

            <View style={styles.categoriesGrid}>
              {ratingCategories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategories.includes(category.id);

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                    onPress={() => toggleCategory(category.id)}
                  >
                    <IconComponent
                      size={20}
                      color={isSelected ? '#4F46E5' : '#6B7280'}
                    />
                    <Text style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected
                    ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Review Options */}
        {rating >= 4 && (
          <View style={styles.quickReviewSection}>
            <Text style={styles.sectionTitle}>Quick feedback</Text>
            <Text style={styles.sectionSubtitle}>Tap to add to your review</Text>

            <View style={styles.quickReviewOptions}>
              {quickReviewOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReviewButton}
                  onPress={() => addQuickReview(option)}
                >
                  <Text style={styles.quickReviewText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Written Review */}
        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>
            {rating >= 4 ? 'Tell others what was great' : 'Help us improve'}
          </Text>
          <Text style={styles.sectionSubtitle}>
            {rating >= 4
              ? 'Your review will help other patients'
              : 'What could have been better?'
            }
          </Text>

          <TextInput
            style={styles.reviewInput}
            placeholder={
              rating >= 4
                ? 'Share your positive experience...'
                : 'Let us know how we can improve...'
            }
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            maxLength={500}
          />

          <Text style={styles.characterCount}>{review.length}/500</Text>
        </View>

        {/* Privacy Options */}
        <View style={styles.privacySection}>
          <TouchableOpacity
            style={styles.privacyOption}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={[styles.checkbox, isAnonymous && styles.checkboxChecked]}>
              {isAnonymous && <CheckCircle size={16} color="#fff" />}
            </View>
            <View style={styles.privacyText}>
              <Text style={styles.privacyTitle}>Submit anonymously</Text>
              <Text style={styles.privacyDescription}>
                Your name won't be shown with this review
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              rating === 0 && styles.submitButtonDisabled
            ]}
            onPress={submitRating}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <Text style={styles.submitButtonText}>Submitting...</Text>
            ) : (
              <>
                <Send size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.submitNote}>
            Your review helps improve our service and assists other patients
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyRatedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  alreadyRatedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  alreadyRatedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    color: '#4F46E5',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  consultationSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  providerSpecialty: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  consultationDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  consultationDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  consultationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  consultationComplaint: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  consultationDiagnosis: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 20,
  },
  starButton: {
    padding: 4,
  },
  ratingFeedback: {
    alignItems: 'center',
    marginTop: 16,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  categorySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  quickReviewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickReviewOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReviewButton: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  quickReviewText: {
    fontSize: 12,
    color: '#3B82F6',
  },
  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F9FAFB',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  privacySection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  privacyText: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  privacyDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  submitSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
    maxWidth: 280,
  },
});

export default RatingReviewSystem;