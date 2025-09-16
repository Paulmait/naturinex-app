import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// API cost tracking
const API_COST_CENTS = 0.2 // $0.002 per request

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

  const startTime = Date.now()

  // Get client info
  const headers = req.headers
  const clientInfo = {
    ip: headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        headers.get('cf-connecting-ip') ||
        headers.get('x-real-ip') ||
        'unknown',
    userAgent: headers.get('user-agent') || 'unknown',
    deviceId: headers.get('x-device-id') || null,
    authorization: headers.get('authorization')
  }

  // Initialize Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Parse request
    const { medication, deviceFingerprint } = await req.json()

    if (!medication) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    if (medication.length > 100 || !/^[a-zA-Z0-9\s\-]+$/.test(medication)) {
      return new Response(
        JSON.stringify({ error: 'Invalid medication name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate user if token provided
    let userId = null
    let userTier = 'anonymous'
    let userEmail = null

    if (clientInfo.authorization && clientInfo.authorization !== 'Bearer null') {
      try {
        const token = clientInfo.authorization.replace('Bearer ', '')

        // Verify JWT and get user
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)

        if (user && !error) {
          userId = user.id
          userEmail = user.email

          // Get user's subscription tier
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('subscription_tier')
            .eq('user_id', userId)
            .single()

          userTier = profile?.subscription_tier || 'free'
        }
      } catch (e) {
        console.log('Auth verification failed:', e)
      }
    }

    // Check rate limits based on user type
    let rateLimitCheck
    let remainingScans
    let limitMessage
    let canSaveData = false
    let dataRetentionDays = 0

    if (userId) {
      // Check user rate limits
      const { data: limitResult, error } = await supabaseAdmin
        .rpc('check_user_rate_limit', { p_user_id: userId })

      if (error) {
        console.error('Rate limit check error:', error)
        throw new Error('Unable to verify rate limits')
      }

      if (limitResult && limitResult.length > 0) {
        rateLimitCheck = limitResult[0]
        remainingScans = rateLimitCheck.remaining_this_month
        limitMessage = rateLimitCheck.message
        userTier = rateLimitCheck.tier

        // Get data retention settings for tier
        const { data: tierData } = await supabaseAdmin
          .from('subscription_tiers')
          .select('save_scan_history, data_retention_days')
          .eq('tier_name', userTier)
          .single()

        if (tierData) {
          canSaveData = tierData.save_scan_history
          dataRetentionDays = tierData.data_retention_days
        }
      }
    } else {
      // Check anonymous rate limits (3 per day per IP)
      const { data: limitResult, error } = await supabaseAdmin
        .rpc('check_anonymous_rate_limit', {
          p_ip_address: clientInfo.ip,
          p_device_fingerprint: deviceFingerprint
        })

      if (error) {
        console.error('Anonymous rate limit check error:', error)
        throw new Error('Unable to verify rate limits')
      }

      if (limitResult && limitResult.length > 0) {
        rateLimitCheck = limitResult[0]
        remainingScans = rateLimitCheck.remaining_today
        limitMessage = rateLimitCheck.message
      }
    }

    // Check if rate limit exceeded
    if (rateLimitCheck && !rateLimitCheck.allowed) {
      // Log rate limit violation
      await supabaseAdmin.from('abuse_logs').insert({
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        device_fingerprint: deviceFingerprint,
        action: 'rate_limit_exceeded',
        severity: 'high',
        details: {
          tier: userTier,
          message: limitMessage,
          user_id: userId
        }
      })

      return new Response(
        JSON.stringify({
          error: limitMessage,
          code: 'RATE_LIMIT_EXCEEDED',
          tier: userTier,
          upgrade: userTier !== 'pro',
          upgradeUrl: '/pricing',
          limits: {
            anonymous: '3 scans per day',
            free: '5 scans per month',
            plus: '100 scans per month',
            pro: 'Unlimited scans'
          }
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Tier': userTier,
            'X-RateLimit-Remaining': String(remainingScans || 0),
            'Retry-After': userTier === 'anonymous' ? '86400' : '2592000' // 1 day or 30 days
          }
        }
      )
    }

    // Call Gemini API for analysis
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
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text())
      throw new Error('Analysis service unavailable')
    }

    const geminiData = await geminiResponse.json()
    const result = geminiData.candidates[0].content.parts[0].text

    // Parse response
    let parsedResult
    try {
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      parsedResult = JSON.parse(cleanedResult)
    } catch (e) {
      parsedResult = {
        alternatives: [
          {
            name: 'Consult Healthcare Provider',
            description: `For natural alternatives to ${medication}, please consult with a qualified healthcare provider.`,
            effectiveness: 'Varies by individual',
            dosage: 'As recommended',
            precautions: 'Professional guidance required',
            scientificSupport: 'Consult medical literature'
          }
        ],
        warnings: [
          'This information is for educational purposes only',
          'Always consult healthcare providers before changing medications'
        ],
        disclaimer: 'Not a substitute for professional medical advice',
        consultDoctor: true
      }
    }

    // Calculate response time
    const responseTime = Date.now() - startTime

    // Save scan with proper retention policy
    const { data: scanId, error: saveError } = await supabaseAdmin
      .rpc('save_scan_with_retention', {
        p_user_id: userId,
        p_medication: medication,
        p_alternatives: parsedResult,
        p_ip_address: clientInfo.ip,
        p_user_agent: clientInfo.userAgent,
        p_device_fingerprint: deviceFingerprint,
        p_tier: userTier
      })

    if (saveError) {
      console.error('Scan save error:', saveError)
    }

    // Prepare response based on tier
    const responseData = {
      success: true,
      medication,
      ...parsedResult,
      metadata: {
        scanId: canSaveData ? scanId : undefined,
        responseTime: `${responseTime}ms`,
        tier: userTier,
        dataSaved: canSaveData,
        dataRetention: canSaveData ? (
          dataRetentionDays === null ? 'permanent' :
          dataRetentionDays === 365 ? '1 year' :
          'not saved'
        ) : 'not saved',
        remainingScans: remainingScans,
        limits: {
          current: limitMessage,
          tiers: {
            anonymous: '3 scans per day',
            free: '5 scans per month (no data saving)',
            plus: '100 scans per month (1 year retention)',
            pro: 'Unlimited scans (permanent storage)'
          }
        }
      }
    }

    // For free users, add upgrade prompt
    if (userTier === 'free') {
      responseData.upgradePrompt = {
        message: 'Upgrade to save your scan history and get more scans!',
        benefits: [
          'Save scan history',
          'Access past results',
          'AI-powered insights',
          'Priority support'
        ],
        upgradeUrl: '/pricing'
      }
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Tier': userTier,
          'X-RateLimit-Remaining': String(remainingScans ?? 'unlimited'),
          'X-Data-Saved': String(canSaveData),
          'X-Response-Time': String(responseTime),
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    )
  } catch (error) {
    console.error('Function error:', error)

    // Log error
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
        alternatives: [],
        warnings: ['Service is temporarily unavailable. Please try again later.'],
        disclaimer: 'Unable to process request at this time'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}, { port: 8000 })