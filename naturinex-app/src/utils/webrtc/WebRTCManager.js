/**
 * WebRTCManager - Comprehensive WebRTC management for telemedicine video calls
 * Handles peer connections, media streams, and signaling for high-quality video consultations
 */

import { EventEmitter } from 'events';

class WebRTCManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: 'turn:numb.viagenie.ca',
          username: 'webrtc@live.com',
          credential: 'muazkh'
        }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      ...config
    };

    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.dataChannel = null;

    this.isInitiator = false;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.signalingState = 'stable';

    this.mediaConstraints = {
      video: {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { min: 15, ideal: 30, max: 60 },
        facingMode: 'user'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 48000,
        channelCount: 2
      }
    };

    this.statistics = {
      connectionStartTime: null,
      connectionDuration: 0,
      bytesReceived: 0,
      bytesSent: 0,
      packetsLost: 0,
      jitter: 0,
      roundTripTime: 0
    };

    this.qualityMetrics = {
      videoQuality: 'unknown',
      audioQuality: 'unknown',
      connectionQuality: 'unknown',
      networkType: 'unknown'
    };

    // Bind methods
    this.handleIceCandidate = this.handleIceCandidate.bind(this);
    this.handleRemoteStream = this.handleRemoteStream.bind(this);
    this.handleConnectionStateChange = this.handleConnectionStateChange.bind(this);
    this.handleIceConnectionStateChange = this.handleIceConnectionStateChange.bind(this);
    this.handleSignalingStateChange = this.handleSignalingStateChange.bind(this);
    this.handleDataChannelMessage = this.handleDataChannelMessage.bind(this);
  }

  /**
   * Initialize WebRTC peer connection
   */
  async initialize() {
    try {
      this.peerConnection = new RTCPeerConnection(this.config);
      this.setupPeerConnectionHandlers();
      this.setupDataChannel();

      console.log('WebRTC peer connection initialized');
      this.emit('initialized');

      return true;
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Set up peer connection event handlers
   */
  setupPeerConnectionHandlers() {
    this.peerConnection.onicecandidate = this.handleIceCandidate;
    this.peerConnection.ontrack = this.handleRemoteStream;
    this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange;
    this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange;
    this.peerConnection.onsignalingstatechange = this.handleSignalingStateChange;
    this.peerConnection.ondatachannel = this.handleIncomingDataChannel.bind(this);
    this.peerConnection.onnegotiationneeded = this.handleNegotiationNeeded.bind(this);
  }

  /**
   * Set up data channel for non-media communication
   */
  setupDataChannel() {
    try {
      this.dataChannel = this.peerConnection.createDataChannel('consultation', {
        ordered: true,
        maxRetransmits: 3
      });

      this.dataChannel.onopen = () => {
        console.log('Data channel opened');
        this.emit('dataChannelOpen');
      };

      this.dataChannel.onmessage = this.handleDataChannelMessage;
      this.dataChannel.onerror = (error) => {
        console.error('Data channel error:', error);
        this.emit('dataChannelError', error);
      };
    } catch (error) {
      console.error('Failed to create data channel:', error);
    }
  }

  /**
   * Handle incoming data channel
   */
  handleIncomingDataChannel(event) {
    const channel = event.channel;
    channel.onmessage = this.handleDataChannelMessage;
    channel.onopen = () => {
      console.log('Incoming data channel opened');
      this.emit('dataChannelOpen');
    };
  }

  /**
   * Get user media (camera and microphone)
   */
  async getUserMedia(constraints = null) {
    try {
      const mediaConstraints = constraints || this.mediaConstraints;

      this.localStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      console.log('User media obtained successfully');
      this.emit('localStreamReady', this.localStream);

      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      this.emit('getUserMediaError', error);
      throw error;
    }
  }

  /**
   * Get screen sharing stream
   */
  async getDisplayMedia() {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 }
        },
        audio: true
      });

      // Replace video track if already connected
      if (this.peerConnection && this.localStream) {
        const videoTrack = displayStream.getVideoTracks()[0];
        const sender = this.peerConnection.getSenders().find(s =>
          s.track && s.track.kind === 'video'
        );

        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Update local stream
        const oldVideoTrack = this.localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          this.localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        this.localStream.addTrack(videoTrack);
      }

      this.emit('screenShareStarted', displayStream);
      return displayStream;
    } catch (error) {
      console.error('Failed to get display media:', error);
      this.emit('screenShareError', error);
      throw error;
    }
  }

  /**
   * Stop screen sharing and return to camera
   */
  async stopScreenShare() {
    try {
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: this.mediaConstraints.video,
        audio: false // Don't replace audio
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      const sender = this.peerConnection.getSenders().find(s =>
        s.track && s.track.kind === 'video'
      );

      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      // Update local stream
      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      this.localStream.addTrack(videoTrack);

      this.emit('screenShareStopped');
    } catch (error) {
      console.error('Failed to stop screen share:', error);
      this.emit('screenShareError', error);
    }
  }

  /**
   * Create offer for initiating connection
   */
  async createOffer() {
    try {
      this.isInitiator = true;
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('Created offer');

      this.emit('offerCreated', offer);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create answer for responding to offer
   */
  async createAnswer(offer) {
    try {
      await this.peerConnection.setRemoteDescription(offer);

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      console.log('Created answer');
      this.emit('answerCreated', answer);

      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Set remote answer
   */
  async setRemoteAnswer(answer) {
    try {
      await this.peerConnection.setRemoteDescription(answer);
      console.log('Set remote answer');
    } catch (error) {
      console.error('Failed to set remote answer:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate) {
    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('Added ICE candidate');
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      this.emit('error', error);
    }
  }

  /**
   * Handle ICE candidate event
   */
  handleIceCandidate(event) {
    if (event.candidate) {
      console.log('New ICE candidate');
      this.emit('iceCandidate', event.candidate);
    } else {
      console.log('ICE gathering completed');
      this.emit('iceGatheringComplete');
    }
  }

  /**
   * Handle remote stream
   */
  handleRemoteStream(event) {
    console.log('Received remote stream');
    this.remoteStream = event.streams[0];
    this.emit('remoteStreamReceived', this.remoteStream);
  }

  /**
   * Handle connection state changes
   */
  handleConnectionStateChange() {
    this.connectionState = this.peerConnection.connectionState;
    console.log('Connection state changed:', this.connectionState);

    this.emit('connectionStateChange', this.connectionState);

    if (this.connectionState === 'connected') {
      this.statistics.connectionStartTime = Date.now();
      this.startQualityMonitoring();
    } else if (this.connectionState === 'disconnected' || this.connectionState === 'failed') {
      this.stopQualityMonitoring();
    }
  }

  /**
   * Handle ICE connection state changes
   */
  handleIceConnectionStateChange() {
    this.iceConnectionState = this.peerConnection.iceConnectionState;
    console.log('ICE connection state changed:', this.iceConnectionState);

    this.emit('iceConnectionStateChange', this.iceConnectionState);
  }

  /**
   * Handle signaling state changes
   */
  handleSignalingStateChange() {
    this.signalingState = this.peerConnection.signalingState;
    console.log('Signaling state changed:', this.signalingState);

    this.emit('signalingStateChange', this.signalingState);
  }

  /**
   * Handle negotiation needed
   */
  async handleNegotiationNeeded() {
    console.log('Negotiation needed');
    if (this.isInitiator) {
      try {
        const offer = await this.createOffer();
        this.emit('renegotiationOffer', offer);
      } catch (error) {
        console.error('Renegotiation failed:', error);
      }
    }
  }

  /**
   * Handle data channel messages
   */
  handleDataChannelMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('Received data channel message:', data);
      this.emit('dataChannelMessage', data);
    } catch (error) {
      console.error('Failed to parse data channel message:', error);
    }
  }

  /**
   * Send data through data channel
   */
  sendData(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Failed to send data:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled = null) {
    if (!this.localStream) return false;

    const videoTracks = this.localStream.getVideoTracks();
    if (videoTracks.length === 0) return false;

    const isEnabled = enabled !== null ? enabled : !videoTracks[0].enabled;
    videoTracks.forEach(track => {
      track.enabled = isEnabled;
    });

    this.emit('videoToggled', isEnabled);
    return isEnabled;
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled = null) {
    if (!this.localStream) return false;

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return false;

    const isEnabled = enabled !== null ? enabled : !audioTracks[0].enabled;
    audioTracks.forEach(track => {
      track.enabled = isEnabled;
    });

    this.emit('audioToggled', isEnabled);
    return isEnabled;
  }

  /**
   * Start quality monitoring
   */
  startQualityMonitoring() {
    this.qualityMonitoringInterval = setInterval(async () => {
      try {
        const stats = await this.getConnectionStats();
        this.updateQualityMetrics(stats);
        this.emit('qualityUpdate', this.qualityMetrics);
      } catch (error) {
        console.error('Quality monitoring error:', error);
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Stop quality monitoring
   */
  stopQualityMonitoring() {
    if (this.qualityMonitoringInterval) {
      clearInterval(this.qualityMonitoringInterval);
      this.qualityMonitoringInterval = null;
    }
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats() {
    if (!this.peerConnection) return null;

    const stats = await this.peerConnection.getStats();
    const result = {
      video: { inbound: null, outbound: null },
      audio: { inbound: null, outbound: null },
      connection: null
    };

    stats.forEach(stat => {
      if (stat.type === 'inbound-rtp') {
        if (stat.mediaType === 'video') {
          result.video.inbound = stat;
        } else if (stat.mediaType === 'audio') {
          result.audio.inbound = stat;
        }
      } else if (stat.type === 'outbound-rtp') {
        if (stat.mediaType === 'video') {
          result.video.outbound = stat;
        } else if (stat.mediaType === 'audio') {
          result.audio.outbound = stat;
        }
      } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        result.connection = stat;
      }
    });

    return result;
  }

  /**
   * Update quality metrics based on stats
   */
  updateQualityMetrics(stats) {
    if (!stats) return;

    // Update connection quality
    if (stats.connection) {
      this.statistics.roundTripTime = stats.connection.currentRoundTripTime || 0;

      if (this.statistics.roundTripTime < 0.1) {
        this.qualityMetrics.connectionQuality = 'excellent';
      } else if (this.statistics.roundTripTime < 0.3) {
        this.qualityMetrics.connectionQuality = 'good';
      } else if (this.statistics.roundTripTime < 0.5) {
        this.qualityMetrics.connectionQuality = 'fair';
      } else {
        this.qualityMetrics.connectionQuality = 'poor';
      }
    }

    // Update video quality
    if (stats.video.inbound) {
      const packetsLost = stats.video.inbound.packetsLost || 0;
      const packetsReceived = stats.video.inbound.packetsReceived || 0;
      const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;

      if (lossRate < 0.01) {
        this.qualityMetrics.videoQuality = 'excellent';
      } else if (lossRate < 0.05) {
        this.qualityMetrics.videoQuality = 'good';
      } else if (lossRate < 0.1) {
        this.qualityMetrics.videoQuality = 'fair';
      } else {
        this.qualityMetrics.videoQuality = 'poor';
      }
    }

    // Update audio quality
    if (stats.audio.inbound) {
      const jitter = stats.audio.inbound.jitter || 0;
      this.statistics.jitter = jitter;

      if (jitter < 0.02) {
        this.qualityMetrics.audioQuality = 'excellent';
      } else if (jitter < 0.05) {
        this.qualityMetrics.audioQuality = 'good';
      } else if (jitter < 0.1) {
        this.qualityMetrics.audioQuality = 'fair';
      } else {
        this.qualityMetrics.audioQuality = 'poor';
      }
    }
  }

  /**
   * Get current quality metrics
   */
  getQualityMetrics() {
    return { ...this.qualityMetrics };
  }

  /**
   * Get connection statistics
   */
  getStatistics() {
    if (this.statistics.connectionStartTime) {
      this.statistics.connectionDuration = Date.now() - this.statistics.connectionStartTime;
    }
    return { ...this.statistics };
  }

  /**
   * Close connection and cleanup
   */
  close() {
    try {
      this.stopQualityMonitoring();

      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      if (this.dataChannel) {
        this.dataChannel.close();
        this.dataChannel = null;
      }

      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      this.connectionState = 'closed';
      this.emit('closed');

      console.log('WebRTC connection closed');
    } catch (error) {
      console.error('Error closing WebRTC connection:', error);
    }
  }

  /**
   * Check if connection is active
   */
  isConnected() {
    return this.connectionState === 'connected';
  }

  /**
   * Get connection state
   */
  getConnectionState() {
    return {
      connectionState: this.connectionState,
      iceConnectionState: this.iceConnectionState,
      signalingState: this.signalingState
    };
  }
}

export default WebRTCManager;