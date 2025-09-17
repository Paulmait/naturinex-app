/**
 * BookAppointment - Patient appointment booking interface
 * Allows patients to search providers, select time slots, and book telemedicine appointments
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import {
  Calendar, Clock, Search, Filter, Star, MapPin, DollarSign,
  Video, User, CheckCircle, ArrowRight, Heart, Brain, Eye
} from 'lucide-react';
import { telemedicineService } from '../../../services/telemedicineService';

const BookAppointment = ({ route, navigation }) => {
  const { patientId } = route.params;

  const [currentStep, setCurrentStep] = useState(1); // 1: specialty, 2: provider, 3: time, 4: details, 5: confirmation
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [providers, setProviders] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const [appointmentDetails, setAppointmentDetails] = useState({
    reason: '',
    symptoms: '',
    duration: '',
    urgency: 'routine',
    previousTreatment: '',
    allergies: '',
    currentMedications: ''
  });

  const isWeb = useMediaQuery({ query: '(min-width: 768px)' });

  const specialties = [
    { id: 'general', name: 'General Medicine', icon: Heart, color: '#10B981' },
    { id: 'cardiology', name: 'Cardiology', icon: Heart, color: '#EF4444' },
    { id: 'dermatology', name: 'Dermatology', icon: User, color: '#F59E0B' },
    { id: 'psychiatry', name: 'Mental Health', icon: Brain, color: '#8B5CF6' },
    { id: 'ophthalmology', name: 'Eye Care', icon: Eye, color: '#3B82F6' },
    { id: 'pediatrics', name: 'Pediatrics', icon: Heart, color: '#10B981' }
  ];

  useEffect(() => {
    if (selectedSpecialty && currentStep === 2) {
      loadProviders();
    }
  }, [selectedSpecialty, currentStep]);

  useEffect(() => {
    if (selectedProvider && selectedDate && currentStep === 3) {
      loadAvailableSlots();
    }
  }, [selectedProvider, selectedDate, currentStep]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const result = await telemedicineService.getAvailableProviders(selectedSpecialty);

      // Mock data for demonstration
      const mockProviders = [
        {
          id: 'prov_001',
          name: 'Dr. Sarah Wilson',
          specialty: 'General Medicine',
          rating: 4.8,
          reviewCount: 127,
          experience: '8 years',
          education: 'MD - Harvard Medical School',
          languages: ['English', 'Spanish'],
          consultationFee: 75,
          nextAvailable: '2024-01-16',
          profileImage: null,
          bio: 'Experienced family physician specializing in preventive care and chronic disease management.',
          certifications: ['Board Certified Family Medicine', 'Telemedicine Certified']
        },
        {
          id: 'prov_002',
          name: 'Dr. Michael Chen',
          specialty: 'General Medicine',
          rating: 4.9,
          reviewCount: 203,
          experience: '12 years',
          education: 'MD - Johns Hopkins University',
          languages: ['English', 'Mandarin'],
          consultationFee: 85,
          nextAvailable: '2024-01-15',
          profileImage: null,
          bio: 'Internal medicine specialist with expertise in diabetes and cardiovascular health.',
          certifications: ['Board Certified Internal Medicine', 'Diabetes Care Specialist']
        }
      ];

      setProviders(mockProviders);
    } catch (error) {
      console.error('Error loading providers:', error);
      Alert.alert('Error', 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      // Mock available time slots
      const mockSlots = [
        { time: '09:00', available: true },
        { time: '09:30', available: true },
        { time: '10:00', available: false },
        { time: '10:30', available: true },
        { time: '11:00', available: true },
        { time: '11:30', available: false },
        { time: '14:00', available: true },
        { time: '14:30', available: true },
        { time: '15:00', available: true },
        { time: '15:30', available: false },
        { time: '16:00', available: true },
        { time: '16:30', available: true }
      ];

      setAvailableSlots(mockSlots);
    } catch (error) {
      console.error('Error loading available slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const bookAppointment = async () => {
    try {
      setLoading(true);

      const appointmentData = {
        patient_id: patientId,
        provider_id: selectedProvider.id,
        scheduled_datetime: `${selectedDate}T${selectedTimeSlot}:00`,
        consultation_type: 'telemedicine',
        reason: appointmentDetails.reason,
        symptoms: appointmentDetails.symptoms,
        urgency: appointmentDetails.urgency,
        duration_minutes: 30,
        consultation_fee: selectedProvider.consultationFee,
        patient_notes: {
          previousTreatment: appointmentDetails.previousTreatment,
          allergies: appointmentDetails.allergies,
          currentMedications: appointmentDetails.currentMedications
        }
      };

      const result = await telemedicineService.scheduleAppointment(appointmentData);

      if (result.success) {
        setCurrentStep(5);
        Alert.alert('Success', 'Your appointment has been booked successfully!');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const generateDateOptions = () => {
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })
      });
    }

    return dates;
  };

  const ProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.progressStep}>
          <View
            style={[
              styles.progressCircle,
              currentStep >= step && styles.progressCircleActive,
              currentStep > step && styles.progressCircleComplete
            ]}
          >
            {currentStep > step ? (
              <CheckCircle size={16} color="#fff" />
            ) : (
              <Text style={[
                styles.progressNumber,
                currentStep >= step && styles.progressNumberActive
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 5 && (
            <View
              style={[
                styles.progressLine,
                currentStep > step && styles.progressLineComplete
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const SpecialtySelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose a Specialty</Text>
      <Text style={styles.stepSubtitle}>Select the type of care you need</Text>

      <View style={styles.searchContainer}>
        <Search size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search specialties..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.specialtyGrid}>
        {specialties.map((specialty) => {
          const IconComponent = specialty.icon;
          return (
            <TouchableOpacity
              key={specialty.id}
              style={[
                styles.specialtyCard,
                selectedSpecialty === specialty.id && styles.specialtyCardSelected
              ]}
              onPress={() => setSelectedSpecialty(specialty.id)}
            >
              <View style={[styles.specialtyIcon, { backgroundColor: specialty.color }]}>
                <IconComponent size={24} color="#fff" />
              </View>
              <Text style={styles.specialtyName}>{specialty.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const ProviderSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose a Provider</Text>
      <Text style={styles.stepSubtitle}>
        Available {specialties.find(s => s.id === selectedSpecialty)?.name} specialists
      </Text>

      <ScrollView style={styles.providersList}>
        {providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[
              styles.providerCard,
              selectedProvider?.id === provider.id && styles.providerCardSelected
            ]}
            onPress={() => setSelectedProvider(provider)}
          >
            <View style={styles.providerHeader}>
              <View style={styles.providerAvatar}>
                <User size={32} color="#4F46E5" />
              </View>
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{provider.name}</Text>
                <Text style={styles.providerSpecialty}>{provider.specialty}</Text>
                <View style={styles.providerRating}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>{provider.rating}</Text>
                  <Text style={styles.reviewCount}>({provider.reviewCount} reviews)</Text>
                </View>
              </View>
              <View style={styles.providerPrice}>
                <Text style={styles.priceText}>${provider.consultationFee}</Text>
                <Text style={styles.priceLabel}>consultation</Text>
              </View>
            </View>

            <Text style={styles.providerBio}>{provider.bio}</Text>

            <View style={styles.providerDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Experience</Text>
                <Text style={styles.detailValue}>{provider.experience}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Education</Text>
                <Text style={styles.detailValue}>{provider.education}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Next Available</Text>
                <Text style={styles.detailValue}>{provider.nextAvailable}</Text>
              </View>
            </View>

            <View style={styles.certifications}>
              {provider.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationBadge}>
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const TimeSelection = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Date & Time</Text>
      <Text style={styles.stepSubtitle}>
        Choose your preferred appointment time with {selectedProvider?.name}
      </Text>

      {/* Date Selection */}
      <View style={styles.dateSection}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {generateDateOptions().map((dateOption) => (
            <TouchableOpacity
              key={dateOption.date}
              style={[
                styles.dateCard,
                selectedDate === dateOption.date && styles.dateCardSelected
              ]}
              onPress={() => setSelectedDate(dateOption.date)}
            >
              <Text style={[
                styles.dateText,
                selectedDate === dateOption.date && styles.dateTextSelected
              ]}>
                {dateOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Time Selection */}
      {selectedDate && (
        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>Available Time Slots</Text>
          <View style={styles.timeGrid}>
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot.time}
                style={[
                  styles.timeSlot,
                  !slot.available && styles.timeSlotDisabled,
                  selectedTimeSlot === slot.time && styles.timeSlotSelected
                ]}
                onPress={() => slot.available && setSelectedTimeSlot(slot.time)}
                disabled={!slot.available}
              >
                <Text style={[
                  styles.timeText,
                  !slot.available && styles.timeTextDisabled,
                  selectedTimeSlot === slot.time && styles.timeTextSelected
                ]}>
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const AppointmentDetails = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Appointment Details</Text>
      <Text style={styles.stepSubtitle}>Please provide information about your consultation</Text>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Reason for Visit *</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Briefly describe the reason for your appointment..."
          value={appointmentDetails.reason}
          onChangeText={(text) => setAppointmentDetails(prev => ({ ...prev, reason: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Current Symptoms</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Describe your current symptoms..."
          value={appointmentDetails.symptoms}
          onChangeText={(text) => setAppointmentDetails(prev => ({ ...prev, symptoms: text }))}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Urgency Level</Text>
        <View style={styles.urgencyOptions}>
          {[
            { value: 'routine', label: 'Routine', color: '#10B981' },
            { value: 'urgent', label: 'Urgent', color: '#F59E0B' },
            { value: 'emergency', label: 'Emergency', color: '#EF4444' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.urgencyOption,
                appointmentDetails.urgency === option.value && styles.urgencyOptionSelected,
                { borderColor: option.color }
              ]}
              onPress={() => setAppointmentDetails(prev => ({ ...prev, urgency: option.value }))}
            >
              <Text style={[
                styles.urgencyText,
                appointmentDetails.urgency === option.value && { color: option.color }
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Current Medications</Text>
        <TextInput
          style={styles.textInput}
          placeholder="List any medications you're currently taking..."
          value={appointmentDetails.currentMedications}
          onChangeText={(text) => setAppointmentDetails(prev => ({ ...prev, currentMedications: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Known Allergies</Text>
        <TextInput
          style={styles.textInput}
          placeholder="List any known allergies..."
          value={appointmentDetails.allergies}
          onChangeText={(text) => setAppointmentDetails(prev => ({ ...prev, allergies: text }))}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.formLabel}>Previous Treatment</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          placeholder="Any previous treatment for this condition..."
          value={appointmentDetails.previousTreatment}
          onChangeText={(text) => setAppointmentDetails(prev => ({ ...prev, previousTreatment: text }))}
          multiline
          numberOfLines={2}
        />
      </View>
    </ScrollView>
  );

  const Confirmation = () => (
    <ScrollView style={styles.stepContainer}>
      <View style={styles.confirmationHeader}>
        <CheckCircle size={64} color="#10B981" />
        <Text style={styles.confirmationTitle}>Appointment Booked!</Text>
        <Text style={styles.confirmationSubtitle}>
          Your telemedicine appointment has been successfully scheduled
        </Text>
      </View>

      <View style={styles.appointmentSummary}>
        <Text style={styles.summaryTitle}>Appointment Summary</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <User size={20} color="#4F46E5" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Provider</Text>
              <Text style={styles.summaryValue}>{selectedProvider?.name}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Calendar size={20} color="#4F46E5" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {selectedDate} at {selectedTimeSlot}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Video size={20} color="#4F46E5" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Type</Text>
              <Text style={styles.summaryValue}>Telemedicine Video Call</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <DollarSign size={20} color="#4F46E5" />
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryLabel}>Fee</Text>
              <Text style={styles.summaryValue}>${selectedProvider?.consultationFee}</Text>
            </View>
          </View>
        </View>

        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What's Next?</Text>
          <Text style={styles.nextStepsText}>
            • You'll receive a confirmation email shortly
          </Text>
          <Text style={styles.nextStepsText}>
            • A reminder will be sent 24 hours before your appointment
          </Text>
          <Text style={styles.nextStepsText}>
            • Join the video call at your scheduled time
          </Text>
          <Text style={styles.nextStepsText}>
            • Have your insurance card and ID ready
          </Text>
        </View>

        <View style={styles.confirmationActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('PatientDashboard')}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('AppointmentHistory')}
          >
            <Text style={styles.secondaryButtonText}>View All Appointments</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedSpecialty !== null;
      case 2: return selectedProvider !== null;
      case 3: return selectedDate !== null && selectedTimeSlot !== null;
      case 4: return appointmentDetails.reason.trim() !== '';
      default: return true;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Appointment</Text>
        <View />
      </View>

      {/* Progress Indicator */}
      <ProgressIndicator />

      {/* Step Content */}
      <View style={styles.content}>
        {currentStep === 1 && <SpecialtySelection />}
        {currentStep === 2 && <ProviderSelection />}
        {currentStep === 3 && <TimeSelection />}
        {currentStep === 4 && <AppointmentDetails />}
        {currentStep === 5 && <Confirmation />}
      </View>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <View style={styles.navigationButtons}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backNavButton} onPress={previousStep}>
              <Text style={styles.backNavText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              !canProceed() && styles.nextButtonDisabled
            ]}
            onPress={currentStep === 4 ? bookAppointment : nextStep}
            disabled={!canProceed() || loading}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === 4 ? 'Book Appointment' : 'Next'}
            </Text>
            {currentStep < 4 && <ArrowRight size={16} color="#fff" />}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  backButton: {
    color: '#4F46E5',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleActive: {
    backgroundColor: '#4F46E5',
  },
  progressCircleComplete: {
    backgroundColor: '#10B981',
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  progressLineComplete: {
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  specialtyGrid: {
    flex: 1,
  },
  specialtyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialtyCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F0F9FF',
  },
  specialtyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  specialtyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  providersList: {
    flex: 1,
  },
  providerCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F0F9FF',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  providerInfo: {
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
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  providerPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  providerBio: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
    lineHeight: 20,
  },
  providerDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
  },
  certifications: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  certificationBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  certificationText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '500',
  },
  dateSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  dateScroll: {
    flexGrow: 0,
  },
  dateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 100,
    alignItems: 'center',
  },
  dateCardSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
    textAlign: 'center',
  },
  dateTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeSection: {
    marginBottom: 24,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeSlotDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeText: {
    fontSize: 14,
    color: '#111827',
  },
  timeTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeTextDisabled: {
    color: '#9CA3AF',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  urgencyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  urgencyOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  appointmentSummary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
    marginTop: 2,
  },
  nextSteps: {
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  nextStepsText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  confirmationActions: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  secondaryButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  backNavButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  backNavText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BookAppointment;