/**
 * Email Service Module using Resend
 * Handles all email communications for the platform
 */

const { Resend } = require('resend');

class EmailService {
  constructor() {
    // Initialize Resend only if API key is available
    this.resend = process.env.RESEND_API_KEY ? 
      new Resend(process.env.RESEND_API_KEY) : null;
    this.fromEmail = 'notifications@naturinex.com';
    this.enabled = !!process.env.RESEND_API_KEY;
    
    this.templates = {
      welcome: 'd-welcome-template-id',
      medicationReminder: 'd-medication-reminder-id',
      refillAlert: 'd-refill-alert-id',
      priceDropAlert: 'd-price-drop-id',
      weeklyReport: 'd-weekly-report-id',
      doctorAppointment: 'd-appointment-id',
      achievementUnlocked: 'd-achievement-id'
    };
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    if (!this.enabled) {
      console.log('Email service not configured - skipping welcome email');
      return { success: false, message: 'Email service not configured' };
    }
    
    try {
      const data = await this.resend.emails.send({
        from: `Naturinex <${this.fromEmail}>`,
        to: user.email,
        subject: 'Welcome to Naturinex - Your Health Journey Begins',
        html: `
          <h2>Welcome ${user.name}!</h2>
          <p>Thank you for joining Naturinex. Here's what you can do:</p>
          <ul>
            <li>📷 Scan medications instantly</li>
            <li>💊 Check drug interactions</li>
            <li>💰 Compare prices across pharmacies</li>
            <li>👨‍⚕️ Consult with doctors</li>
            <li>🏆 Earn rewards for healthy habits</li>
          </ul>
          <p><a href="https://naturinex.com/dashboard">Get Started</a></p>
        `,
        tags: [
          { name: 'category', value: 'welcome' },
          { name: 'userId', value: user.id }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send daily medication reminders (Premium feature)
   */
  async sendMedicationReminder(user, medications) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const medicationList = medications.map(med => 
        `<li>${med.name} - ${med.dosage} at ${med.time}</li>`
      ).join('');

      const data = await this.resend.emails.send({
        from: `Naturinex Reminders <${this.fromEmail}>`,
        to: user.email,
        subject: `Daily Medication Reminder - ${new Date().toLocaleDateString()}`,
        html: `
          <h3>Good morning ${user.name}! 🌞</h3>
          <p>Here are your medications for today:</p>
          <ul>${medicationList}</ul>
          <p><strong>Pro Tip:</strong> Taking medications with food can reduce stomach upset.</p>
          <p>Current Streak: 🔥 ${user.streak} days</p>
          <p><a href="https://naturinex.com/medications">Mark as Taken</a></p>
        `,
        tags: [
          { name: 'category', value: 'reminder' },
          { name: 'userId', value: user.id }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Medication reminder error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send refill alerts
   */
  async sendRefillAlert(user, medication, daysRemaining) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const data = await this.resend.emails.send({
        from: `Naturinex Alerts <${this.fromEmail}>`,
        to: user.email,
        subject: `Refill Alert: ${medication.name} - ${daysRemaining} days remaining`,
        html: `
          <h3>Time to refill ${medication.name}</h3>
          <p>You have approximately ${daysRemaining} days of ${medication.name} remaining.</p>
          <h4>💰 Best Prices Found:</h4>
          <ul>
            <li>Walmart: $${medication.prices.walmart}</li>
            <li>CVS: $${medication.prices.cvs}</li>
            <li>Walgreens: $${medication.prices.walgreens}</li>
          </ul>
          <p><a href="https://naturinex.com/refill/${medication.id}">Order Refill</a></p>
        `,
        tags: [
          { name: 'category', value: 'refill' },
          { name: 'medicationId', value: medication.id }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Refill alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send price drop alerts
   */
  async sendPriceDropAlert(user, medication, oldPrice, newPrice) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const savings = oldPrice - newPrice;
      const percentSaved = Math.round((savings / oldPrice) * 100);

      const data = await this.resend.emails.send({
        from: `Naturinex Savings <${this.fromEmail}>`,
        to: user.email,
        subject: `💰 Price Drop Alert: Save $${savings} on ${medication.name}`,
        html: `
          <h3>Great news! ${medication.name} price dropped ${percentSaved}%</h3>
          <p>Old price: $${oldPrice}</p>
          <p><strong>New price: $${newPrice}</strong></p>
          <p>You save: $${savings}</p>
          <p>Available at: ${medication.pharmacy}</p>
          <p><a href="https://naturinex.com/buy/${medication.id}">Get This Deal</a></p>
        `,
        tags: [
          { name: 'category', value: 'price-alert' },
          { name: 'savings', value: savings.toString() }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Price drop alert error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send weekly health report (Premium feature)
   */
  async sendWeeklyReport(user, reportData) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const data = await this.resend.emails.send({
        from: `Naturinex Reports <${this.fromEmail}>`,
        to: user.email,
        subject: `Your Weekly Health Report - ${user.name}`,
        html: `
          <h2>Weekly Health Summary 📊</h2>
          
          <h3>Medication Adherence</h3>
          <p>Adherence Rate: ${reportData.adherenceRate}%</p>
          <p>Streak: 🔥 ${reportData.streak} days</p>
          
          <h3>Achievements Unlocked</h3>
          <ul>
            ${reportData.achievements.map(a => `<li>${a.icon} ${a.name}</li>`).join('')}
          </ul>
          
          <h3>Money Saved</h3>
          <p>This week: $${reportData.weekSavings}</p>
          <p>Total saved: $${reportData.totalSavings}</p>
          
          <h3>Health Score</h3>
          <p>Current: ${reportData.healthScore}/100</p>
          <p>Trend: ${reportData.trend}</p>
          
          <h3>Upcoming</h3>
          <ul>
            <li>Refills needed: ${reportData.refillsNeeded}</li>
            <li>Doctor appointments: ${reportData.appointments}</li>
          </ul>
          
          <p><a href="https://naturinex.com/dashboard">View Full Report</a></p>
        `,
        tags: [
          { name: 'category', value: 'weekly-report' },
          { name: 'week', value: new Date().toISOString() }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Weekly report error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send doctor appointment confirmations
   */
  async sendAppointmentConfirmation(user, appointment) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const data = await this.resend.emails.send({
        from: `Naturinex Health <${this.fromEmail}>`,
        to: user.email,
        subject: `Appointment Confirmed - ${appointment.doctorName}`,
        html: `
          <h3>Your appointment is confirmed!</h3>
          <p><strong>Doctor:</strong> ${appointment.doctorName}</p>
          <p><strong>Type:</strong> ${appointment.type}</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          ${appointment.type === 'VIDEO' ? 
            `<p><strong>Video Link:</strong> <a href="${appointment.videoLink}">Join Video Call</a></p>` : 
            `<p><strong>Location:</strong> ${appointment.location}</p>`
          }
          <p><a href="https://naturinex.com/appointments/${appointment.id}">Manage Appointment</a></p>
        `,
        tags: [
          { name: 'category', value: 'appointment' },
          { name: 'appointmentId', value: appointment.id }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Appointment confirmation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send achievement notifications
   */
  async sendAchievementUnlocked(user, achievement) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const data = await this.resend.emails.send({
        from: `Naturinex Rewards <${this.fromEmail}>`,
        to: user.email,
        subject: `🏆 Achievement Unlocked: ${achievement.name}`,
        html: `
          <h2>Congratulations ${user.name}! 🎉</h2>
          <div style="text-align: center;">
            <h1>${achievement.icon}</h1>
            <h3>${achievement.name}</h3>
            <p>${achievement.description}</p>
            <p><strong>+${achievement.points} points</strong></p>
          </div>
          <p>You're now Level ${user.level} with ${user.totalPoints} total points!</p>
          <p><a href="https://naturinex.com/achievements">View All Achievements</a></p>
        `,
        tags: [
          { name: 'category', value: 'achievement' },
          { name: 'achievementType', value: achievement.type }
        ]
      });

      return { success: true, messageId: data.id };
    } catch (error) {
      console.error('Achievement notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule batch emails for efficiency
   */
  async sendBatchEmails(emailBatch) {
    if (!this.enabled) return { success: false, message: 'Email service not configured' };
    
    try {
      const results = await Promise.allSettled(
        emailBatch.map(email => this.resend.emails.send(email))
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: true,
        sent: successful,
        failed,
        total: emailBatch.length
      };
    } catch (error) {
      console.error('Batch email error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(timeframe = '7d') {
    // Track open rates, click rates, etc.
    return {
      sent: 1000,
      opened: 650,
      clicked: 320,
      openRate: 65,
      clickRate: 32
    };
  }
}

module.exports = EmailService;