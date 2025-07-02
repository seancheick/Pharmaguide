// enhancedApiTest.js
// Run: node enhancedApiTest.js

const axios = require('axios');

// IMPORTANT: Replace these with your actual API keys.
// In a real application, these should be loaded from environment variables
// (e.g., process.env.USDA_API_KEY) and NEVER hardcoded in source control.
const APIs = {
  USDA: {
    key: 'I86PVaAa89qUOK3QbbE3me8HALMGON6rCwq3hIPL', // Your USDA key
    baseURL: 'https://api.nal.usda.gov/fdc/v1',
  },
  PubMed: {
    key: 'cb741b87b6c19c3b9dce4dd57e3b34068508', // Your PubMed key
    baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
  },
  FDA: {
    key: 'tVkz3lBy3NFZLkzh7erC6xrwqmeyEc0lARGBzCeF', // Your FDA key
    baseURL: 'https://api.fda.gov',
  },
  DSLD: {
    key: 'DH7lozDgSydZKcARpe34DIq7V2gYcsAOoNMgTjnx', // Your DSLD key
    baseURL: 'https://api.ods.od.nih.gov/dsld/v9',
  },
  OpenFoodFacts: {
    baseURL:
      process.env.NODE_ENV === 'development'
        ? 'https://world.openfoodfacts.net/api/v2'
        : 'https://world.openfoodfacts.org/api/v2',
  },
};

// Define a default User-Agent for all requests as good practice
const DEFAULT_USER_AGENT = 'PharmaGuide/1.0 (contact@pharmaguide.com)';

// Helper function for clean output
function logSection(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`📋 ${title}`);
  console.log('='.repeat(60));
}

// Helper to show sample data concisely
function showSample(data, fields) {
  if (!data || !data._source || (data.hits && data.hits.length === 0)) {
    console.log('    No sample data available.');
    return;
  }
  const sample = {};
  fields.forEach(field => {
    if (data._source[field] !== undefined) {
      sample[field] = data._source[field];
    }
  });
  console.log('    Sample data:', JSON.stringify(sample, null, 2));
}

// Helper for consistent error logging
function logError(apiName, error) {
  console.log(`❌ ${apiName} Error: ${error.message}`);
  if (error.response) {
    console.log(`    Status: ${error.response.status}`);
    console.log(
      `    Response data: ${JSON.stringify(error.response.data || {}).substring(0, 500)}...`
    );
  } else if (error.request) {
    console.log(
      '    No response received. Request was made but no response from server.'
    );
  } else {
    console.log(
      '    Error setting up request (client-side issue):',
      error.message
    );
  }
}

