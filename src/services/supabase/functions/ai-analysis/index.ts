// supabase/functions/ai-analysis/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, data } = await req.json()

    // Get API keys from Supabase secrets
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY')

    let result = null

    switch (action) {
      case 'analyze-product':
        result = await analyzeProduct(data, GROQ_API_KEY!)
        break
      
      case 'classify-text':
        result = await classifyText(data, HUGGINGFACE_API_KEY!)
        break
      
      case 'extract-ingredients':
        result = await extractIngredients(data, GROQ_API_KEY!)
        break
        
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})

// Analyze product with Groq
async function analyzeProduct(data: any, apiKey: string) {
  const { product, stack } = data
  
  const prompt = `As a pharmaceutical expert, analyze this supplement:
Product: ${product.name}
Ingredients: ${JSON.stringify(product.ingredients)}
User's current stack: ${JSON.stringify(stack?.map((s: any) => s.name) || [])}

Provide:
1. Safety assessment
2. Potential interactions
3. Efficacy rating (1-10)
4. Recommendations`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',  // Using working model from your test
      messages: [
        {
          role: 'system',
          content: 'You are a pharmaceutical expert specializing in supplements and drug interactions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${error}`)
  }

  const result = await response.json()
  return result.choices[0].message.content
}

// Classify text with HuggingFace
async function classifyText(data: any, apiKey: string) {
  const { text, labels } = data
  
  const response = await fetch(
    'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
    {
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: labels || ['safe', 'caution', 'dangerous'],
        }
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HuggingFace API error: ${error}`)
  }

  return await response.json()
}

// Extract ingredients from OCR text using Groq
async function extractIngredients(data: any, apiKey: string) {
  const { ocrText } = data
  
  const prompt = `Extract all supplement ingredients from this label text. 
Return as JSON array with format: [{name: string, amount: number, unit: string}]

Label text:
${ocrText}

Only return the JSON array, no other text.`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: 'You extract structured data from supplement labels. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,  // Low temperature for consistent extraction
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${error}`)
  }

  const result = await response.json()
  const content = result.choices[0].message.content
  
  // Try to parse as JSON
  try {
    return JSON.parse(content)
  } catch {
    // If parsing fails, return the raw content
    return { raw: content, parsed: false }
  }
}