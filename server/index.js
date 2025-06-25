const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Add Firebase Admin SDK for webhook handling
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // In production, use service account key or default credentials
  // For development, you can use the Firebase Admin SDK with default credentials
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // You can also use service account key file:
      // credential: admin.credential.cert(require('./path-to-service-account-key.json')),
    });
    console.log('🔥 Firebase Admin initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase Admin initialization skipped (webhook functions may not work):', error.message);
  }
}

const app = express();

// Stripe webhook endpoint needs raw body - must be before express.json()
app.use('/webhook', express.raw({ type: 'application/json' }));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] 
    : [
        'http://localhost:3000', 
        'http://localhost:3001', 
        'http://localhost:3003', 
        'http://localhost:3004', 
        'http://127.0.0.1:3000',
        'http://10.0.0.74:3000',    // Mobile testing
        'http://10.0.0.74:3001',    // Mobile testing
        'http://10.0.0.74:3003',    // Mobile testing
        'http://10.0.0.74:3004'     // Mobile testing
      ],
  credentials: true
}));

// Rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit
app.use('/api/', createRateLimit(15 * 60 * 1000, 100, 'Too many API requests'));

// Strict rate limit for AI suggestions
app.use('/suggest', createRateLimit(60 * 1000, 10, 'Too many AI requests - please wait'));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// Check if API key is configured
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️  Warning: GEMINI_API_KEY is not properly configured in .env file');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Input validation middleware
const validateMedicationInput = (req, res, next) => {
  const { medicationName } = req.body;
  
  if (!medicationName || typeof medicationName !== 'string') {
    return res.status(400).json({ error: 'Medication name is required and must be a string' });
  }
  
  const trimmed = medicationName.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Medication name cannot be empty' });
  }
  
  if (trimmed.length > 100) {
    return res.status(400).json({ error: 'Medication name too long (max 100 characters)' });
  }
  
  // Basic sanitization - remove potentially harmful characters
  const sanitized = trimmed.replace(/[<>\"'&]/g, '');
  req.body.medicationName = sanitized;
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['AI Analysis', 'Premium Tiers', 'Rate Limiting', 'Security Headers']
  });
});

app.post('/suggest', validateMedicationInput, async (req, res) => {
  const { medicationName, userTier = 'free', advancedAnalysis = false } = req.body;
  
  // Validate input
  if (!medicationName || typeof medicationName !== 'string' || !medicationName.trim()) {
    return res.status(400).json({ error: 'Medication name is required and must be a non-empty string' });
  }

  // Check API key
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res.status(500).json({ error: 'AI service not configured properly' });
  }
  
  // Debug logging to verify tier and advanced analysis
  console.log(`🔍 AI Request: ${medicationName}`);
  console.log(`👤 User Tier: ${userTier}`);
  console.log(`🧠 Advanced Analysis: ${advancedAnalysis}`);
  console.log(`🤖 AI Model: ${(userTier === 'premium' || userTier === 'professional') && advancedAnalysis ? 'Gemini Pro' : 'Gemini Flash'}`);
  
  try {
    let suggestions;
    
    if ((userTier === 'premium' || userTier === 'professional') && advancedAnalysis) {
      // Premium/Professional users get comprehensive analysis with Gemini Pro
      console.log('🎯 Using Premium AI Response with Gemini Pro');
      suggestions = await getPremiumAIResponse(medicationName.trim());
    } else {
      // Free/Basic users get standard response with Gemini Flash
      console.log('📱 Using Basic AI Response with Gemini Flash');
      suggestions = await getBasicAIResponse(medicationName.trim());
    }
    
    res.json({ suggestions });
  } catch (error) {
    console.error('AI API Error:', error);
    
    if (error.message.includes('API_KEY')) {
      res.status(500).json({ error: 'Invalid API key configuration' });
    } else if (error.message.includes('quota')) {
      res.status(429).json({ error: 'API quota exceeded. Please try again later.' });
    } else {
      res.status(500).json({ error: 'AI service temporarily unavailable' });
    }
  }
});

