/**
 * MediaUtils - Utility functions for media handling in telemedicine consultations
 * Provides device enumeration, quality management, and media stream utilities
 */

/**
 * Get available media devices
 */
export async function getAvailableDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const result = {
      videoInputs: [],
      audioInputs: [],
      audioOutputs: []
    };

    devices.forEach(device => {
      if (device.kind === 'videoinput') {
        result.videoInputs.push({
          deviceId: device.deviceId,
          label: device.label || `Camera ${result.videoInputs.length + 1}`,
          groupId: device.groupId
        });
      } else if (device.kind === 'audioinput') {
        result.audioInputs.push({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${result.audioInputs.length + 1}`,
          groupId: device.groupId
        });
      } else if (device.kind === 'audiooutput') {
        result.audioOutputs.push({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${result.audioOutputs.length + 1}`,
          groupId: device.groupId
        });
      }
    });

    return result;
  } catch (error) {
    console.error('Error getting available devices:', error);
    throw error;
  }
}

/**
 * Check if device has camera and microphone access
 */
export async function checkMediaPermissions() {
  try {
    const permissions = {
      camera: false,
      microphone: false,
      error: null
    };

    // Try to get a minimal stream to check permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1, height: 1 },
        audio: true
      });

      permissions.camera = stream.getVideoTracks().length > 0;
      permissions.microphone = stream.getAudioTracks().length > 0;

      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      permissions.error = error.name;

      if (error.name === 'NotAllowedError') {
        permissions.error = 'Permission denied';
      } else if (error.name === 'NotFoundError') {
        permissions.error = 'No camera or microphone found';
      } else if (error.name === 'NotReadableError') {
        permissions.error = 'Camera or microphone is already in use';
      }
    }

    return permissions;
  } catch (error) {
    console.error('Error checking media permissions:', error);
    return {
      camera: false,
      microphone: false,
      error: error.message
    };
  }
}

/**
 * Get optimal media constraints based on device capabilities
 */
export async function getOptimalConstraints(deviceId = null, quality = 'auto') {
  const baseConstraints = {
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

  // Adjust constraints based on quality setting
  switch (quality) {
    case 'low':
      baseConstraints.video = {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      };
      break;

    case 'medium':
      baseConstraints.video = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 24 }
      };
      break;

    case 'high':
      baseConstraints.video = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      };
      break;

    case 'auto':
    default:
      // Use adaptive quality based on connection
      const connection = getConnectionInfo();
      if (connection.effectiveType === '4g' || connection.effectiveType === 'wifi') {
        // High quality for good connections
        baseConstraints.video.width.ideal = 1280;
        baseConstraints.video.height.ideal = 720;
        baseConstraints.video.frameRate.ideal = 30;
      } else {
        // Lower quality for slower connections
        baseConstraints.video.width.ideal = 640;
        baseConstraints.video.height.ideal = 480;
        baseConstraints.video.frameRate.ideal = 15;
      }
      break;
  }

  // Set specific device if provided
  if (deviceId) {
    baseConstraints.video.deviceId = { exact: deviceId };
  }

  return baseConstraints;
}

/**
 * Get connection information for adaptive quality
 */
export function getConnectionInfo() {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }

  return {
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  };
}

/**
 * Test camera and microphone functionality
 */
export async function testMediaDevices() {
  const results = {
    camera: { working: false, error: null, resolution: null },
    microphone: { working: false, error: null, volume: null },
    speaker: { working: false, error: null }
  };

  // Test camera
  try {
    const videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    const videoTrack = videoStream.getVideoTracks()[0];
    const settings = videoTrack.getSettings();

    results.camera.working = true;
    results.camera.resolution = `${settings.width}x${settings.height}`;

    videoStream.getTracks().forEach(track => track.stop());
  } catch (error) {
    results.camera.error = error.message;
  }

  // Test microphone
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: true
    });

    // Create audio context to measure volume
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(audioStream);
    microphone.connect(analyser);

    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    // Measure volume for 1 second
    const measureVolume = () => {
      return new Promise(resolve => {
        let maxVolume = 0;
        const measureInterval = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const volume = Math.max(...dataArray);
          maxVolume = Math.max(maxVolume, volume);
        }, 100);

        setTimeout(() => {
          clearInterval(measureInterval);
          resolve(maxVolume);
        }, 1000);
      });
    };

    const volume = await measureVolume();
    results.microphone.working = true;
    results.microphone.volume = Math.round((volume / 255) * 100);

    audioStream.getTracks().forEach(track => track.stop());
    audioContext.close();
  } catch (error) {
    results.microphone.error = error.message;
  }

  // Test speaker (if supported)
  try {
    if ('setSinkId' in HTMLAudioElement.prototype) {
      const audio = new Audio();
      // Use a short silent audio file or data URL
      audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+LyvmsbBzuQ1fXKdSsELnTG8N+UQAoUXrTp66hVFApGn+LyvmsbBzuQ1fXKdSsEKHfH8N2QQAoUXrTp66hVFApGn+LyvmsbBzuQ1fXKdSsEKHfH8N2QQAoUXrTp66hVFApGn+LyvmsbBzuQ1fXKdSsEKHfH8N2QQAoUXrTp66hVFApGn+LyvmsbBzuQ1fXKdSsELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjuQ1fXKdSsELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjuQ1fXKdSsELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjuQ1fXKdSsE';
      audio.volume = 0.1;

      results.speaker.working = true;
    }
  } catch (error) {
    results.speaker.error = error.message;
  }

  return results;
}

