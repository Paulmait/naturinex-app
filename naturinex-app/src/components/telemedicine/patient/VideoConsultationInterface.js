/**
 * VideoConsultationInterface - Patient video consultation interface
 * Handles video calling, provider interaction, and consultation experience
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import {
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare, Settings,
  Clock, User, Wifi, WifiOff, Camera, CameraOff, Volume2, VolumeX
} from 'lucide-react';
import { telemedicineService } from '../../../services/telemedicineService';

const VideoConsultationInterface = ({ route, navigation }) => {
  const { appointmentId, patientId } = route.params;

  const [callState, setCallState] = useState({
    isConnected: false,
    isConnecting: true,
    isWaiting: false,
    startTime: null,
    duration: 0,
    connectionQuality: 'good' // poor, fair, good, excellent
  });

  const [mediaState, setMediaState] = useState({
    videoEnabled: true,
    audioEnabled: true,
    speakerEnabled: true
  });

  const [consultation, setConsultation] = useState({
    id: null,
    appointmentInfo: null,
    providerInfo: null,
    waitingRoomMessage: null,
    consultationNotes: ''
  });

  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);

  const isWeb = useMediaQuery({ query: '(min-width: 768px)' });

  useEffect(() => {
    initializeConsultation();
    return () => cleanup();
  }, []);

  useEffect(() => {
    if (callState.isConnected && callState.startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callState.startTime) / 1000);
        setCallState(prev => ({ ...prev, duration: elapsed }));
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState.isConnected, callState.startTime]);

  const initializeConsultation = async () => {
    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));

      // Load appointment details
      await loadAppointmentInfo();

      // Check if provider is ready
      const providerReady = await checkProviderStatus();

      if (providerReady) {
        await startVideoCall();
      } else {
        setCallState(prev => ({
          ...prev,
          isConnecting: false,
          isWaiting: true
        }));
        setConsultation(prev => ({
          ...prev,
          waitingRoomMessage: "Your provider will join the call shortly. Please wait."
        }));
      }
    } catch (error) {
      console.error('Failed to initialize consultation:', error);
      Alert.alert('Connection Error', 'Failed to start video consultation');
      navigation.goBack();
    }
  };

  const loadAppointmentInfo = async () => {
    try {
      // Mock appointment data - in real implementation, fetch from API
      const appointmentInfo = {
        id: appointmentId,
        scheduledTime: '2024-01-15T14:30:00',
        reason: 'Follow-up consultation',
        duration: 30
      };

      const providerInfo = {
        name: 'Dr. Sarah Wilson',
        specialty: 'General Medicine',
        profileImage: null,
        credentials: 'MD, Family Medicine'
      };

      setConsultation(prev => ({
        ...prev,
        appointmentInfo,
        providerInfo
      }));
    } catch (error) {
      console.error('Error loading appointment info:', error);
    }
  };

  const checkProviderStatus = async () => {
    // In real implementation, check if provider has joined
    return new Promise(resolve => {
      setTimeout(() => resolve(Math.random() > 0.3), 2000);
    });
  };

  const startVideoCall = async () => {
    try {
      // Initialize video call
      const result = await telemedicineService.initiateVideoCall(
        appointmentId,
        patientId,
        'patient'
      );

      if (result.success) {
        setConsultation(prev => ({
          ...prev,
          id: result.consultationId
        }));

        // Set up local video stream
        if (localVideoRef.current && result.localStream) {
          localVideoRef.current.srcObject = result.localStream;
        }

        setCallState({
          isConnected: true,
          isConnecting: false,
          isWaiting: false,
          startTime: Date.now(),
          duration: 0,
          connectionQuality: 'good'
        });

        setIsRecording(true);
      }
    } catch (error) {
      console.error('Failed to start video call:', error);
      Alert.alert('Connection Error', 'Failed to connect to provider');
    }
  };

  const toggleVideo = async () => {
    try {
      const newState = !mediaState.videoEnabled;
      setMediaState(prev => ({ ...prev, videoEnabled: newState }));

      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
        videoTracks.forEach(track => {
          track.enabled = newState;
        });
      }
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleAudio = async () => {
    try {
      const newState = !mediaState.audioEnabled;
      setMediaState(prev => ({ ...prev, audioEnabled: newState }));

      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
        audioTracks.forEach(track => {
          track.enabled = newState;
        });
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  };

  const toggleSpeaker = () => {
    setMediaState(prev => ({ ...prev, speakerEnabled: !prev.speakerEnabled }));
  };

  const endCall = async () => {
    Alert.alert(
      'End Consultation',
      'Are you sure you want to end this consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: confirmEndCall }
      ]
    );
  };

  const confirmEndCall = async () => {
    try {
      if (consultation.id) {
        await telemedicineService.endVideoCall(consultation.id, 'patient_ended');
      }
      navigation.navigate('ConsultationSummary', {
        consultationId: consultation.id,
        appointmentId
      });
    } catch (error) {
      console.error('Error ending call:', error);
      navigation.goBack();
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return '#10B981';
      case 'good': return '#3B82F6';
      case 'fair': return '#F59E0B';
      case 'poor': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const WaitingRoom = () => (
    <View style={styles.waitingRoom}>
      <View style={styles.waitingContent}>
        <View style={styles.providerInfo}>
          <View style={styles.providerAvatar}>
            <User size={48} color="#4F46E5" />
          </View>
          <Text style={styles.providerName}>{consultation.providerInfo?.name}</Text>
          <Text style={styles.providerCredentials}>
            {consultation.providerInfo?.credentials}
          </Text>
        </View>

        <View style={styles.waitingMessage}>
          <Text style={styles.waitingTitle}>Waiting for your provider</Text>
          <Text style={styles.waitingText}>
            {consultation.waitingRoomMessage}
          </Text>
        </View>

        <View style={styles.appointmentDetails}>
          <Text style={styles.appointmentTitle}>Today's Appointment</Text>
          <Text style={styles.appointmentTime}>
            {new Date(consultation.appointmentInfo?.scheduledTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
          <Text style={styles.appointmentReason}>
            {consultation.appointmentInfo?.reason}
          </Text>
        </View>

        <View style={styles.waitingActions}>
          <TouchableOpacity style={styles.testButton} onPress={toggleVideo}>
            <Camera size={20} color="#4F46E5" />
            <Text style={styles.testButtonText}>Test Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.testButton} onPress={toggleAudio}>
            <Mic size={20} color="#4F46E5" />
            <Text style={styles.testButtonText}>Test Microphone</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview Video */}
      <View style={styles.previewContainer}>
        <video
          ref={localVideoRef}
          style={styles.previewVideo}
          autoPlay
          playsInline
          muted
        />
        <Text style={styles.previewLabel}>Your Camera Preview</Text>
      </View>
    </View>
  );

  const VideoCall = () => (
    <View style={styles.videoCallContainer}>
      {/* Remote Video (Provider) */}
      <View style={styles.remoteVideoContainer}>
        <video
          ref={remoteVideoRef}
          style={styles.remoteVideo}
          autoPlay
          playsInline
          muted={false}
        />

        {/* Video Overlay */}
        <View style={styles.videoOverlay}>
          <View style={styles.overlayTop}>
            <View style={styles.providerBadge}>
              <Text style={styles.providerBadgeText}>
                {consultation.providerInfo?.name}
              </Text>
            </View>

            <View style={styles.statusIndicators}>
              {isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>REC</Text>
                </View>
              )}

              <View style={[
                styles.connectionIndicator,
                { backgroundColor: getConnectionQualityColor(callState.connectionQuality) }
              ]}>
                <Wifi size={12} color="#fff" />
              </View>
            </View>
          </View>

          <View style={styles.overlayBottom}>
            <View style={styles.callTimer}>
              <Clock size={16} color="#fff" />
              <Text style={styles.timerText}>{formatDuration(callState.duration)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Local Video */}
      <View style={styles.localVideoContainer}>
        <video
          ref={localVideoRef}
          style={styles.localVideo}
          autoPlay
          playsInline
          muted
        />
        <Text style={styles.localVideoLabel}>You</Text>
        {!mediaState.videoEnabled && (
          <View style={styles.videoDisabledOverlay}>
            <CameraOff size={24} color="#fff" />
          </View>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.callControls}>
        <TouchableOpacity
          style={[styles.controlButton, !mediaState.audioEnabled && styles.controlButtonDisabled]}
          onPress={toggleAudio}
        >
          {mediaState.audioEnabled ? (
            <Mic size={24} color="#fff" />
          ) : (
            <MicOff size={24} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !mediaState.videoEnabled && styles.controlButtonDisabled]}
          onPress={toggleVideo}
        >
          {mediaState.videoEnabled ? (
            <Video size={24} color="#fff" />
          ) : (
            <VideoOff size={24} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !mediaState.speakerEnabled && styles.controlButtonDisabled]}
          onPress={toggleSpeaker}
        >
          {mediaState.speakerEnabled ? (
            <Volume2 size={24} color="#fff" />
          ) : (
            <VolumeX size={24} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowChat(!showChat)}
        >
          <MessageSquare size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Settings size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <Phone size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Chat Sidebar */}
      {showChat && (
        <View style={styles.chatSidebar}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle}>Chat</Text>
            <TouchableOpacity onPress={() => setShowChat(false)}>
              <Text style={styles.chatClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.chatMessages}>
            <Text style={styles.chatPlaceholder}>
              Chat with your provider during the consultation
            </Text>
          </ScrollView>
          <View style={styles.chatInput}>
            <Text style={styles.chatInputPlaceholder}>Type a message...</Text>
          </View>
        </View>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <View style={styles.settingsPanel}>
          <View style={styles.settingsHeader}>
            <Text style={styles.settingsTitle}>Settings</Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={styles.settingsClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.settingsContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Connection Quality</Text>
              <Text style={[
                styles.settingValue,
                { color: getConnectionQualityColor(callState.connectionQuality) }
              ]}>
                {callState.connectionQuality.toUpperCase()}
              </Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Video Quality</Text>
              <Text style={styles.settingValue}>720p HD</Text>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Audio Quality</Text>
              <Text style={styles.settingValue}>High</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <Text style={styles.loadingText}>Connecting to your provider...</Text>
        <View style={styles.loadingSpinner}>
          <Text>⟳</Text>
        </View>
      </View>
    </View>
  );

  if (callState.isConnecting) {
    return <LoadingScreen />;
  }

  if (callState.isWaiting) {
    return <WaitingRoom />;
  }

  return <VideoCall />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  loadingSpinner: {
    fontSize: 24,
    color: '#4F46E5',
  },
  waitingRoom: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  waitingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
  },
  providerInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  providerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  providerCredentials: {
    fontSize: 16,
    color: '#6B7280',
  },
  waitingMessage: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  appointmentDetails: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  appointmentTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4F46E5',
    marginBottom: 4,
  },
  appointmentReason: {
    fontSize: 14,
    color: '#6B7280',
  },
  waitingActions: {
    flexDirection: 'row',
    gap: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  testButtonText: {
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  previewContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 150,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#fff',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    color: '#fff',
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoCallContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteVideoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  overlayTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  providerBadge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  providerBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  recordingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  connectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBottom: {
    alignItems: 'flex-start',
    padding: 20,
  },
  callTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#000',
  },
  localVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  localVideoLabel: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    color: '#fff',
    fontSize: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDisabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: '#EF4444',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
  },
  chatSidebar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  chatClose: {
    fontSize: 18,
    color: '#6B7280',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
  },
  chatInput: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  chatInputPlaceholder: {
    fontSize: 14,
    color: '#9CA3AF',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  settingsPanel: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  settingsClose: {
    fontSize: 16,
    color: '#6B7280',
  },
  settingsContent: {
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
});

export default VideoConsultationInterface;