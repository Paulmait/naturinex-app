import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create, verify } from 'https://deno.land/x/djwt@v2.8/mod.ts'

import { getCorsHeaders } from '../_shared/cors.ts'

// CORS headers will be set per-request based on origin

// Rate limiting configuration
const RATE_LIMITS = {
  ANONYMOUS: { limit: 3, window: 3600000 }, // 3 per hour
  FREE: { limit: 10, window: 86400000 }, // 10 per day
  PLUS: { limit: 100, window: 86400000 }, // 100 per day
  PRO: { limit: 1000, window: 86400000 }, // 1000 per day
  ADMIN: { limit: 10000, window: 86400000 } // Unlimited essentially
}

// Cost tracking
const API_COST_CENTS = 0.2 // $0.002 per request

// In-memory cache for rate limiting (resets on cold start)
const rateLimitCache = new Map()
const deviceCache = new Map()
const suspiciousIPs = new Set()

// Helper to get client info
function getClientInfo(req: Request) {
  const headers = req.headers

  return {
    ip: headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        headers.get('cf-connecting-ip') ||
        headers.get('x-real-ip') ||
        headers.get('x-client-ip') ||
        'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    deviceId: headers.get('x-device-id') || null,
    country: headers.get('cf-ipcountry') || null,
    authorization: headers.get('authorization'),
    origin: headers.get('origin') || headers.get('referer') || 'unknown'
  }
}

// Helper to generate identifier for rate limiting
function getRateLimitKey(clientInfo: any, userId?: string) {
  if (userId) return `user:${userId}`
  if (clientInfo.deviceId) return `device:${clientInfo.deviceId}`
  return `ip:${clientInfo.ip}:${clientInfo.userAgent}`
}

