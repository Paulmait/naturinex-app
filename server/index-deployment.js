const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();

// Initialize services with better error handling
let genAI = null;
let stripe = null;
let admin = null;

// Initialize Gemini AI
if (process.env.GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini AI initialized');
} else {
  console.warn('⚠️ GEMINI_API_KEY not found - AI features disabled');
}

// Initialize Stripe
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe initialized');
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not found - Payment features disabled');
}

// Initialize Firebase Admin (optional)
try {
  const firebaseAdmin = require('firebase-admin');
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'naturinex-app',
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    admin = firebaseAdmin;
    console.log('✅ Firebase Admin initialized');
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin skipped:', error.message);
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date(),
    version: '2.0.0',
    features: {
      ai: genAI !== null,
      payments: stripe !== null,
      firebase: admin !== null
    }
  });
});

// Medication analysis endpoint
app.post('/api/analyze/name', [
  body('medicationName').isString().notEmpty().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (!genAI) {
    return res.status(503).json({ 
      error: 'AI service unavailable',
      message: 'Please configure GEMINI_API_KEY'
    });
  }

  try {
    const { medicationName } = req.body;
    
    // Use Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    As a health information assistant, analyze the medication "${medicationName}" and provide:
    1. Generic name and active ingredients
    2. Common uses
    3. Natural alternatives with scientific backing
    4. Important warnings
    5. Drug interactions
    
    Format as JSON with these fields:
    - medication: {name, activeIngredient, uses[], warnings[]}
    - naturalAlternatives: [{name, benefits, usage}]
    - interactions: []
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse AI response
    let analysisData;
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid AI response format');
      }
    } catch (e) {
      // Fallback response
      analysisData = {
        medication: {
          name: medicationName,
          activeIngredient: 'Information pending',
          uses: ['Consult medication label'],
          warnings: ['Always consult healthcare provider']
        },
        naturalAlternatives: [
          {
            name: 'Consult Healthcare Provider',
            benefits: 'Professional guidance recommended',
            usage: 'Discuss natural alternatives with your doctor'
          }
        ],
        interactions: []
      };
    }

    res.json({
      ...analysisData,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// Stripe endpoints (if configured)
app.post('/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ 
      error: 'Payment service unavailable',
      message: 'Stripe not configured'
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Naturinex Premium',
          },
          unit_amount: 999, // $9.99
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Catch all for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Naturinex API Server Started
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
✅ Features enabled:
   - AI Analysis: ${genAI ? 'YES' : 'NO - Add GEMINI_API_KEY'}
   - Payments: ${stripe ? 'YES' : 'NO - Add STRIPE_SECRET_KEY'}
   - Firebase: ${admin ? 'YES' : 'NO - Optional'}
  `);
});