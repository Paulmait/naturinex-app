// Analyze Medication Edge Function
// Provides natural alternatives using Gemini AI

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT token
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    // Parse request body
    const { medication, source = 'manual', imageData } = await req.json()

    if (!medication && !imageData) {
      throw new Error('Medication name or image data required')
    }

    // Check user's scan limit if not logged in or free tier
    if (!user) {
      // Track anonymous scan
      console.log('Anonymous scan for:', medication)
    } else {
      // Check subscription and scan limits
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('subscription_tier, scans_this_month')
        .eq('user_id', user.id)
        .single()

      if (profile?.subscription_tier === 'free' && profile.scans_this_month >= 5) {
        return new Response(
          JSON.stringify({
            error: 'Monthly scan limit reached. Please upgrade to continue.',
            requiresUpgrade: true,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Call Gemini API for natural alternatives
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('AI service not configured')
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `As a natural health expert, provide comprehensive natural alternatives for the medication "${medication}".

                  Format your response as a JSON object with the following structure:
                  {
                    "alternatives": [
                      {
                        "name": "Alternative name",
                        "description": "How it helps",
                        "dosage": "Recommended dosage",
                        "effectiveness": "High/Moderate/Low",
                        "scientificEvidence": "Brief evidence summary",
                        "sideEffects": "Potential side effects",
                        "interactions": "Drug interactions"
                      }
                    ],
                    "warnings": ["Important safety warnings"],
                    "lifestyle": ["Lifestyle recommendations"],
                    "disclaimer": "Medical disclaimer"
                  }

                  Be specific, evidence-based, and prioritize safety.`,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!geminiResponse.ok) {
      throw new Error('AI analysis failed')
    }

    const geminiData = await geminiResponse.json()
    const aiResponse = geminiData.candidates[0].content.parts[0].text

    // Try to parse as JSON, or structure the response
    let structuredResponse
    try {
      structuredResponse = JSON.parse(aiResponse)
    } catch {
      // Fallback: Structure the text response
      structuredResponse = {
        alternatives: [
          {
            name: 'Natural Alternative',
            description: aiResponse,
            effectiveness: 'See details',
            dosage: 'Consult healthcare provider',
          },
        ],
        warnings: [
          'Always consult with healthcare providers before making changes',
          'Natural alternatives may not be suitable for all conditions',
        ],
        disclaimer: 'This information is for educational purposes only.',
      }
    }

    // Save scan to database if user is logged in
    if (user) {
      const scanData = {
        user_id: user.id,
        medication_name: medication,
        natural_alternatives: structuredResponse,
        scan_source: source,
        created_at: new Date().toISOString(),
      }

      await supabaseClient.from('scans').insert([scanData])

      // Update scan count
      await supabaseClient.rpc('increment_scan_count', {
        p_user_id: user.id,
      })
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        medication: medication,
        ...structuredResponse,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Analyze function error:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Analysis failed',
        success: false,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})