// CORS headers for Supabase Edge Functions
// Handles cross-origin requests for Naturinex APIs
// SECURITY: Restricted to known production and development origins

const ALLOWED_ORIGINS = [
  'https://naturinex.com',
  'https://www.naturinex.com',
  'https://app.naturinex.com',
  'https://naturinex-app.web.app',
  'https://naturinex-app.vercel.app',
]

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('origin') || ''

  // Check if origin is allowed
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0] // Default to primary domain

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Vary': 'Origin',
  }
}

// Legacy export for backward compatibility during migration
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://naturinex.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}
