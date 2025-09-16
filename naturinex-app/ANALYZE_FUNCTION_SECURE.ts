import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map()
const ANONYMOUS_LIMIT = 3 // 3 scans per IP per hour
const RATE_LIMIT_WINDOW = 3600000 // 1 hour in ms

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Get client IP and user agent for tracking
    const clientIP = req.headers.get('x-forwarded-for') ||
                    req.headers.get('cf-connecting-ip') ||
                    req.headers.get('x-real-ip') ||
                    'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    const authorization = req.headers.get('authorization')

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    )

    // Check if user is authenticated
    let userId = null
    let isAuthenticated = false

    if (authorization && authorization !== 'Bearer null') {
      try {
        const token = authorization.replace('Bearer ', '')
        const { data: { user } } = await supabase.auth.getUser(token)
        if (user) {
          userId = user.id
          isAuthenticated = true
        }
      } catch (e) {
        console.log('Auth check failed:', e)
      }
    }

    // Rate limiting for anonymous users
    if (!isAuthenticated) {
      const rateLimitKey = clientIP + ':' + userAgent
      const now = Date.now()

      // Clean up old entries
      for (const [key, data] of rateLimitMap.entries()) {
        if (now - data.firstRequest > RATE_LIMIT_WINDOW) {
          rateLimitMap.delete(key)
        }
      }

      // Check rate limit
      const limitData = rateLimitMap.get(rateLimitKey)
      if (limitData) {
        if (now - limitData.firstRequest < RATE_LIMIT_WINDOW) {
          if (limitData.count >= ANONYMOUS_LIMIT) {
            console.log('Rate limit exceeded for:', rateLimitKey)

            // Log abuse attempt
            await supabase.from('abuse_logs').insert({
              ip_address: clientIP,
              user_agent: userAgent,
              timestamp: new Date().toISOString(),
              action: 'rate_limit_exceeded'
            })

            return new Response(
              JSON.stringify({
                error: 'Rate limit exceeded. Please sign up for unlimited scans.',
                requiresAuth: true,
                remainingScans: 0
              }),
              {
                status: 429,
                headers: {
                  ...corsHeaders,
                  'Content-Type': 'application/json',
                  'X-RateLimit-Limit': String(ANONYMOUS_LIMIT),
                  'X-RateLimit-Remaining': '0',
                  'X-RateLimit-Reset': String(limitData.firstRequest + RATE_LIMIT_WINDOW)
                }
              }
            )
          }
          limitData.count++
        } else {
          // Reset if window expired
          rateLimitMap.set(rateLimitKey, { firstRequest: now, count: 1 })
        }
      } else {
        // First request
        rateLimitMap.set(rateLimitKey, { firstRequest: now, count: 1 })
      }

      const remaining = ANONYMOUS_LIMIT - (rateLimitMap.get(rateLimitKey)?.count || 0)
      console.log('Anonymous scan:', clientIP, 'Remaining:', remaining)
    }

    // Parse request
    const { medication } = await req.json()

    if (!medication) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for authenticated user limits
    if (isAuthenticated) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier, scans_this_month')
        .eq('user_id', userId)
        .single()

      if (profile?.subscription_tier === 'free' && profile.scans_this_month >= 10) {
        return new Response(
          JSON.stringify({
            error: 'Monthly scan limit reached. Please upgrade for unlimited scans.',
            requiresUpgrade: true
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update scan count for authenticated users
      await supabase.rpc('increment_scan_count', { p_user_id: userId })
    }

    // Log scan attempt
    await supabase.from('scan_logs').insert({
      user_id: userId,
      ip_address: clientIP,
      user_agent: userAgent,
      medication,
      is_anonymous: !isAuthenticated,
      timestamp: new Date().toISOString()
    })

    // Call Gemini API
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('API configuration error')
    }

    const prompt = 'Provide natural alternatives for ' + medication + '. Return JSON with alternatives array, warnings array, and disclaimer string.'

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      throw new Error('Analysis service unavailable')
    }

    const data = await response.json()
    const result = data.candidates[0].content.parts[0].text

    let parsedResult
    try {
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      parsedResult = JSON.parse(cleanedResult)
    } catch (e) {
      parsedResult = {
        alternatives: [
          {
            name: 'Consult Healthcare Provider',
            description: 'Please consult with a healthcare provider for alternatives to ' + medication,
            effectiveness: 'Varies by individual',
            dosage: 'As recommended',
            precautions: 'Professional guidance required'
          }
        ],
        warnings: ['Always consult healthcare providers before changing medications'],
        disclaimer: 'For educational purposes only.'
      }
    }

    // Calculate remaining scans for anonymous users
    let remainingScans = null
    if (!isAuthenticated) {
      const limitData = rateLimitMap.get(clientIP + ':' + userAgent)
      remainingScans = limitData ? ANONYMOUS_LIMIT - limitData.count : ANONYMOUS_LIMIT
    }

    return new Response(
      JSON.stringify({
        success: true,
        medication,
        ...parsedResult,
        remainingScans: remainingScans,
        isAuthenticated: isAuthenticated
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...(remainingScans !== null && {
            'X-RateLimit-Limit': String(ANONYMOUS_LIMIT),
            'X-RateLimit-Remaining': String(remainingScans)
          })
        }
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable',
        alternatives: [],
        warnings: ['Please try again later'],
        disclaimer: 'Service error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}, { port: 8000 })