/**
 * ConsultationHistory - Patient consultation history and medical records
 * Displays past consultations, prescriptions, and allows access to consultation summaries
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import {
  Calendar, Clock, User, Video, Phone, FileText, Pill, Download,
  Star, Search, Filter, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import { telemedicineService } from '../../../services/telemedicineService';

const ConsultationHistory = ({ route, navigation }) => {
  const { patientId } = route.params;

  const [consultations, setConsultations] = useState([]);
  const [filteredConsultations, setFilteredConsultations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, completed, upcoming, cancelled
  const [loading, setLoading] = useState(true);

  const isWeb = useMediaQuery({ query: '(min-width: 768px)' });

  useEffect(() => {
    loadConsultationHistory();
  }, [patientId]);

  useEffect(() => {
    filterConsultations();
  }, [consultations, searchQuery, selectedFilter]);

  const loadConsultationHistory = async () => {
    try {
      setLoading(true);

      // Mock consultation data - in real implementation, fetch from API
      const mockConsultations = [
        {
          id: 'cons_001',
          appointmentId: 'apt_001',
          providerId: 'prov_001',
          providerName: 'Dr. Sarah Wilson',
          providerSpecialty: 'General Medicine',
          scheduledDate: '2024-01-15T14:30:00Z',
          actualStartTime: '2024-01-15T14:32:00Z',
          actualEndTime: '2024-01-15T15:02:00Z',
          duration: 30,
          status: 'completed',
          consultationType: 'video',
          chiefComplaint: 'Follow-up diabetes management',
          diagnosis: 'Type 2 Diabetes - well controlled',
          prescriptions: [
            {
              medication: 'Metformin',
              dosage: '500mg',
              frequency: 'Twice daily',
              duration: '90 days'
            }
          ],
          consultationFee: 75,
          rating: 5,
          patientReview: 'Excellent consultation. Dr. Wilson was very thorough and helpful.',
          followUpRequired: true,
          followUpDate: '2024-04-15',
          hasRecording: true,
          hasNotes: true,
          hasPrescriptions: true
        },
        {
          id: 'cons_002',
          appointmentId: 'apt_002',
          providerId: 'prov_002',
          providerName: 'Dr. Michael Chen',
          providerSpecialty: 'Dermatology',
          scheduledDate: '2024-01-10T10:00:00Z',
          actualStartTime: '2024-01-10T10:05:00Z',
          actualEndTime: '2024-01-10T10:25:00Z',
          duration: 20,
          status: 'completed',
          consultationType: 'video',
          chiefComplaint: 'Skin rash evaluation',
          diagnosis: 'Contact dermatitis',
          prescriptions: [
            {
              medication: 'Hydrocortisone cream',
              dosage: '1%',
              frequency: 'Twice daily',
              duration: '14 days'
            }
          ],
          consultationFee: 85,
          rating: 4,
          patientReview: 'Good consultation, quick diagnosis and treatment plan.',
          followUpRequired: false,
          hasRecording: true,
          hasNotes: true,
          hasPrescriptions: true
        },
        {
          id: 'cons_003',
          appointmentId: 'apt_003',
          providerId: 'prov_001',
          providerName: 'Dr. Sarah Wilson',
          providerSpecialty: 'General Medicine',
          scheduledDate: '2024-01-20T16:00:00Z',
          status: 'scheduled',
          consultationType: 'video',
          chiefComplaint: 'Routine check-up',
          consultationFee: 75,
          followUpRequired: false,
          hasRecording: false,
          hasNotes: false,
          hasPrescriptions: false
        },
        {
          id: 'cons_004',
          appointmentId: 'apt_004',
          providerId: 'prov_003',
          providerName: 'Dr. Emily Rodriguez',
          providerSpecialty: 'Mental Health',
          scheduledDate: '2023-12-20T11:00:00Z',
          actualStartTime: '2023-12-20T11:00:00Z',
          actualEndTime: '2023-12-20T11:50:00Z',
          duration: 50,
          status: 'completed',
          consultationType: 'video',
          chiefComplaint: 'Anxiety management',
          diagnosis: 'Generalized Anxiety Disorder',
          prescriptions: [],
          consultationFee: 120,
          rating: 5,
          patientReview: 'Very helpful session. Dr. Rodriguez provided excellent coping strategies.',
          followUpRequired: true,
          followUpDate: '2024-02-20',
          hasRecording: false, // Mental health consultations might not be recorded
          hasNotes: true,
          hasPrescriptions: false
        }
      ];

      setConsultations(mockConsultations);
    } catch (error) {
      console.error('Error loading consultation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConsultations = () => {
    let filtered = consultations;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(consultation => {
        switch (selectedFilter) {
          case 'completed':
            return consultation.status === 'completed';
          case 'upcoming':
            return consultation.status === 'scheduled' || consultation.status === 'confirmed';
          case 'cancelled':
            return consultation.status === 'cancelled';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(consultation =>
        consultation.providerName.toLowerCase().includes(query) ||
        consultation.chiefComplaint.toLowerCase().includes(query) ||
        consultation.diagnosis?.toLowerCase().includes(query) ||
        consultation.providerSpecialty.toLowerCase().includes(query)
      );
    }

    setFilteredConsultations(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'scheduled': return '#3B82F6';
      case 'confirmed': return '#8B5CF6';
      case 'cancelled': return '#EF4444';
      case 'no-show': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Calendar;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewConsultationDetails = (consultation) => {
    navigation.navigate('ConsultationDetails', {
      consultationId: consultation.id,
      patientId
    });
  };

  const downloadConsultationSummary = async (consultationId) => {
    try {
      // In real implementation, download PDF summary
      alert('Downloading consultation summary...');
    } catch (error) {
      console.error('Error downloading summary:', error);
    }
  };

  const rateConsultation = (consultation) => {
    navigation.navigate('RateConsultation', {
      consultationId: consultation.id,
      providerId: consultation.providerId,
      providerName: consultation.providerName
    });
  };

  const scheduleFollowUp = (consultation) => {
    navigation.navigate('BookAppointment', {
      patientId,
      providerId: consultation.providerId,
      followUpFor: consultation.id
    });
  };

  const FilterButton = ({ filter, title, isActive, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ConsultationCard = ({ consultation }) => {
    const StatusIcon = getStatusIcon(consultation.status);
    const isUpcoming = consultation.status === 'scheduled' || consultation.status === 'confirmed';
    const isCompleted = consultation.status === 'completed';

    return (
      <TouchableOpacity
        style={styles.consultationCard}
        onPress={() => viewConsultationDetails(consultation)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.consultationDate}>
            <Calendar size={16} color="#4F46E5" />
            <Text style={styles.dateText}>{formatDate(consultation.scheduledDate)}</Text>
            <Text style={styles.timeText}>{formatTime(consultation.scheduledDate)}</Text>
          </View>

          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(consultation.status) }
          ]}>
            <StatusIcon size={12} color="#fff" />
            <Text style={styles.statusText}>{consultation.status}</Text>
          </View>
        </View>

        <View style={styles.providerInfo}>
          <View style={styles.providerAvatar}>
            <User size={24} color="#4F46E5" />
          </View>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{consultation.providerName}</Text>
            <Text style={styles.providerSpecialty}>{consultation.providerSpecialty}</Text>
          </View>

          <View style={styles.consultationTypeIcon}>
            {consultation.consultationType === 'video' ? (
              <Video size={20} color="#4F46E5" />
            ) : (
              <Phone size={20} color="#4F46E5" />
            )}
          </View>
        </View>

        <View style={styles.consultationInfo}>
          <Text style={styles.chiefComplaint}>{consultation.chiefComplaint}</Text>
          {consultation.diagnosis && (
            <Text style={styles.diagnosis}>Diagnosis: {consultation.diagnosis}</Text>
          )}
        </View>

        {isCompleted && consultation.duration && (
          <View style={styles.consultationMeta}>
            <View style={styles.metaItem}>
              <Clock size={14} color="#6B7280" />
              <Text style={styles.metaText}>{consultation.duration} minutes</Text>
            </View>
            <Text style={styles.feeText}>${consultation.consultationFee}</Text>
          </View>
        )}

        {isCompleted && (
          <View style={styles.consultationAssets}>
            {consultation.hasNotes && (
              <View style={styles.assetItem}>
                <FileText size={14} color="#10B981" />
                <Text style={styles.assetText}>Notes</Text>
              </View>
            )}
            {consultation.hasPrescriptions && (
              <View style={styles.assetItem}>
                <Pill size={14} color="#3B82F6" />
                <Text style={styles.assetText}>Prescriptions</Text>
              </View>
            )}
            {consultation.hasRecording && (
              <View style={styles.assetItem}>
                <Video size={14} color="#8B5CF6" />
                <Text style={styles.assetText}>Recording</Text>
              </View>
            )}
          </View>
        )}

        {isCompleted && consultation.rating && (
          <View style={styles.ratingSection}>
            <View style={styles.rating}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  color="#F59E0B"
                  fill={star <= consultation.rating ? "#F59E0B" : "transparent"}
                />
              ))}
            </View>
            {consultation.patientReview && (
              <Text style={styles.reviewText} numberOfLines={2}>
                {consultation.patientReview}
              </Text>
            )}
          </View>
        )}

        <View style={styles.cardActions}>
          {isUpcoming && (
            <>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}

          {isCompleted && (
            <>
              {!consultation.rating && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.primaryAction]}
                  onPress={() => rateConsultation(consultation)}
                >
                  <Star size={14} color="#fff" />
                  <Text style={styles.primaryActionText}>Rate</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => downloadConsultationSummary(consultation.id)}
              >
                <Download size={14} color="#4F46E5" />
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>

              {consultation.followUpRequired && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.followUpAction]}
                  onPress={() => scheduleFollowUp(consultation)}
                >
                  <Calendar size={14} color="#fff" />
                  <Text style={styles.primaryActionText}>Follow-up</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity style={styles.viewDetailsButton}>
            <ChevronRight size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading consultation history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultation History</Text>
        <View />
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search consultations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          <FilterButton
            filter="all"
            title="All"
            isActive={selectedFilter === 'all'}
            onPress={() => setSelectedFilter('all')}
          />
          <FilterButton
            filter="completed"
            title="Completed"
            isActive={selectedFilter === 'completed'}
            onPress={() => setSelectedFilter('completed')}
          />
          <FilterButton
            filter="upcoming"
            title="Upcoming"
            isActive={selectedFilter === 'upcoming'}
            onPress={() => setSelectedFilter('upcoming')}
          />
          <FilterButton
            filter="cancelled"
            title="Cancelled"
            isActive={selectedFilter === 'cancelled'}
            onPress={() => setSelectedFilter('cancelled')}
          />
        </ScrollView>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {consultations.filter(c => c.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {consultations.filter(c => c.status === 'scheduled').length}
          </Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {consultations.filter(c => c.followUpRequired).length}
          </Text>
          <Text style={styles.statLabel}>Follow-ups</Text>
        </View>
      </View>

      {/* Consultations List */}
      <ScrollView style={styles.consultationsList}>
        {filteredConsultations.length > 0 ? (
          filteredConsultations.map((consultation) => (
            <ConsultationCard key={consultation.id} consultation={consultation} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No consultations found</Text>
            <Text style={styles.emptyText}>
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Book your first consultation to get started'
              }
            </Text>
            {!searchQuery && selectedFilter === 'all' && (
              <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate('BookAppointment', { patientId })}
              >
                <Text style={styles.bookButtonText}>Book Consultation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
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
  searchSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filtersContainer: {
    flexGrow: 0,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  summaryStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  consultationsList: {
    flex: 1,
    padding: 20,
  },
  consultationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  consultationDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  providerSpecialty: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  consultationTypeIcon: {
    padding: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  consultationInfo: {
    marginBottom: 12,
  },
  chiefComplaint: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  diagnosis: {
    fontSize: 12,
    color: '#6B7280',
  },
  consultationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  feeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  consultationAssets: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assetText: {
    fontSize: 10,
    color: '#6B7280',
  },
  ratingSection: {
    marginBottom: 12,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 4,
  },
  primaryAction: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  followUpAction: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  primaryActionText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  viewDetailsButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConsultationHistory;