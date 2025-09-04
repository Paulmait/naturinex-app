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
const ComplianceMonitor = require('./compliance-monitor');
const authMiddleware = require('./auth-middleware');

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
      // Handle private key format - it might come as a JSON string or regular string
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // If it's a JSON string, parse it
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = JSON.parse(privateKey);
      }
      
      // Replace literal \n with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || 'naturinex-app',
          privateKey: privateKey,
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
    // Don't crash the server, just disable Firebase features
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
      'https://naturinex-webapp.vercel.app',
      'https://naturinex-webapp-*.vercel.app',
      'https://naturinex.com',
      'https://www.naturinex.com',
      'https://naturinex.ai',
      'https://www.naturinex.ai',
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3002',
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

// Webhook handlers need raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use('/webhooks/*', express.raw({ type: 'application/json' }));
app.use('/api/webhooks/*', express.raw({ type: 'application/json' }));

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
  authMiddleware.optionalAuth, // Optional auth for better experience
  async (req, res) => {
    try {
      const { medicationName } = req.body;
      
      // Enhanced AI service validation
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        console.error('CRITICAL: Gemini API key not configured');
        
        // Log incident for compliance
        await complianceMonitor.logSecurityIncident(
          'AI_SERVICE_MISCONFIGURATION',
          'HIGH',
          { service: 'GEMINI', endpoint: '/api/suggestions' }
        );
        
        // Return graceful error
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'AI service is being configured. Please try again later.',
          code: 'AI_SERVICE_UNAVAILABLE'
        });
      }

      const prompt = `As a healthcare information assistant, provide natural alternatives for ${medicationName}. 
        Include:
        1. Common natural alternatives with their benefits
        2. Safety considerations and warnings
        3. When to consult a healthcare provider
        4. Important disclaimer about not replacing medical advice
        
        Format the response clearly with sections and be concise but comprehensive.`;

      // Retry logic for AI requests
      let attempts = 0;
      let suggestions = null;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !suggestions) {
        try {
          attempts++;
          const model = genAI.getGenerativeModel({ 
            model: 'gemini-pro',
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_ONLY_HIGH'
              }
            ]
          });
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          suggestions = response.text();
          
          // Validate response
          if (!suggestions || suggestions.length < 50) {
            throw new Error('Invalid AI response');
          }
        } catch (aiError) {
          console.error(`AI attempt ${attempts} failed:`, aiError.message);
          if (attempts === maxAttempts) {
            throw aiError;
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        }
      }

      // Log successful AI usage
      if (req.user) {
        await complianceMonitor.logDataAccess(
          req.user.uid,
          'AI_GENERATION',
          'MEDICATION_SUGGESTIONS',
          req.ip
        );
      }
      
      res.json({
        suggestions,
        medicationName,
        timestamp: new Date().toISOString(),
        disclaimer: 'This information is for educational purposes only. Always consult with a healthcare provider before making changes to your medication regimen.',
        metadata: {
          aiModel: 'gemini-pro',
          responseTime: Date.now() - req.startTime,
          authenticated: !!req.user
        }
      });
    } catch (error) {
      console.error('AI suggestion error:', error);
      
      // Log AI failures
      await complianceMonitor.logSecurityIncident(
        'AI_GENERATION_FAILURE',
        'MEDIUM',
        { 
          error: error.message,
          endpoint: '/api/suggestions',
          medication: req.body.medicationName
        }
      );
      
      // Determine error type and response
      if (error.message?.includes('SAFETY')) {
        return res.status(400).json({ 
          error: 'Content filtered',
          message: 'The request was blocked due to safety concerns',
          code: 'SAFETY_BLOCK'
        });
      }
      
      if (error.message?.includes('quota') || error.message?.includes('rate')) {
        return res.status(429).json({ 
          error: 'Rate limited',
          message: 'Too many requests. Please try again later',
          code: 'RATE_LIMIT'
        });
      }
      
      res.status(500).json({ 
        error: 'Failed to generate suggestions',
        message: 'Please try again later',
        code: 'AI_ERROR'
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

      // Check if we should use mock data (for testing without API key)
      let analysis;
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_ACTUAL_GEMINI_API_KEY' || process.env.USE_MOCK_DATA === 'true') {
        // Return mock data for testing
        analysis = `
**OCR Analysis Result for: ${medName}**

**Extracted Text:** ${ocrText || medName}

**Medication Identified:** ${medName}

**Uses:**
- This medication is commonly prescribed for various conditions
- Please consult your healthcare provider for specific uses

**Common Side Effects:**
- May cause mild side effects
- Individual reactions vary
- Monitor for any unusual symptoms

**Natural Alternatives:**
- Dietary modifications
- Exercise and lifestyle changes  
- Herbal supplements (consult doctor first)
- Mind-body therapies

**Important Safety Information:**
⚠️ Always follow prescribed dosage
⚠️ Do not discontinue without medical advice
⚠️ Store properly as directed

**Note:** This is test data. For actual medication analysis, configure the Gemini API key.`;
      } else {
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
        analysis = response.text();
      }

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
      
      // Check if we should use mock data (for testing without API key)
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_ACTUAL_GEMINI_API_KEY' || process.env.USE_MOCK_DATA === 'true') {
        // Return mock data for testing
        const mockResponse = `
**${medicationName.toUpperCase()} - Medication Information**

**Generic Name:** ${medicationName.toLowerCase()}
**Brand Names:** Various brands available

**Medical Uses:**
- This medication is commonly used for treating various conditions
- Please consult your healthcare provider for specific uses

**How It Works:**
- Works by interacting with specific receptors in the body
- The exact mechanism depends on the medication class

**Natural Alternatives:**
- Lifestyle modifications including diet and exercise
- Stress management techniques
- Herbal supplements (consult healthcare provider first)
- Physical therapy when appropriate

**Important Safety Information:**
⚠️ Always consult your healthcare provider before starting or stopping any medication
⚠️ This is general information only - not medical advice
⚠️ Individual responses to medications vary

**Note:** This is test data. For actual medication information, please configure the Gemini API key.`;
        
        return res.json({
          medication: medicationName,
          details: mockResponse,
          timestamp: new Date().toISOString(),
          isMockData: true
        });
      }
      
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
      
      // Return a more helpful error message
      if (error.message && error.message.includes('API_KEY_INVALID')) {
        res.status(500).json({ 
          error: 'API configuration error',
          message: 'The server is not properly configured. Please contact support.',
          details: 'Gemini API key is invalid or missing'
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to lookup medication',
          message: 'Please try again later'
        });
      }
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

// Import killer feature modules
const PillIdentifier = require('./modules/pillIdentifier');
const PriceComparisonEngine = require('./modules/priceComparison');
const PredictiveHealthAI = require('./modules/predictiveHealthAI');
const SmartNotifications = require('./modules/smartNotifications');
const DoctorNetwork = require('./modules/doctorNetwork');
const GamificationSystem = require('./modules/gamification');

// Import email and monitoring services
const emailService = require('./services/email-service');
const emailMonitor = require('./monitoring/email-monitor');
const emailRoutes = require('./routes/email-routes');
const webhookRoutes = require('./routes/webhook-routes');

// Initialize modules
const interactionChecker = new DrugInteractionChecker(process.env.GEMINI_API_KEY);
const pillIdentifier = new PillIdentifier();
const priceComparison = new PriceComparisonEngine();
const predictiveAI = new PredictiveHealthAI();
const notifications = new SmartNotifications();
const doctorNetwork = new DoctorNetwork();
const gamification = new GamificationSystem();

// Initialize Compliance Monitor
const complianceMonitor = new ComplianceMonitor();
global.complianceMonitor = complianceMonitor; // Make available globally for auth middleware

// Initialize Data Retention Manager (only if DB is configured)
let dataRetentionManager = null;
if (process.env.DATABASE_URL) {
  const DataRetentionManager = require('./database/data-retention-manager');
  dataRetentionManager = new DataRetentionManager();
  console.log('📊 Data Retention Manager initialized');
}

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

// ===== KILLER FEATURES API ENDPOINTS =====

// Visual Pill Identifier
app.post('/api/pill/identify',
  [
    body('imageData').isString().withMessage('Image data required'),
    body('userId').optional().isString(),
    validateInput
  ],
  checkUsageLimits,
  async (req, res) => {
    try {
      const { imageData, metadata, userId } = req.body;
      
      // Check if user has Pro features for enhanced accuracy
      const enhancedMode = TierSystem.hasFeatureAccess(req.userTier, 'pillIdentifier');
      
      const result = await pillIdentifier.identifyPill(imageData, {
        ...metadata,
        enhancedMode,
        userId
      });
      
      // Add price comparison if pill identified
      if (result.success && result.topMatch) {
        result.priceComparison = await priceComparison.comparePrices(
          result.topMatch.name,
          result.topMatch.dosage,
          30,
          req.body.location
        );
        
        // Send price drop alert if significant savings found
        if (result.priceComparison.savings?.potential > 30 && req.body.email) {
          await emailService.sendPriceDropAlert(
            { email: req.body.email, name: req.body.userName || 'User' },
            { 
              name: result.topMatch.name,
              pharmacy: result.priceComparison.savings.bestPharmacy,
              id: result.topMatch.id 
            },
            result.priceComparison.savings.highestPrice,
            result.priceComparison.savings.lowestPrice
          );
        }
      }
      
      // Track achievement
      if (userId && result.success) {
        await gamification.trackAchievement(userId, 'PILL_SCAN');
      }
      
      await TierSystem.incrementUsage(userId, 'pillScan');
      res.json(result);
    } catch (error) {
      console.error('Pill identification error:', error);
      res.status(500).json({
        error: 'Failed to identify pill',
        message: error.message
      });
    }
  }
);

// Price Comparison
app.post('/api/price/compare',
  [
    body('medicationName').isString(),
    body('dosage').isString(),
    body('quantity').isNumeric(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { medicationName, dosage, quantity, location, userId } = req.body;
      
      const result = await priceComparison.comparePrices(
        medicationName,
        dosage,
        quantity,
        location
      );
      
      // Track achievement for saving money
      if (userId && result.savings?.potential > 20) {
        await gamification.trackAchievement(userId, 'PRICE_SAVER');
      }
      
      res.json(result);
    } catch (error) {
      console.error('Price comparison error:', error);
      res.status(500).json({
        error: 'Failed to compare prices',
        message: error.message
      });
    }
  }
);

// Predictive Health AI
app.post('/api/predict/side-effects',
  [
    body('userId').isString(),
    body('medicationName').isString(),
    validateInput
  ],
  checkUsageLimits,
  async (req, res) => {
    try {
      const { userId, medicationName } = req.body;
      
      // Get user profile
      const profileResult = await HealthProfileManager.getHealthProfiles(userId);
      const userProfile = profileResult.profiles?.[0];
      
      const predictions = await predictiveAI.predictSideEffects(
        userId,
        medicationName,
        userProfile
      );
      
      res.json(predictions);
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({
        error: 'Failed to predict side effects',
        message: error.message
      });
    }
  }
);

app.post('/api/predict/adherence',
  [
    body('userId').isString(),
    body('medicationPlan').isObject(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, medicationPlan } = req.body;
      
      const prediction = await predictiveAI.predictAdherence(userId, medicationPlan);
      
      // Create personalized reminders if adherence is low
      if (prediction.probability < 0.7) {
        await notifications.scheduleSmartReminders(userId, [{
          ...medicationPlan,
          adherenceBoost: true
        }]);
      }
      
      res.json(prediction);
    } catch (error) {
      console.error('Adherence prediction error:', error);
      res.status(500).json({
        error: 'Failed to predict adherence',
        message: error.message
      });
    }
  }
);

