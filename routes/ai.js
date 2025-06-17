const express = require('express');
const Store = require('../models/Store');
const AIQuery = require('../models/AIQuery');
const AIIntegrationService = require('../services/aiIntegrationService');
const router = express.Router();

// Test AI connectivity
router.get('/test-connectivity', async (req, res) => {
  try {
    const results = await AIIntegrationService.testConnectivity();
    res.json({
      success: true,
      providers: results
    });
  } catch (error) {
    console.error('Error testing AI connectivity:', error);
    res.status(500).json({ error: 'Failed to test AI connectivity' });
  }
});

// Simulate AI query for testing
router.post('/simulate-query', async (req, res) => {
  try {
    const { shop, query, provider = 'claude' } = req.body;
    
    if (!shop || !query) {
      return res.status(400).json({ error: 'Shop and query are required' });
    }

    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if provider is enabled for this store
    if (!store.subscription.aiProviders.includes(provider)) {
      return res.status(403).json({ 
        error: `${provider} is not enabled for your subscription plan` 
      });
    }

    // Simulate product matching (in real implementation, this would come from AI response)
    const matchedProducts = store.products
      .filter(product => {
        const queryLower = query.toLowerCase();
        return product.title.toLowerCase().includes(queryLower) ||
               product.description.toLowerCase().includes(queryLower) ||
               product.tags.some(tag => tag.toLowerCase().includes(queryLower));
      })
      .slice(0, 5)
      .map(product => ({
        storeId: store._id,
        productId: product.shopifyId,
        relevanceScore: Math.random() * 0.5 + 0.5, // Random score between 0.5-1
        mentioned: Math.random() > 0.3 // 70% chance of being mentioned
      }));

    // Save query to analytics
    const aiQuery = new AIQuery({
      query,
      provider,
      response: `Simulated response for: ${query}`,
      productsMatched: matchedProducts,
      userLocation: 'Simulated',
      userAgent: req.get('User-Agent'),
      sessionId: `sim_${Date.now()}`
    });

    await aiQuery.save();

    // Update store analytics
    store.analytics.totalAIQueries++;
    await store.save();

    res.json({
      success: true,
      query: aiQuery.query,
      provider: aiQuery.provider,
      productsMatched: matchedProducts.length,
      productsMentioned: matchedProducts.filter(m => m.mentioned).length,
      timestamp: aiQuery.timestamp
    });
  } catch (error) {
    console.error('Error simulating AI query:', error);
    res.status(500).json({ error: 'Failed to simulate query' });
  }
});

// Force sync to AI providers
router.post('/force-sync/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    
    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const results = await AIIntegrationService.syncToAIProviders(store);
    
    res.json({
      success: true,
      message: 'AI sync completed',
      results: results.map(result => ({
        provider: result.provider,
        success: result.success,
        error: result.error || null
      }))
    });
  } catch (error) {
    console.error('Error forcing AI sync:', error);
    res.status(500).json({ error: 'AI sync failed' });
  }
});

// Get AI provider status for store
router.get('/store/:shop/providers', async (req, res) => {
  try {
    const { shop } = req.params;
    
    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const allProviders = ['claude', 'openai', 'gemini', 'deepseek', 'llama'];
    const maxProviders = {
      basic: 1,
      standard: 2,
      growth: 5,
      premium: 5
    };

    const providerStatus = allProviders.map(provider => ({
      name: provider,
      enabled: store.subscription.aiProviders.includes(provider),
      available: true, // You could check API keys here
      displayName: provider.charAt(0).toUpperCase() + provider.slice(1)
    }));

    res.json({
      providers: providerStatus,
      maxAllowed: maxProviders[store.subscription.plan],
      currentlyEnabled: store.subscription.aiProviders.length,
      canAddMore: store.subscription.aiProviders.length < maxProviders[store.subscription.plan]
    });
  } catch (error) {
    console.error('Error fetching AI providers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;