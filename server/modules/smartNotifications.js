/**
 * Smart Notifications System
 * AI-powered personalized notifications and reminders
 */

const admin = require('firebase-admin');
let schedule;
try {
  schedule = require('node-schedule');
} catch (error) {
  console.warn('node-schedule not installed - Smart notifications scheduling disabled');
}
const { GoogleGenerativeAI } = require('@google/generative-ai');

class SmartNotificationSystem {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.scheduledJobs = new Map();
    this.notificationTypes = {
      MEDICATION_REMINDER: 'medication_reminder',
      REFILL_ALERT: 'refill_alert',
      INTERACTION_WARNING: 'interaction_warning',
      PRICE_DROP: 'price_drop',
      HEALTH_TIP: 'health_tip',
      APPOINTMENT: 'appointment',
      SYMPTOM_CHECK: 'symptom_check',
      ACHIEVEMENT: 'achievement'
    };
    
    // Initialize notification scheduler
    this.initializeScheduler();
  }

  /**
   * Initialize the notification scheduler
   */
  initializeScheduler() {
    // Run every minute to check for pending notifications
    if (schedule) {
      schedule.scheduleJob('* * * * *', async () => {
        await this.processPendingNotifications();
      });

      // Daily health tips at 9 AM
      schedule.scheduleJob('0 9 * * *', async () => {
        await this.sendDailyHealthTips();
      });

      // Weekly medication review on Sundays at 7 PM
      schedule.scheduleJob('0 19 * * 0', async () => {
        await this.sendWeeklyReview();
      });
    }
  }

  /**
   * Schedule medication reminders with AI-optimized timing
   */
  async scheduleMedicationReminders(userId, medication) {
    try {
      // Get user's profile and habits
      const userProfile = await this.getUserProfile(userId);
      
      // AI-optimize reminder timing
      const optimalTimes = await this.optimizeReminderTiming(
        medication,
        userProfile
      );

      // Schedule reminders
      optimalTimes.forEach(time => {
        const jobId = `${userId}_${medication.id}_${time}`;
        
        if (!this.scheduledJobs.has(jobId)) {
          if (schedule) {
            const job = schedule.scheduleJob(time, async () => {
              await this.sendMedicationReminder(userId, medication);
            });
            
            this.scheduledJobs.set(jobId, job);
          } else {
            console.warn('Cannot schedule job - node-schedule not available');
          }
        }
      });

      // Save reminder schedule to database
      await this.saveReminderSchedule(userId, medication, optimalTimes);

      return {
        success: true,
        scheduled: optimalTimes,
        message: 'Reminders scheduled successfully'
      };
    } catch (error) {
      console.error('Scheduling error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * AI-optimize reminder timing based on medication and user habits
   */
  async optimizeReminderTiming(medication, userProfile) {
    try {
      const prompt = `
        Optimize medication reminder timing for:
        Medication: ${medication.name}
        Dosage: ${medication.dosage}
        Frequency: ${medication.frequency}
        Food Requirements: ${medication.withFood ? 'Take with food' : 'Can take without food'}
        
        User Profile:
        Wake Time: ${userProfile.wakeTime || '7:00 AM'}
        Sleep Time: ${userProfile.sleepTime || '10:00 PM'}
        Meal Times: Breakfast ${userProfile.breakfast || '8:00 AM'}, 
                   Lunch ${userProfile.lunch || '12:00 PM'}, 
                   Dinner ${userProfile.dinner || '6:00 PM'}
        Work Schedule: ${userProfile.workSchedule || '9 AM - 5 PM'}
        
        Provide optimal reminder times considering:
        1. Medication absorption requirements
        2. Food interactions
        3. User's daily routine
        4. Avoiding sleep disruption
        5. Spacing between doses
      `;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const times = this.parseReminderTimes(result.response.text());
      
      return times;
    } catch (error) {
      // Fallback to standard times
      const frequency = medication.frequency || 'once daily';
      if (frequency.includes('twice')) {
        return ['08:00', '20:00'];
      } else if (frequency.includes('three')) {
        return ['08:00', '14:00', '20:00'];
      } else {
        return ['09:00'];
      }
    }
  }

  /**
   * Send smart medication reminder
   */
  async sendMedicationReminder(userId, medication) {
    try {
      // Check if user already took medication
      const taken = await this.checkMedicationTaken(userId, medication);
      if (taken) return;

      // Get contextual information
      const context = await this.getReminderContext(userId, medication);
      
      // Generate personalized reminder message
      const message = await this.generateReminderMessage(medication, context);
      
      // Send notification
      const notification = {
        userId,
        type: this.notificationTypes.MEDICATION_REMINDER,
        title: `Time for ${medication.name}`,
        body: message,
        data: {
          medicationId: medication.id,
          actionButtons: [
            { action: 'taken', title: 'Mark as Taken' },
            { action: 'snooze', title: 'Remind in 30 min' },
            { action: 'skip', title: 'Skip this dose' }
          ]
        },
        priority: 'high',
        timestamp: new Date()
      };

      await this.sendNotification(notification);
      
      // Track notification
      await this.trackNotification(notification);
    } catch (error) {
      console.error('Reminder error:', error);
    }
  }

  /**
   * Refill alert system
   */
  async checkRefillAlerts() {
    try {
      const users = await this.getAllUsers();
      
      for (const user of users) {
        const medications = await this.getUserMedications(user.id);
        
        for (const med of medications) {
          const daysRemaining = this.calculateDaysRemaining(med);
          
          if (daysRemaining <= 7 && daysRemaining > 0) {
            await this.sendRefillAlert(user.id, med, daysRemaining);
          } else if (daysRemaining === 0) {
            await this.sendUrgentRefillAlert(user.id, med);
          }
        }
      }
    } catch (error) {
      console.error('Refill alert error:', error);
    }
  }

  /**
   * Send refill alert
   */
  async sendRefillAlert(userId, medication, daysRemaining) {
    const notification = {
      userId,
      type: this.notificationTypes.REFILL_ALERT,
      title: 'Refill Reminder',
      body: `${medication.name} will run out in ${daysRemaining} days. Order refill now?`,
      data: {
        medicationId: medication.id,
        actionButtons: [
          { action: 'order', title: 'Order Refill' },
          { action: 'remind_later', title: 'Remind Tomorrow' }
        ],
        pharmacyInfo: await this.getNearestPharmacy(userId)
      },
      priority: daysRemaining <= 3 ? 'high' : 'medium',
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }

  /**
   * Interaction warning system
   */
  async checkInteractionWarnings(userId, newMedication) {
    try {
      const currentMedications = await this.getUserMedications(userId);
      const interactions = [];

      for (const med of currentMedications) {
        const interaction = await this.checkInteraction(newMedication, med);
        if (interaction.severity !== 'none') {
          interactions.push(interaction);
        }
      }

      if (interactions.length > 0) {
        await this.sendInteractionWarning(userId, newMedication, interactions);
      }
    } catch (error) {
      console.error('Interaction warning error:', error);
    }
  }

  /**
   * Send interaction warning
   */
  async sendInteractionWarning(userId, medication, interactions) {
    const highSeverity = interactions.find(i => i.severity === 'high');
    
    const notification = {
      userId,
      type: this.notificationTypes.INTERACTION_WARNING,
      title: '⚠️ Drug Interaction Warning',
      body: highSeverity 
        ? `URGENT: ${medication.name} has serious interaction with your current medications`
        : `${medication.name} may interact with your current medications`,
      data: {
        medicationId: medication.id,
        interactions,
        actionButtons: [
          { action: 'view_details', title: 'View Details' },
          { action: 'contact_doctor', title: 'Contact Doctor' }
        ]
      },
      priority: 'critical',
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }

  /**
   * Price drop notifications
   */
  async checkPriceDrops(userId) {
    try {
      const watchlist = await this.getPriceWatchlist(userId);
      
      for (const item of watchlist) {
        const currentPrice = await this.getCurrentPrice(item.medication);
        
        if (currentPrice < item.targetPrice || currentPrice < item.lastPrice * 0.9) {
          await this.sendPriceDropAlert(userId, item, currentPrice);
        }
      }
    } catch (error) {
      console.error('Price drop check error:', error);
    }
  }

  /**
   * Send price drop alert
   */
  async sendPriceDropAlert(userId, item, newPrice) {
    const savings = item.lastPrice - newPrice;
    const percentOff = Math.round((savings / item.lastPrice) * 100);
    
    const notification = {
      userId,
      type: this.notificationTypes.PRICE_DROP,
      title: `💰 Price Drop Alert!`,
      body: `${item.medication} is now ${percentOff}% off! Save $${savings.toFixed(2)}`,
      data: {
        medicationId: item.medicationId,
        oldPrice: item.lastPrice,
        newPrice,
        pharmacy: item.pharmacy,
        actionButtons: [
          { action: 'buy_now', title: 'Buy Now' },
          { action: 'save_coupon', title: 'Save Coupon' }
        ]
      },
      priority: 'medium',
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }

  /**
   * Daily health tips
   */
  async sendDailyHealthTips() {
    try {
      const users = await this.getAllUsers();
      
      for (const user of users) {
        const tip = await this.generatePersonalizedHealthTip(user);
        
        const notification = {
          userId: user.id,
          type: this.notificationTypes.HEALTH_TIP,
          title: '💡 Daily Health Tip',
          body: tip,
          priority: 'low',
          timestamp: new Date()
        };

        await this.sendNotification(notification);
      }
    } catch (error) {
      console.error('Health tip error:', error);
    }
  }

  /**
   * Generate personalized health tip
   */
  async generatePersonalizedHealthTip(user) {
    try {
      const medications = await this.getUserMedications(user.id);
      const conditions = user.conditions || [];
      
      const prompt = `
        Generate a personalized health tip for a user with:
        Conditions: ${conditions.join(', ') || 'None specified'}
        Medications: ${medications.map(m => m.name).join(', ')}
        
        Provide a short, actionable health tip relevant to their situation.
        Keep it under 100 characters for notification display.
      `;

      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      
      return result.response.text();
    } catch (error) {
      // Fallback tips
      const tips = [
        'Stay hydrated! Aim for 8 glasses of water daily.',
        'Take a 5-minute walk every hour for better health.',
        'Practice deep breathing for stress relief.',
        'Get 7-9 hours of quality sleep each night.'
      ];
      
      return tips[Math.floor(Math.random() * tips.length)];
    }
  }

  /**
   * Weekly medication review
   */
  async sendWeeklyReview() {
    try {
      const users = await this.getAllUsers();
      
      for (const user of users) {
        const stats = await this.getWeeklyStats(user.id);
        
        if (stats.adherence < 0.8) {
          const notification = {
            userId: user.id,
            type: this.notificationTypes.HEALTH_TIP,
            title: '📊 Weekly Medication Review',
            body: `Your adherence was ${Math.round(stats.adherence * 100)}% this week. Let's improve together!`,
            data: {
              stats,
              actionButtons: [
                { action: 'view_report', title: 'View Report' },
                { action: 'set_goals', title: 'Set Goals' }
              ]
            },
            priority: 'medium',
            timestamp: new Date()
          };

          await this.sendNotification(notification);
        }
      }
    } catch (error) {
      console.error('Weekly review error:', error);
    }
  }

  /**
   * Send notification through appropriate channel
   */
  async sendNotification(notification) {
    try {
      // Send push notification via Firebase
      if (admin.apps.length) {
        const userToken = await this.getUserToken(notification.userId);
        
        if (userToken) {
          const message = {
            notification: {
              title: notification.title,
              body: notification.body
            },
            data: notification.data || {},
            token: userToken,
            android: {
              priority: notification.priority === 'critical' ? 'high' : 'normal'
            },
            apns: {
              headers: {
                'apns-priority': notification.priority === 'critical' ? '10' : '5'
              }
            }
          };

          await admin.messaging().send(message);
        }
      }

      // Save notification to database
      await this.saveNotification(notification);
      
      // Send email if critical
      if (notification.priority === 'critical') {
        await this.sendEmailNotification(notification);
      }
      
      // Send SMS if urgent
      if (notification.priority === 'critical' && notification.type === this.notificationTypes.REFILL_ALERT) {
        await this.sendSMSNotification(notification);
      }
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }

  /**
   * Process pending notifications
   */
  async processPendingNotifications() {
    try {
      if (!admin.apps.length) return;

      const now = new Date();
      const pendingSnapshot = await admin.firestore()
        .collection('pendingNotifications')
        .where('scheduledTime', '<=', now)
        .where('sent', '==', false)
        .limit(100)
        .get();

      for (const doc of pendingSnapshot.docs) {
        const notification = doc.data();
        await this.sendNotification(notification);
        
        // Mark as sent
        await doc.ref.update({
          sent: true,
          sentAt: now
        });
      }
    } catch (error) {
      console.error('Process pending notifications error:', error);
    }
  }

  /**
   * Helper methods
   */
  parseReminderTimes(aiResponse) {
    // Parse AI response to extract times
    const times = [];
    const timeRegex = /\d{1,2}:\d{2}\s*(AM|PM)?/gi;
    const matches = aiResponse.match(timeRegex);
    
    if (matches) {
      matches.forEach(time => {
        // Convert to 24-hour format
        times.push(this.convertTo24Hour(time));
      });
    }
    
    return times.length > 0 ? times : ['09:00'];
  }

  convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    
    return `${hours}:${minutes}`;
  }

  async getUserProfile(userId) {
    // Mock user profile
    return {
      userId,
      wakeTime: '07:00',
      sleepTime: '22:00',
      breakfast: '08:00',
      lunch: '12:00',
      dinner: '18:00',
      workSchedule: '09:00-17:00'
    };
  }

  async saveReminderSchedule(userId, medication, times) {
    // Save to database
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('reminders')
      .doc(medication.id)
      .set({
        medication,
        times,
        createdAt: new Date(),
        active: true
      });
  }

  async checkMedicationTaken(userId, medication) {
    // Check if medication was already taken today
    return false;
  }

  async getReminderContext(userId, medication) {
    return {
      weather: 'sunny',
      userActivity: 'at home',
      mealTime: false
    };
  }

  async generateReminderMessage(medication, context) {
    let message = `Take ${medication.dosage} of ${medication.name}`;
    
    if (medication.withFood) {
      message += ' with food';
    }
    
    if (medication.instructions) {
      message += `. ${medication.instructions}`;
    }
    
    return message;
  }

  async trackNotification(notification) {
    // Track for analytics
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('notificationHistory')
      .add({
        ...notification,
        trackedAt: new Date()
      });
  }

  async getAllUsers() {
    // Mock users - in production, get from database
    return [{ id: 'user1' }, { id: 'user2' }];
  }

  async getUserMedications(userId) {
    // Mock medications
    return [
      { id: 'med1', name: 'Aspirin', dosage: '81mg', frequency: 'once daily' }
    ];
  }

  calculateDaysRemaining(medication) {
    // Calculate based on quantity and dosage
    return Math.floor(Math.random() * 15);
  }

  async getNearestPharmacy(userId) {
    return {
      name: 'CVS Pharmacy',
      address: '123 Main St',
      phone: '555-0123'
    };
  }

  async checkInteraction(med1, med2) {
    return {
      severity: Math.random() > 0.8 ? 'high' : 'none',
      description: 'Potential interaction'
    };
  }

  async getPriceWatchlist(userId) {
    return [];
  }

  async getCurrentPrice(medication) {
    return Math.random() * 100 + 20;
  }

  async getWeeklyStats(userId) {
    return {
      adherence: Math.random(),
      missedDoses: Math.floor(Math.random() * 5)
    };
  }

  async getUserToken(userId) {
    // Get FCM token from database
    return null;
  }

  async saveNotification(notification) {
    if (!admin.apps.length) return;

    await admin.firestore()
      .collection('notifications')
      .add(notification);
  }

  async sendEmailNotification(notification) {
    // Email integration
    console.log('Email notification:', notification.title);
  }

  async sendSMSNotification(notification) {
    // SMS integration (Twilio, etc.)
    console.log('SMS notification:', notification.title);
  }
}

module.exports = SmartNotificationSystem;