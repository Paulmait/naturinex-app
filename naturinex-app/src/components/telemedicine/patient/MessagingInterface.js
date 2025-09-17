/**
 * MessagingInterface - Patient messaging interface for secure communication with healthcare providers
 * Supports text messages, image sharing, and appointment-related communications
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { useMediaQuery } from 'react-responsive';
import {
  Send, Paperclip, Image as ImageIcon, Camera, FileText,
  User, Clock, Check, CheckCheck, Search, Phone, Video
} from 'lucide-react';
import { telemedicineService } from '../../../services/telemedicineService';

const MessagingInterface = ({ route, navigation }) => {
  const { patientId, providerId, appointmentId = null } = route.params;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [providerInfo, setProviderInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollViewRef = useRef(null);
  const isWeb = useMediaQuery({ query: '(min-width: 768px)' });

  useEffect(() => {
    loadConversation();
    // Set up real-time message listening
    const interval = setInterval(loadNewMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversation = async () => {
    try {
      setLoading(true);

      // Load provider information
      const provider = {
        id: providerId,
        name: 'Dr. Sarah Wilson',
        specialty: 'General Medicine',
        isOnline: true,
        lastSeen: new Date().toISOString()
      };
      setProviderInfo(provider);

      // Load message history
      const result = await telemedicineService.getMessageHistory(
        patientId,
        providerId,
        appointmentId
      );

      // Mock messages for demonstration
      const mockMessages = [
        {
          id: 'msg_001',
          senderId: providerId,
          senderType: 'provider',
          content: 'Hello! I hope you\'re feeling better since our last consultation. How are you doing today?',
          timestamp: '2024-01-15T10:30:00Z',
          messageType: 'text',
          readStatus: true,
          deliveryStatus: 'delivered'
        },
        {
          id: 'msg_002',
          senderId: patientId,
          senderType: 'patient',
          content: 'Hi Dr. Wilson! I\'m feeling much better, thank you. The medication you prescribed is working well.',
          timestamp: '2024-01-15T10:32:00Z',
          messageType: 'text',
          readStatus: true,
          deliveryStatus: 'delivered'
        },
        {
          id: 'msg_003',
          senderId: providerId,
          senderType: 'provider',
          content: 'That\'s wonderful to hear! Have you experienced any side effects from the medication?',
          timestamp: '2024-01-15T10:35:00Z',
          messageType: 'text',
          readStatus: true,
          deliveryStatus: 'delivered'
        },
        {
          id: 'msg_004',
          senderId: patientId,
          senderType: 'patient',
          content: 'No side effects so far. I have a question about the dosage though. Should I continue with the same amount?',
          timestamp: '2024-01-15T10:38:00Z',
          messageType: 'text',
          readStatus: false,
          deliveryStatus: 'delivered'
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading conversation:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadNewMessages = async () => {
    try {
      // In real implementation, check for new messages
      // For now, simulate typing indicator occasionally
      if (Math.random() > 0.9) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    } catch (error) {
      console.error('Error loading new messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Create optimistic message
      const tempMessage = {
        id: `temp_${Date.now()}`,
        senderId: patientId,
        senderType: 'patient',
        content: messageContent,
        timestamp: new Date().toISOString(),
        messageType: 'text',
        readStatus: false,
        deliveryStatus: 'sending'
      };

      setMessages(prev => [...prev, tempMessage]);

      // Send message
      const result = await telemedicineService.sendMessage(
        patientId,
        providerId,
        messageContent,
        'text',
        appointmentId
      );

      if (result.success) {
        // Update message with actual data
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessage.id
              ? { ...result.message, deliveryStatus: 'delivered' }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');

      // Update message status to failed
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempMessage.id
            ? { ...msg, deliveryStatus: 'failed' }
            : msg
        )
      );
    }
  };

  const sendImage = async () => {
    try {
      // In real implementation, open image picker
      Alert.alert('Feature Coming Soon', 'Image sharing will be available in the next update');
    } catch (error) {
      console.error('Error sending image:', error);
    }
  };

  const sendDocument = async () => {
    try {
      // In real implementation, open document picker
      Alert.alert('Feature Coming Soon', 'Document sharing will be available in the next update');
    } catch (error) {
      console.error('Error sending document:', error);
    }
  };

  const initiateVideoCall = () => {
    if (appointmentId) {
      navigation.navigate('VideoConsultationInterface', {
        appointmentId,
        patientId
      });
    } else {
      Alert.alert('Video Call', 'Schedule an appointment to start a video consultation');
    }
  };

  const initiatePhoneCall = () => {
    Alert.alert('Phone Call', 'Voice calls will be available soon');
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const MessageBubble = ({ message }) => {
    const isOwnMessage = message.senderType === 'patient';

    return (
      <View style={[
        styles.messageBubble,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {message.content}
        </Text>

        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatMessageTime(message.timestamp)}
          </Text>

          {isOwnMessage && (
            <View style={styles.messageStatus}>
              {message.deliveryStatus === 'sending' && (
                <Clock size={12} color="#9CA3AF" />
              )}
              {message.deliveryStatus === 'delivered' && !message.readStatus && (
                <Check size={12} color="#9CA3AF" />
              )}
              {message.deliveryStatus === 'delivered' && message.readStatus && (
                <CheckCheck size={12} color="#10B981" />
              )}
              {message.deliveryStatus === 'failed' && (
                <Text style={styles.failedStatus}>!</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  const TypingIndicator = () => (
    <View style={[styles.messageBubble, styles.otherMessage, styles.typingBubble]}>
      <Text style={styles.typingText}>
        {providerInfo?.name} is typing...
      </Text>
      <View style={styles.typingDots}>
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
      </View>
    </View>
  );

  const AttachmentOptions = () => (
    <View style={styles.attachmentOptions}>
      <TouchableOpacity style={styles.attachmentOption} onPress={sendImage}>
        <ImageIcon size={24} color="#4F46E5" />
        <Text style={styles.attachmentText}>Image</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.attachmentOption} onPress={() => {}}>
        <Camera size={24} color="#4F46E5" />
        <Text style={styles.attachmentText}>Camera</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.attachmentOption} onPress={sendDocument}>
        <FileText size={24} color="#4F46E5" />
        <Text style={styles.attachmentText}>Document</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading conversation...</Text>
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

        <View style={styles.providerHeader}>
          <View style={styles.providerAvatar}>
            <User size={24} color="#4F46E5" />
          </View>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{providerInfo?.name}</Text>
            <Text style={styles.providerStatus}>
              {providerInfo?.isOnline ? 'Online' : `Last seen ${formatMessageTime(providerInfo?.lastSeen)}`}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={initiatePhoneCall}>
            <Phone size={20} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={initiateVideoCall}>
            <Video size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
      >
        {appointmentId && (
          <View style={styles.appointmentBanner}>
            <Text style={styles.appointmentText}>
              Messages related to your appointment
            </Text>
          </View>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && <TypingIndicator />}
      </ScrollView>

      {/* Attachment Options */}
      {showAttachmentOptions && <AttachmentOptions />}

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setShowAttachmentOptions(!showAttachmentOptions)}
        >
          <Paperclip size={20} color="#6B7280" />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
        >
          <Send size={20} color={newMessage.trim() ? '#fff' : '#9CA3AF'} />
        </TouchableOpacity>
      </View>

      {/* Message Guidelines */}
      <View style={styles.guidelines}>
        <Text style={styles.guidelinesText}>
          💡 For urgent medical concerns, please call emergency services or visit your nearest emergency room
        </Text>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    color: '#4F46E5',
    fontSize: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 16,
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
  providerStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  appointmentBanner: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  appointmentText: {
    fontSize: 14,
    color: '#3B82F6',
    textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  ownMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  otherMessageTime: {
    color: '#6B7280',
  },
  messageStatus: {
    marginLeft: 8,
  },
  failedStatus: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typingBubble: {
    backgroundColor: '#F3F4F6',
  },
  typingText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  typingDots: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  attachmentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentOption: {
    alignItems: 'center',
    padding: 12,
  },
  attachmentText: {
    fontSize: 12,
    color: '#4F46E5',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#4F46E5',
  },
  sendButtonInactive: {
    backgroundColor: '#F3F4F6',
  },
  guidelines: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  guidelinesText: {
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default MessagingInterface;