// Smart Notifications
app.post('/api/notifications/schedule',
  [
    body('userId').isString(),
    body('medications').isArray(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, medications } = req.body;
      
      const result = await notifications.scheduleSmartReminders(userId, medications);
      
      res.json(result);
    } catch (error) {
      console.error('Notification scheduling error:', error);
      res.status(500).json({
        error: 'Failed to schedule notifications',
        message: error.message
      });
    }
  }
);

app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const activeNotifications = await notifications.getActiveReminders(userId);
    
    res.json({ notifications: activeNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to get notifications',
      message: error.message
    });
  }
});

// Doctor Network
app.get('/api/doctors/available', async (req, res) => {
  try {
    const { specialty, urgency } = req.query;
    
    const doctors = await doctorNetwork.getAvailableDoctors(specialty, urgency);
    
    res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      error: 'Failed to get available doctors',
      message: error.message
    });
  }
});

app.post('/api/doctors/book',
  [
    body('userId').isString(),
    body('doctorId').isString(),
    body('type').isString(),
    body('details').isObject(),
    validateInput
  ],
  checkUsageLimits,
  async (req, res) => {
    try {
      const { userId, doctorId, type, details } = req.body;
      
      const booking = await doctorNetwork.bookConsultation(
        userId,
        doctorId,
        type,
        details
      );
      
      // Track achievement and send confirmation email
      if (booking.success) {
        await gamification.trackAchievement(userId, 'FIRST_CONSULTATION');
        
        // Send appointment confirmation email
        if (req.body.email) {
          await emailService.sendAppointmentConfirmation(
            { email: req.body.email, name: req.body.userName || 'Patient' },
            {
              id: booking.consultation.id,
              doctorName: req.body.doctorName || 'Doctor',
              type: type,
              date: new Date(details.scheduledTime).toLocaleDateString(),
              time: new Date(details.scheduledTime).toLocaleTimeString(),
              videoLink: booking.session?.videoToken ? `https://naturinex.com/video/${booking.consultation.id}` : null,
              location: details.location
            }
          );
        }
      }
      
      res.json(booking);
    } catch (error) {
      console.error('Booking error:', error);
      res.status(500).json({
        error: 'Failed to book consultation',
        message: error.message
      });
    }
  }
);

