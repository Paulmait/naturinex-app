/**
 * Enhanced Production Server with Expert-Level Features
 * Includes monitoring, caching, error tracking, and security
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Import enhancement modules
const HealthMonitor = require('./health-monitor');
const ErrorTracker = require('./error-tracker');
const CacheManager = require('./cache-manager');
const { TierManager, tierMiddleware, requirePremium } = require('./tier-middleware');

// Initialize enhancement systems
const healthMonitor = new HealthMonitor();
const errorTracker = new ErrorTracker();
const tierManager = new TierManager();
const cacheManager = new CacheManager({
  ttl: 3600000, // 1 hour default
  maxSize: 1000
});

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

// Initialize Firebase Admin SDK with enhanced error handling
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
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('🔥 Firebase Admin initialized with default credentials');
    }
  } catch (error) {
    errorTracker.captureError(error, { context: 'firebase_init' });
    console.warn('⚠️ Firebase Admin initialization failed:', error.message);
  }
}

const app = express();

// Trust proxy headers (required for cloud platforms)
app.set('trust proxy', true);

// Enable compression for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Apply health monitoring middleware
app.use(healthMonitor.middleware());

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration with specific origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://naturinex-app.firebaseapp.com',
      'https://naturinex-app.web.app',
      'http://localhost:3000',
      'http://localhost:8081',
      'exp://192.168.1.100:8081' // Expo development
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Enhanced rate limiting with different tiers
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      errorTracker.captureError(new Error('Rate limit exceeded'), {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
      });
      res.status(429).json({ error: message });
    }
  });
};

// Apply different rate limits
app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));
app.use('/suggest', createRateLimit(60 * 1000, 10, 'Too many AI requests'));
app.use('/webhook', createRateLimit(60 * 1000, 50, 'Too many webhook requests'));

// Stripe webhook endpoints need raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }));

// JSON body parser with size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Apply cache invalidation middleware
app.use(cacheManager.invalidateOnChange());

// Request logging with performance tracking
app.use((req, res, next) => {
  req.startTime = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    if (duration > 3000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Enhanced input validation
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

// Health check endpoint with detailed metrics
app.get('/health', (req, res) => {
  const healthStatus = healthMonitor.getHealthStatus();
  const cacheStats = cacheManager.getStats();
  const errorStats = errorTracker.getStatistics();
  
  res.json({
    ...healthStatus,
    cache: cacheStats,
    errors: errorStats,
    version: '3.0.0-enhanced',
    features: [
      'AI Analysis',
      'Premium Tiers',
      'Rate Limiting',
      'Security Headers',
      'Health Monitoring',
      'Error Tracking',
      'Response Caching'
    ]
  });
});

// Main suggestion endpoint with tier enforcement
app.post('/suggest',
  tierMiddleware('naturalAlternatives'), // Require natural alternatives feature
  // Apply caching for similar requests
  (req, res, next) => {
    const cacheKey = cacheManager.generateKey('suggest', {
      medication: req.body.medicationName?.toLowerCase(),
      tier: req.userTier // Use tier from middleware
    });
    
    const cached = cacheManager.get(cacheKey);
    if (cached && cached.tier === req.userTier) {
      console.log('Returning cached suggestion for tier:', req.userTier);
      return res.json(cached);
    }
    
    req.cacheKey = cacheKey;
    next();
  },
  [
    body('medicationName')
      .isLength({ min: 1, max: 100 })
      .trim()
      .escape()
      .matches(/^[a-zA-Z0-9\s\-\.\/]+$/)
      .withMessage('Invalid medication name'),
    validateInput
  ],
  async (req, res, next) => {
    try {
      const { medicationName } = req.body;
      const userTier = req.userTier; // Get tier from middleware
      
      // Check API key
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
        throw new Error('AI service not configured properly');
      }

      // Enhanced prompt based on actual user tier
      const tierFeatures = {
        free: 'Basic medication information only (no alternatives)',
        basic: 'Natural alternatives with basic safety information',
        premium: 'Comprehensive alternatives with interactions and scientific backing',
        professional: 'Complete analysis with clinical studies and professional recommendations'
      };

      const prompt = `Provide ${tierFeatures[userTier]} for ${medicationName}. 
        Include disclaimer about consulting healthcare providers.
        Format response in clear sections with safety warnings.
        ${userTier === 'free' ? 'Do NOT include natural alternatives.' : ''}`;

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const suggestions = response.text();

      // Filter response based on tier
      const responseData = await req.tierManager.filterResponseByTier({
        suggestions,
        medicationName,
        timestamp: new Date().toISOString()
      }, userTier);
      
      // Cache the filtered response
      cacheManager.set(req.cacheKey, responseData);

      res.json(responseData);
    } catch (error) {
      next(error);
    }
  }
);

// Analyze endpoint with tier enforcement
app.post('/api/analyze',
  tierMiddleware(), // Apply tier checking
  [
    body('medicationName')
      .optional()
      .isLength({ min: 1, max: 100 })
      .trim()
      .withMessage('Invalid medication name'),
    validateInput
  ],
  async (req, res, next) => {
    try {
      const { medicationName, imageData } = req.body;
      const userTier = req.userTier;
      
      // Track scan for rate limiting
      if (req.userId) {
        const db = admin.firestore();
        await db.collection('scans').add({
          userId: req.userId,
          medicationName,
          userTier,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        });
      }
      
      // Prepare response based on tier
      let analysis = {
        medication: medicationName,
        basicInfo: {
          description: 'Common medication for pain relief',
          commonUses: ['Pain', 'Fever', 'Inflammation']
        }
      };
      
      // Add features based on tier
      if (tierManager.hasAccess(userTier, 'naturalAlternatives')) {
        analysis.naturalAlternatives = [
          'Turmeric for inflammation',
          'Ginger for pain relief',
          'Willow bark as natural aspirin'
        ];
      }
      
      if (tierManager.hasAccess(userTier, 'interactions')) {
        analysis.drugInteractions = [
          'May interact with blood thinners',
          'Avoid with certain heart medications'
        ];
      }
      
      if (tierManager.hasAccess(userTier, 'detailedWarnings')) {
        analysis.detailedWarnings = {
          sideEffects: ['Stomach upset', 'Drowsiness', 'Allergic reactions'],
          contraindications: ['Liver disease', 'Kidney problems'],
          precautions: ['Take with food', 'Avoid alcohol']
        };
      }
      
      // Filter response through tier manager
      const filteredResponse = await req.tierManager.filterResponseByTier(
        analysis,
        userTier
      );
      
      res.json(filteredResponse);
    } catch (error) {
      next(error);
    }
  }
);

// Analyze by name endpoint
app.post('/api/analyze/name',
  tierMiddleware(),
  async (req, res, next) => {
    try {
      const { medicationName } = req.body;
      const userTier = req.userTier;
      
      // Use medication database
      const MedicationDatabase = require('./medication-database');
      const medDb = new MedicationDatabase();
      
      // Initialize clinical studies fetcher for professional tier
      const ClinicalStudiesFetcher = require('./clinical-studies-fetcher');
      const studiesFetcher = new ClinicalStudiesFetcher();
      
      const searchResults = medDb.searchMedication(medicationName);
      
      if (searchResults.length === 0) {
        return res.status(404).json({
          error: 'Medication not found',
          userTier,
          suggestion: 'Try searching with a different name or brand'
        });
      }
      
      const medication = searchResults[0].medication;
      const alternatives = medDb.getAlternatives(searchResults[0].key);
      
      let response = {
        medication: medication.genericName,
        brandNames: medication.brandNames,
        category: medication.category,
        uses: medication.uses,
        warnings: medication.warnings
      };
      
      // Add tier-specific content
      if (tierManager.hasAccess(userTier, 'naturalAlternatives') && alternatives.length > 0) {
        response.naturalAlternatives = alternatives;
      }
      
      if (tierManager.hasAccess(userTier, 'detailedWarnings')) {
        response.maxDailyDose = medication.maxDailyDose;
        response.dosageForms = medication.dosageForms;
        response.commonDosages = medication.commonDosages;
      }
      
      // Add clinical studies for premium and professional tiers
      if (userTier === 'premium' || userTier === 'professional') {
        const studies = await studiesFetcher.getStudiesForUser(medicationName, userTier);
        response.clinicalStudies = studies;
      }
      
      // Filter through tier manager
      const filteredResponse = await req.tierManager.filterResponseByTier(
        response,
        userTier
      );
      
      res.json(filteredResponse);
    } catch (error) {
      next(error);
    }
  }
);

// Stripe webhook handler with signature verification
app.post('/webhook', async (req, res, next) => {
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
        await handleSuccessfulPayment(session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        await updateSubscriptionStatus(subscription);
        break;
      
      case 'customer.subscription.deleted':
        const cancelledSub = event.data.object;
        await handleSubscriptionCancellation(cancelledSub);
        break;
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    errorTracker.captureError(error, { 
      context: 'stripe_webhook',
      eventType: event?.type 
    });
    next(error);
  }
});

// Helper functions for Stripe events
async function handleSuccessfulPayment(session) {
  try {
    const userId = session.metadata?.userId;
    if (!userId) return;

    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        subscriptionStatus: 'active',
        subscriptionTier: session.metadata?.tier || 'premium',
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    errorTracker.captureError(error, { context: 'payment_update' });
  }
}

async function updateSubscriptionStatus(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    errorTracker.captureError(error, { context: 'subscription_update' });
  }
}

async function handleSubscriptionCancellation(subscription) {
  try {
    const userId = subscription.metadata?.userId;
    if (!userId) return;

    await admin.firestore()
      .collection('users')
      .doc(userId)
      .update({
        subscriptionStatus: 'cancelled',
        subscriptionEndDate: new Date(subscription.canceled_at * 1000),
        subscriptionUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    errorTracker.captureError(error, { context: 'subscription_cancellation' });
  }
}

// Admin endpoint for monitoring
app.get('/admin/metrics', async (req, res, next) => {
  try {
    // Verify admin authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const metrics = {
      health: healthMonitor.getHealthStatus(),
      cache: cacheManager.getStats(),
      errors: errorTracker.getStatistics(),
      critical: healthMonitor.checkCriticalStatus()
    };

    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// Clear cache endpoint (admin only)
app.post('/admin/cache/clear', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    cacheManager.clear(req.body.pattern);
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    next(error);
  }
});

// Apply error handling middleware
app.use(errorTracker.errorHandler());

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('Starting graceful shutdown...');
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Clean up resources
  cacheManager.destroy();
  
  // Clean old error logs
  await errorTracker.cleanOldLogs(30);
  
  // Close database connections
  await admin.app().delete();
  
  console.log('Graceful shutdown complete');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Enhanced Production Server Running
  📍 Port: ${PORT}
  🔧 Environment: ${process.env.NODE_ENV || 'development'}
  ✨ Features: Monitoring, Caching, Error Tracking
  📊 Admin Metrics: /admin/metrics
  🏥 Health Check: /health
  `);
});

// Periodic health check
setInterval(() => {
  const critical = healthMonitor.checkCriticalStatus();
  if (critical.restart) {
    console.error(`🚨 Critical status detected: ${critical.reason}`);
    errorTracker.captureError(new Error('Critical status - restart recommended'), {
      reason: critical.reason,
      health: healthMonitor.getHealthStatus()
    });
  }
}, 60000); // Check every minute

module.exports = app;