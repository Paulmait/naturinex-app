const { Resend } = require('resend');
const crypto = require('crypto');
const { pool } = require('../database/db-config');

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const templates = {
  welcome: (user) => ({
    subject: 'Welcome to NaturineX - Your Health Journey Begins',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e4e8; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to NaturineX!</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name || 'there'},</p>
              <p>Thank you for joining NaturineX! We're excited to help you on your health journey.</p>
              <p>With NaturineX, you can:</p>
              <ul>
                <li>Scan product barcodes to check ingredients</li>
                <li>Track your health metrics over time</li>
                <li>Get personalized health recommendations</li>
                <li>Access detailed product information</li>
              </ul>
              <a href="${process.env.APP_URL}/verify-email?token=${user.verificationToken}" class="button">Verify Your Email</a>
              <p style="margin-top: 20px;">If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 NaturineX. All rights reserved.</p>
              <p>This email was sent to ${user.email}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to NaturineX! Thank you for joining us. Please verify your email by clicking: ${process.env.APP_URL}/verify-email?token=${user.verificationToken}`
  }),

  verification: (user) => ({
    subject: 'Verify Your NaturineX Email',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e4e8; border-radius: 0 0 10px 10px; }
            .verification-code { background: #f6f8fa; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 2px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Email Verification</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name || 'there'},</p>
              <p>Please verify your email address to complete your NaturineX registration.</p>
              <div class="verification-code">${user.verificationCode}</div>
              <p>Or click the button below:</p>
              <p style="text-align: center;">
                <a href="${process.env.APP_URL}/verify-email?token=${user.verificationToken}" class="button">Verify Email</a>
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in 24 hours. If you didn't create an account, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Verify your email for NaturineX. Your verification code is: ${user.verificationCode}. Or click: ${process.env.APP_URL}/verify-email?token=${user.verificationToken}`
  }),

  passwordReset: (user) => ({
    subject: 'Reset Your NaturineX Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d73502; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e4e8; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #d73502; color: white; text-decoration: none; border-radius: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name || 'there'},</p>
              <p>We received a request to reset your password for your NaturineX account.</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${process.env.APP_URL}/reset-password?token=${user.resetToken}" class="button">Reset Password</a>
              </p>
              <div class="warning">
                <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this, please ignore this email or contact support if you have concerns.
              </div>
              <p style="color: #666; font-size: 14px;">For security reasons, we never include passwords in emails.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Reset your NaturineX password: ${process.env.APP_URL}/reset-password?token=${user.resetToken}. This link expires in 1 hour.`
  }),

  scanAlert: (data) => ({
    subject: `Health Alert: ${data.productName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert-header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e4e8; border-radius: 0 0 10px 10px; }
            .ingredient-list { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .warning { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert-header">
              <h1>⚠️ Health Alert</h1>
            </div>
            <div class="content">
              <p>Product: <strong>${data.productName}</strong></p>
              <p>Scanned: ${new Date().toLocaleString()}</p>
              <div class="ingredient-list">
                <p class="warning">Potentially harmful ingredients detected:</p>
                <ul>
                  ${data.harmfulIngredients.map(ing => `<li>${ing.name} - ${ing.reason}</li>`).join('')}
                </ul>
              </div>
              <p>Recommendation: ${data.recommendation}</p>
              <p style="margin-top: 20px;">
                <a href="${process.env.APP_URL}/scan-history" style="color: #667eea;">View your scan history →</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Health Alert for ${data.productName}. Harmful ingredients detected: ${data.harmfulIngredients.map(i => i.name).join(', ')}. ${data.recommendation}`
  })
};

// Email service class
class EmailService {
  constructor() {
    this.rateLimits = new Map();
    this.maxEmailsPerHour = 10;
    this.maxEmailsPerDay = 50;
  }

  // Check rate limits
  async checkRateLimit(email) {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);

    try {
      // Check hourly limit
      const hourlyResult = await pool.query(
        'SELECT COUNT(*) as count FROM email_logs WHERE recipient = $1 AND sent_at > $2',
        [email, new Date(hourAgo)]
      );

      if (hourlyResult.rows[0].count >= this.maxEmailsPerHour) {
        throw new Error('Hourly email limit exceeded');
      }

      // Check daily limit
      const dailyResult = await pool.query(
        'SELECT COUNT(*) as count FROM email_logs WHERE recipient = $1 AND sent_at > $2',
        [email, new Date(dayAgo)]
      );

      if (dailyResult.rows[0].count >= this.maxEmailsPerDay) {
        throw new Error('Daily email limit exceeded');
      }

      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      throw error;
    }
  }

  // Log email send
  async logEmail(recipient, subject, status, error = null) {
    try {
      await pool.query(
        `INSERT INTO email_logs (recipient, subject, status, error, sent_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [recipient, subject, status, error]
      );
    } catch (err) {
      console.error('Failed to log email:', err);
    }
  }

  // Send email with retry logic
  async sendEmail(to, template, data, options = {}) {
    const maxRetries = options.retries || 3;
    const retryDelay = options.retryDelay || 1000;

    // Check rate limits
    try {
      await this.checkRateLimit(to);
    } catch (error) {
      console.error('Rate limit exceeded for:', to);
      await this.logEmail(to, template.subject, 'rate_limited', error.message);
      throw error;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const emailContent = templates[template](data);
        
        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'NaturineX <noreply@naturinex.com>',
          to: [to],
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
          headers: {
            'X-Entity-Ref-ID': crypto.randomUUID(),
          },
          tags: [
            { name: 'template', value: template },
            { name: 'environment', value: process.env.NODE_ENV || 'development' }
          ]
        });

        // Log successful send
        await this.logEmail(to, emailContent.subject, 'sent');
        
        return result;
      } catch (error) {
        console.error(`Email send attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          await this.logEmail(to, template.subject || 'Unknown', 'failed', error.message);
          throw error;
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store verification token in database
    await pool.query(
      `UPDATE users 
       SET verification_token = $1, 
           verification_code = $2,
           verification_expires = NOW() + INTERVAL '24 hours'
       WHERE id = $3`,
      [verificationToken, verificationCode, user.id]
    );

    return this.sendEmail(user.email, 'welcome', {
      ...user,
      verificationToken,
      verificationCode
    });
  }

  // Send verification email
  async sendVerificationEmail(user) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `UPDATE users 
       SET verification_token = $1, 
           verification_code = $2,
           verification_expires = NOW() + INTERVAL '24 hours'
       WHERE id = $3`,
      [verificationToken, verificationCode, user.id]
    );

    return this.sendEmail(user.email, 'verification', {
      ...user,
      verificationToken,
      verificationCode
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(user) {
    const resetToken = crypto.randomBytes(32).toString('hex');

    await pool.query(
      `UPDATE users 
       SET reset_token = $1, 
           reset_expires = NOW() + INTERVAL '1 hour'
       WHERE id = $3`,
      [resetToken, user.id]
    );

    return this.sendEmail(user.email, 'passwordReset', {
      ...user,
      resetToken
    });
  }

  // Send scan alert email
  async sendScanAlert(user, scanData) {
    return this.sendEmail(user.email, 'scanAlert', scanData);
  }

  // Bulk email sending (with rate limiting)
  async sendBulkEmails(recipients, template, data) {
    const results = [];
    const batchSize = 10;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(recipient => 
          this.sendEmail(recipient.email, template, {
            ...data,
            ...recipient
          })
        )
      );
      
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Verify email address
  async verifyEmailAddress(email) {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Check for disposable email domains
    const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
    const domain = email.split('@')[1];
    
    if (disposableDomains.includes(domain)) {
      return { valid: false, reason: 'Disposable email not allowed' };
    }

    return { valid: true };
  }

  // Get email statistics
  async getEmailStats(days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const stats = await pool.query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
          COUNT(CASE WHEN status = 'rate_limited' THEN 1 END) as rate_limited,
          DATE(sent_at) as date
         FROM email_logs
         WHERE sent_at >= $1
         GROUP BY DATE(sent_at)
         ORDER BY date DESC`,
        [startDate]
      );

      return stats.rows;
    } catch (error) {
      console.error('Failed to get email stats:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();