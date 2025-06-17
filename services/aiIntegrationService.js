const axios = require('axios');

class AIIntegrationService {
  constructor() {
    this.providers = {
      claude: {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      },
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      },
      gemini: {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        headers: {
          'Content-Type': 'application/json'
        }
      },
      deepseek: {
        url: 'https://api.deepseek.com/v1/chat/completions',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      },
      llama: {
        url: 'https://api.together.xyz/v1/chat/completions', // Using Together.ai for Llama
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`
        }
      }
    };

    // Validate API keys on startup
    this.validateAPIKeys();
  }

  // Validate that all required API keys are present
  validateAPIKeys() {
    const requiredKeys = {
      claude: 'CLAUDE_API_KEY',
      openai: 'OPENAI_API_KEY', 
      gemini: 'GEMINI_API_KEY',
      deepseek: 'DEEPSEEK_API_KEY',
      llama: 'LLAMA_API_KEY'
    };

    const missingKeys = [];
    for (const [provider, envVar] of Object.entries(requiredKeys)) {
      if (!process.env[envVar]) {
        missingKeys.push(`${envVar} (${provider})`);
      }
    }

    if (missingKeys.length > 0) {
      console.warn(`⚠️ Missing AI API keys: ${missingKeys.join(', ')}`);
      console.warn('Some AI providers will not be available');
    } else {
      console.log('✅ All AI API keys configured');
    }
  }

  // Format product data for AI consumption with size optimization
  formatProductDataForAI(products, maxProducts = 50) {
    // Limit and optimize product data to avoid token limits
    const limitedProducts = products.slice(0, maxProducts);
    
    return limitedProducts.map(product => ({
      id: product.shopifyId,
      title: product.title,
      description: this.truncateText(product.description, 200),
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags.slice(0, 5), // Limit tags
      handle: product.handle,
      inStock: product.variants.some(v => v.inventory > 0),
      variants: product.variants.slice(0, 3).map(v => ({ // Limit variants
        title: v.title,
        price: v.price,
        inStock: v.inventory > 0
      }))
    }));
  }

  // Helper to truncate text
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  // Enhanced error handling
  handleAPIError(error, provider) {
    const errorInfo = {
      provider,
      timestamp: new Date().toISOString(),
      success: false
    };

    if (error.response) {
      // API responded with error status
      errorInfo.status = error.response.status;
      errorInfo.error = error.response.data?.error?.message || error.response.statusText;
      
      // Log specific error types
      if (error.response.status === 401) {
        console.error(`❌ ${provider} API: Invalid API key`);
        errorInfo.error = 'Invalid API key';
      } else if (error.response.status === 429) {
        console.error(`❌ ${provider} API: Rate limit exceeded`);
        errorInfo.error = 'Rate limit exceeded';
      } else if (error.response.status >= 500) {
        console.error(`❌ ${provider} API: Server error`);
        errorInfo.error = 'Provider server error';
      }
    } else if (error.request) {
      // Network error
      console.error(`❌ ${provider} API: Network error`);
      errorInfo.error = 'Network error - unable to reach API';
    } else {
      // Other error
      console.error(`❌ ${provider} API: ${error.message}`);
      errorInfo.error = error.message;
    }

    return errorInfo;
  }

  // Send product data to Claude with retry logic
  async sendToClaude(productData, storeInfo, retries = 2) {
    if (!process.env.CLAUDE_API_KEY) {
      return { success: false, provider: 'claude', error: 'API key not configured' };
    }

    try {
      const systemPrompt = `You are an AI assistant with access to product information from ${storeInfo.shopName}. When users ask about products, services, or recommendations, you can reference these products.

Product catalog (${productData.length} products):
${JSON.stringify(productData, null, 2)}

Guidelines:
- Provide helpful, accurate product recommendations
- Include pricing when relevant
- Mention product availability
- Be conversational and helpful
- Always mention the store name when making recommendations
- If asked about products not in the catalog, be honest about limitations`;

      const response = await axios.post(this.providers.claude.url, {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: 'I have updated product information. Please acknowledge that you now have access to this catalog.'
        }]
      }, {
        headers: this.providers.claude.headers,
        timeout: 30000 // 30 second timeout
      });

      console.log(`✅ Claude: Successfully synced ${productData.length} products for ${storeInfo.shopName}`);
      return {
        success: true,
        provider: 'claude',
        response: response.data,
        productCount: productData.length
      };
    } catch (error) {
      console.error(`❌ Claude API Error for ${storeInfo.shopName}:`, error.message);
      
      if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        console.log(`🔄 Retrying Claude API call (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendToClaude(productData, storeInfo, retries - 1);
      }
      
      return this.handleAPIError(error, 'claude');
    }
  }

