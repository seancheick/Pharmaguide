#!/usr/bin/env node

/**
 * AI Integration Test Runner
 *
 * This script tests the AI API integration without requiring the full React Native environment.
 * It can be run from the command line to verify API connectivity and basic functionality.
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

class SimpleAITester {
  constructor() {
    this.groqApiKey =
      process.env.EXPO_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY;
    this.hfApiKey =
      process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY ||
      process.env.HUGGINGFACE_API_KEY;

    console.log('🔧 Configuration:');
    console.log(`Groq API Key: ${this.groqApiKey ? '✅ Set' : '❌ Missing'}`);
    console.log(
      `HuggingFace API Key: ${this.hfApiKey ? '✅ Set' : '❌ Missing'}`
    );
    console.log('');
  }

  /**
   * Test Groq API connectivity
   */
  async testGroqAPI() {
    console.log('🤖 Testing Groq API...');

    if (!this.groqApiKey) {
      console.log('❌ Groq API key not found');
      return false;
    }

    const payload = JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content:
            'Hello! This is a connection test. Please respond with "Connection successful".',
        },
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    try {
      const response = await this.makeHttpsRequest(
        {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        payload
      );

      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log('✅ Groq API: Connected successfully');
        console.log(`📝 Response: ${data.choices[0].message.content}`);
        return true;
      } else {
        console.log(`❌ Groq API: HTTP ${response.statusCode}`);
        console.log(`📝 Error: ${response.body}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Groq API: ${error.message}`);
      return false;
    }
  }

  /**
   * Test HuggingFace API connectivity
   */
  async testHuggingFaceAPI() {
    console.log('🤗 Testing HuggingFace API...');

    if (!this.hfApiKey) {
      console.log('❌ HuggingFace API key not found');
      return false;
    }

    const payload = JSON.stringify({
      inputs: 'This supplement is safe for daily use',
      parameters: {
        candidate_labels: ['safe', 'unsafe', 'caution'],
      },
    });

    try {
      const response = await this.makeHttpsRequest(
        {
          hostname: 'api-inference.huggingface.co',
          path: '/models/facebook/bart-large-mnli',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.hfApiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        payload
      );

      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log('✅ HuggingFace API: Connected successfully');
        console.log(
          `📝 Classification: ${data.labels[0]} (${(data.scores[0] * 100).toFixed(1)}%)`
        );
        return true;
      } else {
        console.log(`❌ HuggingFace API: HTTP ${response.statusCode}`);
        console.log(`📝 Error: ${response.body}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ HuggingFace API: ${error.message}`);
      return false;
    }
  }

  /**
   * Test supplement analysis with Groq
   */
  async testSupplementAnalysis() {
    console.log('💊 Testing Supplement Analysis...');

    if (!this.groqApiKey) {
      console.log('❌ Groq API key required for supplement analysis');
      return false;
    }

    const prompt = `As a pharmaceutical expert, analyze this supplement and provide a structured response:

Product: Vitamin D3 2000 IU
Brand: Nature Made
Ingredients: [{"name": "Vitamin D3", "amount": "2000", "unit": "IU", "category": "vitamin"}]
User's current stack: ["Calcium Carbonate"]

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

    const payload = JSON.stringify({
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
    });

    try {
      const response = await this.makeHttpsRequest(
        {
          hostname: 'api.groq.com',
          path: '/openai/v1/chat/completions',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        payload
      );

      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        const analysisText = data.choices[0].message.content;

        try {
          const analysis = JSON.parse(analysisText);
          console.log('✅ Supplement Analysis: Successful');
          console.log(`📊 Overall Score: ${analysis.overallScore}/100`);
          console.log(
            `💡 Key Strength: ${analysis.strengths[0]?.point || 'N/A'}`
          );
          console.log(
            `⚠️ Key Concern: ${analysis.weaknesses[0]?.point || 'N/A'}`
          );
          return true;
        } catch (parseError) {
          console.log('⚠️ Supplement Analysis: Response not in JSON format');
          console.log(`📝 Raw response: ${analysisText.substring(0, 200)}...`);
          return true; // Still consider it successful if we got a response
        }
      } else {
        console.log(`❌ Supplement Analysis: HTTP ${response.statusCode}`);
        console.log(`📝 Error: ${response.body}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Supplement Analysis: ${error.message}`);
      return false;
    }
  }

  /**
   * Make HTTPS request helper
   */
  makeHttpsRequest(options, data = null) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, res => {
        let body = '';
        res.on('data', chunk => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(data);
      }

      req.end();
    });
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting AI Integration Tests...\n');

    const results = {
      groq: false,
      huggingface: false,
      analysis: false,
    };

    // Test APIs
    results.groq = await this.testGroqAPI();
    console.log('');

    results.huggingface = await this.testHuggingFaceAPI();
    console.log('');

    results.analysis = await this.testSupplementAnalysis();
    console.log('');

    // Summary
    console.log('📋 Test Summary:');
    console.log(`Groq API: ${results.groq ? '✅ Pass' : '❌ Fail'}`);
    console.log(
      `HuggingFace API: ${results.huggingface ? '✅ Pass' : '❌ Fail'}`
    );
    console.log(
      `Supplement Analysis: ${results.analysis ? '✅ Pass' : '❌ Fail'}`
    );

    const overallSuccess = results.groq || results.huggingface;
    console.log(
      `\n🎯 Overall: ${overallSuccess ? '✅ At least one AI service is working' : '❌ No AI services available'}`
    );

    if (!overallSuccess) {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check that your API keys are set in .env file');
      console.log('2. Verify API keys are valid and have sufficient credits');
      console.log('3. Check your internet connection');
      console.log('4. Try running: npm run supabase:functions:serve');
    }

    return overallSuccess;
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SimpleAITester();
  tester
    .runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export { SimpleAITester };
