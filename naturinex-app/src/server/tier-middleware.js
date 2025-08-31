// PHANTOM FILE - Created to work around Render bug
// This file doesn't actually exist in our codebase
// Render's cache is corrupted and insists this file exists

module.exports = {
  checkTierLimit: async (req, res, next) => {
    // Dummy middleware that just passes through
    next();
  },
  
  getRemainingScans: async (userId, tier) => {
    // Return unlimited for now
    return {
      remaining: 999,
      limit: 999,
      tier: tier || 'free'
    };
  }
};