// Premium AI response with comprehensive analysis
async function getPremiumAIResponse(medicationName) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // Use Pro model for premium
  
  const prompt = `As a comprehensive medical AI assistant with access to clinical research databases, provide an in-depth analysis for the medication "${medicationName}":

🔍 COMPREHENSIVE MEDICATION OVERVIEW:
- Primary therapeutic uses and FDA-approved indications
- Detailed mechanism of action (molecular level)
- Pharmacokinetics: absorption, distribution, metabolism, excretion
- Standard dosing protocols for different conditions
- Onset of action and therapeutic duration
- Bioavailability and factors affecting absorption

🧬 DRUG INTERACTIONS & CONTRAINDICATIONS:
- Major drug-drug interactions (CYP450 pathways)
- Drug-food interactions with clinical significance
- Drug-supplement interactions (vitamins, minerals, herbs)
- Contraindications and relative contraindications
- Special populations: pregnancy, breastfeeding, elderly, pediatric
- Genetic polymorphisms affecting drug response

🌿 EVIDENCE-BASED NATURAL ALTERNATIVES:
- Clinical trials supporting natural alternatives (provide study references when possible)
- Herbal medicines with comparable efficacy
- Nutritional interventions with research backing
- Supplement protocols with dosing recommendations
- Comparative effectiveness vs conventional treatment
- Safety profiles and potential side effects of alternatives

💊 COMPREHENSIVE SIDE EFFECT PROFILE:
- Common adverse effects (>10% incidence)
- Serious but rare adverse effects (<1% but clinically significant)
- Long-term effects and dependency potential
- Monitoring requirements and frequency
- Early warning signs of toxicity

🍃 HOLISTIC TREATMENT APPROACH:
- Lifestyle modifications with evidence-based support
- Dietary changes specific to the medication's therapeutic goals
- Exercise protocols tailored to the medical condition
- Stress reduction techniques with clinical validation
- Sleep hygiene recommendations
- Mindfulness and behavioral interventions

📊 CLINICAL MONITORING PROTOCOLS:
- Baseline assessments before starting treatment
- Routine monitoring intervals and specific tests
- Therapeutic drug monitoring when applicable
- Biomarkers for efficacy and safety
- Patient-reported outcome measures
- Red flag symptoms requiring immediate medical attention

🔄 TAPERING & DISCONTINUATION:
- Evidence-based tapering schedules
- Withdrawal syndrome characteristics and management
- Natural bridging therapies during transition
- Timeline for safe discontinuation
- Rebound effect prevention strategies
- When to seek immediate medical supervision

⚕️ CLINICAL PEARLS:
- Optimization strategies for maximum therapeutic benefit
- Patient counseling points for adherence
- Cost-effective alternatives within the same drug class
- Emerging research and future directions
- Integration with complementary therapies

IMPORTANT MEDICAL DISCLAIMER: This analysis is for educational purposes only. All medication decisions require consultation with qualified healthcare professionals. Never discontinue prescribed medications without medical supervision. In emergency situations, contact emergency medical services immediately.

Please provide specific, evidence-based recommendations while emphasizing the critical importance of professional medical oversight for any treatment modifications.`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Basic AI response for free/basic users
async function getBasicAIResponse(medicationName) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use Flash model for basic
  
  const prompt = `Suggest natural alternatives and complementary approaches for the medication "${medicationName}". 

Please provide:
- Safe, evidence-based natural alternatives
- Lifestyle changes that may help
- Dietary modifications to consider
- Important safety considerations

Always emphasize consulting healthcare professionals before making any changes to prescribed medications.

Keep the response concise but informative.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

// Stripe payment endpoints
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, userEmail } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_1234567890', // Fallback test price
          quantity: 1,
        },
      ],
      mode: 'subscription',
      customer_email: userEmail,
      metadata: {
        userId: userId,
      },
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get Stripe public key
app.get('/stripe-config', (req, res) => {
  res.json({
    publicKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51234567890abcdefghijklmnopqrstuvwxyz',
  });
});

// Verify payment session
app.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      paymentStatus: session.payment_status,
      customerEmail: session.customer_email,
      userId: session.metadata.userId,
    });
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// Test endpoint to simulate successful payment (for testing without real payment)
app.post('/test-premium-upgrade', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    console.log(`✅ Test premium upgrade request for user: ${userId}`);
    
    // For now, we'll return success and let the client handle the Firestore update
    // In production, this would be handled by Stripe webhooks with proper Firebase Admin
    res.json({
      success: true,
      message: 'Premium upgrade successful (test mode)',
      userId: userId,
      premiumStatus: true,
      // Include timestamp for client to use
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Test upgrade error:', error);
    res.status(500).json({ error: 'Test upgrade failed', details: error.message });
  }
});

// 🔗 STRIPE WEBHOOK HANDLER FOR AUTOMATIC MONTHLY BILLING
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        console.log(`🔔 Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

