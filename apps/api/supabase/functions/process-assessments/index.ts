// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Add your OpenRouter API key to your Supabase secrets
// supabase secrets set OPENROUTER_API_KEY=your_key_here
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')

interface ProcessRequest {
  mindmaps: string[];
}

console.log("Hello from Functions!")

Deno.serve(async (req) => {
  try {
    const { mindmaps }: ProcessRequest = await req.json()
    
    if (!mindmaps || mindmaps.length === 0) {
      throw new Error("No mindmaps provided")
    }

    // Process the mindmaps into a single string with clear separation
    const processedString = mindmaps
      .map((mindmap, index) => `Assessment ${index + 1}:\n${JSON.stringify(mindmap, null, 2)}`)
      .join("\n\n---\n\n")

    // Construct prompt for the LLM
    const prompt = `You are an experienced educational analyst specializing in analyzing student assessments and providing actionable insights for teachers.

Given these assessment results from different students in mindmap format:

${processedString}

Analyze these assessments holistically and generate 3-5 key insights that would be valuable for a teacher. Focus on:
1. Patterns across different students and topics
2. Common areas where students show strength or need improvement
3. Specific, actionable recommendations for the teacher to help the class as a whole
4. Any potential gaps in understanding that appear across multiple students

Remember: Each assessment is from a different student - look for patterns across the group rather than treating it as a single student's progress.

IMPORTANT: You must respond with ONLY a valid JSON array of strings. Example format:
["Insight 1 text here", "Insight 2 text here", "Insight 3 text here"]

Do not include any other text, markdown formatting, or explanation - ONLY the JSON array.`

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
    
    if (!llmResponse.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from LLM')
    }

    // Clean and parse the response content
    let insights: string[]
    try {
      const cleanContent = llmResponse.choices[0].message.content.replace(/```json\n?|\n?```/g, '').trim()
      insights = JSON.parse(cleanContent)
      
      if (!Array.isArray(insights)) {
        throw new Error('LLM response is not an array')
      }
      
      if (!insights.every(item => typeof item === 'string')) {
        throw new Error('LLM response contains non-string elements')
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error)
      throw new Error('Failed to parse insights from LLM response')
    }

    return new Response(
      JSON.stringify({
        insights: insights
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  }
})
