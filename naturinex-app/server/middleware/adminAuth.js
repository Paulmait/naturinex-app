const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');

// Admin role verification middleware
async function verifyAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user has admin role in Firebase
    const userRecord = await admin.auth().getUser(decoded.uid);
    
    // Check custom claims for admin role
    if (!userRecord.customClaims || !userRecord.customClaims.admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    // Check if admin is active and not suspended
    const adminDoc = await admin.firestore()
      .collection('admins')
      .doc(decoded.uid)
      .get();
    
    if (!adminDoc.exists || !adminDoc.data().active) {
      return res.status(403).json({ error: 'Admin access revoked' });
    }
    
    // Log admin action
    await logAdminAction(decoded.uid, req.method, req.path, req.ip, req.headers['user-agent']);
    
    req.admin = {
      uid: decoded.uid,
      email: userRecord.email,
      permissions: adminDoc.data().permissions || []
    };
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Log admin actions for audit trail
async function logAdminAction(adminId, method, path, ip, userAgent) {
  try {
    await admin.firestore().collection('adminLogs').add({
      adminId,
      action: `${method} ${path}`,
      ip,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: userAgent
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

// Rate limiting for admin endpoints
const adminRateLimiter = new Map();

function rateLimit(req, res, next) {
  const key = `${req.admin?.uid || req.ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;
  
  if (!adminRateLimiter.has(key)) {
    adminRateLimiter.set(key, []);
  }
  
  const requests = adminRateLimiter.get(key);
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  recentRequests.push(now);
  adminRateLimiter.set(key, recentRequests);
  
  next();
}

// Security headers middleware
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  next();
}

module.exports = {
  verifyAdmin,
  rateLimit,
  securityHeaders
};