  // Send product data to OpenAI with retry logic
  async sendToOpenAI(productData, storeInfo, retries = 2) {
    if (!process.env.OPENAI_API_KEY) {
      return { success: false, provider: 'openai', error: 'API key not configured' };
    }

    try {
      const systemPrompt = `You are a helpful shopping assistant with access to products from ${storeInfo.shopName}. Here is the current product catalog: ${JSON.stringify(productData)}. When users ask for product recommendations, reference these products appropriately.`;

      const response = await axios.post(this.providers.openai.url, {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Product catalog updated successfully.' }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: this.providers.openai.headers,
        timeout: 30000
      });

      console.log(`✅ OpenAI: Successfully synced ${productData.length} products for ${storeInfo.shopName}`);
      return {
        success: true,
        provider: 'openai',
        response: response.data,
        productCount: productData.length
      };
    } catch (error) {
      console.error(`❌ OpenAI API Error for ${storeInfo.shopName}:`, error.message);
      
      if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        console.log(`🔄 Retrying OpenAI API call (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendToOpenAI(productData, storeInfo, retries - 1);
      }
      
      return this.handleAPIError(error, 'openai');
    }
  }

  // Send product data to Gemini with retry logic
  async sendToGemini(productData, storeInfo, retries = 2) {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, provider: 'gemini', error: 'API key not configured' };
    }

    try {
      const prompt = `You now have access to product information from ${storeInfo.shopName}. Product catalog: ${JSON.stringify(productData)}. Please acknowledge this update.`;

      const response = await axios.post(this.providers.gemini.url, {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.7
        }
      }, {
        headers: this.providers.gemini.headers,
        timeout: 30000
      });

      console.log(`✅ Gemini: Successfully synced ${productData.length} products for ${storeInfo.shopName}`);
      return {
        success: true,
        provider: 'gemini',
        response: response.data,
        productCount: productData.length
      };
    } catch (error) {
      console.error(`❌ Gemini API Error for ${storeInfo.shopName}:`, error.message);
      
      if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        console.log(`🔄 Retrying Gemini API call (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendToGemini(productData, storeInfo, retries - 1);
      }
      
      return this.handleAPIError(error, 'gemini');
    }
  }

  // Send product data to DeepSeek with retry logic
  async sendToDeepSeek(productData, storeInfo, retries = 2) {
    if (!process.env.DEEPSEEK_API_KEY) {
      return { success: false, provider: 'deepseek', error: 'API key not configured' };
    }

    try {
      const systemPrompt = `You are a shopping assistant for ${storeInfo.shopName}. Current products: ${JSON.stringify(productData)}. Help users find relevant products.`;

      const response = await axios.post(this.providers.deepseek.url, {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Catalog updated.' }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: this.providers.deepseek.headers,
        timeout: 30000
      });

      console.log(`✅ DeepSeek: Successfully synced ${productData.length} products for ${storeInfo.shopName}`);
      return {
        success: true,
        provider: 'deepseek',
        response: response.data,
        productCount: productData.length
      };
    } catch (error) {
      console.error(`❌ DeepSeek API Error for ${storeInfo.shopName}:`, error.message);
      
      if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        console.log(`🔄 Retrying DeepSeek API call (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendToDeepSeek(productData, storeInfo, retries - 1);
      }
      
      return this.handleAPIError(error, 'deepseek');
    }
  }

  // Send product data to Llama with retry logic
  async sendToLlama(productData, storeInfo, retries = 2) {
    if (!process.env.LLAMA_API_KEY) {
      return { success: false, provider: 'llama', error: 'API key not configured' };
    }

    try {
      const systemPrompt = `You are a shopping assistant for ${storeInfo.shopName}. Current products: ${JSON.stringify(productData)}. Help users find relevant products.`;

      const response = await axios.post(this.providers.llama.url, {
        model: 'meta-llama/Llama-2-70b-chat-hf',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Catalog updated.' }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: this.providers.llama.headers,
        timeout: 30000
      });

      console.log(`✅ Llama: Successfully synced ${productData.length} products for ${storeInfo.shopName}`);
      return {
        success: true,
        provider: 'llama',
        response: response.data,
        productCount: productData.length
      };
    } catch (error) {
      console.error(`❌ Llama API Error for ${storeInfo.shopName}:`, error.message);
      
      if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT')) {
        console.log(`🔄 Retrying Llama API call (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.sendToLlama(productData, storeInfo, retries - 1);
      }
      
      return this.handleAPIError(error, 'llama');
    }
  }

  // Main method to sync data to all enabled AI providers
  async syncToAIProviders(store) {
    if (!store.products || store.products.length === 0) {
      console.log(`⚠️ No products to sync for ${store.shopifyShop}`);
      return [{ success: false, error: 'No products available to sync' }];
    }

    console.log(`🔄 Starting AI sync for ${store.shopifyShop} with ${store.subscription.aiProviders.length} providers`);
    
    const results = [];
    const productData = this.formatProductDataForAI(store.products);
    const storeInfo = {
      shopName: store.shopifyShop,
      totalProducts: store.products.length
    };

    for (const provider of store.subscription.aiProviders) {
      console.log(`🔄 Syncing to ${provider} for ${store.shopifyShop}...`);
      
      let result;
      
      try {
        switch (provider) {
          case 'claude':
            result = await this.sendToClaude(productData, storeInfo);
            break;
          case 'openai':
            result = await this.sendToOpenAI(productData, storeInfo);
            break;
          case 'gemini':
            result = await this.sendToGemini(productData, storeInfo);
            break;
          case 'deepseek':
            result = await this.sendToDeepSeek(productData, storeInfo);
            break;
          case 'llama':
            result = await this.sendToLlama(productData, storeInfo);
            break;
          default:
            result = { success: false, provider, error: 'Unknown provider' };
        }
      } catch (error) {
        console.error(`❌ Unexpected error syncing to ${provider}:`, error.message);
        result = { success: false, provider, error: 'Unexpected sync error' };
      }

      results.push(result);
      
      // Add delay between API calls to avoid rate limiting
      if (store.subscription.aiProviders.indexOf(provider) < store.subscription.aiProviders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`📊 AI sync completed for ${store.shopifyShop}: ${successful}/${results.length} providers successful`);

    return results;
  }

  // Test connectivity to all AI providers
  async testConnectivity() {
    console.log('🔍 Testing AI provider connectivity...');
    const results = {};
    
    // Test Claude
    if (process.env.CLAUDE_API_KEY) {
      try {
        await axios.post(this.providers.claude.url, {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        }, { 
          headers: this.providers.claude.headers,
          timeout: 10000
        });
        results.claude = { status: 'connected' };
      } catch (error) {
        results.claude = { status: 'error', message: error.message };
      }
    } else {
      results.claude = { status: 'not_configured', message: 'API key not set' };
    }

    // Test OpenAI
    if (process.env.OPENAI_API_KEY) {
      try {
        await axios.post(this.providers.openai.url, {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        }, { 
          headers: this.providers.openai.headers,
          timeout: 10000
        });
        results.openai = { status: 'connected' };
      } catch (error) {
        results.openai = { status: 'error', message: error.message };
      }
    } else {
      results.openai = { status: 'not_configured', message: 'API key not set' };
    }

    // Test Gemini
    if (process.env.GEMINI_API_KEY) {
      try {
        await axios.post(this.providers.gemini.url, {
          contents: [{ parts: [{ text: 'test' }] }]
        }, { 
          headers: this.providers.gemini.headers,
          timeout: 10000
        });
        results.gemini = { status: 'connected' };
      } catch (error) {
        results.gemini = { status: 'error', message: error.message };
      }
    } else {
      results.gemini = { status: 'not_configured', message: 'API key not set' };
    }

    // Test DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        await axios.post(this.providers.deepseek.url, {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        }, { 
          headers: this.providers.deepseek.headers,
          timeout: 10000
        });
        results.deepseek = { status: 'connected' };
      } catch (error) {
        results.deepseek = { status: 'error', message: error.message };
      }
    } else {
      results.deepseek = { status: 'not_configured', message: 'API key not set' };
    }

    // Test Llama
    if (process.env.LLAMA_API_KEY) {
      try {
        await axios.post(this.providers.llama.url, {
          model: 'meta-llama/Llama-2-70b-chat-hf',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5
        }, { 
          headers: this.providers.llama.headers,
          timeout: 10000
        });
        results.llama = { status: 'connected' };
      } catch (error) {
        results.llama = { status: 'error', message: error.message };
      }
    } else {
      results.llama = { status: 'not_configured', message: 'API key not set' };
    }

    console.log('✅ AI connectivity test completed');
    return results;
  }
}

module.exports = new AIIntegrationService();