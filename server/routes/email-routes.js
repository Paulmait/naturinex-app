const express = require('express');
const router = express.Router();
const emailService = require('../services/email-service');
const { pool } = require('../database/db-config');
const authMiddleware = require('../auth-middleware');
const crypto = require('crypto');

// Verify email with token
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Verification token required' });
  }

  try {
    // Find user with valid token
    const result = await pool.query(
      `SELECT id, email, name 
       FROM users 
       WHERE verification_token = $1 
       AND verification_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = result.rows[0];

    // Mark email as verified
    await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           email_verified_at = NOW(),
           verification_token = NULL,
           verification_code = NULL
       WHERE id = $1`,
      [user.id]
    );

    res.json({ 
      success: true, 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Verify email with code
router.post('/verify-email-code', authMiddleware, async (req, res) => {
  const { code } = req.body;
  const userId = req.user.id;

  if (!code) {
    return res.status(400).json({ error: 'Verification code required' });
  }

  try {
    const result = await pool.query(
      `SELECT id 
       FROM users 
       WHERE id = $1 
       AND verification_code = $2 
       AND verification_expires > NOW()`,
      [userId, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // Mark email as verified
    await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           email_verified_at = NOW(),
           verification_token = NULL,
           verification_code = NULL
       WHERE id = $1`,
      [userId]
    );

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Code verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Resend verification email
router.post('/resend-verification', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if already verified
    const userResult = await pool.query(
      'SELECT email, name, email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Send new verification email
    await emailService.sendVerificationEmail({
      id: userId,
      email: user.email,
      name: user.name
    });

    res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

// Request password reset
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    // Validate email
    const validation = await emailService.verifyEmailAddress(email);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    // Find user
    const result = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return res.json({ 
        success: true, 
        message: 'If email exists, reset instructions have been sent' 
      });
    }

    const user = result.rows[0];

    // Send password reset email
    await emailService.sendPasswordResetEmail(user);

    res.json({ 
      success: true, 
      message: 'If email exists, reset instructions have been sent' 
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Find user with valid reset token
    const result = await pool.query(
      `SELECT id, email 
       FROM users 
       WHERE reset_token = $1 
       AND reset_expires > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = result.rows[0];

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password = $1, 
           reset_token = NULL,
           reset_expires = NULL,
           password_changed_at = NOW()
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Update email preferences
router.put('/preferences', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { scan_alerts, product_updates, newsletter, security_alerts } = req.body;

  try {
    await pool.query(
      `INSERT INTO email_preferences 
       (user_id, scan_alerts, product_updates, newsletter, security_alerts)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id)
       DO UPDATE SET
         scan_alerts = EXCLUDED.scan_alerts,
         product_updates = EXCLUDED.product_updates,
         newsletter = EXCLUDED.newsletter,
         security_alerts = EXCLUDED.security_alerts,
         updated_at = NOW()`,
      [userId, scan_alerts, product_updates, newsletter, security_alerts]
    );

    res.json({ success: true, message: 'Email preferences updated' });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get email preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT scan_alerts, product_updates, newsletter, security_alerts
       FROM email_preferences
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // Return default preferences
      return res.json({
        scan_alerts: true,
        product_updates: true,
        newsletter: true,
        security_alerts: true
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Admin route to get email statistics
router.get('/stats', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { days = 7 } = req.query;

  try {
    const stats = await emailService.getEmailStats(parseInt(days));
    res.json(stats);
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Admin route to send test email
router.post('/test', authMiddleware, async (req, res) => {
  // Check if user is admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { template, to } = req.body;

  try {
    const testData = {
      name: 'Test User',
      email: to || req.user.email,
      verificationToken: 'test-token',
      verificationCode: '123456',
      resetToken: 'test-reset-token',
      productName: 'Test Product',
      harmfulIngredients: [
        { name: 'Test Ingredient', reason: 'Test reason' }
      ],
      recommendation: 'This is a test recommendation'
    };

    await emailService.sendEmail(
      to || req.user.email,
      template || 'welcome',
      testData
    );

    res.json({ success: true, message: 'Test email sent' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
});

module.exports = router;