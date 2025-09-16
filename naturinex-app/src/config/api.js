// API Configuration
// Handles switching between Render and Supabase endpoints

// Determine which API URL to use
const getApiUrl = () => {
  // First try Supabase URL (new deployment)
  if (process.env.REACT_APP_API_URL_SUPABASE) {
    return process.env.REACT_APP_API_URL_SUPABASE;
  }

  // Fallback to original Render URL
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Default fallback
  return 'https://naturinex-app.onrender.com';
};

// Export the API URL and helper functions
export const API_URL = getApiUrl();

// Check if we're using Supabase
export const isUsingSupabase = () => {
  return API_URL.includes('supabase.co');
};

// API endpoints
export const API_ENDPOINTS = {
  ANALYZE: `${API_URL}${isUsingSupabase() ? '/analyze' : '/api/analyze'}`,
  WEBHOOK: `${API_URL}${isUsingSupabase() ? '/stripe-webhook' : '/api/webhook'}`,
  SUBSCRIPTION: `${API_URL}${isUsingSupabase() ? '/subscription' : '/api/subscription'}`,
  ADMIN: {
    DASHBOARD: `${API_URL}/api/admin/dashboard`,
    SCANS: `${API_URL}/api/admin/scans`,
    USERS: `${API_URL}/api/admin/users`,
  }
};

// Helper to make API calls
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

export default {
  API_URL,
  API_ENDPOINTS,
  apiCall,
  isUsingSupabase,
};