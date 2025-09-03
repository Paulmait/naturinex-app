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

// ===== NEW REVENUE-GENERATING FEATURES =====

// Import new modules
const { TierSystem, SUBSCRIPTION_TIERS, CREDIT_PACKAGES } = require('./modules/tierSystem');
const DrugInteractionChecker = require('./modules/drugInteractions');
const HealthProfileManager = require('./modules/healthProfiles');
const AffiliateSystem = require('./modules/affiliateSystem');

// Initialize drug interaction checker
const interactionChecker = new DrugInteractionChecker(process.env.GEMINI_API_KEY);

// Middleware to check usage limits
const checkUsageLimits = async (req, res, next) => {
  try {
    const userId = req.body.userId || req.query.userId || 'anonymous';
    const action = req.body.action || 'scan';
    
    const check = await TierSystem.checkUsageLimits(userId, action);
    
    if (!check.allowed) {
      return res.status(429).json({
        error: 'Usage limit reached',
        reason: check.reason,
        limit: check.limit,
        current: check.current,
        tier: check.tier,
        upgradeOptions: check.upgradeOptions,
        creditPackages: check.creditPackages
      });
    }
    
    req.userTier = check.tier;
    req.userId = userId;
    req.userCredits = check.credits;
    next();
  } catch (error) {
    console.error('Usage check error:', error);
    next(); // Allow request on error
  }
};

// Apply usage limits to existing endpoints
app.post('/api/analyze', checkUsageLimits, async (req, res, next) => {
  // Existing analyze logic...
  // After successful analysis, increment usage
  await TierSystem.incrementUsage(req.userId, 'scan');
  next();
});

app.post('/api/analyze/name', checkUsageLimits, async (req, res, next) => {
  // Existing analyze/name logic...
  // After successful analysis, increment usage
  await TierSystem.incrementUsage(req.userId, 'scan');
  next();
});

// Drug Interaction Checker (Premium Feature)
app.post('/api/interactions/check',
  [
    body('medications').isArray().withMessage('Medications must be an array'),
    body('userId').optional().isString(),
    validateInput
  ],
  checkUsageLimits,
  async (req, res) => {
    try {
      const { medications, userId } = req.body;
      
      // Check if user has access to this feature
      if (!TierSystem.hasFeatureAccess(req.userTier, 'drugInteractions')) {
        // Check if they have credits
        if (req.userCredits < 3) {
          return res.status(402).json({
            error: 'Premium feature',
            message: 'Drug interaction checking requires Pro subscription or credits',
            creditsRequired: 3,
            currentCredits: req.userCredits,
            upgradeOptions: TierSystem.getUpgradeOptions(req.userTier),
            creditPackages: CREDIT_PACKAGES
          });
        }
        // Deduct credits
        await TierSystem.addCredits(userId, -3, 'drug_interaction');
      }
      
      const result = await interactionChecker.checkInteractions(medications);
      
      // Track usage
      await TierSystem.incrementUsage(userId, 'drugInteraction');
      
      // Add affiliate links if applicable
      if (AffiliateSystem.shouldShowAffiliateOffers(req.userTier)) {
        result.affiliateProducts = AffiliateSystem.generateAffiliateLinks(
          'natural alternatives for drug interactions',
          userId
        );
      }
      
      res.json(result);
    } catch (error) {
      console.error('Drug interaction error:', error);
      res.status(500).json({
        error: 'Failed to check interactions',
        message: error.message
      });
    }
  }
);

// Health Profile Management
app.post('/api/health-profile',
  [
    body('userId').isString(),
    body('profileData').isObject(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, profileData } = req.body;
      const result = await HealthProfileManager.createHealthProfile(userId, profileData);
      res.json(result);
    } catch (error) {
      console.error('Health profile error:', error);
      res.status(500).json({
        error: 'Failed to create health profile',
        message: error.message
      });
    }
  }
);

app.get('/api/health-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await HealthProfileManager.getHealthProfiles(userId);
    res.json(result);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to get health profiles',
      message: error.message
    });
  }
});

