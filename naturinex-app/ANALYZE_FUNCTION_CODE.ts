import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { medication, source = 'manual_input' } = await req.json()

    if (!medication) {
      return new Response(
        JSON.stringify({ error: 'Medication name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    const prompt = 'Analyze the medication "' + medication + '" and provide natural alternatives. Return a JSON response with this structure: {"alternatives": [{"name": "Alternative name", "description": "Brief description", "effectiveness": "How effective it is", "dosage": "Recommended dosage", "precautions": "Important precautions"}], "warnings": ["Important warning 1", "Warning 2"], "interactions": ["Potential interaction 1"], "disclaimer": "Medical disclaimer text"}. Provide 3-5 natural alternatives with scientific backing.'

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
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('Gemini API error:', error)
      throw new Error('Failed to analyze medication')
    }

    const data = await response.json()
    const result = data.candidates[0].content.parts[0].text

    // Parse the response
    let parsedResult
    try {
      // Remove markdown code blocks if present
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      parsedResult = JSON.parse(cleanedResult)
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      // Return a fallback structure
      parsedResult = {
        alternatives: [{
          name: 'Natural Alternative',
          description: 'Consult with a healthcare provider for natural alternatives to ' + medication,
          effectiveness: 'Varies by individual',
          dosage: 'As recommended by healthcare provider',
          precautions: 'Always consult with a healthcare provider before switching medications'
        }],
        warnings: [
          'Always consult with a healthcare provider before switching medications',
          'Natural alternatives may not be suitable for all conditions',
          'Results are for informational purposes only'
        ],
        disclaimer: 'This information is for educational purposes only and is not medical advice.'
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        medication,
        ...parsedResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        alternatives: [],
        warnings: ['Service temporarily unavailable. Please try again later.'],
        disclaimer: 'Unable to process request at this time.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})