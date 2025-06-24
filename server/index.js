const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Check if API key is configured
if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️  Warning: GEMINI_API_KEY is not properly configured in .env file');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

app.post('/suggest', async (req, res) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  console.log(`💳 Stripe integration ready for testing`);
});
