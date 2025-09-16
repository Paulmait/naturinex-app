// Push Notification Service
// Handles medication reminders, alerts, and engagement notifications

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class PushNotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Initialize push notifications
  async initialize(userId) {
    try {
      // Request permissions
      const permission = await this.requestPermissions();
      if (!permission) {
        console.log('Push notification permission denied');
        return false;
      }

      // Get push token
      this.expoPushToken = await this.registerForPushNotifications();
      
      // Save token to database
      if (this.expoPushToken && userId) {
        await this.saveTokenToDatabase(userId, this.expoPushToken);
      }

      // Set up listeners
      this.setupNotificationListeners();

      // Schedule default reminders
      await this.scheduleDefaultReminders();

      return true;
    } catch (error) {
      console.error('Push notification initialization failed:', error);
      return false;
    }
  }

  // Request notification permissions
  async requestPermissions() {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  // Register for push notifications
  async registerForPushNotifications() {
    if (!Device.isDevice) return null;

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
        });

        await Notifications.setNotificationChannelAsync('medications', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('interactions', {
          name: 'Drug Interactions',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'alert',
        });
      }
      
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  // Save token to database
  async saveTokenToDatabase(userId, token) {
    try {
      await supabase.from('push_tokens').upsert({
        user_id: userId,
        token,
        platform: Platform.OS,
        device_info: {
          brand: Device.brand,
          model: Device.modelName,
          os_version: Device.osVersion,
        },
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save push token:', error);
    }
  }

  // Set up notification listeners
  setupNotificationListeners() {
    // Listener for received notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleReceivedNotification(notification);
    });

    // Listener for user interaction with notifications
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  // Handle received notification
  async handleReceivedNotification(notification) {
    const { type, data } = notification.request.content.data || {};
    
    // Track notification received
    await this.trackNotificationEvent('received', type, data);
    
    // Update badge count
    const currentBadge = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(currentBadge + 1);
  }

  // Handle notification response (user tapped)
  async handleNotificationResponse(response) {
    const { type, data } = response.notification.request.content.data || {};
    
    // Track notification interaction
    await this.trackNotificationEvent('opened', type, data);
    
    // Clear badge
    await Notifications.setBadgeCountAsync(0);
    
    // Navigate based on notification type
    switch (type) {
      case 'medication_reminder':
        // Navigate to medication screen
        break;
      case 'interaction_warning':
        // Navigate to interaction details
        break;
      case 'appointment':
        // Navigate to appointments
        break;
      case 'subscription':
        // Navigate to subscription screen
        break;
      default:
        // Navigate to home
        break;
    }
  }

  // Schedule medication reminder
  async scheduleMedicationReminder(medication, schedule) {
    const { name, dosage, frequency, times } = medication;
    
    for (const time of times) {
      const [hours, minutes] = time.split(':').map(Number);
      
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Medication Reminder',
          body: `Time to take ${name} (${dosage})`,
          sound: 'default',
          data: {
            type: 'medication_reminder',
            data: { medication_id: medication.id, name, dosage },
          },
        },
        trigger,
        identifier: `med_${medication.id}_${time}`,
      });
    }
    
    // Save reminder to database
    await this.saveReminderToDatabase(medication, schedule);
  }

  // Send interaction warning
  async sendInteractionWarning(interactions) {
    const critical = interactions.filter(i => i.severity === 'critical');
    
    if (critical.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Critical Drug Interaction Warning',
          body: `${critical[0].description}. Consult your doctor immediately.`,
          sound: 'alert',
          priority: 'high',
          data: {
            type: 'interaction_warning',
            data: { interactions: critical },
          },
        },
        trigger: null, // Send immediately
      });
    }
  }

  // Schedule refill reminder
  async scheduleRefillReminder(medication, daysBeforeEmpty = 3) {
    const { name, quantity, dailyDosage } = medication;
    const daysUntilEmpty = quantity / dailyDosage;
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + (daysUntilEmpty - daysBeforeEmpty));
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔄 Refill Reminder',
        body: `${name} will run out in ${daysBeforeEmpty} days. Time to refill!`,
        sound: 'default',
        data: {
          type: 'refill_reminder',
          data: { medication_id: medication.id, name },
        },
      },
      trigger: reminderDate,
      identifier: `refill_${medication.id}`,
    });
  }

  // Send appointment reminder
  async scheduleAppointmentReminder(appointment) {
    const { provider, datetime, type } = appointment;
    const reminderTime = new Date(datetime);
    reminderTime.setHours(reminderTime.getHours() - 1); // 1 hour before
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📅 Appointment Reminder',
        body: `${type} with ${provider} in 1 hour`,
        sound: 'default',
        data: {
          type: 'appointment',
          data: appointment,
        },
      },
      trigger: reminderTime,
      identifier: `appointment_${appointment.id}`,
    });
  }

  // Send promotional notification
  async sendPromotionalNotification(promotion) {
    const { title, message, deepLink } = promotion;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: message,
        sound: 'default',
        data: {
          type: 'promotion',
          data: { deepLink },
        },
      },
      trigger: null,
    });
  }

  // Schedule default reminders
  async scheduleDefaultReminders() {
    // Daily health tip
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Daily Health Tip',
        body: 'Discover natural ways to improve your health today!',
        data: { type: 'health_tip' },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },
      identifier: 'daily_health_tip',
    });

    // Weekly check-in
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📋 Weekly Check-In',
        body: 'How are your natural remedies working? Log your progress.',
        data: { type: 'weekly_checkin' },
      },
      trigger: {
        weekday: 1, // Monday
        hour: 10,
        minute: 0,
        repeats: true,
      },
      identifier: 'weekly_checkin',
    });
  }

  // Get scheduled notifications
  async getScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  // Cancel notification
  async cancelNotification(identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Update notification settings
  async updateNotificationSettings(settings) {
    await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
    
    // Apply settings
    if (!settings.medicationReminders) {
      const scheduled = await this.getScheduledNotifications();
      const medReminders = scheduled.filter(n => 
        n.identifier.startsWith('med_')
      );
      
      for (const reminder of medReminders) {
        await this.cancelNotification(reminder.identifier);
      }
    }
    
    // Save to database
    await supabase.from('notification_preferences').upsert(settings);
  }

  // Track notification events
  async trackNotificationEvent(event, type, data) {
    try {
      await supabase.from('notification_analytics').insert({
        event,
        type,
        data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to track notification event:', error);
    }
  }

  // Save reminder to database
  async saveReminderToDatabase(medication, schedule) {
    try {
      await supabase.from('medication_reminders').upsert({
        medication_id: medication.id,
        schedule,
        active: true,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to save reminder:', error);
    }
  }

  // Clean up
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Create singleton instance
const pushNotificationService = new PushNotificationService();

export default pushNotificationService;

// Export convenience functions
export const initializePushNotifications = (userId) => 
  pushNotificationService.initialize(userId);

export const scheduleMedicationReminder = (medication, schedule) => 
  pushNotificationService.scheduleMedicationReminder(medication, schedule);

export const sendInteractionWarning = (interactions) => 
  pushNotificationService.sendInteractionWarning(interactions);

export const scheduleRefillReminder = (medication, days) => 
  pushNotificationService.scheduleRefillReminder(medication, days);