// Check if request is suspicious
function checkSuspiciousActivity(clientInfo: any): { suspicious: boolean, reason?: string } {
  // Check if IP is already flagged
  if (suspiciousIPs.has(clientInfo.ip)) {
    return { suspicious: true, reason: 'Previously flagged IP' }
  }

  // Check for missing headers (bot-like behavior)
  if (!clientInfo.userAgent || clientInfo.userAgent === 'unknown') {
    return { suspicious: true, reason: 'Missing user agent' }
  }

  // Check for common bot patterns
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|axios|fetch/i
  if (botPatterns.test(clientInfo.userAgent)) {
    return { suspicious: true, reason: 'Bot-like user agent' }
  }

  // Check for suspicious origins
  if (clientInfo.origin === 'unknown' || clientInfo.origin.includes('localhost')) {
    return { suspicious: true, reason: 'Suspicious origin' }
  }

  return { suspicious: false }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: getCorsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    )
  }

  const startTime = Date.now()
  const clientInfo = getClientInfo(req)

  // Initialize Supabase clients
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: clientInfo.authorization || '' }
    }
  })

  try {
    // Check for suspicious activity
    const suspiciousCheck = checkSuspiciousActivity(clientInfo)
    if (suspiciousCheck.suspicious) {
      // Log suspicious activity
      await supabaseAdmin.from('abuse_logs').insert({
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        device_fingerprint: clientInfo.deviceId,
        action: 'suspicious_request',
        severity: 'medium',
        details: { reason: suspiciousCheck.reason }
      })

      suspiciousIPs.add(clientInfo.ip)

      return new Response(
        JSON.stringify({
          error: 'Request blocked due to suspicious activity',
          code: 'SUSPICIOUS_ACTIVITY'
        }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate user if token provided
    let userId = null
    let userTier = 'ANONYMOUS'
    let isAuthenticated = false

    if (clientInfo.authorization && clientInfo.authorization !== 'Bearer null') {
      try {
        const token = clientInfo.authorization.replace('Bearer ', '')
        const { data: { user }, error } = await supabaseClient.auth.getUser(token)

        if (user && !error) {
          userId = user.id
          isAuthenticated = true

          // Get user subscription tier
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('subscription_tier, role')
            .eq('user_id', userId)
            .single()

          if (profile) {
            if (profile.role === 'admin') {
              userTier = 'ADMIN'
            } else {
              userTier = (profile.subscription_tier || 'free').toUpperCase()
            }
          } else {
            userTier = 'FREE'
          }
        }
      } catch (e) {
        console.log('Auth verification failed:', e)
      }
    }

    // Rate limiting check using database
    const rateLimitKey = getRateLimitKey(clientInfo, userId)
    const limits = RATE_LIMITS[userTier as keyof typeof RATE_LIMITS] || RATE_LIMITS.ANONYMOUS

    // Check rate limit in database
    const { data: rateLimitResult, error: rateLimitError } = await supabaseAdmin
      .rpc('check_rate_limit', {
        p_identifier: rateLimitKey,
        p_limit: limits.limit,
        p_window_hours: limits.window / 3600000
      })

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError)
      // Fall back to in-memory check
      const cached = rateLimitCache.get(rateLimitKey)
      const now = Date.now()

      if (cached && now - cached.firstRequest < limits.window) {
        if (cached.count >= limits.limit) {
          await supabaseAdmin.from('abuse_logs').insert({
            ip_address: clientInfo.ip,
            user_agent: clientInfo.userAgent,
            device_fingerprint: clientInfo.deviceId,
            action: 'rate_limit_exceeded',
            severity: 'high',
            details: { tier: userTier, limit: limits.limit }
          })

          return new Response(
            JSON.stringify({
              error: 'Rate limit exceeded. Please upgrade or wait.',
              code: 'RATE_LIMIT_EXCEEDED',
              upgrade: !isAuthenticated || userTier === 'FREE',
              retryAfter: new Date(cached.firstRequest + limits.window).toISOString()
            }),
            {
              status: 429,
              headers: {
                ...getCorsHeaders(req),
                'Content-Type': 'application/json',
                'X-RateLimit-Limit': String(limits.limit),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(cached.firstRequest + limits.window),
                'Retry-After': String(Math.ceil((cached.firstRequest + limits.window - now) / 1000))
              }
            }
          )
        }
        cached.count++
      } else {
        rateLimitCache.set(rateLimitKey, { firstRequest: now, count: 1 })
      }
    } else if (rateLimitResult && rateLimitResult.length > 0) {
      const { allowed, remaining, reset_at } = rateLimitResult[0]

      if (!allowed) {
        await supabaseAdmin.from('abuse_logs').insert({
          ip_address: clientInfo.ip,
          user_agent: clientInfo.userAgent,
          device_fingerprint: clientInfo.deviceId,
          action: 'rate_limit_exceeded',
          severity: 'high',
          details: { tier: userTier, limit: limits.limit }
        })

        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please upgrade or wait.',
            code: 'RATE_LIMIT_EXCEEDED',
            upgrade: !isAuthenticated || userTier === 'FREE',
            retryAfter: reset_at
          }),
          {
            status: 429,
            headers: {
              ...getCorsHeaders(req),
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(limits.limit),
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': new Date(reset_at).getTime().toString()
            }
          }
        )
      }
    }

    // Parse request body
    const { medication, deviceFingerprint } = await req.json()

    if (!medication) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required', code: 'MISSING_MEDICATION' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Validate medication input (prevent injection attacks)
    if (medication.length > 100 || !/^[a-zA-Z0-9\s\-]+$/.test(medication)) {
      return new Response(
        JSON.stringify({ error: 'Invalid medication name', code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Update device fingerprint tracking
    if (deviceFingerprint) {
      const { error: fpError } = await supabaseAdmin
        .from('device_fingerprints')
        .upsert({
          fingerprint_hash: deviceFingerprint,
          ip_addresses: [clientInfo.ip],
          user_agents: [clientInfo.userAgent],
          user_ids: userId ? [userId] : [],
          last_seen: new Date().toISOString(),
          total_scans: 1
        }, {
          onConflict: 'fingerprint_hash'
        })

      if (fpError) console.error('Fingerprint tracking error:', fpError)
    }

    // Check for abuse patterns
    const { data: abuseCheck } = await supabaseAdmin
      .rpc('check_abuse_patterns', {
        p_ip: clientInfo.ip,
        p_device_id: deviceFingerprint || clientInfo.deviceId
      })

    if (abuseCheck) {
      suspiciousIPs.add(clientInfo.ip)

      return new Response(
        JSON.stringify({
          error: 'Unusual activity detected. Please try again later.',
          code: 'ABUSE_DETECTED'
        }),
        { status: 403, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Call Gemini API
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('API configuration error')
    }

    const prompt = `As a healthcare information provider, analyze the medication "${medication}" and provide natural alternatives.

    Return a valid JSON response with this exact structure:
    {
      "alternatives": [
        {
          "name": "Alternative name",
          "description": "Brief description",
          "effectiveness": "Evidence level",
          "dosage": "Typical dosage",
          "precautions": "Important warnings",
          "scientificSupport": "Research backing"
        }
      ],
      "warnings": ["Important warning messages"],
      "interactions": ["Potential interactions"],
      "disclaimer": "Medical disclaimer",
      "consultDoctor": true
    }

    Provide 2-4 evidence-based natural alternatives. Be factual and safety-focused.`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
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
            topP: 0.95,
            topK: 40
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text()
      console.error('Gemini API error:', errorText)
      throw new Error('Analysis service unavailable')
    }

    const geminiData = await geminiResponse.json()

    if (!geminiData.candidates || !geminiData.candidates[0]) {
      throw new Error('Invalid API response')
    }

    const result = geminiData.candidates[0].content.parts[0].text

    // Parse and validate response
    let parsedResult
    try {
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      parsedResult = JSON.parse(cleanedResult)

      // Validate structure
      if (!parsedResult.alternatives || !Array.isArray(parsedResult.alternatives)) {
        throw new Error('Invalid response structure')
      }
    } catch (e) {
      console.error('Response parsing error:', e)
      parsedResult = {
        alternatives: [
          {
            name: 'Consult Healthcare Provider',
            description: `For natural alternatives to ${medication}, please consult with a qualified healthcare provider.`,
            effectiveness: 'Varies by individual',
            dosage: 'As recommended by healthcare provider',
            precautions: 'Always consult before making medication changes',
            scientificSupport: 'Professional guidance recommended'
          }
        ],
        warnings: [
          'This information is for educational purposes only',
          'Always consult healthcare providers before changing medications',
          'Natural alternatives may not be suitable for all conditions'
        ],
        disclaimer: 'Not a substitute for professional medical advice',
        consultDoctor: true
      }
    }

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Log the scan
    const { error: logError } = await supabaseAdmin.from('scan_logs').insert({
      user_id: userId,
      ip_address: clientInfo.ip,
      user_agent: clientInfo.userAgent,
      device_fingerprint: deviceFingerprint || clientInfo.deviceId,
      medication: medication,
      is_anonymous: !isAuthenticated,
      response_time_ms: responseTime,
      api_cost_cents: API_COST_CENTS,
      country_code: clientInfo.country
    })

    if (logError) console.error('Scan logging error:', logError)

    // Update analytics
    await supabaseAdmin.rpc('update_analytics_daily')

    // Check for cost alerts
    const { data: todayCost } = await supabaseAdmin
      .from('scan_logs')
      .select('api_cost_cents')
      .gte('timestamp', new Date().toISOString().split('T')[0])
      .single()

    if (todayCost && todayCost.api_cost_cents > 1000) { // $10 threshold
      await supabaseAdmin.from('monitoring_alerts').insert({
        alert_type: 'cost_threshold',
        severity: 'critical',
        message: 'Daily API cost exceeded $10',
        details: { cost: todayCost.api_cost_cents / 100 }
      })
    }

    // Calculate remaining requests
    const remaining = limits.limit - ((rateLimitCache.get(rateLimitKey)?.count || 0))

    return new Response(
      JSON.stringify({
        success: true,
        medication,
        ...parsedResult,
        metadata: {
          responseTime: `${responseTime}ms`,
          tier: userTier.toLowerCase(),
          remaining: remaining,
          limit: limits.limit,
          authenticated: isAuthenticated
        }
      }),
      {
        status: 200,
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(limits.limit),
          'X-RateLimit-Remaining': String(Math.max(0, remaining)),
          'X-Response-Time': String(responseTime),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Function error:', error)

    // Log critical errors
    await supabaseAdmin.from('monitoring_alerts').insert({
      alert_type: 'function_error',
      severity: 'high',
      message: 'Edge function error',
      details: {
        error: error.message,
        ip: clientInfo.ip,
        medication: req.body
      }
    })

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable',
        code: 'SERVICE_ERROR',
        alternatives: [],
        warnings: ['Service is temporarily unavailable. Please try again later.'],
        disclaimer: 'Unable to process request at this time'
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )
  }
}, { port: 8000 })