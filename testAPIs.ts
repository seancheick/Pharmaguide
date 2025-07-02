// testAPIs.ts - Updated to use environment variables
import {
  USDA_API_KEY,
  PUBMED_API_KEY,
  DSLD_API_KEY,
  FDA_API_KEY,
  FOODREPO_API_KEY
} from '@env';
import axios from 'axios';

// API Configuration using environment variables
const API_CONFIGS = [
  {
    name: 'USDA FoodData Central',
    baseURL: 'https://api.nal.usda.gov/fdc/v1',
    apiKey: USDA_API_KEY,
    authMethod: 'query' as const,
    testEndpoint: '/foods/search?query=vitamin&pageSize=1'
  },
  {
    name: 'PubMed E-utilities',
    baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
    apiKey: PUBMED_API_KEY,
    authMethod: 'query' as const,
    testEndpoint: '/esearch.fcgi?db=pubmed&term=warfarin+vitamin+k&retmode=json&retmax=1'
  },
  {
    name: 'DSLD (Dietary Supplement Label Database)',
    baseURL: 'https://api.ods.od.nih.gov/dsld/v8',
    apiKey: DSLD_API_KEY,
    authMethod: 'header' as const,
    headers: {
      'X-Api-Key': DSLD_API_KEY
    },
    testEndpoint: '/ingredient_search?ingredient_text=vitamin'
  },
  {
    name: 'FDA openFDA',
    baseURL: 'https://api.fda.gov',
    apiKey: FDA_API_KEY,
    authMethod: 'query' as const,
    testEndpoint: '/drug/event.json?limit=1'
  },
  {
    name: 'FoodRepo',
    baseURL: 'https://www.foodrepo.org/api/v3',
    apiKey: FOODREPO_API_KEY,
    authMethod: 'header' as const,
    headers: {
      'Authorization': `Token token="${FOODREPO_API_KEY}"`
    },
    testEndpoint: '/products?page_size=1'
  }
];

// Simple test function for React Native
export async function testAllAPIs() {
  console.log('🚀 Testing PharmaGuide APIs...\n');
  
  for (const config of API_CONFIGS) {
    try {
      console.log(`Testing ${config.name}...`);
      
      let url = `${config.baseURL}${config.testEndpoint}`;
      const headers = { ...config.headers };
      
      if (config.authMethod === 'query') {
        const separator = config.testEndpoint.includes('?') ? '&' : '?';
        url += `${separator}api_key=${config.apiKey}`;
      }
      
      const response = await axios.get(url, { headers, timeout: 10000 });
      
      console.log(`✅ ${config.name} - SUCCESS (Status: ${response.status})`);
      
    } catch (error: any) {
      console.log(`❌ ${config.name} - FAILED`);
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTest complete!');
}