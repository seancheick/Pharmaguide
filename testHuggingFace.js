// testHuggingFace.js
// Finalized test script for HuggingFace API with your provided API key, and adds Groq test.

// Your Hugging Face API key is embedded directly here.
const HF_API_KEY = 'API';

// !!! IMPORTANT: ADD YOUR GROQ API KEY HERE FOR TESTING GROQ MODELS !!!
// This is a placeholder, ensure you have a real Groq API key from console.groq.com
const GROQ_API_KEY = 'API'; // Replace with your actual Groq API key

async function testConnectionAndModels() {
  console.log('🚀 Starting API Tests (HuggingFace & Groq)\n');
  console.log(
    'HuggingFace API Key:',
    'hf_' + '*'.repeat(HF_API_KEY.length - 3)
  );
  console.log(
    'Groq API Key:',
    GROQ_API_KEY.startsWith('gsk_')
      ? 'gsk_' + '*'.repeat(GROQ_API_KEY.length - 4)
      : GROQ_API_KEY
  );
  console.log('=' + '='.repeat(50) + '\n');

  // --- Helper function for making HuggingFace API calls ---
  async function makeHfApiCall(
    modelName,
    payload,
    modelType = 'text-generation'
  ) {
    const endpoint = `https://api-inference.huggingface.co/models/${modelName}`;
    let displayOutput = '';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ HF: ${modelName} - Working!`);
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0]?.generated_text === 'string')
            displayOutput = data[0].generated_text.substring(0, 70) + '...';
          else if (typeof data[0] === 'number')
            displayOutput = `[${data[0].toFixed(3)}, ${
              data[1]?.toFixed(3) || ''
            }, ...]`;
          else displayOutput = JSON.stringify(data).substring(0, 70) + '...';
        } else if (typeof data?.generated_text === 'string') {
          displayOutput = data.generated_text.substring(0, 70) + '...';
        } else if (typeof data === 'object' && data !== null) {
          displayOutput = JSON.stringify(data).substring(0, 70) + '...';
        } else {
          displayOutput = String(data).substring(0, 70) + '...';
        }
        console.log('   Output:', displayOutput);
        return true;
      } else {
        const errorText = await response.text();
        console.log(`❌ HF: ${modelName} - Failed: ${response.status}`);
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.estimated_time)
            console.log(
              `   ⏳ Model loading, estimated time: ${errorData.estimated_time}s`
            );
          console.log(`   Error: ${errorData.error || errorText}`);
        } catch (e) {
          console.log(`   Error: ${errorText.substring(0, 100)}...`);
        }
        return false;
      }
    } catch (error) {
      console.log(
        `❌ HF: ${modelName} - Network/Fetch Error: ${error.message}`
      );
      return false;
    }
  }

  // --- Helper function for making Groq API calls ---
  async function makeGroqApiCall(modelName, payload) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'gsk_xxxxxxx') {
      console.log(`⚠️ Groq: ${modelName} - Skipped (Groq API Key not set).`);
      return false;
    }
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: payload.messages,
          temperature: payload.temperature || 0.7,
          max_tokens: payload.max_tokens || 100,
          stream: false, // For simple test, not streaming
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedText = data.choices[0]?.message?.content;
        console.log(`✅ Groq: ${modelName} - Working!`);
        console.log('   Output:', generatedText?.substring(0, 70) + '...');
        return true;
      } else {
        const errorText = await response.text();
        console.log(`❌ Groq: ${modelName} - Failed: ${response.status}`);
        console.log('   Error:', errorText);
        return false;
      }
    } catch (error) {
      console.log(
        `❌ Groq: ${modelName} - Network/Fetch Error: ${error.message}`
      );
      return false;
    }
  }

  // --- Test Cases ---

  // 1. Hugging Face Classification & Embeddings (These consistently worked)
  console.log('\n--- Hugging Face Classification & Embeddings Tests ---\n');

  await makeHfApiCall(
    'facebook/bart-large-mnli',
    {
      inputs: 'This product contains iron.',
      parameters: { candidate_labels: ['supplement', 'food', 'medical'] },
    },
    'zero-shot-classification'
  );

  await makeHfApiCall(
    'typeform/distilbert-base-uncased-mnli',
    {
      inputs: 'Is this safe for children?',
      parameters: { candidate_labels: ['yes', 'no', 'consult doctor'] },
    },
    'zero-shot-classification'
  );

  await makeHfApiCall(
    'sentence-transformers/all-MiniLM-L6-v2',
    {
      inputs: ['Generate embedding for this sentence.', 'Another sentence.'], // CORRECTED PAYLOAD
    },
    'feature-extraction'
  );

  // 2. Hugging Face Text Generation & Conversational (Expect 404s on free tier for most)
  console.log(
    '\n--- Hugging Face Text Generation & Conversational Tests (Expect 404s for most on free tier) ---\n'
  );

  const hfTextModelsToTest = [
    'gpt2',
    'distilgpt2',
    'google/flan-t5-small', // Smaller version
    'microsoft/DialoGPT-small', // Smaller version
    // "microsoft/DialoGPT-medium", // Often too large for free tier
    // "facebook/blenderbot-400M-distill", // Often too large for free tier
    // "google/flan-t5-base", // Often too large for free tier
    // "bigscience/bloom-560m", // Often too large for free tier
    // "EleutherAI/gpt-neo-125M", // Often fails with 404/503
  ];

  for (const modelName of hfTextModelsToTest) {
    await makeHfApiCall(modelName, {
      inputs: `Hello, what is ${modelName}?`,
      parameters: { max_new_tokens: 20 },
    });
  }

  // 3. Groq Text Generation Tests (High expectation of success)
  console.log('\n--- Groq Text Generation Tests ---\n');

  const groqModelsToTest = [
    'llama3-8b-8192', // Your FAST model
    'mixtral-8x7b-32768', // Your BALANCED model
  ];

  for (const modelName of groqModelsToTest) {
    await makeGroqApiCall(modelName, {
      messages: [
        {
          role: 'user',
          content: 'Explain the benefits of Vitamin C in one sentence.',
        },
      ],
      max_tokens: 50,
    });
  }

  console.log('\n' + '='.repeat(50));
  console.log('🏁 All API tests completed!');
  console.log('\nSummary:');
  console.log('  - Hugging Face Classification/Embeddings: Likely working.');
  console.log(
    '  - Hugging Face Text Generation/Conversational: Highly likely to fail (404/503) on free tier.'
  );
  console.log(
    '  - Groq Text Generation: Should be very reliable if key is valid.'
  );
  console.log('\nNext Steps for your app:');
  console.log(
    '1. **Crucial:** Ensure you have a valid `EXPO_PUBLIC_GROQ_API_KEY` in your `.env` file.'
  );
  console.log(
    '2. Adjust your `aiChatService` to use `GroqService` for general chat/text generation.'
  );
  console.log(
    '3. Keep `huggingfaceService` for classification (e.g., ingredient analysis) as it works.'
  );
}

// Run the tests
testConnectionAndModels().catch(console.error);
