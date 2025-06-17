const express = require('express');
const Store = require('../models/Store');
const { subscriptionPlans } = require('../models/Subscription');
const router = express.Router();

// Get available subscription plans
router.get('/plans', (req, res) => {
  res.json({
    plans: subscriptionPlans
  });
});

// Get current subscription
router.get('/store/:shop/subscription', async (req, res) => {
  try {
    const { shop } = req.params;
    const store = await Store.findOne({ shopifyShop: shop });
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const currentPlan = subscriptionPlans.find(plan => plan.name === store.subscription.plan);
    
    res.json({
      current: store.subscription,
      planDetails: currentPlan,
      availablePlans: subscriptionPlans
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription
router.post('/store/:shop/subscription', async (req, res) => {
  try {
    const { shop } = req.params;
    const { plan } = req.body;

    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const newPlan = subscriptionPlans.find(p => p.name === plan);
    if (!newPlan) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Update subscription
    store.subscription.plan = plan;
    store.subscription.status = 'active';
    store.subscription.productLimit = newPlan.features.maxProducts;
    store.subscription.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    // Update sync frequency based on plan
    store.settings.syncFrequency = newPlan.features.syncFrequency;
    
    // Reset AI providers if current selection exceeds new plan limits
    const maxProviders = plan === 'basic' ? 1 : plan === 'standard' ? 2 : 5;
    if (store.subscription.aiProviders.length > maxProviders) {
      store.subscription.aiProviders = store.subscription.aiProviders.slice(0, maxProviders);
    }

    await store.save();

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: store.subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;