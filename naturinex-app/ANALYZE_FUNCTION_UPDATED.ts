import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
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
    const { medication } = await req.json()

    if (!medication) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      console.error('GEMINI_API_KEY not found in environment')
      throw new Error('API configuration error')
    }

    console.log('Processing medication:', medication)

    const prompt = 'Analyze the medication "' + medication + '" and provide natural alternatives. Return a JSON response with alternatives array containing objects with name, description, effectiveness, dosage, and precautions fields. Also include warnings array and disclaimer string.'

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + geminiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error('Failed to get alternatives')
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0]) {
      throw new Error('Invalid API response')
    }

    const result = data.candidates[0].content.parts[0].text

    // Try to parse as JSON, otherwise return structured fallback
    let parsedResult
    try {
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      parsedResult = JSON.parse(cleanedResult)
    } catch (e) {
      console.log('Failed to parse JSON, using fallback')
      parsedResult = {
        alternatives: [
          {
            name: 'Turmeric',
            description: 'Natural anti-inflammatory compound',
            effectiveness: 'Moderate to high for mild pain',
            dosage: '500-1000mg daily',
            precautions: 'May interact with blood thinners'
          },
          {
            name: 'Willow Bark',
            description: 'Natural source of salicin, similar to aspirin',
            effectiveness: 'Moderate for pain relief',
            dosage: '240mg daily',
            precautions: 'Not for those allergic to aspirin'
          }
        ],
        warnings: [
          'Always consult healthcare provider before switching medications',
          'Natural alternatives may not be suitable for all conditions'
        ],
        disclaimer: 'This information is for educational purposes only.'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        medication,
        ...parsedResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unable to process request',
        alternatives: [],
        warnings: ['Service temporarily unavailable'],
        disclaimer: 'Please try again later'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}, { port: 8000 })