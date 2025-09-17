/**
 * PatientHistoryViewer - Comprehensive patient medical history viewer for providers
 * Displays patient records, past consultations, medications, allergies, and health timeline
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import {
  User, Calendar, Clock, Heart, Pill, AlertTriangle, FileText,
  Activity, TrendingUp, Search, Filter, Download, Share
} from 'lucide-react';
import { telemedicineService } from '../../../services/telemedicineService';

const PatientHistoryViewer = ({ route, navigation }) => {
  const { patientId, providerId } = route.params;

  const [patientData, setPatientData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [loading, setLoading] = useState(true);

  const isWeb = useMediaQuery({ query: '(min-width: 768px)' });

  useEffect(() => {
    loadPatientHistory();
  }, [patientId]);

  const loadPatientHistory = async () => {
    try {
      setLoading(true);
      // This would call the telemedicine service to get patient data
      const mockPatientData = {
        id: patientId,
        personalInfo: {
          name: 'Sarah Johnson',
          age: 32,
          gender: 'Female',
          dateOfBirth: '1991-05-15',
          email: 'sarah.johnson@email.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, Anytown, ST 12345',
          emergencyContact: {
            name: 'Michael Johnson',
            relationship: 'Spouse',
            phone: '+1 (555) 987-6543'
          }
        },
        medicalInfo: {
          allergies: [
            { substance: 'Penicillin', severity: 'Severe', reaction: 'Anaphylaxis' },
            { substance: 'Shellfish', severity: 'Moderate', reaction: 'Hives, swelling' }
          ],
          chronicConditions: [
            { condition: 'Type 2 Diabetes', diagnosedDate: '2019-03-15', status: 'Controlled' },
            { condition: 'Hypertension', diagnosedDate: '2020-01-10', status: 'Well-controlled' }
          ],
          currentMedications: [
            {
              name: 'Metformin',
              dosage: '500mg',
              frequency: 'Twice daily',
              prescribedDate: '2019-03-15',
              prescribedBy: 'Dr. Smith'
            },
            {
              name: 'Lisinopril',
              dosage: '10mg',
              frequency: 'Once daily',
              prescribedDate: '2020-01-10',
              prescribedBy: 'Dr. Brown'
            }
          ],
          vitalSigns: {
            bloodPressure: { value: '125/82', date: '2024-01-15', status: 'Good' },
            heartRate: { value: '72 bpm', date: '2024-01-15', status: 'Normal' },
            weight: { value: '68 kg', date: '2024-01-15', trend: 'Stable' },
            height: { value: '165 cm', date: '2023-01-01', trend: 'Stable' },
            bmi: { value: '25.0', date: '2024-01-15', status: 'Normal' }
          }
        },
        consultationHistory: [
          {
            id: 'cons_001',
            date: '2024-01-15',
            provider: 'Dr. Emily Wilson',
            type: 'Telemedicine',
            duration: '25 minutes',
            chiefComplaint: 'Follow-up diabetes management',
            diagnosis: 'Type 2 Diabetes - well controlled',
            prescriptions: ['Continue Metformin 500mg twice daily'],
            notes: 'Patient reports good glucose control. No concerning symptoms.',
            followUp: 'Scheduled in 3 months'
          },
          {
            id: 'cons_002',
            date: '2023-10-20',
            provider: 'Dr. Michael Brown',
            type: 'In-person',
            duration: '30 minutes',
            chiefComplaint: 'Annual physical examination',
            diagnosis: 'Routine health maintenance',
            prescriptions: ['Flu vaccination administered'],
            notes: 'Overall health good. Blood pressure slightly elevated.',
            followUp: 'Follow-up BP check in 2 weeks'
          }
        ],
        labResults: [
          {
            id: 'lab_001',
            date: '2024-01-10',
            testName: 'Comprehensive Metabolic Panel',
            results: {
              'Glucose': { value: '95 mg/dL', range: '70-99 mg/dL', status: 'Normal' },
              'HbA1c': { value: '6.8%', range: '<7.0%', status: 'Good' },
              'Creatinine': { value: '0.9 mg/dL', range: '0.6-1.2 mg/dL', status: 'Normal' }
            },
            orderedBy: 'Dr. Emily Wilson'
          }
        ],
        attachments: [
          {
            id: 'att_001',
            name: 'Chest X-Ray - Jan 2024',
            type: 'image',
            date: '2024-01-15',
            size: '2.4 MB'
          },
          {
            id: 'att_002',
            name: 'Blood Test Results - Dec 2023',
            type: 'pdf',
            date: '2023-12-20',
            size: '1.1 MB'
          }
        ]
      };

      setPatientData(mockPatientData);
    } catch (error) {
      console.error('Error loading patient history:', error);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ tab, icon: Icon, title, count = null }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
    >
      <Icon size={20} color={activeTab === tab ? '#4F46E5' : '#6B7280'} />
      <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
        {title}
      </Text>
      {count && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const PatientOverview = () => (
    <ScrollView style={styles.tabContent}>
      {/* Patient Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <View style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.avatarContainer}>
              <User size={40} color="#4F46E5" />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patientData?.personalInfo.name}</Text>
              <Text style={styles.patientDetails}>
                {patientData?.personalInfo.age} years old • {patientData?.personalInfo.gender}
              </Text>
              <Text style={styles.patientContact}>{patientData?.personalInfo.email}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{patientData?.personalInfo.dateOfBirth}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{patientData?.personalInfo.phone}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>
                {patientData?.personalInfo.emergencyContact.name} ({patientData?.personalInfo.emergencyContact.relationship})
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Current Health Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Health Status</Text>

        {/* Vital Signs */}
        <View style={styles.vitalsContainer}>
          <Text style={styles.subsectionTitle}>Latest Vital Signs</Text>
          <View style={styles.vitalsGrid}>
            <View style={styles.vitalCard}>
              <Heart size={20} color="#EF4444" />
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
              <Text style={styles.vitalValue}>{patientData?.medicalInfo.vitalSigns.bloodPressure.value}</Text>
              <Text style={styles.vitalStatus}>{patientData?.medicalInfo.vitalSigns.bloodPressure.status}</Text>
            </View>
            <View style={styles.vitalCard}>
              <Activity size={20} color="#10B981" />
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={styles.vitalValue}>{patientData?.medicalInfo.vitalSigns.heartRate.value}</Text>
              <Text style={styles.vitalStatus}>{patientData?.medicalInfo.vitalSigns.heartRate.status}</Text>
            </View>
            <View style={styles.vitalCard}>
              <TrendingUp size={20} color="#3B82F6" />
              <Text style={styles.vitalLabel}>Weight</Text>
              <Text style={styles.vitalValue}>{patientData?.medicalInfo.vitalSigns.weight.value}</Text>
              <Text style={styles.vitalStatus}>{patientData?.medicalInfo.vitalSigns.weight.trend}</Text>
            </View>
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <AlertTriangle size={20} color="#EF4444" />
            <Text style={styles.alertTitle}>Allergies</Text>
          </View>
          {patientData?.medicalInfo.allergies.map((allergy, index) => (
            <View key={index} style={styles.allergyItem}>
              <Text style={styles.allergySubstance}>{allergy.substance}</Text>
              <Text style={styles.allergySeverity}>{allergy.severity}</Text>
              <Text style={styles.allergyReaction}>{allergy.reaction}</Text>
            </View>
          ))}
        </View>

        {/* Current Medications */}
        <View style={styles.medicationsSection}>
          <View style={styles.medicationHeader}>
            <Pill size={20} color="#4F46E5" />
            <Text style={styles.medicationTitle}>Current Medications</Text>
          </View>
          {patientData?.medicalInfo.currentMedications.map((medication, index) => (
            <View key={index} style={styles.medicationItem}>
              <Text style={styles.medicationName}>{medication.name}</Text>
              <Text style={styles.medicationDosage}>{medication.dosage} - {medication.frequency}</Text>
              <Text style={styles.medicationPrescriber}>Prescribed by {medication.prescribedBy}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const ConsultationHistory = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.consultationFilters}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search consultations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {patientData?.consultationHistory.map((consultation) => (
        <View key={consultation.id} style={styles.consultationCard}>
          <View style={styles.consultationHeader}>
            <View style={styles.consultationDate}>
              <Calendar size={16} color="#4F46E5" />
              <Text style={styles.dateText}>{consultation.date}</Text>
            </View>
            <View style={styles.consultationDuration}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.durationText}>{consultation.duration}</Text>
            </View>
          </View>

          <Text style={styles.consultationProvider}>{consultation.provider}</Text>
          <Text style={styles.consultationType}>{consultation.type}</Text>

          <View style={styles.consultationDetails}>
            <Text style={styles.detailLabel}>Chief Complaint:</Text>
            <Text style={styles.detailValue}>{consultation.chiefComplaint}</Text>
          </View>

          <View style={styles.consultationDetails}>
            <Text style={styles.detailLabel}>Diagnosis:</Text>
            <Text style={styles.detailValue}>{consultation.diagnosis}</Text>
          </View>

          <View style={styles.consultationDetails}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue}>{consultation.notes}</Text>
          </View>

          {consultation.prescriptions.length > 0 && (
            <View style={styles.consultationDetails}>
              <Text style={styles.detailLabel}>Prescriptions:</Text>
              {consultation.prescriptions.map((prescription, index) => (
                <Text key={index} style={styles.prescriptionText}>• {prescription}</Text>
              ))}
            </View>
          )}

          <View style={styles.consultationActions}>
            <TouchableOpacity style={styles.actionButton}>
              <FileText size={16} color="#4F46E5" />
              <Text style={styles.actionText}>View Full Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const LabResults = () => (
    <ScrollView style={styles.tabContent}>
      {patientData?.labResults.map((lab) => (
        <View key={lab.id} style={styles.labCard}>
          <View style={styles.labHeader}>
            <Text style={styles.labTestName}>{lab.testName}</Text>
            <Text style={styles.labDate}>{lab.date}</Text>
          </View>
          <Text style={styles.labOrderedBy}>Ordered by: {lab.orderedBy}</Text>

          <View style={styles.labResults}>
            {Object.entries(lab.results).map(([testName, result]) => (
              <View key={testName} style={styles.labResultItem}>
                <Text style={styles.labResultName}>{testName}</Text>
                <Text style={styles.labResultValue}>{result.value}</Text>
                <Text style={styles.labResultRange}>Range: {result.range}</Text>
                <View style={[styles.labStatusBadge, { backgroundColor: getLabStatusColor(result.status) }]}>
                  <Text style={styles.labStatusText}>{result.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const getLabStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'normal': return '#10B981';
      case 'good': return '#3B82F6';
      case 'high': return '#F59E0B';
      case 'low': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading patient history...</Text>
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
        <Text style={styles.headerTitle}>Patient History</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Download size={20} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Share size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TabButton tab="overview" icon={User} title="Overview" />
        <TabButton
          tab="consultations"
          icon={Calendar}
          title="Consultations"
          count={patientData?.consultationHistory.length}
        />
        <TabButton
          tab="labs"
          icon={Activity}
          title="Lab Results"
          count={patientData?.labResults.length}
        />
        <TabButton
          tab="attachments"
          icon={FileText}
          title="Files"
          count={patientData?.attachments.length}
        />
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && <PatientOverview />}
      {activeTab === 'consultations' && <ConsultationHistory />}
      {activeTab === 'labs' && <LabResults />}
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  countBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  countText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  patientCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  patientDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  patientContact: {
    fontSize: 14,
    color: '#4F46E5',
    marginTop: 2,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  vitalsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  vitalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 4,
  },
  vitalStatus: {
    fontSize: 10,
    color: '#10B981',
    marginTop: 2,
  },
  alertSection: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 8,
  },
  allergyItem: {
    marginBottom: 8,
  },
  allergySubstance: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  allergySeverity: {
    fontSize: 12,
    color: '#EF4444',
  },
  allergyReaction: {
    fontSize: 12,
    color: '#6B7280',
  },
  medicationsSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginLeft: 8,
  },
  medicationItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  medicationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  medicationDosage: {
    fontSize: 12,
    color: '#6B7280',
  },
  medicationPrescriber: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  consultationFilters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  filterButton: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  consultationCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  consultationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  consultationDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
  consultationDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  consultationProvider: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  consultationType: {
    fontSize: 12,
    color: '#4F46E5',
    marginBottom: 12,
  },
  consultationDetails: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    marginTop: 2,
  },
  prescriptionText: {
    fontSize: 12,
    color: '#111827',
    marginLeft: 8,
  },
  consultationActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#4F46E5',
  },
  labCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  labHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labTestName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  labDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  labOrderedBy: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  labResults: {
    gap: 8,
  },
  labResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  labResultName: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  labResultValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: 'bold',
  },
  labResultRange: {
    fontSize: 10,
    color: '#6B7280',
  },
  labStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  labStatusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PatientHistoryViewer;