app.post('/api/doctors/question',
  [
    body('userId').isString(),
    body('question').isString(),
    body('category').isString(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, question, category } = req.body;
      
      const result = await doctorNetwork.submitQuestion(userId, question, category);
      
      res.json(result);
    } catch (error) {
      console.error('Question submission error:', error);
      res.status(500).json({
        error: 'Failed to submit question',
        message: error.message
      });
    }
  }
);

// Gamification
app.get('/api/gamification/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const profile = await gamification.getUserProfile(userId);
    
    res.json(profile);
  } catch (error) {
    console.error('Get gamification profile error:', error);
    res.status(500).json({
      error: 'Failed to get gamification profile',
      message: error.message
    });
  }
});

app.post('/api/gamification/achievement',
  [
    body('userId').isString(),
    body('achievementType').isString(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, achievementType } = req.body;
      
      const result = await gamification.trackAchievement(userId, achievementType);
      
      // Send achievement email notification
      if (result.newAchievement && req.body.email) {
        await emailService.sendAchievementUnlocked(
          { 
            email: req.body.email, 
            name: req.body.userName || 'Player',
            level: result.level,
            totalPoints: result.totalPoints
          },
          result.newAchievement
        );
      }
      
      res.json(result);
    } catch (error) {
      console.error('Track achievement error:', error);
      res.status(500).json({
        error: 'Failed to track achievement',
        message: error.message
      });
    }
  }
);

