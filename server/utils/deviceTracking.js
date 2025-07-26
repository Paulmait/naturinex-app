const crypto = require('crypto');

// In-memory storage for device tracking (use Redis or database in production)
const deviceScans = new Map();
const SCAN_LIMIT = 3;
const RESET_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function generateDeviceFingerprint(req) {
  // Combine multiple factors for device fingerprinting
  const factors = [
    req.headers['user-agent'] || 'unknown',
    req.headers['accept-language'] || 'unknown',
    req.headers['accept-encoding'] || 'unknown',
    req.ip || req.connection.remoteAddress || 'unknown',
  ];
  
  // Create a hash of these factors
  return crypto
    .createHash('sha256')
    .update(factors.join('|'))
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for brevity
}

function getDeviceId(req) {
  // Prefer the client-provided device ID if available
  const clientDeviceId = req.headers['x-device-id'];
  if (clientDeviceId) {
    return clientDeviceId;
  }
  
  // Fallback to server-side fingerprinting
  return generateDeviceFingerprint(req);
}

function checkScanLimit(deviceId, userId = null, isPremium = false) {
  // Premium users have unlimited scans
  if (isPremium) {
    return { allowed: true, remaining: -1, resetTime: null };
  }
  
  const now = Date.now();
  const deviceData = deviceScans.get(deviceId) || {
    count: 0,
    firstScan: now,
    lastScan: now,
    userId: userId
  };
  
  // Check if we need to reset the count (24 hours passed)
  if (now - deviceData.firstScan > RESET_PERIOD) {
    deviceData.count = 0;
    deviceData.firstScan = now;
  }
  
  // Check if limit reached
  if (deviceData.count >= SCAN_LIMIT) {
    const resetTime = deviceData.firstScan + RESET_PERIOD;
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(resetTime).toISOString(),
      message: 'Free scan limit reached. Upgrade to premium for unlimited scans!'
    };
  }
  
  return {
    allowed: true,
    remaining: SCAN_LIMIT - deviceData.count,
    resetTime: new Date(deviceData.firstScan + RESET_PERIOD).toISOString()
  };
}

function recordScan(deviceId, userId = null) {
  const now = Date.now();
  const deviceData = deviceScans.get(deviceId) || {
    count: 0,
    firstScan: now,
    lastScan: now,
    userId: userId,
    scans: []
  };
  
  // Reset if needed
  if (now - deviceData.firstScan > RESET_PERIOD) {
    deviceData.count = 1;
    deviceData.firstScan = now;
    deviceData.scans = [];
  } else {
    deviceData.count++;
  }
  
  deviceData.lastScan = now;
  deviceData.scans.push({
    timestamp: now,
    userId: userId
  });
  
  deviceScans.set(deviceId, deviceData);
  
  return {
    scanCount: deviceData.count,
    remaining: Math.max(0, SCAN_LIMIT - deviceData.count)
  };
}

function getDeviceStats(deviceId) {
  const deviceData = deviceScans.get(deviceId);
  if (!deviceData) {
    return null;
  }
  
  return {
    totalScans: deviceData.count,
    firstScan: new Date(deviceData.firstScan).toISOString(),
    lastScan: new Date(deviceData.lastScan).toISOString(),
    userId: deviceData.userId,
    scansToday: deviceData.scans.length
  };
}

// Clean up old entries periodically (in production, use a scheduled job)
function cleanupOldEntries() {
  const now = Date.now();
  for (const [deviceId, data] of deviceScans.entries()) {
    if (now - data.lastScan > RESET_PERIOD * 7) { // Remove entries older than 7 days
      deviceScans.delete(deviceId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupOldEntries, 60 * 60 * 1000);

module.exports = {
  generateDeviceFingerprint,
  getDeviceId,
  checkScanLimit,
  recordScan,
  getDeviceStats,
  SCAN_LIMIT
};