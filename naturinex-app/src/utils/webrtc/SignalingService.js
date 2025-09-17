/**
 * SignalingService - WebRTC signaling service for telemedicine consultations
 * Handles offer/answer exchange and ICE candidate sharing between peers
 */

import { supabase } from '../../config/supabase';

class SignalingService {
  constructor() {
    this.consultationId = null;
    this.userType = null; // 'patient' or 'provider'
    this.listeners = new Map();
    this.isListening = false;
    this.subscription = null;
  }

  /**
   * Initialize signaling for a consultation
   */
  async initialize(consultationId, userType) {
    this.consultationId = consultationId;
    this.userType = userType;

    console.log(`Signaling service initialized for consultation ${consultationId} as ${userType}`);
  }

  /**
   * Start listening for signaling messages
   */
  startListening() {
    if (this.isListening || !this.consultationId) return;

    this.isListening = true;

    // Subscribe to real-time signaling updates
    this.subscription = supabase
      .channel(`consultation_${this.consultationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_signaling',
          filter: `consultation_id=eq.${this.consultationId}`
        },
        (payload) => {
          this.handleSignalingMessage(payload.new);
        }
      )
      .subscribe();

    console.log('Started listening for signaling messages');
  }

  /**
   * Stop listening for signaling messages
   */
  stopListening() {
    if (!this.isListening) return;

    this.isListening = false;

    if (this.subscription) {
      supabase.removeChannel(this.subscription);
      this.subscription = null;
    }

    console.log('Stopped listening for signaling messages');
  }

  /**
   * Handle incoming signaling message
   */
  handleSignalingMessage(message) {
    try {
      const { signal_type, signal_data, sender_type } = message;

      // Don't process our own messages
      if (sender_type === this.userType) return;

      const data = typeof signal_data === 'string'
        ? JSON.parse(signal_data)
        : signal_data;

      console.log(`Received ${signal_type} from ${sender_type}`);

      // Emit event to listeners
      this.emit(signal_type, data);
    } catch (error) {
      console.error('Error handling signaling message:', error);
    }
  }

  /**
   * Send offer
   */
  async sendOffer(offer) {
    try {
      await this.sendSignalingMessage('offer', offer);
      console.log('Sent offer');
    } catch (error) {
      console.error('Error sending offer:', error);
      throw error;
    }
  }

  /**
   * Send answer
   */
  async sendAnswer(answer) {
    try {
      await this.sendSignalingMessage('answer', answer);
      console.log('Sent answer');
    } catch (error) {
      console.error('Error sending answer:', error);
      throw error;
    }
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(candidate) {
    try {
      await this.sendSignalingMessage('ice-candidate', candidate);
      console.log('Sent ICE candidate');
    } catch (error) {
      console.error('Error sending ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Send generic signaling message
   */
  async sendSignalingMessage(type, data) {
    if (!this.consultationId) {
      throw new Error('Consultation ID not set');
    }

    try {
      const { error } = await supabase
        .from('consultation_signaling')
        .insert([
          {
            consultation_id: this.consultationId,
            signal_type: type,
            signal_data: JSON.stringify(data),
            sender_type: this.userType,
            timestamp: new Date().toISOString()
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending signaling message:', error);
      throw error;
    }
  }

  /**
   * Get existing signaling messages for consultation
   */
  async getExistingMessages() {
    if (!this.consultationId) return [];

    try {
      const { data, error } = await supabase
        .from('consultation_signaling')
        .select('*')
        .eq('consultation_id', this.consultationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting existing messages:', error);
      return [];
    }
  }

  /**
   * Process any pending messages
   */
  async processPendingMessages() {
    try {
      const messages = await this.getExistingMessages();

      for (const message of messages) {
        // Only process messages from the other peer
        if (message.sender_type !== this.userType) {
          this.handleSignalingMessage(message);
        }
      }
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }

  /**
   * Clean up old signaling data
   */
  async cleanup() {
    if (!this.consultationId) return;

    try {
      const { error } = await supabase
        .from('consultation_signaling')
        .delete()
        .eq('consultation_id', this.consultationId);

      if (error) throw error;

      console.log('Cleaned up signaling data');
    } catch (error) {
      console.error('Error cleaning up signaling data:', error);
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.listeners.has(event)) return;

    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in signaling event callback:', error);
      }
    });
  }

  /**
   * Destroy signaling service
   */
  destroy() {
    this.stopListening();
    this.listeners.clear();
    this.consultationId = null;
    this.userType = null;
  }
}

export default SignalingService;