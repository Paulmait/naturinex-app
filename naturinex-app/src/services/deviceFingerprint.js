// Device Fingerprinting Service
// Generates unique device identifiers for rate limiting and analytics

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import CryptoJS from 'crypto-js';

class DeviceFingerprintService {
  constructor() {
    this.fingerprint = null;
    this.fpPromise = null;
    this.initialized = false;
    this.sessionData = {};
  }

  // Initialize the fingerprinting library
  async init() {
    if (this.initialized) return this.fingerprint;

    try {
      // Load FingerprintJS
      this.fpPromise = FingerprintJS.load({
        monitoring: false, // Disable sending data to FingerprintJS
      });

      const fp = await this.fpPromise;
      const result = await fp.get();

      // Generate comprehensive fingerprint
      this.fingerprint = {
        visitorId: result.visitorId,
        confidence: result.confidence?.score || 0,
        components: this.extractComponents(result.components),
        hash: this.generateHash(result),
        timestamp: Date.now()
      };

      // Collect additional browser data
      this.collectBrowserData();

      // Store in localStorage for persistence
      this.storeFingerprint();

      this.initialized = true;
      return this.fingerprint;
    } catch (error) {
      console.error('Fingerprinting error:', error);
      // Fallback to basic fingerprinting
      return this.getFallbackFingerprint();
    }
  }

  // Extract relevant components for tracking
  extractComponents(components) {
    const extracted = {};
    const relevantKeys = [
      'screenResolution',
      'timezone',
      'language',
      'platform',
      'hardwareConcurrency',
      'deviceMemory',
      'colorDepth',
      'pixelRatio',
      'touchSupport'
    ];

    for (const key of relevantKeys) {
      if (components[key]) {
        extracted[key] = components[key].value;
      }
    }

    return extracted;
  }

  // Generate a hash from fingerprint data
  generateHash(fpData) {
    const dataString = JSON.stringify({
      id: fpData.visitorId,
      screen: fpData.components?.screenResolution?.value,
      timezone: fpData.components?.timezone?.value,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    });

    return CryptoJS.SHA256(dataString).toString();
  }

  // Collect additional browser data for better fingerprinting
  collectBrowserData() {
    this.sessionData = {
      // Screen information
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        colorDepth: window.screen.colorDepth,
        pixelDepth: window.screen.pixelDepth,
        orientation: window.screen.orientation?.type
      },

      // Browser features
      features: {
        cookies: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack,
        language: navigator.language,
        languages: navigator.languages,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: navigator.deviceMemory,
        maxTouchPoints: navigator.maxTouchPoints
      },

      // Connection info
      connection: {
        type: navigator.connection?.effectiveType,
        downlink: navigator.connection?.downlink,
        rtt: navigator.connection?.rtt,
        saveData: navigator.connection?.saveData
      },

      // Timing info for bot detection
      timing: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      },

      // Canvas fingerprint
      canvas: this.getCanvasFingerprint(),

      // WebGL fingerprint
      webgl: this.getWebGLFingerprint(),

      // Audio fingerprint
      audio: this.getAudioFingerprint()
    };
  }

  // Generate canvas fingerprint
  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Canvas fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas fingerprint', 4, 17);

      return canvas.toDataURL().substring(0, 100); // Use first 100 chars
    } catch (e) {
      return null;
    }
  }

  // Generate WebGL fingerprint
  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return null;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

      return {
        vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : null,
        renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null
      };
    } catch (e) {
      return null;
    }
  }

  // Generate audio fingerprint
  getAudioFingerprint() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gain.gain.value = 0; // Mute
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start(0);
      oscillator.stop(0.1);

      return {
        sampleRate: audioContext.sampleRate,
        channelCount: audioContext.destination.channelCount
      };
    } catch (e) {
      return null;
    }
  }

  // Fallback fingerprint for when advanced fingerprinting fails
  getFallbackFingerprint() {
    const fallbackData = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: Date.now()
    };

    const hash = CryptoJS.SHA256(JSON.stringify(fallbackData)).toString();

    return {
      visitorId: hash.substring(0, 16),
      confidence: 0.5,
      components: fallbackData,
      hash: hash,
      timestamp: Date.now()
    };
  }

  // Store fingerprint in localStorage
  storeFingerprint() {
    try {
      const stored = {
        fingerprint: this.fingerprint,
        sessionData: this.sessionData,
        createdAt: Date.now()
      };

      localStorage.setItem('device_fingerprint', JSON.stringify(stored));
    } catch (e) {
      console.error('Failed to store fingerprint:', e);
    }
  }

  // Retrieve stored fingerprint
  getStoredFingerprint() {
    try {
      const stored = localStorage.getItem('device_fingerprint');
      if (stored) {
        const data = JSON.parse(stored);
        // Check if fingerprint is less than 24 hours old
        if (Date.now() - data.createdAt < 86400000) {
          return data.fingerprint;
        }
      }
    } catch (e) {
      console.error('Failed to retrieve fingerprint:', e);
    }
    return null;
  }

  // Get device ID for API calls
  async getDeviceId() {
    if (!this.initialized) {
      // Try to get stored fingerprint first
      const stored = this.getStoredFingerprint();
      if (stored) {
        this.fingerprint = stored;
        this.initialized = true;
        return stored.visitorId;
      }

      // Otherwise initialize new fingerprint
      await this.init();
    }

    return this.fingerprint?.visitorId || 'unknown';
  }

  // Get full fingerprint data for analytics
  async getFullFingerprint() {
    if (!this.initialized) {
      await this.init();
    }

    return {
      ...this.fingerprint,
      session: this.sessionData
    };
  }

  // Check if device is suspicious (bot detection)
  async isSuspiciousDevice() {
    const fp = await this.getFullFingerprint();

    // Check for bot indicators
    const suspicious = [];

    // No JavaScript execution time (too fast)
    if (fp.session?.timing?.loadTime < 100) {
      suspicious.push('abnormally_fast_load');
    }

    // Headless browser detection
    if (navigator.webdriver) {
      suspicious.push('webdriver_detected');
    }

    // No plugins (common in headless browsers)
    if (!navigator.plugins || navigator.plugins.length === 0) {
      suspicious.push('no_plugins');
    }

    // Suspicious user agent
    const botPatterns = /headless|phantom|puppeteer|bot|spider|crawler/i;
    if (botPatterns.test(navigator.userAgent)) {
      suspicious.push('bot_user_agent');
    }

    // No touch support on mobile user agent
    const mobileUA = /mobile|android|iphone/i.test(navigator.userAgent);
    if (mobileUA && !navigator.maxTouchPoints) {
      suspicious.push('fake_mobile');
    }

    return {
      suspicious: suspicious.length > 0,
      reasons: suspicious,
      confidence: Math.min(suspicious.length * 0.25, 1)
    };
  }

  // Generate request signature for additional verification
  generateRequestSignature(data) {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 15);

    const signatureData = {
      ...data,
      timestamp,
      nonce,
      deviceId: this.fingerprint?.visitorId
    };

    return {
      signature: CryptoJS.HmacSHA256(
        JSON.stringify(signatureData),
        this.fingerprint?.hash || 'default'
      ).toString(),
      timestamp,
      nonce
    };
  }
}

// Export singleton instance
const deviceFingerprintService = new DeviceFingerprintService();
export default deviceFingerprintService;