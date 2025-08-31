// Content Security Policy configuration for Naturinex
export const cspConfig = {
  directives: {
    // Default source restrictions
    "default-src": ["'self'"],
    
    // Script sources - only allow self and specific trusted domains
    "script-src": [
      "'self'",
      "'unsafe-inline'", // Required for React development
      "https://js.stripe.com",
      "https://checkout.stripe.com"
    ],
    
    // Style sources
    "style-src": [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and React
      "https://fonts.googleapis.com"
    ],
    
    // Image sources
    "img-src": [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    
    // Font sources
    "font-src": [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    
    // Connect sources for API calls
    "connect-src": [
      "'self'",
      "https://naturinex-app-1.onrender.com",
      "https://api.stripe.com",
      "https://checkout.stripe.com",
      "https://naturinex.firebaseapp.com",
      "https://firestore.googleapis.com",
      "https://identitytoolkit.googleapis.com",
      "https://securetoken.googleapis.com"
    ],
    
    // Frame sources for Stripe checkout
    "frame-src": [
      "https://js.stripe.com",
      "https://hooks.stripe.com",
      "https://checkout.stripe.com"
    ],
    
    // Prevent framing of the application
    "frame-ancestors": ["'none'"],
    
    // Base URI restrictions
    "base-uri": ["'self'"],
    
    // Object restrictions
    "object-src": ["'none'"],
    
    // Media restrictions
    "media-src": ["'self'"],
    
    // Worker restrictions
    "worker-src": ["'self'"],
    
    // Manifest restrictions
    "manifest-src": ["'self'"]
  }
};

// Security headers for development vs production
export const securityHeaders = {
  development: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(self)"
  },
  
  production: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=(self)",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Robots-Tag": "noindex, nofollow"
  }
};

// Apply CSP to HTML meta tag
export const generateCSPMetaTag = () => {
  const policies = Object.entries(cspConfig.directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
    
  return `<meta http-equiv="Content-Security-Policy" content="${policies}">`;
};

const securityConfigExports = { cspConfig, securityHeaders, generateCSPMetaTag };

export default securityConfigExports;
