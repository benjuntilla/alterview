// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Add your OpenRouter API key to your Supabase secrets
// supabase secrets set OPENROUTER_API_KEY=your_key_here
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

interface RequestBody {
  transcript: string;
  mindmap_template: Record<string, string>;
}

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  try {
    // Parse request body
    const { transcript, mindmap_template }: RequestBody = await req.json()

    if (!transcript || !mindmap_template) {
      throw new Error('Missing required fields: transcript and mindmap_template')
    }

    // Construct prompt for the LLM
    const prompt = `Given this transcript of a student's interview with a teacher: "${transcript}"
    
Please analyze it and fill out the following template with relevant information. 
Respond ONLY with the completed JSON template, maintaining the exact same structure:
${JSON.stringify(mindmap_template, null, 2)}`

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://alterview-web.vercel.app'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const llmResponse = await response.json()
    // Clean the response content of any markdown formatting
    const cleanContent = llmResponse.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim()
    const filledTemplate = JSON.parse(cleanContent)

    return new Response(
      JSON.stringify({ mindmap: filledTemplate }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 400
      }
    )
  }
})
