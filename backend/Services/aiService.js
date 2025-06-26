const axios = require('axios');
const AIQuery = require('../models/AIQuery');
const { getProviderConfig } = require('../config/aiProviders');
const Subscription = require('../models/Subscription');

class AIService {
  constructor() {
    this.providers = {
      openai: this._callOpenAI,
      anthropic: this._callAnthropic,
      google: this._callGoogle,
      deepseek: this._callDeepSeek,
      meta: this._callMeta,
    };
  }

  async processQuery(shopId, query, providerName = 'openai') {
    // Check subscription limits
    const subscription = await Subscription.findOne({ shop: shopId });
    if (!subscription || !subscription.isActive) {
      throw new Error('No active subscription or subscription limit reached');
    }

    if (subscription.queriesUsed >= subscription.plan.aiQueries) {
      throw new Error('AI query limit reached for this billing period');
    }

    const provider = getProviderConfig(providerName);
    if (!subscription.plan.aiProviders.includes(providerName)) {
      throw new Error(`Provider ${providerName} not available in your plan`);
    }

    // Call the appropriate provider
    const response = await this.providers[providerName](query, provider);

    // Record the query
    const aiQuery = new AIQuery({
      shop: shopId,
      query,
      response: response.content,
      products: response.products || [],
      provider: providerName,
      model: response.model,
      tokensUsed: response.tokensUsed,
      cost: response.cost,
      metadata: response.metadata,
    });

    await aiQuery.save();
    await Analytics.updateOne(
      { shop: shopId, date: { $gte: startOfDay } },
      { 
       $inc: { 
         aiQueries: 1,
         [`tokensUsed.${provider}`]: tokensUsed 
    } 
  },
  { upsert: true }
);

    // Update subscription usage
    subscription.queriesUsed += 1;
    await subscription.save();

    return aiQuery;
  }

  async _callOpenAI(query, provider) {
    const response = await axios.post(
      `${provider.baseUrl}/chat/completions`,
      {
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'user',
            content: query,
          },
        ],
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      content: response.data.choices[0].message.content,
      model: response.data.model,
      tokensUsed: response.data.usage.total_tokens,
      cost: this._calculateOpenAICost(response.data.usage),
    };
  }

  async _callAnthropic(query, provider) {
    // Similar implementation for Anthropic
    // ...
  }

  async _callGoogle(query, provider) {
    // Similar implementation for Google
    // ...
  }

  async _callDeepSeek(query, provider) {
    // Similar implementation for DeepSeek
    // ...
  }

  async _callMeta(query, provider) {
    // Similar implementation for Meta
    // ...
  }

  _calculateOpenAICost(usage) {
    // Calculate cost based on tokens and model
    // ...
  }
}

module.exports = new AIService();