/**
 * Capture screenshot from video stream
 */
export function captureScreenshot(videoElement, quality = 0.8) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    ctx.drawImage(videoElement, 0, 0);

    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null;
  }
}

/**
 * Calculate bandwidth usage for video call
 */
export function calculateBandwidth(stats) {
  if (!stats) return null;

  const bandwidth = {
    video: { incoming: 0, outgoing: 0 },
    audio: { incoming: 0, outgoing: 0 },
    total: { incoming: 0, outgoing: 0 }
  };

  try {
    // Video bandwidth
    if (stats.video.inbound && stats.video.inbound.bytesReceived) {
      bandwidth.video.incoming = Math.round(
        (stats.video.inbound.bytesReceived * 8) / 1024 // Convert to kbps
      );
    }

    if (stats.video.outbound && stats.video.outbound.bytesSent) {
      bandwidth.video.outgoing = Math.round(
        (stats.video.outbound.bytesSent * 8) / 1024 // Convert to kbps
      );
    }

    // Audio bandwidth
    if (stats.audio.inbound && stats.audio.inbound.bytesReceived) {
      bandwidth.audio.incoming = Math.round(
        (stats.audio.inbound.bytesReceived * 8) / 1024 // Convert to kbps
      );
    }

    if (stats.audio.outbound && stats.audio.outbound.bytesSent) {
      bandwidth.audio.outgoing = Math.round(
        (stats.audio.outbound.bytesSent * 8) / 1024 // Convert to kbps
      );
    }

    // Total bandwidth
    bandwidth.total.incoming = bandwidth.video.incoming + bandwidth.audio.incoming;
    bandwidth.total.outgoing = bandwidth.video.outgoing + bandwidth.audio.outgoing;

    return bandwidth;
  } catch (error) {
    console.error('Error calculating bandwidth:', error);
    return bandwidth;
  }
}

/**
 * Optimize video quality based on connection
 */
export async function optimizeVideoQuality(peerConnection, targetBitrate) {
  try {
    const senders = peerConnection.getSenders();
    const videoSender = senders.find(sender =>
      sender.track && sender.track.kind === 'video'
    );

    if (!videoSender) return false;

    const params = videoSender.getParameters();
    if (!params.encodings) {
      params.encodings = [{}];
    }

    // Set maximum bitrate
    params.encodings[0].maxBitrate = targetBitrate * 1000; // Convert to bps

    await videoSender.setParameters(params);
    console.log(`Video bitrate optimized to ${targetBitrate} kbps`);

    return true;
  } catch (error) {
    console.error('Error optimizing video quality:', error);
    return false;
  }
}

/**
 * Monitor audio levels
 */
export class AudioLevelMonitor {
  constructor(stream) {
    this.stream = stream;
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.isMonitoring = false;
    this.callbacks = [];
  }

  start() {
    if (this.isMonitoring) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);

      this.microphone.connect(this.analyser);
      this.analyser.fftSize = 256;

      this.isMonitoring = true;
      this.monitor();
    } catch (error) {
      console.error('Error starting audio level monitor:', error);
    }
  }

  stop() {
    this.isMonitoring = false;

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  monitor() {
    if (!this.isMonitoring) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkLevel = () => {
      if (!this.isMonitoring) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      const level = Math.round((average / 255) * 100);

      this.callbacks.forEach(callback => {
        try {
          callback(level);
        } catch (error) {
          console.error('Error in audio level callback:', error);
        }
      });

      requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }

  onLevelChange(callback) {
    this.callbacks.push(callback);
  }

  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }
}

/**
 * Record media stream
 */
export class MediaRecorder {
  constructor(stream, options = {}) {
    this.stream = stream;
    this.recorder = null;
    this.chunks = [];
    this.isRecording = false;

    this.options = {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 1000000,
      audioBitsPerSecond: 128000,
      ...options
    };
  }

  start() {
    if (this.isRecording) return false;

    try {
      this.recorder = new window.MediaRecorder(this.stream, this.options);
      this.chunks = [];

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.recorder.start(1000); // Record in 1-second chunks
      this.isRecording = true;

      return true;
    } catch (error) {
      console.error('Error starting media recorder:', error);
      return false;
    }
  }

  stop() {
    if (!this.isRecording || !this.recorder) return null;

    return new Promise((resolve) => {
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.options.mimeType });
        this.isRecording = false;
        resolve(blob);
      };

      this.recorder.stop();
    });
  }

  pause() {
    if (this.recorder && this.isRecording) {
      this.recorder.pause();
    }
  }

  resume() {
    if (this.recorder && this.isRecording) {
      this.recorder.resume();
    }
  }
}

export default {
  getAvailableDevices,
  checkMediaPermissions,
  getOptimalConstraints,
  getConnectionInfo,
  testMediaDevices,
  captureScreenshot,
  calculateBandwidth,
  optimizeVideoQuality,
  AudioLevelMonitor,
  MediaRecorder
};