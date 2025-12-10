// Supabase Edge Function: Vision OCR
// This function proxies requests to Google Vision API with server-side API key
// Prevents API key exposure in client bundles

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
    // Get environment variables
    const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

    if (!GOOGLE_VISION_API_KEY) {
      throw new Error('GOOGLE_VISION_API_KEY not configured')
    }

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { imageBase64, imageUrl } = await req.json()

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageBase64 or imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate image size (limit to 10MB)
    if (imageBase64 && imageBase64.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Image too large. Maximum size is 10MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare Vision API request
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`

    const visionRequest: any = {
      requests: [{
        image: imageBase64
          ? { content: imageBase64.replace(/^data:image\/\w+;base64,/, '') }
          : { source: { imageUri: imageUrl } },
        features: [
          { type: 'TEXT_DETECTION', maxResults: 1 },
          { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
          { type: 'LABEL_DETECTION', maxResults: 5 },
        ],
        imageContext: {
          languageHints: ['en'],
        },
      }],
    }

    // Call Google Vision API
    const visionResponse = await fetch(visionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visionRequest),
    })

    if (!visionResponse.ok) {
      const error = await visionResponse.text()
      console.error('Vision API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to process image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const visionData = await visionResponse.json()
    const response = visionData.responses?.[0]

    if (!response) {
      return new Response(
        JSON.stringify({ error: 'No response from Vision API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract text from response
    const fullText = response.fullTextAnnotation?.text || ''
    const textAnnotations = response.textAnnotations || []
    const labels = response.labelAnnotations || []

    // Calculate confidence
    let confidence = 0
    if (textAnnotations.length > 0) {
      const scores = textAnnotations.map((t: any) => t.score || 0).filter((s: number) => s > 0)
      confidence = scores.length > 0
        ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
        : 0
    }

    // Extract potential medication names (words in all caps or with capitalized first letter)
    const words = fullText.split(/\s+/)
    const potentialMedications = words.filter((word: string) => {
      return word.length > 3 && /^[A-Z][a-z]+$|^[A-Z]+$/.test(word)
    }).slice(0, 5) // Take top 5

    // Log usage for monitoring
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      function_name: 'vision-ocr',
      input_length: imageBase64?.length || imageUrl?.length || 0,
      success: true,
      created_at: new Date().toISOString(),
    }).catch(err => console.warn('Failed to log usage:', err))

    return new Response(
      JSON.stringify({
        success: true,
        fullText: fullText,
        confidence: confidence,
        textAnnotations: textAnnotations.slice(0, 10), // Limit response size
        labels: labels.map((l: any) => ({ description: l.description, score: l.score })),
        potentialMedications: potentialMedications,
        detectedLanguage: response.textAnnotations?.[0]?.locale || 'en',
        processingTime: Date.now(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in vision-ocr function:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