app.get('/api/gamification/challenges', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const challenges = await gamification.getActiveChallenges(userId);
    
    res.json({ challenges });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({
      error: 'Failed to get challenges',
      message: error.message
    });
  }
});

app.get('/api/gamification/leaderboard', async (req, res) => {
  try {
    const { type = 'weekly', limit = 10 } = req.query;
    
    const leaderboard = await gamification.getLeaderboard(type, limit);
    
    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to get leaderboard',
      message: error.message
    });
  }
});

// Health Insights Dashboard
app.get('/api/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Combine data from multiple sources
    const [
      healthTrajectory,
      gamificationProfile,
      medicationHistory,
      upcomingReminders
    ] = await Promise.all([
      predictiveAI.predictHealthTrajectory(userId),
      gamification.getUserProfile(userId),
      HealthProfileManager.getMedicationHistory(userId, { limit: 10 }),
      notifications.getActiveReminders(userId)
    ]);
    
    res.json({
      healthScore: healthTrajectory.currentScore,
      trajectory: healthTrajectory.trajectory,
      level: gamificationProfile.level,
      points: gamificationProfile.totalPoints,
      streak: gamificationProfile.streak,
      recentMedications: medicationHistory.history,
      upcomingReminders,
      recommendations: healthTrajectory.recommendations
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({
      error: 'Failed to get health insights',
      message: error.message
    });
  }
});

