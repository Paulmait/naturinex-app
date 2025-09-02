/**
 * Naturinex Production Server
 * AI-powered natural medication alternatives API
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const { GoogleGenerativeAI } = require('@google/generative-ai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Validate required environment variables
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log('🔥 Firebase Admin initialized successfully');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('🔥 Firebase Admin initialized with application default credentials');
    } else {
      console.warn('⚠️ Firebase Admin not initialized - no credentials provided');
    }
  } catch (error) {
    console.warn('⚠️ Firebase Admin initialization failed:', error.message);
  }
}

const app = express();

// Trust proxy headers (required for cloud platforms)
app.set('trust proxy', true);

// Enable compression
app.use(compression({
  level: 6,
  threshold: 1024
}));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API server
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all origins for testing
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
      return;
    }
    
    const allowedOrigins = [
      'https://naturinex-app.firebaseapp.com',
      'https://naturinex-app.web.app',
      'https://naturinex.vercel.app',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:8081',
      'exp://192.168.1.100:8081'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Also allow any localhost port for development
      if (origin && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Apply rate limits
app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));
app.use('/suggest', createRateLimit(60 * 1000, 10, 'Too many AI requests'));
app.use('/api/analyze', createRateLimit(60 * 1000, 20, 'Too many analysis requests'));

// Stripe webhook needs raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Invalid input',
      details: errors.array() 
    });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    services: {
      ai: !!process.env.GEMINI_API_KEY,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      firebase: !!admin.apps.length
    }
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Main AI suggestion endpoint
app.post('/suggest',
  [
    body('medicationName')
      .isLength({ min: 1, max: 100 })
      .trim()
      .matches(/^[a-zA-Z0-9\s\-\.\/]+$/)
      .withMessage('Invalid medication name'),
    validateInput
  ],
  async (req, res) => {
    try {
      const { medicationName } = req.body;
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error('AI service not configured properly');
      }

      const prompt = `As a healthcare information assistant, provide natural alternatives for ${medicationName}. 
        Include:
        1. Common natural alternatives with their benefits
        2. Safety considerations and warnings
        3. When to consult a healthcare provider
        4. Important disclaimer about not replacing medical advice
        
        Format the response clearly with sections and be concise but comprehensive.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestions = response.text();

      res.json({
        suggestions,
        medicationName,
        timestamp: new Date().toISOString(),
        disclaimer: 'This information is for educational purposes only. Always consult with a healthcare provider before making changes to your medication regimen.'
      });
    } catch (error) {
      console.error('AI suggestion error:', error);
      res.status(500).json({ 
        error: 'Failed to generate suggestions',
        message: 'Please try again later'
      });
    }
  }
);

// Analyze medication endpoint (supports OCR results from mobile)
app.post('/api/analyze',
  [
    body('medicationName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Invalid medication name'),
    body('ocrText')
      .optional()
      .isString()
      .withMessage('Invalid OCR text'),
    validateInput
  ],
  async (req, res) => {
    try {
      const { medicationName, ocrText, imageData } = req.body;
      
      // Handle OCR text if provided (from mobile app scanning)
      let medName = medicationName;
      if (ocrText && !medName) {
        // Extract medication name from OCR text
        medName = ocrText.split('\n')[0].trim(); // Simple extraction, can be improved
      }
      
      if (!medName) {
        return res.status(400).json({ 
          error: 'No medication name provided',
          message: 'Please provide a medication name or scan text'
        });
      }

      const prompt = `Analyze the medication "${medName}" and provide:
        1. What this medication is used for
        2. Common side effects
        3. Natural alternatives that may help with similar conditions
        4. Important safety information
        5. Drug interactions to be aware of
        
        If this appears to be OCR text, try to identify the medication name first.
        Provide clear, accurate medical information with appropriate disclaimers.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysis = response.text();

      res.json({
        medication: medName,
        analysis,
        naturalAlternatives: true,
        timestamp: new Date().toISOString(),
        source: ocrText ? 'ocr_scan' : 'manual_input'
      });
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze medication',
        message: 'Please try again later'
      });
    }
  }
);

// Analyze by name endpoint (for direct medication lookup)
app.post('/api/analyze/name',
  [
    body('medicationName')
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Invalid medication name'),
    validateInput
  ],
  async (req, res) => {
    try {
      const { medicationName } = req.body;
      
      const prompt = `Provide comprehensive information about ${medicationName}:
        1. Generic and brand names
        2. Medical uses and conditions treated
        3. How it works in the body
        4. Natural alternatives for the conditions it treats
        5. Lifestyle changes that may help
        6. When natural alternatives are NOT appropriate
        7. Important safety warnings
        
        Be thorough but clear, and always emphasize consulting healthcare providers.`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      res.json({
        medication: medicationName,
        details: response.text(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Medication lookup error:', error);
      res.status(500).json({ 
        error: 'Failed to lookup medication',
        message: 'Please try again later'
      });
    }
  }
);

// Stripe webhook handler
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Payment successful:', session.id);
        // Update user subscription in Firebase if needed
        if (session.metadata?.userId && admin.apps.length) {
          await admin.firestore()
            .collection('users')
            .doc(session.metadata.userId)
            .update({
              subscriptionStatus: 'active',
              subscriptionTier: session.metadata?.tier || 'premium',
              subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        break;
      
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);
        // Update user subscription status if needed
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Create checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || 'https://naturinex.com/success',
      cancel_url: cancelUrl || 'https://naturinex.com/cancel',
      metadata: {
        userId: userId || 'anonymous'
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Naturinex Server Running
  📍 Port: ${PORT}
  🔧 Environment: ${process.env.NODE_ENV || 'development'}
  🏥 Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;