async function testAPIs() {
  console.log('🧪 ENHANCED PharmaGuide API Testing Suite');
  console.log(
    'Testing all endpoints with real medication/supplement examples\n'
  );

  // ========== USDA TESTS ==========
  logSection('USDA FoodData Central');

  try {
    console.log('\n1️⃣ Searching for Vitamin D supplements:');
    const usdaSearch = await axios.get(`${APIs.USDA.baseURL}/foods/search`, {
      params: {
        api_key: APIs.USDA.key,
        query: 'vitamin d supplement',
        pageSize: 3,
      },
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(`✅ Found ${usdaSearch.data.totalHits} products`);
    if (usdaSearch.data.foods && usdaSearch.data.foods[0]) {
      const food = usdaSearch.data.foods[0];
      showSample({ _source: food }, [
        'description',
        'brandName',
        'gtinUpc',
        'fdcId',
      ]);
    }

    if (usdaSearch.data.foods && usdaSearch.data.foods[0]) {
      console.log('\n2️⃣ Getting detailed nutrition for first result:');
      const fdcId = usdaSearch.data.foods[0].fdcId;
      const details = await axios.get(`${APIs.USDA.baseURL}/food/${fdcId}`, {
        params: { api_key: APIs.USDA.key },
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
        },
      });
      console.log(`✅ Retrieved details for: ${details.data.description}`);
      if (details.data.foodNutrients && details.data.foodNutrients.length > 0) {
        console.log(
          `    Contains ${details.data.foodNutrients.length} nutrients`
        );
        const vitD = details.data.foodNutrients.find(n =>
          n.nutrient.name.includes('Vitamin D')
        );
        if (vitD) {
          console.log(
            `    Vitamin D: ${vitD.amount} ${vitD.nutrient.unitName}`
          );
        }
      }
    }
  } catch (e) {
    logError('USDA', e);
  }

  // ========== FDA TESTS ==========
  logSection('FDA openFDA');

  try {
    console.log('\n1️⃣ Searching for Warfarin adverse events:');
    const fdaEvents = await axios.get(`${APIs.FDA.baseURL}/drug/event.json`, {
      params: {
        api_key: APIs.FDA.key,
        search: 'patient.drug.openfda.generic_name:"warfarin"',
        limit: 3,
      },
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(`✅ Found ${fdaEvents.data.meta.results.total} total events`);
    if (fdaEvents.data.results && fdaEvents.data.results[0]) {
      const event = fdaEvents.data.results[0];
      console.log(`    Most recent event date: ${event.receiptdate}`);
      if (event.patient.reaction) {
        const reactions = Array.isArray(event.patient.reaction)
          ? event.patient.reaction
          : [event.patient.reaction];
        console.log(
          `    Reactions: ${reactions
            .slice(0, 3)
            .map(r => r.reactionmeddrapt)
            .join(', ')}`
        );
      }
    }

    console.log('\n2️⃣ Searching for Warfarin drug label (interactions):');
    const fdaLabel = await axios.get(`${APIs.FDA.baseURL}/drug/label.json`, {
      params: {
        api_key: APIs.FDA.key,
        search: 'openfda.generic_name:"warfarin" AND drug_interactions:*',
        limit: 1,
      },
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(`✅ Found ${fdaLabel.data.meta.results.total} drug labels`);
    if (fdaLabel.data.results && fdaLabel.data.results[0]) {
      const label = fdaLabel.data.results[0];
      console.log(`    Product: ${label.openfda.brand_name?.[0] || 'Generic'}`);
      if (label.drug_interactions) {
        console.log(`    ⚠️  Drug interactions section found!`);
        console.log(
          `    Preview: ${label.drug_interactions[0].substring(0, 200)}...`
        );
      }
      if (label.warnings) {
        console.log(`    ⚠️  Warnings section found!`);
      }
    }

    console.log('\n3️⃣ Searching for statin medications:');
    const statins = await axios.get(`${APIs.FDA.baseURL}/drug/label.json`, {
      params: {
        api_key: APIs.FDA.key,
        search: 'openfda.pharm_class_epc:"HMG-CoA Reductase Inhibitor [EPC]"',
        limit: 5,
      },
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(`✅ Found ${statins.data.meta.results.total} statin drugs`);
    if (statins.data.results) {
      const statinNames = statins.data.results
        .map(r => r.openfda.generic_name?.[0])
        .filter(Boolean)
        .slice(0, 5);
      console.log(`    Examples: ${statinNames.join(', ')}`);
    }
  } catch (e) {
    logError('FDA', e);
  }

  // ========== PubMed TESTS ==========
  logSection('PubMed Medical Literature');

  try {
    console.log('\n1️⃣ Searching for Warfarin + Vitamin K interaction studies:');
    const pubmedSearch = await axios.get(
      `${APIs.PubMed.baseURL}/esearch.fcgi`,
      {
        params: {
          db: 'pubmed',
          term: 'warfarin vitamin k interaction',
          retmode: 'json',
          retmax: 5,
          api_key: APIs.PubMed.key,
        },
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
        },
      }
    );
    const count = pubmedSearch.data.esearchresult.count;
    console.log(`✅ Found ${count} research articles`);

    if (
      pubmedSearch.data.esearchresult.idlist &&
      pubmedSearch.data.esearchresult.idlist.length > 0
    ) {
      const pmids = pubmedSearch.data.esearchresult.idlist;
      console.log(`    PMIDs: ${pmids.join(', ')}`);

      console.log('\n2️⃣ Fetching abstract for first article:');
      const articleDetails = await axios.get(
        `${APIs.PubMed.baseURL}/efetch.fcgi`,
        {
          params: {
            db: 'pubmed',
            id: pmids[0],
            rettype: 'abstract',
            retmode: 'text',
            api_key: APIs.PubMed.key,
          },
          headers: {
            'User-Agent': DEFAULT_USER_AGENT,
          },
        }
      );
      const abstract = articleDetails.data.split('\n').slice(0, 5).join('\n');
      console.log(`✅ Retrieved article ${pmids[0]}`);
      console.log(`    Preview: ${abstract.substring(0, 200)}...`);
    }

    console.log('\n3️⃣ Searching for St. Johns Wort drug interactions:');
    const herbSearch = await axios.get(`${APIs.PubMed.baseURL}/esearch.fcgi`, {
      params: {
        db: 'pubmed',
        term: '"St Johns Wort" drug interaction',
        retmode: 'json',
        retmax: 3,
        api_key: APIs.PubMed.key,
      },
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(
      `✅ Found ${herbSearch.data.esearchresult.count} studies on St. Johns Wort interactions`
    );
  } catch (e) {
    logError('PubMed', e);
  }

  // ========== DSLD TESTS ==========
  logSection('Dietary Supplement Label Database (v9)');
  console.log(
    'Note: DSLD API consistently expects X-Api-Key header for authenticated requests.'
  );

  try {
    console.log(
      '\n1️⃣ Getting a specific supplement label (ID: 82118) with X-Api-Key header:'
    );
    const labelResponse = await axios.get(`${APIs.DSLD.baseURL}/label/82118`, {
      headers: {
        'X-Api-Key': APIs.DSLD.key,
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(`✅ Retrieved label successfully`);
    showSample({ _source: labelResponse.data }, [
      'id',
      'fullName',
      'brandName',
      'upcSku',
    ]);
    console.log(
      `    Full response snippet: ${JSON.stringify(labelResponse.data).substring(0, 500)}...`
    );

    console.log(
      '\n2️⃣ Searching for Vitamin D supplements with X-Api-Key header:'
    );
    const vitDSearch = await axios.get(
      `${APIs.DSLD.baseURL}/browse-products/`,
      {
        params: {
          method: 'by_keyword',
          q: 'Vitamin D',
        },
        headers: {
          'X-Api-Key': APIs.DSLD.key,
          'User-Agent': DEFAULT_USER_AGENT,
        },
      }
    );
    console.log(
      `✅ Found ${vitDSearch.data.total?.value || 0} Vitamin D products`
    );
    if (vitDSearch.data.hits && vitDSearch.data.hits.length > 0) {
      showSample(vitDSearch.data.hits[0], ['fullName', 'brandName', 'upcSku']);
    } else {
      console.log('    No results found for Vitamin D.');
    }
    console.log(
      `    Response snippet: ${JSON.stringify(vitDSearch.data).substring(0, 500)}...`
    );

    console.log(
      '\n3️⃣ Testing DSLD without API key (public access to browse-products):'
    );
    const publicTest = await axios.get(
      `${APIs.DSLD.baseURL}/browse-products/`,
      {
        params: {
          method: 'by_keyword',
          q: 'Vitamin C',
        },
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
        },
      }
    );
    console.log(
      `✅ Public access test: ${publicTest.data.total?.value || 0} results`
    );
    if (publicTest.data.hits && publicTest.data.hits.length > 0) {
      showSample(publicTest.data.hits[0], ['fullName', 'brandName']);
    } else {
      console.log('    No results found for Vitamin C.');
    }
    console.log(
      `    Response snippet: ${JSON.stringify(publicTest.data).substring(0, 500)}...`
    );

    console.log(
      '\n4️⃣ Testing DSLD browse-products with X-Api-Key header for multivitamin:'
    );
    const multiSearch = await axios.get(
      `${APIs.DSLD.baseURL}/browse-products/`,
      {
        params: {
          method: 'by_keyword',
          q: 'multivitamin',
        },
        headers: {
          'X-Api-Key': APIs.DSLD.key,
          'User-Agent': DEFAULT_USER_AGENT,
        },
      }
    );
    console.log(
      `✅ Search test successful: ${multiSearch.data.total?.value || 0} results`
    );
    if (multiSearch.data.hits && multiSearch.data.hits.length > 0) {
      showSample(multiSearch.data.hits[0], ['fullName', 'brandName']);
    } else {
      console.log('    No results found for multivitamin.');
    }
    console.log(
      `    Response snippet: ${JSON.stringify(multiSearch.data).substring(0, 500)}...`
    );

    console.log(
      '\n5️⃣ Searching for barcode "0 33674 15904 0" via browse-products endpoint:'
    );
    const normalizedBarcode = '033674159040';
    const spacedBarcode = '0 33674 15904 0';
    const barcodeSearchResponse = await axios.get(
      `${APIs.DSLD.baseURL}/browse-products/`,
      {
        params: {
          method: 'by_keyword',
          q: `upcSku:${spacedBarcode}`,
        },
        headers: {
          'X-Api-Key': APIs.DSLD.key,
          'User-Agent': DEFAULT_USER_AGENT,
        },
      }
    );
    console.log(
      `✅ Barcode search successful: ${barcodeSearchResponse.data.total?.value || 0} results`
    );
    if (
      barcodeSearchResponse.data.hits &&
      barcodeSearchResponse.data.hits.length > 0
    ) {
      showSample(barcodeSearchResponse.data.hits[0], [
        'fullName',
        'brandName',
        'upcSku',
      ]);
    } else {
      console.log(`    No results found for barcode "${spacedBarcode}".`);
      console.log(
        `\n6️⃣ Fallback: Searching for barcode "${normalizedBarcode}" via browse-products:`
      );
      const fallbackBarcodeSearch = await axios.get(
        `${APIs.DSLD.baseURL}/browse-products/`,
        {
          params: {
            method: 'by_keyword',
            q: `barcode:${normalizedBarcode}`,
          },
          headers: {
            'X-Api-Key': APIs.DSLD.key,
            'User-Agent': DEFAULT_USER_AGENT,
          },
        }
      );
      console.log(
        `✅ Fallback barcode search: ${fallbackBarcodeSearch.data.total?.value || 0} results`
      );
      if (
        fallbackBarcodeSearch.data.hits &&
        fallbackBarcodeSearch.data.hits.length > 0
      ) {
        showSample(fallbackBarcodeSearch.data.hits[0], [
          'fullName',
          'brandName',
          'upcSku',
        ]);
      } else {
        console.log(`    No results found for barcode "${normalizedBarcode}".`);
        console.log(
          `\n7️⃣ Fallback: Searching for product name "Alive! Women's 50+ Multivitamin":`
        );
        const nameSearch = await axios.get(
          `${APIs.DSLD.baseURL}/browse-products/`,
          {
            params: {
              method: 'by_keyword',
              q: "Alive! Women's 50+ Multivitamin",
            },
            headers: {
              'X-Api-Key': APIs.DSLD.key,
              'User-Agent': DEFAULT_USER_AGENT,
            },
          }
        );
        console.log(
          `✅ Name search successful: ${nameSearch.data.total?.value || 0} results`
        );
        if (nameSearch.data.hits && nameSearch.data.hits.length > 0) {
          showSample(nameSearch.data.hits[0], [
            'fullName',
            'brandName',
            'upcSku',
          ]);
        } else {
          console.log(
            `    No results found for "Alive! Women's 50+ Multivitamin".`
          );
        }
        console.log(
          `    Response snippet: ${JSON.stringify(nameSearch.data).substring(0, 500)}...`
        );
      }
      console.log(
        `    Response snippet: ${JSON.stringify(fallbackBarcodeSearch.data).substring(0, 500)}...`
      );
    }
    console.log(
      `    Response snippet: ${JSON.stringify(barcodeSearchResponse.data).substring(0, 500)}...`
    );

    console.log(
      '\n8️⃣ Testing DSLD search-filter with simplified query for Vitamin D:'
    );
    console.log(
      '    Note: /search-filter is unreliable; prefer /browse-products/ for Vitamin D searches.'
    );
    const vitDSearchFilter = await axios.get(
      `${APIs.DSLD.baseURL}/search-filter`,
      {
        params: {
          q: 'Vitamin D',
        },
        headers: {
          'X-Api-Key': APIs.DSLD.key,
          'User-Agent': DEFAULT_USER_AGENT,
        },
      }
    );
    console.log(
      `✅ Search-filter test successful: ${vitDSearchFilter.data.total?.value || 0} results`
    );
    if (vitDSearchFilter.data.hits && vitDSearchFilter.data.hits.length > 0) {
      showSample(vitDSearchFilter.data.hits[0], [
        'fullName',
        'brandName',
        'upcSku',
      ]);
    } else {
      console.log('    No results found for Vitamin D (search-filter).');
    }
    console.log(
      `    Response snippet: ${JSON.stringify(vitDSearchFilter.data).substring(0, 500)}...`
    );
  } catch (e) {
    logError('DSLD', e);
  }

  // ========== Open Food Facts TESTS ==========
  logSection('Open Food Facts');

  try {
    console.log('\n1️⃣ Fetching product by barcode (example: 076314361564):');
    const headers = {
      'User-Agent': DEFAULT_USER_AGENT,
    };
    if (process.env.NODE_ENV === 'development') {
      headers['Authorization'] =
        'Basic ' + Buffer.from('off:off').toString('base64');
    }
    const offProduct = await axios.get(
      `${APIs.OpenFoodFacts.baseURL}/product/076314361564.json`,
      {
        headers,
      }
    );
    console.log(
      `✅ Retrieved product: ${offProduct.data.product?.product_name || 'Unknown'}`
    );
    if (offProduct.data.status === 1) {
      showSample({ _source: offProduct.data.product }, [
        'product_name',
        'code',
        'ingredients',
        'labels',
      ]);
    } else {
      console.log('    Product not found or incomplete data');
    }

    console.log('\n2️⃣ Searching for multivitamin supplements:');
    console.log(
      '    Note: Open Food Facts has limited multivitamin data; prefer DSLD/USDA for supplements.'
    );
    const offSearch = await axios.get(`${APIs.OpenFoodFacts.baseURL}/search`, {
      params: {
        search_terms: 'multivitamin',
        categories_tags: 'en:dietary-supplements',
        json: true,
        page_size: 3,
        fields:
          'code,product_name,nutrition_grades,categories_tags,ingredients,labels',
      },
      headers,
    });
    console.log(`✅ Found ${offSearch.data.count || 0} products`);
    if (offSearch.data.products && offSearch.data.products.length > 0) {
      offSearch.data.products.forEach((product, index) => {
        console.log(
          `    - ${product.product_name || 'Unknown'} (${product.code})`
        );
      });
    } else {
      console.log('    No supplement products found for multivitamin.');
    }
    console.log(
      `    Response snippet: ${JSON.stringify(offSearch.data).substring(0, 500)}...`
    );
  } catch (e) {
    logError('Open Food Facts', e);
  }

  console.log(
    '\n📌 Note: While DSLD is great for supplement labels, USDA provides excellent coverage for general food and fortified products.'
  );

  try {
    const usdaMulti = await axios.get(`${APIs.USDA.baseURL}/foods/search`, {
      params: {
        api_key: APIs.USDA.key,
        query: 'multivitamin',
        dataType: 'Branded',
        pageSize: 3,
      },
      headers: {
        'User-Agent': DEFAULT_USER_AGENT,
      },
    });
    console.log(
      `    ✅ USDA has ${usdaMulti.data.totalHits} multivitamin products`
    );
    if (usdaMulti.data.foods) {
      usdaMulti.data.foods.forEach(food => {
        console.log(`    - ${food.description} (${food.brandName})`);
      });
    }
  } catch (e) {
    logError('USDA (Multivitamin fallback)', e);
  }

  // ========== SUMMARY ==========
  logSection('API Capabilities Summary');

  console.log('\n🎯 What each API provides for PharmaGuide:\n');

  console.log('📊 USDA FoodData Central:');
  console.log('    ✓ Barcode lookup for foods/supplements');
  console.log('    ✓ Complete nutritional data');
  console.log('    ✓ Brand and manufacturer info');
  console.log('    ✓ Serving sizes and ingredients');
  console.log(
    '    ✓ Relevant for general dietary context and food-drug/supplement interactions.\n'
  );

  console.log('💊 FDA openFDA:');
  console.log('    ✓ Drug adverse event reports (side effect tracking)');
  console.log('    ✓ Official drug labels with comprehensive warnings');
  console.log('    ✓ Explicit drug interaction sections');
  console.log('    ✓ Medication classifications (pharmacological classes)');
  console.log('    ✓ Boxed warnings (most serious safety concerns)');
  console.log('    ✓ Core for medication safety and interaction analysis.\n');

  console.log('📚 PubMed:');
  console.log(
    '    ✓ Clinical research on drug-supplement, drug-drug, supplement-supplement interactions'
  );
  console.log('    ✓ Medical evidence and studies for efficacy and safety');
  console.log('    ✓ Peer-reviewed articles for deep dives');
  console.log('    ✓ Latest research findings for up-to-date guidance');
  console.log(
    '    ✓ Enables evidence-based recommendations and confidence scoring.\n'
  );

  console.log('🌿 DSLD:');
  console.log('    ✓ Dietary supplement labels (specific product details)');
  console.log('    ✓ Ingredient searches (identify components of supplements)');
  console.log(
    '    ✓ Proprietary blend detection (understand complex formulations)'
  );
  console.log('    ✓ Supplement fact panels (dosage and composition)');
  console.log(
    '    ✓ Official NIH source for supplement data; crucial for supplement-specific interaction analysis and dosage.\n'
  );

  console.log('🥫 Open Food Facts:');
  console.log(
    '    ✓ Barcode lookup for a wide range of consumer food products'
  );
  console.log(
    '    ✓ User-contributed ingredients lists and nutritional values'
  );
  console.log('    ✓ Product images and general category info');
  console.log('    ✓ Supports community contributions for a growing database');
  console.log(
    '    ✓ Excellent for general food data, expanding interaction scope to diet.\n'
  );

  console.log('✨ Combined, these APIs give PharmaGuide:');
  console.log('    → A comprehensive US medication database');
  console.log(
    '    → Detailed, official, and crowd-sourced supplement & food information'
  );
  console.log(
    '    → Robust drug-supplement, drug-drug, and food-drug interaction data'
  );
  console.log(
    '    → Clinical research evidence to support all recommendations'
  );
  console.log('    → Advanced nutritional analysis capabilities');
  console.log('    → Flexible barcode and name-based product resolution');
  console.log(
    '\n🚀 All the data power needed for PharmaGuide to help users make better decisions about medication and supplements, including stack interactions!'
  );
}

// Run the tests
testAPIs().catch(console.error);
