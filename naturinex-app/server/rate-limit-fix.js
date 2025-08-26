// Fix for the rate limiting warning
// Replace your current rate limiter code with this:

const rateLimit = require('express-rate-limit');

// Create rate limiter with proper configuration for Render
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip the trust proxy issue by using custom key generator
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later'
    });
  }
});