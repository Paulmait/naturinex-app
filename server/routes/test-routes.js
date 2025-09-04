/**
 * Test Routes for verifying services are working
 * These routes help debug deployment issues
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/email-service');

// Test endpoint to check if services are configured
router.get('/test/status', (req, res) => {
  const status = {
    server: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      firebase: {
        configured: !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY),
        projectId: process.env.FIREBASE_PROJECT_ID || 'not-set'
      },
      resend: {
        configured: !!(process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_')),
        fromEmail: process.env.RESEND_FROM_EMAIL || 'not-set'
      },
      database: {
        configured: !!process.env.DATABASE_URL,
        type: process.env.DATABASE_URL ? 'PostgreSQL' : 'mock'
      },
      gemini: {
        configured: !!(process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_'))
      },
      stripe: {
        configured: !!(process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('your_'))
      }
    }
  };

  res.json(status);
});

// Test Resend email sending (protected endpoint)
router.post('/test/send-email', async (req, res) => {
  try {
    // Check for test authorization header
    const authHeader = req.headers['x-test-auth'];
    if (authHeader !== process.env.TEST_AUTH_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { to, type = 'test' } = req.body;

    if (!to) {
      return res.status(400).json({ error: 'Email address required' });
    }

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.includes('your_')) {
      return res.status(503).json({ 
        error: 'Email service not configured',
        message: 'RESEND_API_KEY is not properly set'
      });
    }

    // Send test email
    const testData = {
      id: 'test-' + Date.now(),
      email: to,
      name: 'Test User',
      verificationToken: 'test-token-123',
      verificationCode: '123456'
    };

    let result;
    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail(testData);
        break;
      case 'verification':
        result = await emailService.sendVerificationEmail(testData);
        break;
      default:
        // Send a simple test email
        result = await emailService.sendEmail(to, 'welcome', testData);
    }

    res.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: result?.data?.id,
      to: to,
      type: type
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check with detailed info
router.get('/test/health', async (req, res) => {
  const health = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
    },
    environment: {
      node: process.version,
      platform: process.platform,
      env: process.env.NODE_ENV
    }
  };

  res.json(health);
});

module.exports = router;