// Medication History
app.post('/api/medication-history',
  [
    body('userId').isString(),
    body('medicationData').isObject(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, medicationData } = req.body;
      const result = await HealthProfileManager.addMedicationToHistory(userId, medicationData);
      res.json(result);
    } catch (error) {
      console.error('Medication history error:', error);
      res.status(500).json({
        error: 'Failed to add medication to history',
        message: error.message
      });
    }
  }
);

app.get('/api/medication-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await HealthProfileManager.getMedicationHistory(userId, req.query);
    res.json(result);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      error: 'Failed to get medication history',
      message: error.message
    });
  }
});

// PDF Report Generation (Premium)
app.get('/api/report/pdf/:userId', checkUsageLimits, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user has PDF export access
    if (!TierSystem.hasFeatureAccess(req.userTier, 'pdfExport')) {
      return res.status(402).json({
        error: 'Premium feature',
        message: 'PDF reports require Pro subscription or higher',
        upgradeOptions: TierSystem.getUpgradeOptions(req.userTier)
      });
    }
    
    const result = await HealthProfileManager.generatePDFReport(userId, req.query);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);
      res.send(result.pdf);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: 'Failed to generate PDF report',
      message: error.message
    });
  }
});

// Credit System
app.post('/api/credits/purchase',
  [
    body('userId').isString(),
    body('packageId').isString(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, packageId } = req.body;
      const creditPackage = CREDIT_PACKAGES[packageId];
      
      if (!creditPackage) {
        return res.status(400).json({
          error: 'Invalid package',
          availablePackages: CREDIT_PACKAGES
        });
      }
      
      // Create Stripe checkout for credits
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${creditPackage.credits} Credits`,
              description: `${creditPackage.bonus} bonus credits included`
            },
            unit_amount: creditPackage.price * 100
          },
          quantity: 1
        }],
        mode: 'payment',
        success_url: `${req.headers.origin}/credits/success`,
        cancel_url: `${req.headers.origin}/credits/cancel`,
        metadata: {
          userId,
          packageId,
          credits: creditPackage.credits + creditPackage.bonus
        }
      });
      
      res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
      console.error('Credit purchase error:', error);
      res.status(500).json({
        error: 'Failed to create checkout session',
        message: error.message
      });
    }
  }
);

app.get('/api/credits/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const remaining = await TierSystem.getRemainingScans(userId);
    res.json(remaining);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      error: 'Failed to get credit balance',
      message: error.message
    });
  }
});

// Affiliate System
app.post('/api/affiliate/track',
  [
    body('userId').isString(),
    body('productData').isObject(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, productData } = req.body;
      const result = await AffiliateSystem.trackAffiliateClick(userId, productData);
      res.json(result);
    } catch (error) {
      console.error('Affiliate tracking error:', error);
      res.status(500).json({
        error: 'Failed to track affiliate click',
        message: error.message
      });
    }
  }
);

app.get('/api/affiliate/products/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const userId = req.query.userId || 'anonymous';
    const userTier = req.query.tier || 'FREE';
    
    if (!AffiliateSystem.shouldShowAffiliateOffers(userTier)) {
      return res.json({ products: [], message: 'No ads for premium users' });
    }
    
    const products = AffiliateSystem.generateAffiliateLinks(keyword, userId);
    res.json({ products });
  } catch (error) {
    console.error('Get affiliate products error:', error);
    res.status(500).json({
      error: 'Failed to get affiliate products',
      message: error.message
    });
  }
});

// Subscription Tiers Info
app.get('/api/subscriptions/tiers', (req, res) => {
  res.json({
    tiers: SUBSCRIPTION_TIERS,
    creditPackages: CREDIT_PACKAGES,
    features: {
      drugInteractions: 'Check interactions between multiple medications',
      healthProfiles: 'Store health conditions and allergies',
      medicationHistory: 'Track all scanned medications',
      pdfReports: 'Export detailed health reports',
      familyAccounts: 'Manage multiple family member profiles',
      noAds: 'Remove affiliate product recommendations'
    }
  });
});

// Usage Statistics
app.get('/api/usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const remaining = await TierSystem.getRemainingScans(userId);
    res.json(remaining);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      error: 'Failed to get usage statistics',
      message: error.message
    });
  }
});

// ===== END OF NEW FEATURES =====

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