// Mount email and webhook routes
app.use('/api/email', emailRoutes);
app.use('/api/webhooks', webhookRoutes);

// Test routes for debugging (remove in production if needed)
const testRoutes = require('./routes/test-routes');
app.use('/api', testRoutes);

// ===== EMAIL SERVICE ENDPOINTS =====

// Send welcome email on user registration
app.post('/api/email/welcome',
  [
    body('userId').isString(),
    body('email').isEmail(),
    body('name').isString(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, email, name } = req.body;
      
      const result = await emailService.sendWelcomeEmail({
        id: userId,
        email,
        name
      });
      
      res.json(result);
    } catch (error) {
      console.error('Welcome email error:', error);
      res.status(500).json({
        error: 'Failed to send welcome email',
        message: error.message
      });
    }
  }
);

// Schedule medication reminders
app.post('/api/email/medication-reminders',
  [
    body('userId').isString(),
    body('enabled').isBoolean(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, enabled } = req.body;
      
      // Check if user has premium subscription
      const userTier = await TierSystem.getUserTier(userId);
      if (!TierSystem.hasFeatureAccess(userTier, 'emailReminders')) {
        return res.status(402).json({
          error: 'Premium feature',
          message: 'Email reminders require Basic subscription or higher',
          upgradeOptions: TierSystem.getUpgradeOptions(userTier)
        });
      }
      
      // Schedule daily reminders
      if (enabled) {
        await notifications.scheduleEmailReminders(userId);
      } else {
        await notifications.cancelEmailReminders(userId);
      }
      
      res.json({
        success: true,
        message: enabled ? 'Email reminders enabled' : 'Email reminders disabled'
      });
    } catch (error) {
      console.error('Medication reminder setup error:', error);
      res.status(500).json({
        error: 'Failed to configure email reminders',
        message: error.message
      });
    }
  }
);

// Send weekly health report
app.post('/api/email/weekly-report/:userId', 
  checkUsageLimits,
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Check premium access
      if (!TierSystem.hasFeatureAccess(req.userTier, 'weeklyReports')) {
        return res.status(402).json({
          error: 'Premium feature',
          message: 'Weekly reports require Pro subscription or higher'
        });
      }
      
      // Gather report data
      const [
        userData,
        medicationHistory,
        achievements,
        healthTrajectory,
        savings
      ] = await Promise.all([
        HealthProfileManager.getHealthProfiles(userId),
        HealthProfileManager.getMedicationHistory(userId, { days: 7 }),
        gamification.getUserProfile(userId),
        predictiveAI.predictHealthTrajectory(userId),
        TierSystem.getUserSavings(userId)
      ]);
      
      const reportData = {
        adherenceRate: medicationHistory.adherenceRate || 85,
        streak: achievements.streak || 0,
        achievements: achievements.recentAchievements || [],
        weekSavings: savings.week || 0,
        totalSavings: savings.total || 0,
        healthScore: healthTrajectory.currentScore || 75,
        trend: healthTrajectory.trend || 'improving',
        refillsNeeded: medicationHistory.refillsNeeded || 0,
        appointments: userData.upcomingAppointments || 0
      };
      
      const result = await emailService.sendWeeklyReport(
        { id: userId, email: req.body.email, name: req.body.name },
        reportData
      );
      
      res.json(result);
    } catch (error) {
      console.error('Weekly report error:', error);
      res.status(500).json({
        error: 'Failed to send weekly report',
        message: error.message
      });
    }
  }
);

