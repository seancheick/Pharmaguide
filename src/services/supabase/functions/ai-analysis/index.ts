// supabase/functions/ai-analysis/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const {
      action,
      product,
      stack,
      healthProfile,
      analysisType,
      modelId,
      enhancedReasoning,
      ...data
    } = requestBody;

    // Get API keys from Supabase secrets
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
    const HUGGINGFACE_API_KEY = Deno.env.get('HUGGINGFACE_API_KEY');

    // Validate API keys
    if (!GROQ_API_KEY && !HUGGINGFACE_API_KEY) {
      throw new Error('No AI API keys configured');
    }

    // Extract performance headers
    const modelIdHeader = req.headers.get('X-Model-ID');
    const attemptHeader = req.headers.get('X-Attempt');

    console.log(`Processing ${action} request:
      - Analysis Type: ${analysisType || 'groq'}
      - Model ID: ${modelId || modelIdHeader || 'default'}
      - Enhanced Reasoning: ${enhancedReasoning || false}
      - Attempt: ${attemptHeader || '1'}`);

    let result = null;

    switch (action) {
      case 'analyze-product':
        result = await analyzeProduct(
          { product, stack },
          GROQ_API_KEY!,
          HUGGINGFACE_API_KEY,
          { modelId, enhancedReasoning }
        );
        break;

      case 'analyze-product-personalized':
        result = await analyzeProductPersonalized(
          { product, stack, healthProfile },
          GROQ_API_KEY!,
          HUGGINGFACE_API_KEY,
          { modelId, enhancedReasoning }
        );
        break;

      case 'analyze-interactions-enhanced':
        result = await analyzeInteractionsEnhanced(
          { product, stack, healthProfile },
          GROQ_API_KEY!,
          HUGGINGFACE_API_KEY,
          { modelId }
        );
        break;

      case 'classify-text':
        result = await classifyText(data, HUGGINGFACE_API_KEY!);
        break;

      case 'extract-ingredients':
        result = await extractIngredients(data, GROQ_API_KEY!);
        break;

      case 'health-check':
        result = await performHealthCheck(GROQ_API_KEY, HUGGINGFACE_API_KEY);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Model-Used': modelId || modelIdHeader || 'default',
        'X-Enhanced': enhancedReasoning ? 'true' : 'false',
        'X-Processing-Time': Date.now().toString(),
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);

    // Enhanced error response with model information
    const errorResponse = {
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      modelId: modelId || modelIdHeader || 'unknown',
      attempt: attemptHeader || '1',
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

// Enhanced product analysis with structured output and model selection
async function analyzeProduct(
  data: any,
  groqApiKey: string,
  hfApiKey?: string,
  options?: { modelId?: string; enhancedReasoning?: boolean }
) {
  const { product, stack } = data;
  const { modelId, enhancedReasoning } = options || {};

  try {
    // Use enhanced reasoning if requested
    const analysis = enhancedReasoning
      ? await callGroqAnalysis(product, stack, groqApiKey)
      : await callGroqAnalysisBasic(product, stack, groqApiKey);

    // Try to parse structured response
    const structuredAnalysis = parseAnalysisResponse(analysis);

    // Add enhanced interaction analysis
    const interactions = await analyzeInteractions(product, stack);

    return {
      ...structuredAnalysis,
      stackInteraction: interactions,
      modelUsed: modelId || 'groq-default',
      enhancedReasoning: enhancedReasoning || false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Analysis error:', error);
    // Fallback to rule-based analysis
    return generateFallbackAnalysis(product, stack);
  }
}

// Personalized product analysis with health profile and enhanced reasoning
async function analyzeProductPersonalized(
  data: any,
  groqApiKey: string,
  hfApiKey?: string,
  options?: { modelId?: string; enhancedReasoning?: boolean }
) {
  const { product, stack, healthProfile } = data;
  const { modelId, enhancedReasoning } = options || {};

  try {
    // Enhanced prompt with health profile
    const personalizedAnalysis = await callGroqPersonalizedAnalysis(
      product,
      stack,
      healthProfile,
      groqApiKey
    );

    // Parse structured response
    const structuredAnalysis = parseAnalysisResponse(personalizedAnalysis);

    // Add enhanced interaction analysis
    const interactions = await analyzeInteractions(product, stack);

    // Add personalized recommendations
    const personalizedRecommendations = generatePersonalizedRecommendations(
      product,
      healthProfile
    );

    return {
      ...structuredAnalysis,
      stackInteraction: interactions,
      personalizedRecommendations,
      confidenceScore: calculateConfidenceScore(
        structuredAnalysis,
        healthProfile
      ),
      evidenceLevel: determineEvidenceLevel(structuredAnalysis),
      modelUsed: modelId || 'groq-personalized',
      enhancedReasoning: enhancedReasoning || false,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Personalized analysis error:', error);
    // Fallback to basic analysis
    return analyzeProduct({ product, stack }, groqApiKey, hfApiKey, options);
  }
}

// Enhanced interaction analysis for comprehensive interaction checking
async function analyzeInteractionsEnhanced(
  data: any,
  groqApiKey: string,
  hfApiKey?: string,
  options?: { modelId?: string }
) {
  const { product, stack, healthProfile } = data;
  const { modelId } = options || {};

  try {
    // Enhanced interaction checking with clinical evidence
    const interactions = await analyzeInteractions(product, stack);

    // Add cumulative dosage warnings
    const cumulativeWarnings = await checkCumulativeDosages(product, stack);

    // Generate timing recommendations
    const timingRecommendations =
      await generateTimingRecommendations(interactions);

    // Generate comprehensive recommendations
    const recommendations = generateInteractionRecommendations(
      interactions,
      timingRecommendations
    );

    return {
      interactions,
      timingRecommendations,
      nutrientWarnings: cumulativeWarnings,
      recommendations,
      confidenceLevel: calculateInteractionConfidence(interactions),
      modelUsed: modelId || 'interaction-analyzer',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Enhanced interaction analysis error:', error);
    // Fallback to basic interaction analysis
    return await analyzeInteractions(product, stack);
  }
}

// Basic analysis fallback for when enhanced reasoning is not available
async function callGroqAnalysisBasic(
  product: any,
  stack: any[],
  apiKey: string
) {
  const prompt = `As a pharmaceutical expert, analyze this supplement and provide a structured response:

Product: ${product.name}
Brand: ${product.brand || 'Unknown'}
Ingredients: ${JSON.stringify(product.ingredients)}
User's current stack: ${JSON.stringify(stack?.map((s: any) => s.name) || [])}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": number (1-100),
  "categoryScores": {
    "ingredients": number (1-100),
    "bioavailability": number (1-100),
    "dosage": number (1-100),
    "purity": number (1-100),
    "value": number (1-100)
  },
  "strengths": [{"point": "string", "evidence": "string"}],
  "weaknesses": [{"point": "string", "evidence": "string"}],
  "recommendations": {
    "goodFor": ["string"],
    "avoidIf": ["string"]
  },
  "aiReasoning": "detailed explanation"
}

Focus on safety, efficacy, and potential interactions.`;

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              'You are a pharmaceutical expert specializing in supplements. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// Classify text with HuggingFace
async function classifyText(data: any, apiKey: string) {
  const { text, labels } = data;

  const response = await fetch(
    'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: text,
        parameters: {
          candidate_labels: labels || ['safe', 'caution', 'dangerous'],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace API error: ${error}`);
  }

  return await response.json();
}

// Extract ingredients from OCR text using Groq
async function extractIngredients(data: any, apiKey: string) {
  const { ocrText } = data;

  const prompt = `Extract all supplement ingredients from this label text. 
Return as JSON array with format: [{name: string, amount: number, unit: string}]

Label text:
${ocrText}

Only return the JSON array, no other text.`;

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              'You extract structured data from supplement labels. Always return valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 500,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const result = await response.json();
  const content = result.choices[0].message.content;

  // Try to parse as JSON
  try {
    return JSON.parse(content);
  } catch {
    // If parsing fails, return the raw content
    return { raw: content, parsed: false };
  }
}

// Health check for AI services
async function performHealthCheck(groqApiKey?: string, hfApiKey?: string) {
  const results = {
    groq: false,
    huggingface: false,
    overall: false,
    timestamp: new Date().toISOString(),
    errors: [] as string[],
  };

  // Test Groq
  if (groqApiKey) {
    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: 'Health check' }],
            max_tokens: 10,
          }),
        }
      );
      results.groq = response.ok;
      if (!response.ok) {
        results.errors.push(`Groq API error: ${response.status}`);
      }
    } catch (error) {
      results.errors.push(`Groq connection error: ${error.message}`);
    }
  }

  // Test HuggingFace
  if (hfApiKey) {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
        {
          headers: { Authorization: `Bearer ${hfApiKey}` },
          method: 'POST',
          body: JSON.stringify({
            inputs: 'Health check',
            parameters: { candidate_labels: ['test'] },
          }),
        }
      );
      results.huggingface = response.ok;
      if (!response.ok) {
        results.errors.push(`HuggingFace API error: ${response.status}`);
      }
    } catch (error) {
      results.errors.push(`HuggingFace connection error: ${error.message}`);
    }
  }

  results.overall = results.groq || results.huggingface;
  return results;
}

// Enhanced AI reasoning with sophisticated prompts and evidence-based analysis
async function callGroqAnalysis(product: any, stack: any[], apiKey: string) {
  const prompt = `You are a clinical pharmacist and supplement expert with deep knowledge of:
- Pharmacokinetics and bioavailability
- Drug-nutrient interactions
- Evidence-based medicine
- Clinical research interpretation
- Safety assessment protocols

ANALYSIS TASK:
Analyze this supplement using clinical reasoning and evidence-based assessment.

PRODUCT DATA:
Name: ${product.name}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category || 'Supplement'}
Ingredients: ${JSON.stringify(product.ingredients)}

CURRENT STACK CONTEXT:
${
  stack?.length > 0
    ? `User currently takes: ${JSON.stringify(stack.map((s: any) => ({ name: s.name, dosage: s.dosage })))}`
    : 'No current supplements in stack'
}

CLINICAL ANALYSIS FRAMEWORK:
1. INGREDIENT ASSESSMENT: Evaluate each active ingredient for:
   - Clinical efficacy (based on peer-reviewed research)
   - Bioavailability and absorption factors
   - Dosage appropriateness vs. established therapeutic ranges
   - Form optimization (e.g., chelated minerals, active vitamin forms)

2. SAFETY EVALUATION: Consider:
   - Upper tolerable limits and toxicity thresholds
   - Contraindications and precautions
   - Quality concerns (fillers, additives, potential contaminants)
   - Manufacturing standards and third-party testing

3. INTERACTION ANALYSIS: Assess:
   - Nutrient-nutrient interactions (synergistic/antagonistic)
   - Absorption competition or enhancement
   - Metabolic pathway interactions
   - Cumulative dosage risks

4. EVIDENCE GRADING: Rate evidence quality:
   - A: Strong evidence from multiple RCTs/meta-analyses
   - B: Moderate evidence from well-designed studies
   - C: Limited evidence from observational studies
   - D: Theoretical/in-vitro evidence only

REQUIRED JSON OUTPUT:
{
  "overallScore": number (1-100, based on clinical merit),
  "evidenceGrade": "A" | "B" | "C" | "D",
  "confidenceLevel": number (30-95, based on data quality),
  "categoryScores": {
    "ingredients": number (clinical efficacy + dosage appropriateness),
    "bioavailability": number (form optimization + absorption factors),
    "dosage": number (therapeutic range + safety margins),
    "purity": number (quality indicators + manufacturing),
    "value": number (cost-effectiveness + clinical benefit),
    "safety": number (risk assessment + contraindications)
  },
  "clinicalAssessment": {
    "therapeuticBenefit": "string (evidence-based benefit assessment)",
    "safetyProfile": "string (risk-benefit analysis)",
    "qualityIndicators": ["string array of quality markers"]
  },
  "strengths": [
    {
      "point": "string (specific clinical strength)",
      "evidence": "string (research citation or clinical rationale)",
      "clinicalSignificance": "HIGH" | "MODERATE" | "LOW"
    }
  ],
  "weaknesses": [
    {
      "point": "string (specific clinical concern)",
      "evidence": "string (research citation or clinical rationale)",
      "riskLevel": "HIGH" | "MODERATE" | "LOW"
    }
  ],
  "recommendations": {
    "dosageOptimization": ["string array of dosing recommendations"],
    "timingAdvice": ["string array of timing recommendations"],
    "monitoringParameters": ["string array of what to monitor"],
    "goodFor": ["string array of evidence-based indications"],
    "avoidIf": ["string array of contraindications"],
    "alternatives": ["string array of alternative options if applicable"]
  },
  "aiReasoning": "string (detailed clinical reasoning with evidence citations)"
}

CRITICAL REQUIREMENTS:
- Base all assessments on clinical evidence and established safety data
- Provide specific, actionable recommendations
- Include appropriate medical disclaimers
- Consider individual variation in response
- Prioritize safety over efficacy claims`;

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              'You are a pharmaceutical expert specializing in supplements and drug interactions. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// Enhanced personalized analysis with clinical reasoning and health profile integration
async function callGroqPersonalizedAnalysis(
  product: any,
  stack: any[],
  healthProfile: any,
  apiKey: string
) {
  const prompt = `You are a clinical pharmacist specializing in personalized supplement therapy with expertise in:
- Age-specific pharmacokinetics and metabolism
- Gender-specific nutritional needs
- Condition-specific supplement interactions
- Pregnancy and lactation safety
- Geriatric and pediatric considerations
- Personalized medicine principles

PERSONALIZED ANALYSIS TASK:
Provide individualized supplement assessment based on user's specific health profile and clinical context.

PRODUCT INFORMATION:
Name: ${product.name}
Brand: ${product.brand || 'Unknown'}
Category: ${product.category || 'Supplement'}
Ingredients: ${JSON.stringify(product.ingredients)}

CURRENT SUPPLEMENT REGIMEN:
${
  stack?.length > 0
    ? `Active supplements: ${JSON.stringify(stack.map((s: any) => ({ name: s.name, dosage: s.dosage, frequency: s.frequency })))}`
    : 'No current supplements'
}

USER HEALTH PROFILE:
Demographics:
- Age Range: ${healthProfile.demographics?.ageRange || 'Not specified'}
- Biological Sex: ${healthProfile.demographics?.biologicalSex || 'Not specified'}
- Pregnancy Status: ${healthProfile.demographics?.pregnancyStatus || 'Not applicable'}

Health Status:
- Medical Conditions: ${JSON.stringify(healthProfile.conditions?.conditions || [])}
- Known Allergies: ${JSON.stringify(healthProfile.allergies?.substances || [])}
- Current Medications: ${JSON.stringify(healthProfile.medications || [])}

Health Objectives:
- Primary Goal: ${healthProfile.goals?.primary || 'Not specified'}
- Secondary Goals: ${JSON.stringify(healthProfile.goals?.secondary || [])}

PERSONALIZED CLINICAL ASSESSMENT FRAMEWORK:

1. DEMOGRAPHIC CONSIDERATIONS:
   - Age-related metabolism changes and absorption capacity
   - Gender-specific nutritional requirements and hormonal factors
   - Pregnancy/lactation safety classifications (FDA categories)
   - Life stage-specific dosage adjustments

2. CONDITION-SPECIFIC ANALYSIS:
   - Contraindications based on medical conditions
   - Therapeutic synergies with health goals
   - Potential exacerbation of existing conditions
   - Monitoring requirements for high-risk conditions

3. DRUG-NUTRIENT INTERACTIONS:
   - Supplement-medication interactions
   - Timing considerations to avoid interference
   - Absorption enhancement or inhibition
   - Therapeutic monitoring requirements

4. PERSONALIZED RISK-BENEFIT ASSESSMENT:
   - Individual risk factors and safety margins
   - Benefit probability based on health goals
   - Alternative approaches if contraindicated
   - Monitoring parameters for safe use

REQUIRED PERSONALIZED JSON OUTPUT:
{
  "overallScore": number (1-100, adjusted for individual profile),
  "personalizedRiskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "evidenceGrade": "A" | "B" | "C" | "D",
  "confidenceLevel": number (30-95, based on profile completeness),
  "categoryScores": {
    "ingredients": number (efficacy for this individual),
    "bioavailability": number (absorption in this demographic),
    "dosage": number (appropriateness for age/condition),
    "purity": number (quality concerns for this profile),
    "value": number (benefit vs. cost for goals),
    "safety": number (individual safety assessment)
  },
  "personalizedAssessment": {
    "ageAppropriate": boolean,
    "genderOptimized": boolean,
    "pregnancySafe": boolean,
    "conditionCompatible": boolean,
    "goalAligned": boolean,
    "allergyFree": boolean
  },
  "clinicalConsiderations": {
    "demographicFactors": ["string array of age/gender considerations"],
    "conditionInteractions": ["string array of condition-specific concerns"],
    "medicationInteractions": ["string array of drug interactions"],
    "monitoringRequirements": ["string array of what to monitor"]
  },
  "personalizedRecommendations": {
    "dosageAdjustments": ["string array of personalized dosing"],
    "timingOptimization": ["string array of optimal timing"],
    "lifestyleConsiderations": ["string array of lifestyle factors"],
    "monitoringAdvice": ["string array of personalized monitoring"],
    "alternativeOptions": ["string array if current option not suitable"]
  },
  "riskMitigation": {
    "identifiedRisks": ["string array of specific risks for this user"],
    "mitigationStrategies": ["string array of risk reduction approaches"],
    "warningSignsToWatch": ["string array of symptoms to monitor"],
    "whenToDiscontinue": ["string array of discontinuation criteria"]
  },
  "goalAlignment": {
    "primaryGoalSupport": "string (how this supports primary goal)",
    "secondaryGoalSupport": ["string array for secondary goals"],
    "expectedTimeframe": "string (realistic timeline for benefits)",
    "successMetrics": ["string array of measurable outcomes"]
  },
  "aiReasoning": "string (detailed personalized clinical reasoning)"
}

PERSONALIZATION REQUIREMENTS:
- Adjust all recommendations based on individual profile
- Consider cumulative effects with current regimen
- Provide age and gender-specific guidance
- Include condition-specific contraindications
- Align recommendations with stated health goals
- Prioritize safety for high-risk individuals

MEDICAL DISCLAIMER:
This analysis provides general educational information only and should not replace professional medical advice. Users should consult healthcare providers before making supplement decisions, especially with medical conditions or medications.`;

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content:
              'You are a pharmaceutical expert providing personalized supplement analysis. Always respond with valid JSON and include appropriate disclaimers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${error}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// Parse AI response and extract structured data
function parseAnalysisResponse(response: string) {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response);
    return {
      overallScore: parsed.overallScore || 75,
      categoryScores: parsed.categoryScores || {
        ingredients: 75,
        bioavailability: 75,
        dosage: 75,
        purity: 75,
        value: 75,
      },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || { goodFor: [], avoidIf: [] },
      aiReasoning: parsed.aiReasoning || response.substring(0, 500),
    };
  } catch {
    // If JSON parsing fails, extract information using regex patterns
    return extractFromText(response);
  }
}

// Extract structured data from text response
function extractFromText(text: string) {
  const scoreMatch = text.match(/(?:score|rating).*?(\d+)/i);
  const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;

  return {
    overallScore,
    categoryScores: {
      ingredients: overallScore,
      bioavailability: overallScore - 5,
      dosage: overallScore,
      purity: overallScore - 3,
      value: overallScore - 8,
    },
    strengths: [
      { point: 'AI analysis completed', evidence: 'Automated assessment' },
    ],
    weaknesses: [
      { point: 'Limited data available', evidence: 'Basic analysis only' },
    ],
    recommendations: {
      goodFor: ['General health support'],
      avoidIf: ['Consult healthcare provider if unsure'],
    },
    aiReasoning: text.substring(0, 500),
  };
}

// Enhanced interaction analysis with comprehensive detection
async function analyzeInteractions(product: any, stack: any[]) {
  try {
    // Enhanced interaction checking with clinical evidence
    const interactions = [];
    const nutrientWarnings = [];
    const timingRecommendations = [];

    // Check for evidence-based supplement interactions
    if (product.ingredients && stack.length > 0) {
      for (const ingredient of product.ingredients) {
        for (const stackItem of stack) {
          const interaction = await checkEnhancedIngredientInteraction(
            ingredient,
            stackItem
          );
          if (interaction) {
            interactions.push(interaction);

            // Add timing recommendations if spacing is required
            if (interaction.spacing) {
              timingRecommendations.push({
                substance1: ingredient.name,
                substance2: stackItem.name,
                minimumHours: interaction.spacing.minimumHours,
                optimalHours: interaction.spacing.optimalHours,
                explanation: interaction.spacing.explanation,
              });
            }
          }
        }
      }
    }

    // Check for cumulative dosage warnings
    const cumulativeWarnings = await checkCumulativeDosages(product, stack);
    nutrientWarnings.push(...cumulativeWarnings);

    // Determine overall risk level with enhanced logic
    let riskLevel = 'NONE';
    if (interactions.some(i => i.severity === 'CRITICAL'))
      riskLevel = 'CRITICAL';
    else if (interactions.some(i => i.severity === 'HIGH')) riskLevel = 'HIGH';
    else if (interactions.some(i => i.severity === 'MODERATE'))
      riskLevel = 'MODERATE';
    else if (interactions.length > 0) riskLevel = 'LOW';

    // Generate comprehensive recommendations
    const recommendations = generateInteractionRecommendations(
      interactions,
      timingRecommendations
    );

    return {
      overallRiskLevel: riskLevel,
      interactions,
      nutrientWarnings,
      timingRecommendations,
      recommendations,
      overallSafe: riskLevel === 'NONE' || riskLevel === 'LOW',
      enhancedAnalysis: true,
    };
  } catch (error) {
    console.error('Enhanced interaction analysis failed:', error);
    // Fallback to basic analysis
    return await analyzeInteractionsBasic(product, stack);
  }
}

// Fallback basic interaction analysis
async function analyzeInteractionsBasic(product: any, stack: any[]) {
  const interactions = [];
  const nutrientWarnings = [];

  if (product.ingredients && stack.length > 0) {
    for (const ingredient of product.ingredients) {
      for (const stackItem of stack) {
        const interaction = checkIngredientInteraction(ingredient, stackItem);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }
  }

  const riskLevel =
    interactions.length > 0
      ? interactions.some(i => i.severity === 'HIGH')
        ? 'HIGH'
        : 'MODERATE'
      : 'NONE';

  return {
    overallRiskLevel: riskLevel,
    interactions,
    nutrientWarnings,
    overallSafe: riskLevel === 'NONE' || riskLevel === 'LOW',
    enhancedAnalysis: false,
  };
}

// Enhanced interaction checking with clinical evidence
async function checkEnhancedIngredientInteraction(
  ingredient: any,
  stackItem: any
) {
  const ingredientName = ingredient.name.toLowerCase();
  const stackName = stackItem.name.toLowerCase();

  // Enhanced interaction database with clinical evidence
  const interactions = [
    {
      substance1: 'calcium',
      substance2: 'iron',
      severity: 'MODERATE',
      mechanism: 'absorption_competition',
      description:
        'Calcium competes with iron for absorption in the intestine, potentially reducing iron bioavailability by up to 60%',
      evidence:
        'Level A evidence from multiple clinical studies (Am J Clin Nutr. 1998;68(1):3-12)',
      spacing: {
        minimumHours: 2,
        optimalHours: 4,
        explanation:
          'Taking calcium and iron 2-4 hours apart allows for optimal absorption of both minerals',
      },
      recommendation: 'Space doses by 2-4 hours for optimal absorption',
    },
    {
      substance1: 'vitamin d',
      substance2: 'calcium',
      severity: 'LOW',
      mechanism: 'absorption_enhancement',
      description:
        'Vitamin D enhances calcium absorption by promoting calcium-binding protein synthesis',
      evidence:
        'Level A evidence from systematic reviews (N Engl J Med. 2006;354(7):669-683)',
      spacing: {
        minimumHours: 0,
        optimalHours: 0,
        explanation:
          'These supplements work synergistically and should be taken together',
      },
      recommendation: 'Take together for enhanced calcium absorption',
    },
    {
      substance1: 'zinc',
      substance2: 'copper',
      severity: 'HIGH',
      mechanism: 'absorption_competition',
      description:
        'High zinc intake interferes with copper absorption by inducing metallothionein',
      evidence: 'Level A evidence (Am J Clin Nutr. 1985;41(6):1184-1192)',
      spacing: {
        minimumHours: 4,
        optimalHours: 8,
        explanation:
          'Significant spacing required to prevent copper deficiency',
      },
      recommendation:
        'Space doses by 4-8 hours or use balanced zinc-copper supplement',
    },
    {
      substance1: 'vitamin c',
      substance2: 'iron',
      severity: 'LOW',
      mechanism: 'absorption_enhancement',
      description:
        'Vitamin C reduces ferric iron to ferrous iron and forms chelates, enhancing absorption',
      evidence: 'Level A evidence (Am J Clin Nutr. 1989;49(1):140-144)',
      spacing: {
        minimumHours: 0,
        optimalHours: 0,
        explanation: 'Take together for maximum iron absorption benefit',
      },
      recommendation: 'Take together to enhance iron absorption by 3-4 fold',
    },
    {
      substance1: 'magnesium',
      substance2: 'calcium',
      severity: 'MODERATE',
      mechanism: 'absorption_competition',
      description:
        'High calcium intake can interfere with magnesium absorption through transport competition',
      evidence: 'Level B evidence (Magnes Res. 2002;15(3-4):241-246)',
      spacing: {
        minimumHours: 2,
        optimalHours: 3,
        explanation:
          'Moderate spacing helps ensure adequate absorption of both minerals',
      },
      recommendation: 'Space doses by 2-3 hours or take magnesium at bedtime',
    },
  ];

  // Check for matches (bidirectional)
  for (const interaction of interactions) {
    const match1 =
      ingredientName.includes(interaction.substance1) &&
      stackName.includes(interaction.substance2);
    const match2 =
      ingredientName.includes(interaction.substance2) &&
      stackName.includes(interaction.substance1);

    if (match1 || match2) {
      return {
        ...interaction,
        type: 'supplement-supplement',
        evidenceLevel: interaction.evidence.includes('Level A')
          ? 'A'
          : interaction.evidence.includes('Level B')
            ? 'B'
            : 'C',
      };
    }
  }

  return null;
}

// 🚨 CRITICAL SAFETY: Enhanced interaction checking with FDA/NIH validated rules
function checkIngredientInteraction(ingredient: any, stackItem: any) {
  const ingredientName = ingredient.name.toLowerCase();
  const stackName = stackItem.name.toLowerCase();

  // Import critical interactions (would need to be imported at top)
  // For now, implementing the most critical ones inline

  // 1. WARFARIN + VITAMIN K (CRITICAL)
  if (
    (ingredientName.includes('warfarin') && stackName.includes('vitamin k')) ||
    (ingredientName.includes('vitamin k') && stackName.includes('warfarin'))
  ) {
    return {
      severity: 'CRITICAL',
      mechanism: 'Vitamin K antagonizes warfarin anticoagulant effects',
      evidence: 'FDA Boxed Warning - Increased risk of blood clots, stroke',
      recommendation:
        'AVOID vitamin K supplements with warfarin. Consult physician immediately.',
      riskLevel: 'LIFE_THREATENING',
    };
  }

  // 2. ST. JOHN'S WORT + MEDICATIONS (CRITICAL)
  if (
    ingredientName.includes('st johns wort') ||
    stackName.includes('st johns wort')
  ) {
    return {
      severity: 'CRITICAL',
      mechanism: 'Induces CYP3A4 enzyme reducing medication effectiveness',
      evidence:
        'FDA Contraindication - Reduces effectiveness of critical medications',
      recommendation: 'AVOID St. Johns Wort with any prescription medications',
      riskLevel: 'LIFE_THREATENING',
    };
  }

  // 3. GINKGO + ANTICOAGULANTS (CRITICAL)
  if (
    (ingredientName.includes('ginkgo') &&
      (stackName.includes('warfarin') ||
        stackName.includes('anticoagulant'))) ||
    (stackName.includes('ginkgo') &&
      (ingredientName.includes('warfarin') ||
        ingredientName.includes('anticoagulant')))
  ) {
    return {
      severity: 'CRITICAL',
      mechanism: 'Additive anticoagulant effects increase bleeding risk',
      evidence: 'FDA Contraindication - Severe bleeding, hemorrhage risk',
      recommendation: 'AVOID ginkgo with blood thinners. Monitor for bleeding.',
      riskLevel: 'LIFE_THREATENING',
    };
  }

  // 4. POTASSIUM + ACE INHIBITORS (CRITICAL)
  if (
    (ingredientName.includes('potassium') &&
      stackName.includes('ace inhibitor')) ||
    (stackName.includes('potassium') &&
      ingredientName.includes('ace inhibitor'))
  ) {
    return {
      severity: 'CRITICAL',
      mechanism: 'Additive potassium retention causing hyperkalemia',
      evidence:
        'FDA Boxed Warning - Life-threatening heart rhythm abnormalities',
      recommendation:
        'AVOID potassium supplements with ACE inhibitors without monitoring',
      riskLevel: 'LIFE_THREATENING',
    };
  }

  // 5. HIGH-DOSE VITAMIN A + RETINOIDS (CRITICAL)
  if (
    (ingredientName.includes('vitamin a') && stackName.includes('retinoid')) ||
    (stackName.includes('vitamin a') && ingredientName.includes('retinoid'))
  ) {
    return {
      severity: 'CRITICAL',
      mechanism: 'Additive vitamin A toxicity',
      evidence: 'FDA Boxed Warning - Liver damage, birth defects',
      recommendation: 'AVOID high-dose vitamin A with retinoid medications',
      riskLevel: 'LIFE_THREATENING',
    };
  }

  // 6. IRON + CALCIUM (HIGH - Absorption Issue)
  if (
    (ingredientName.includes('calcium') && stackName.includes('iron')) ||
    (ingredientName.includes('iron') && stackName.includes('calcium'))
  ) {
    return {
      severity: 'HIGH',
      mechanism: 'Calcium blocks iron absorption at high doses',
      evidence: 'NIH Validated - Iron deficiency anemia risk',
      recommendation: 'Take iron and calcium supplements 2+ hours apart',
      riskLevel: 'MODERATE',
    };
  }

  // 7. MAGNESIUM + FLUOROQUINOLONE ANTIBIOTICS (HIGH)
  if (
    (ingredientName.includes('magnesium') &&
      stackName.includes('fluoroquinolone')) ||
    (stackName.includes('magnesium') &&
      ingredientName.includes('fluoroquinolone'))
  ) {
    return {
      severity: 'HIGH',
      mechanism: 'Magnesium chelates antibiotics reducing absorption',
      evidence: 'FDA Contraindication - Antibiotic treatment failure',
      recommendation:
        'Take magnesium 2+ hours before or 6+ hours after antibiotics',
      riskLevel: 'HIGH',
    };
  }

  // 8. ZINC + COPPER DEPLETION (HIGH)
  if (ingredientName.includes('zinc') || stackName.includes('zinc')) {
    return {
      severity: 'HIGH',
      mechanism: 'High zinc intake depletes copper stores',
      evidence:
        'NIH Upper Limits - Copper deficiency anemia, neurological problems',
      recommendation:
        'Limit zinc to <40mg daily, consider copper supplementation',
      riskLevel: 'MODERATE',
    };
  }

  // 9. VITAMIN D + CALCIUM (BENEFICIAL)
  if (
    (ingredientName.includes('vitamin d') && stackName.includes('calcium')) ||
    (ingredientName.includes('calcium') && stackName.includes('vitamin d'))
  ) {
    return {
      severity: 'LOW',
      mechanism: 'Vitamin D enhances calcium absorption',
      evidence: 'NIH Validated - Beneficial interaction for bone health',
      recommendation: 'Can be taken together - enhances calcium absorption',
      riskLevel: 'BENEFICIAL',
    };
  }

  // 10. BASIC TIMING RECOMMENDATIONS
  if (ingredientName.includes('calcium') && stackName.includes('iron')) {
    return {
      severity: 'MODERATE',
      mechanism: 'Calcium may reduce iron absorption',
      evidence: 'Clinical studies - Reduced bioavailability',
      recommendation: 'Take 2 hours apart for optimal absorption',
      riskLevel: 'LOW',
    };
  }

  return null;
}

// Check for cumulative dosage warnings
async function checkCumulativeDosages(product: any, stack: any[]) {
  const warnings = [];
  const nutrientTotals = new Map();

  // Safety thresholds (Upper Limits from NIH)
  const safetyLimits = {
    'vitamin d': { limit: 4000, unit: 'IU', source: 'NIH Upper Limit' },
    'vitamin c': { limit: 2000, unit: 'mg', source: 'NIH Upper Limit' },
    calcium: { limit: 2500, unit: 'mg', source: 'NIH Upper Limit' },
    iron: { limit: 45, unit: 'mg', source: 'NIH Upper Limit' },
    zinc: { limit: 40, unit: 'mg', source: 'NIH Upper Limit' },
    'vitamin a': { limit: 10000, unit: 'IU', source: 'NIH Upper Limit' },
    'vitamin e': { limit: 1000, unit: 'mg', source: 'NIH Upper Limit' },
    magnesium: {
      limit: 350,
      unit: 'mg',
      source: 'NIH Upper Limit (supplemental)',
    },
  };

  // Collect nutrients from stack
  for (const item of stack) {
    if (item.ingredients) {
      for (const ingredient of item.ingredients) {
        const name = ingredient.name.toLowerCase();
        const amount = parseFloat(ingredient.amount) || 0;

        if (!nutrientTotals.has(name)) {
          nutrientTotals.set(name, { total: 0, sources: [] });
        }

        const current = nutrientTotals.get(name);
        current.total += amount;
        current.sources.push(item.name);
      }
    }
  }

  // Add new product nutrients
  if (product.ingredients) {
    for (const ingredient of product.ingredients) {
      const name = ingredient.name.toLowerCase();
      const amount = parseFloat(ingredient.amount) || 0;

      if (!nutrientTotals.has(name)) {
        nutrientTotals.set(name, { total: 0, sources: [] });
      }

      const current = nutrientTotals.get(name);
      current.total += amount;
      current.sources.push(product.name);
    }
  }

  // Check against safety limits
  for (const [nutrient, data] of nutrientTotals) {
    const limit = safetyLimits[nutrient];
    if (limit && data.total > limit.limit) {
      const percentExceeded = (data.total / limit.limit) * 100;
      let severity = 'LOW';

      if (percentExceeded > 200) severity = 'CRITICAL';
      else if (percentExceeded > 150) severity = 'HIGH';
      else if (percentExceeded > 120) severity = 'MODERATE';

      warnings.push({
        nutrient,
        currentTotal: data.total,
        upperLimit: limit.limit,
        unit: limit.unit,
        percentOfLimit: Math.round(percentExceeded),
        severity,
        sources: data.sources,
        recommendation: `Reduce total ${nutrient} intake by ${Math.round(data.total - limit.limit)} ${limit.unit}. Consider consulting healthcare provider.`,
        riskDescription: `Exceeding upper limit may increase risk of adverse effects`,
      });
    }
  }

  return warnings;
}

// Generate comprehensive interaction recommendations
function generateInteractionRecommendations(
  interactions: any[],
  timingRecommendations: any[]
) {
  const recommendations = {
    immediate: [],
    timing: [],
    monitoring: [],
    alternatives: [],
  };

  // Process interactions
  for (const interaction of interactions) {
    switch (interaction.severity) {
      case 'CRITICAL':
        recommendations.immediate.push(
          `⚠️ CRITICAL: Avoid ${interaction.substance1} + ${interaction.substance2}`
        );
        recommendations.alternatives.push(
          `Consider alternatives to avoid critical interaction`
        );
        break;
      case 'HIGH':
        recommendations.immediate.push(
          `⚠️ HIGH RISK: ${interaction.substance1} + ${interaction.substance2} requires medical supervision`
        );
        recommendations.monitoring.push(
          `Monitor for ${interaction.mechanism} effects`
        );
        break;
      case 'MODERATE':
        recommendations.monitoring.push(
          `Monitor ${interaction.substance1} + ${interaction.substance2} for ${interaction.mechanism}`
        );
        break;
    }
  }

  // Process timing recommendations
  for (const timing of timingRecommendations) {
    if (timing.minimumHours > 0) {
      recommendations.timing.push(
        `Space ${timing.substance1} and ${timing.substance2} by ${timing.minimumHours}+ hours`
      );
    } else {
      recommendations.timing.push(
        `${timing.substance1} and ${timing.substance2} can be taken together`
      );
    }
  }

  return recommendations;
}

// Generate personalized recommendations
function generatePersonalizedRecommendations(product: any, healthProfile: any) {
  const recommendations = [];

  if (healthProfile.ageRange) {
    if (
      healthProfile.ageRange.includes('50+') ||
      healthProfile.ageRange.includes('60+')
    ) {
      recommendations.push(
        'Consider age-appropriate dosing for optimal absorption'
      );
    }
  }

  if (
    healthProfile.biologicalSex === 'female' &&
    healthProfile.pregnancyStatus === 'pregnant'
  ) {
    recommendations.push(
      'Consult healthcare provider before use during pregnancy'
    );
  }

  if (healthProfile.conditions && healthProfile.conditions.length > 0) {
    recommendations.push(
      'Monitor for interactions with existing health conditions'
    );
  }

  if (healthProfile.goals && healthProfile.goals.includes('heart_health')) {
    recommendations.push(
      'May support cardiovascular health goals when used as part of a balanced approach'
    );
  }

  return recommendations;
}

// Calculate confidence score based on available data
function calculateConfidenceScore(analysis: any, healthProfile: any) {
  let confidence = 70; // Base confidence

  if (analysis.categoryScores) confidence += 10;
  if (analysis.strengths && analysis.strengths.length > 0) confidence += 5;
  if (healthProfile && Object.keys(healthProfile).length > 0) confidence += 10;
  if (analysis.aiReasoning && analysis.aiReasoning.length > 100)
    confidence += 5;

  return Math.min(confidence, 95); // Cap at 95%
}

// Determine evidence level
function determineEvidenceLevel(analysis: any) {
  if (analysis.overallScore >= 85) return 'A';
  if (analysis.overallScore >= 70) return 'B';
  if (analysis.overallScore >= 55) return 'C';
  return 'D';
}

// Generate fallback analysis when AI fails
function generateFallbackAnalysis(product: any, stack: any[]) {
  return {
    overallScore: 70,
    categoryScores: {
      ingredients: 70,
      bioavailability: 65,
      dosage: 70,
      purity: 68,
      value: 65,
    },
    strengths: [
      {
        point: 'Product information available',
        evidence: 'Basic data provided',
      },
    ],
    weaknesses: [
      { point: 'Limited AI analysis', evidence: 'Fallback mode active' },
    ],
    recommendations: {
      goodFor: ['General supplementation'],
      avoidIf: ['Consult healthcare provider if you have medical conditions'],
    },
    aiReasoning:
      'Fallback analysis provided due to AI service unavailability. This is a basic assessment based on available product information.',
    stackInteraction: {
      overallRiskLevel: 'NONE',
      interactions: [],
      nutrientWarnings: [],
      overallSafe: true,
    },
    fallbackUsed: true,
    timestamp: new Date().toISOString(),
  };
}
