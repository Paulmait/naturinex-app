// Environment variable checker for debugging
// This file adds a secure endpoint to check which env vars are configured

function addEnvCheckEndpoint(app) {
  app.get('/api/env-check/:secret', (req, res) => {
    // Simple secret check - replace with your own secret
    if (req.params.secret !== 'check-naturinex-2025') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const envStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'not set',
      configured: {},
      missing: [],
      warnings: []
    };
    
    // Check critical environment variables
    const varsToCheck = {
      // AI Services
      'GEMINI_API_KEY': {
        set: !!process.env.GEMINI_API_KEY,
        preview: process.env.GEMINI_API_KEY ? 
          `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET',
        critical: true
      },
      'GOOGLE_VISION_API_KEY': {
        set: !!process.env.GOOGLE_VISION_API_KEY,
        preview: process.env.GOOGLE_VISION_API_KEY ? 
          `${process.env.GOOGLE_VISION_API_KEY.substring(0, 10)}...` : 'NOT SET',
        critical: true
      },
      
      // Stripe
      'STRIPE_SECRET_KEY': {
        set: !!process.env.STRIPE_SECRET_KEY,
        preview: process.env.STRIPE_SECRET_KEY ? 
          `${process.env.STRIPE_SECRET_KEY.substring(0, 10)}...` : 'NOT SET',
        critical: true
      },
      'STRIPE_WEBHOOK_SECRET': {
        set: !!process.env.STRIPE_WEBHOOK_SECRET,
        preview: process.env.STRIPE_WEBHOOK_SECRET ? 
          `${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 10)}...` : 'NOT SET',
        critical: false
      },
      
      // Firebase
      'FIREBASE_PROJECT_ID': {
        set: !!process.env.FIREBASE_PROJECT_ID,
        value: process.env.FIREBASE_PROJECT_ID || 'NOT SET',
        critical: false
      },
      'FIREBASE_CLIENT_EMAIL': {
        set: !!process.env.FIREBASE_CLIENT_EMAIL,
        preview: process.env.FIREBASE_CLIENT_EMAIL ? 
          `${process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20)}...` : 'NOT SET',
        critical: false
      },
      'FIREBASE_PRIVATE_KEY': {
        set: !!process.env.FIREBASE_PRIVATE_KEY,
        preview: process.env.FIREBASE_PRIVATE_KEY ? 
          'KEY_PRESENT' : 'NOT SET',
        critical: false
      },
      
      // Server Config
      'NODE_ENV': {
        set: !!process.env.NODE_ENV,
        value: process.env.NODE_ENV || 'NOT SET',
        critical: false
      },
      'PORT': {
        set: !!process.env.PORT,
        value: process.env.PORT || 'NOT SET',
        critical: false
      },
      'ADMIN_SECRET': {
        set: !!process.env.ADMIN_SECRET,
        preview: process.env.ADMIN_SECRET ? 'SET' : 'NOT SET',
        critical: false
      },
      'DATA_ENCRYPTION_KEY': {
        set: !!process.env.DATA_ENCRYPTION_KEY,
        preview: process.env.DATA_ENCRYPTION_KEY ? 'SET' : 'NOT SET',
        critical: false
      }
    };
    
    // Process variables
    Object.entries(varsToCheck).forEach(([name, info]) => {
      if (info.set) {
        envStatus.configured[name] = {
          status: '✅',
          preview: info.preview || info.value || 'SET'
        };
      } else {
        envStatus.missing.push(name);
        if (info.critical) {
          envStatus.warnings.push(`Critical variable ${name} is missing`);
        }
      }
    });
    
    // Check for common issues
    if (process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      envStatus.warnings.push('GEMINI_API_KEY appears to be a placeholder');
    }
    
    if (process.env.FIREBASE_PRIVATE_KEY && !process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
      envStatus.warnings.push('FIREBASE_PRIVATE_KEY may be incorrectly formatted');
    }
    
    // Summary
    envStatus.summary = {
      totalChecked: Object.keys(varsToCheck).length,
      configured: Object.keys(envStatus.configured).length,
      missing: envStatus.missing.length,
      hasAllCritical: !envStatus.missing.some(name => 
        varsToCheck[name] && varsToCheck[name].critical
      )
    };
    
    res.json(envStatus);
  });
  
  console.log('✅ Environment check endpoint added at /api/env-check/:secret');
}

module.exports = { addEnvCheckEndpoint };