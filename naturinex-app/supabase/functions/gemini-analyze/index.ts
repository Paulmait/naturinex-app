// Supabase Edge Function: Gemini Analyze
// This function proxies requests to Google Gemini API with server-side API key
// Prevents API key exposure in client bundles

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import { getCorsHeaders } from '../_shared/cors.ts'

// CORS headers will be set per-request based on origin

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) })
  }

  try {
    // Get environment variables
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    })

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { medicationName, ocrText } = await req.json()

    if (!medicationName && !ocrText) {
      return new Response(
        JSON.stringify({ error: 'medicationName or ocrText is required' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Validate input
    const textToAnalyze = medicationName || ocrText
    if (typeof textToAnalyze !== 'string' || textToAnalyze.length < 2 || textToAnalyze.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: must be between 2-200 characters' }),
        { status: 400, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize input - remove special characters
    const sanitized = textToAnalyze.replace(/[<>'"]/g, '').trim()

    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

    const prompt = `You are a wellness advisor. Analyze this medication: "${sanitized}"

Please provide:
1. Medication name and type
2. Common uses
3. 2-3 natural wellness alternatives (with scientific backing)
4. Important warnings/disclaimers

Format as JSON:
{
  "medicationName": "...",
  "medicationType": "...",
  "commonUses": ["..."],
  "naturalAlternatives": [
    {
      "name": "...",
      "effectiveness": "High/Moderate/Low",
      "description": "...",
      "benefits": ["..."],
      "warnings": ["..."]
    }
  ],
  "warnings": ["..."],
  "disclaimer": "Always consult healthcare provider..."
}`

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!geminiResponse.ok) {
      const error = await geminiResponse.text()
      console.error('Gemini API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to analyze medication' }),
        { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
      )
    }

    const geminiData = await geminiResponse.json()

    // Extract the text response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error('No response from Gemini API')
    }

    // Try to parse JSON from response
    let analysisResult
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                       responseText.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText
      analysisResult = JSON.parse(jsonText)
    } catch (e) {
      // If JSON parsing fails, return structured response
      analysisResult = {
        medicationName: sanitized,
        medicationType: 'Unknown',
        rawResponse: responseText,
        warnings: ['Always consult with a healthcare provider before making medication changes']
      }
    }

    // Log usage for monitoring (without sensitive data)
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      function_name: 'gemini-analyze',
      input_length: sanitized.length,
      success: true,
      created_at: new Date().toISOString(),
    }).catch(err => console.warn('Failed to log usage:', err))

    return new Response(
      JSON.stringify({
        success: true,
        ...analysisResult,
        analyzedAt: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in gemini-analyze function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
      }
    )
  }
})