// Email preferences
app.post('/api/email/preferences',
  [
    body('userId').isString(),
    body('preferences').isObject(),
    validateInput
  ],
  async (req, res) => {
    try {
      const { userId, preferences } = req.body;
      
      // Save email preferences
      if (admin.apps.length) {
        await admin.firestore()
          .collection('users')
          .doc(userId)
          .update({
            emailPreferences: {
              medicationReminders: preferences.medicationReminders || false,
              refillAlerts: preferences.refillAlerts || true,
              priceDrops: preferences.priceDrops || true,
              weeklyReports: preferences.weeklyReports || false,
              achievements: preferences.achievements || true,
              appointments: preferences.appointments || true,
              promotions: preferences.promotions || false
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
      }
      
      res.json({
        success: true,
        message: 'Email preferences updated'
      });
    } catch (error) {
      console.error('Preferences error:', error);
      res.status(500).json({
        error: 'Failed to update preferences',
        message: error.message
      });
    }
  }
);

// ===== END OF EMAIL SERVICE =====

// ===== END OF KILLER FEATURES =====

// ===== END OF NEW FEATURES =====

// Privacy & Compliance API Endpoints
app.get('/api/compliance/privacy-audit', async (req, res) => {
  try {
    const audit = await complianceMonitor.performPrivacyAudit();
    res.json(audit);
  } catch (error) {
    console.error('Privacy audit error:', error);
    res.status(500).json({ error: 'Failed to perform privacy audit' });
  }
});

app.post('/api/compliance/data-request', async (req, res) => {
  try {
    const { requestType, userId, data } = req.body;
    const request = await complianceMonitor.handleDataRequest(requestType, userId, data);
    res.json(request);
  } catch (error) {
    console.error('Data request error:', error);
    res.status(500).json({ error: 'Failed to process data request' });
  }
});

app.post('/api/compliance/consent', async (req, res) => {
  try {
    const { userId, consentType, granted } = req.body;
    const consent = await complianceMonitor.monitorConsent(userId, consentType, granted);
    res.json(consent);
  } catch (error) {
    console.error('Consent monitoring error:', error);
    res.status(500).json({ error: 'Failed to record consent' });
  }
});

app.get('/api/compliance/report', async (req, res) => {
  try {
    const report = await complianceMonitor.generateComplianceReport();
    res.json(report);
  } catch (error) {
    console.error('Compliance report error:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

app.get('/api/compliance/retention-policies', async (req, res) => {
  try {
    const policies = await complianceMonitor.checkDataRetention();
    res.json(policies);
  } catch (error) {
    console.error('Retention policy error:', error);
    res.status(500).json({ error: 'Failed to check retention policies' });
  }
});

// Log compliance-related data access
app.use((req, res, next) => {
  if (req.path.includes('/api/') && req.method !== 'GET') {
    const userId = req.body?.userId || req.query?.userId || 'anonymous';
    const dataType = req.path.includes('health') ? 'HEALTH' : 
                    req.path.includes('payment') ? 'PAYMENT' : 'GENERAL';
    const ipAddress = req.ip || req.connection.remoteAddress;
    
    complianceMonitor.logDataAccess(userId, dataType, req.method, ipAddress)
      .catch(err => console.error('Failed to log data access:', err));
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Log security incidents for certain error types
  if (err.code === 'EBADCSRFTOKEN' || err.type === 'entity.too.large' || err.status === 429) {
    complianceMonitor.logSecurityIncident(
      'SUSPICIOUS_ACTIVITY',
      'MEDIUM',
      { error: err.message, path: req.path, ip: req.ip }
    ).catch(console.error);
  }
  
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

// Start server and monitoring
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Naturinex Server Running
  📍 Port: ${PORT}
  🔧 Environment: ${process.env.NODE_ENV || 'development'}
  🏥 Health Check: http://localhost:${PORT}/health
  📧 Email Service: ${process.env.RESEND_API_KEY ? 'Active' : 'Not configured'}
  `);
  
  // Start email monitoring
  if (process.env.RESEND_API_KEY) {
    emailMonitor.startMonitoring(15); // Check every 15 minutes
    console.log('📊 Email monitoring started');
  }
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