// 🎯 WEBHOOK HANDLER FUNCTIONS

async function handleCheckoutSessionCompleted(session) {
  console.log('✅ Checkout session completed:', session.id);
  
  const userId = session.metadata.userId;
  const customerEmail = session.customer_email;
  const subscriptionId = session.subscription;
  
  if (!userId) {
    console.error('❌ No userId in session metadata');
    return;
  }
  
  try {
    // Update user's subscription status in Firestore
    await admin.firestore().collection('users').doc(userId).update({
      isPremium: true,
      subscriptionStatus: 'active',
      subscriptionId: subscriptionId,
      customerEmail: customerEmail,
      subscriptionStartDate: admin.firestore.FieldValue.serverTimestamp(),
      lastBillingDate: admin.firestore.FieldValue.serverTimestamp(),
      stripeCustomerId: session.customer
    });
    
    console.log(`🎉 User ${userId} upgraded to premium successfully`);
  } catch (error) {
    console.error('❌ Error updating user subscription:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log('💰 Invoice payment succeeded:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  const customerId = invoice.customer;
  
  try {
    // Find user by subscription ID
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('subscriptionId', '==', subscriptionId).get();
    
    if (snapshot.empty) {
      console.error('❌ No user found for subscription:', subscriptionId);
      return;
    }
    
    // Update user's billing information
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      isPremium: true,
      subscriptionStatus: 'active',
      lastBillingDate: admin.firestore.FieldValue.serverTimestamp(),
      nextBillingDate: new Date(invoice.period_end * 1000),
      lastInvoiceId: invoice.id,
      // Reset monthly scan count on successful payment
      scanCount: 0,
      lastScanMonth: new Date().toISOString().slice(0, 7) // YYYY-MM format
    });
    
    console.log(`💳 Monthly billing processed for user ${userDoc.id}`);
  } catch (error) {
    console.error('❌ Error processing invoice payment:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('❌ Invoice payment failed:', invoice.id);
  
  const subscriptionId = invoice.subscription;
  
  try {
    // Find user by subscription ID
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('subscriptionId', '==', subscriptionId).get();
    
    if (snapshot.empty) {
      console.error('❌ No user found for subscription:', subscriptionId);
      return;
    }
    
    // Update user's status to indicate payment failure
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      subscriptionStatus: 'past_due',
      lastFailedPayment: admin.firestore.FieldValue.serverTimestamp(),
      lastInvoiceId: invoice.id,
      // Don't immediately downgrade - give them a grace period
      paymentRetryCount: admin.firestore.FieldValue.increment(1)
    });
    
    console.log(`⚠️ Payment failed for user ${userDoc.id} - marked as past_due`);
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('🆕 Subscription created:', subscription.id);
  
  // This is handled by checkout.session.completed, but we can add additional logic here
  console.log(`📅 Subscription ${subscription.id} created for customer ${subscription.customer}`);
}

async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);
  
  try {
    // Find user by subscription ID
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('subscriptionId', '==', subscription.id).get();
    
    if (snapshot.empty) {
      console.error('❌ No user found for subscription:', subscription.id);
      return;
    }
    
    // Update user's subscription status
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      subscriptionStatus: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`🔄 Subscription updated for user ${userDoc.id}: ${subscription.status}`);
  } catch (error) {
    console.error('❌ Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('🗑️ Subscription deleted:', subscription.id);
  
  try {
    // Find user by subscription ID  
    const usersRef = admin.firestore().collection('users');
    const snapshot = await usersRef.where('subscriptionId', '==', subscription.id).get();
    
    if (snapshot.empty) {
      console.error('❌ No user found for subscription:', subscription.id);
      return;
    }
    
    // Downgrade user to free tier
    const userDoc = snapshot.docs[0];
    await userDoc.ref.update({
      isPremium: false,
      subscriptionStatus: 'cancelled',
      subscriptionId: null,
      cancelledDate: admin.firestore.FieldValue.serverTimestamp(),
      // Reset to free tier limits
      scanCount: 0,
      lastScanMonth: new Date().toISOString().slice(0, 7)
    });
    
    console.log(`⬇️ User ${userDoc.id} downgraded to free tier`);
  } catch (error) {
    console.error('❌ Error handling subscription deletion:', error);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`💳 Stripe integration ready for testing`);
});
