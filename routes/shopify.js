const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const Store = require('../models/Store');
const DataSyncService = require('../services/dataSyncService');
const router = express.Router();

// Input validation helper
const validateShopDomain = (shop) => {
  if (!shop) return false;
  
  // Basic validation for Shopify domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  return shopRegex.test(shop);
};

// Shopify OAuth - Install URL
router.get('/install', (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  if (!validateShopDomain(shop)) {
    return res.status(400).json({ error: 'Invalid shop domain format' });
  }

  const scopes = 'read_products,read_product_listings';
  const redirectUri = `${process.env.BASE_URL}/api/shopify/callback`;
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store state in session or cache for validation (in production, use Redis)
  // For now, we'll validate in callback
  
  const installUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${process.env.SHOPIFY_API_KEY}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}`;

  console.log(`📦 Install request for shop: ${shop}`);
  res.redirect(installUrl);
});

// Shopify OAuth Callback
router.get('/callback', async (req, res) => {
  const { code, shop, state } = req.query;

  if (!code || !shop) {
    console.error('❌ Missing required OAuth parameters');
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (!validateShopDomain(shop)) {
    console.error('❌ Invalid shop domain:', shop);
    return res.status(400).json({ error: 'Invalid shop domain' });
  }

  try {
    console.log(`🔄 Processing OAuth callback for shop: ${shop}`);

    // Exchange code for access token
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code: code
    });

    const { access_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error('No access token received from Shopify');
    }

    // Verify the access token by getting shop information
    const shopResponse = await axios.get(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const shopData = shopResponse.data.shop;
    console.log(`✅ Verified shop: ${shopData.name} (${shopData.domain})`);

    // Save or update store in database
    let store = await Store.findOne({ shopifyShop: shop });
    
    if (store) {
      console.log(`🔄 Updating existing store: ${shop}`);
      store.accessToken = access_token;
      store.updatedAt = new Date();
    } else {
      console.log(`🆕 Creating new store: ${shop}`);
      store = new Store({
        shopifyShop: shop,
        accessToken: access_token,
        subscription: {
          plan: 'basic',
          status: 'trial',
          aiProviders: ['llama'], // Start with cheapest provider
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days trial
          productLimit: 200
        },
        settings: {
          syncFrequency: '24h',
          enabledFeatures: {
            realTimeSync: false,
            advancedAnalytics: false,
            priorityListing: false
          }
        }
      });
    }

    await store.save();
    console.log(`💾 Store saved successfully: ${shop}`);

    // Trigger initial sync with delay to avoid overwhelming the callback
    setTimeout(async () => {
      try {
        console.log(`🔄 Starting initial sync for: ${shop}`);
        const syncResult = await DataSyncService.syncStore(store._id);
        if (syncResult.success) {
          console.log(`✅ Initial sync completed for: ${shop}`);
        } else {
          console.error(`❌ Initial sync failed for: ${shop}`, syncResult.error);
        }
      } catch (error) {
        console.error(`❌ Initial sync error for: ${shop}`, error.message);
      }
    }, 5000);

    // Redirect to success page or dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'https://shopify-ai-seo-frontend.netlify.app';
    const redirectUrl = `${frontendUrl}/dashboard?shop=${encodeURIComponent(shop)}&installed=true`;
    
    console.log(`🎉 Installation completed for: ${shop}`);
    res.redirect(redirectUrl);

  } catch (error) {
    console.error(`❌ OAuth callback error for shop: ${shop}`, error.message);
    
    // Provide user-friendly error messages
    let errorMessage = 'Installation failed. Please try again.';
    
    if (error.response?.status === 401) {
      errorMessage = 'Invalid Shopify credentials. Please check your app configuration.';
    } else if (error.response?.status === 403) {
      errorMessage = 'Access denied. Please ensure the app has proper permissions.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Network error. Please check your internet connection and try again.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get store information
router.get('/store/:shop', async (req, res) => {
  try {
    const { shop } = req.params;
    
    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    const store = await Store.findOne({ shopifyShop: shop });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Don't return sensitive information
    const storeInfo = {
      shopifyShop: store.shopifyShop,
      subscription: {
        plan: store.subscription.plan,
        status: store.subscription.status,
        aiProviders: store.subscription.aiProviders,
        productLimit: store.subscription.productLimit,
        expiresAt: store.subscription.expiresAt
      },
      productCount: store.products.length,
      lastSyncAt: store.lastSyncAt,
      settings: {
        syncFrequency: store.settings.syncFrequency,
        enabledFeatures: store.settings.enabledFeatures
      },
      createdAt: store.createdAt
    };

    res.json(storeInfo);
  } catch (error) {
    console.error('❌ Error fetching store:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update store settings
router.put('/store/:shop/settings', async (req, res) => {
  try {
    const { shop } = req.params;
    const { aiProviders, syncFrequency, optimizationSettings } = req.body;

    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check subscription status
    if (store.subscription.status !== 'active' && store.subscription.status !== 'trial') {
      return res.status(403).json({ error: 'Subscription required to modify settings' });
    }

    // Validate AI providers based on subscription plan
    const maxProviders = {
      basic: 1,
      standard: 2,
      growth: 5,
      premium: 5
    };

    if (aiProviders && aiProviders.length > maxProviders[store.subscription.plan]) {
      return res.status(400).json({ 
        error: `${store.subscription.plan} plan allows maximum ${maxProviders[store.subscription.plan]} AI providers` 
      });
    }

    // Validate AI providers are supported
    const supportedProviders = ['claude', 'openai', 'gemini', 'deepseek', 'llama'];
    if (aiProviders && !aiProviders.every(provider => supportedProviders.includes(provider))) {
      return res.status(400).json({ error: 'One or more AI providers are not supported' });
    }

    // Update settings
    if (aiProviders) {
      store.subscription.aiProviders = aiProviders;
      console.log(`🔄 Updated AI providers for ${shop}: ${aiProviders.join(', ')}`);
    }
    
    if (syncFrequency) {
      const allowedFrequencies = ['24h', '12h', '6h', '2h'];
      if (!allowedFrequencies.includes(syncFrequency)) {
        return res.status(400).json({ error: 'Invalid sync frequency' });
      }
      store.settings.syncFrequency = syncFrequency;
    }

    if (optimizationSettings) {
      store.settings.aiOptimization = { 
        ...store.settings.aiOptimization, 
        ...optimizationSettings 
      };
    }

    store.updatedAt = new Date();
    await store.save();

    console.log(`✅ Settings updated for shop: ${shop}`);
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('❌ Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual sync trigger
router.post('/store/:shop/sync', async (req, res) => {
  try {
    const { shop } = req.params;
    
    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    console.log(`🔄 Manual sync requested for: ${shop}`);
    const result = await DataSyncService.manualSync(shop);
    
    if (result.success) {
      console.log(`✅ Manual sync completed for: ${shop}`);
      res.json({
        success: true,
        message: 'Sync completed successfully',
        productsSync: result.productsSync,
        timestamp: result.timestamp
      });
    } else {
      console.error(`❌ Manual sync failed for: ${shop}`, result.error);
      res.status(400).json({
        success: false,
        error: result.error || result.reason
      });
    }
  } catch (error) {
    console.error('❌ Manual sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get sync status
router.get('/store/:shop/sync-status', async (req, res) => {
  try {
    const { shop } = req.params;
    
    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    const status = await DataSyncService.getSyncStatus(shop);
    
    if (status.error) {
      return res.status(404).json(status);
    }
    
    res.json(status);
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products with pagination and filtering
router.get('/store/:shop/products', async (req, res) => {
  try {
    const { shop } = req.params;
    const { page = 1, limit = 50, search, category } = req.query;
    
    if (!validateShopDomain(shop)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }
    
    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    let products = store.products;
    
    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product => 
        product.title.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (category) {
      products = products.filter(product => 
        product.productType.toLowerCase() === category.toLowerCase()
      );
    }

    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedProducts = products.slice(startIndex, endIndex);

    res.json({
      products: paginatedProducts,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(products.length / limitNum),
        totalProducts: products.length,
        hasNext: endIndex < products.length,
        hasPrev: startIndex > 0,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook verification helper
const verifyWebhook = (req, res, next) => {
  const hmac = req.get('X-Shopify-Hmac-Sha256');
  const body = req.body;
  const hash = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  if (hash !== hmac) {
    console.error('❌ Webhook verification failed');
    return res.status(401).send('Unauthorized');
  }
  
  next();
};

// Uninstall webhook
router.post('/webhooks/app/uninstalled', express.raw({type: 'application/json'}), verifyWebhook, async (req, res) => {
  try {
    const shop = req.get('X-Shopify-Shop-Domain');
    
    if (shop) {
      const deletedStore = await Store.findOneAndDelete({ shopifyShop: shop });
      if (deletedStore) {
        console.log(`🗑️ App uninstalled and data cleaned for shop: ${shop}`);
      } else {
        console.log(`⚠️ Uninstall webhook received for unknown shop: ${shop}`);
      }
    } else {
      console.error('❌ Uninstall webhook missing shop domain');
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Uninstall webhook error:', error);
    res.status(500).send('Error');
  }
});

// GDPR webhooks (required for Shopify App Store)
router.post('/webhooks/customers/data_request', express.raw({type: 'application/json'}), verifyWebhook, async (req, res) => {
  try {
    const data = JSON.parse(req.body);
    console.log(`📋 Customer data request received for shop: ${data.shop_domain}`);
    
    // In a real app, you would:
    // 1. Collect all customer data
    // 2. Send it to the customer
    // 3. Log the request
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Customer data request webhook error:', error);
    res.status(500).send('Error');
  }
});

router.post('/webhooks/customers/redact', express.raw({type: 'application/json'}), verifyWebhook, async (req, res) => {
  try {
    const data = JSON.parse(req.body);
    console.log(`🗑️ Customer redaction request received for shop: ${data.shop_domain}`);
    
    // In a real app, you would:
    // 1. Remove all customer data
    // 2. Log the redaction
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Customer redaction webhook error:', error);
    res.status(500).send('Error');
  }
});

router.post('/webhooks/shop/redact', express.raw({type: 'application/json'}), verifyWebhook, async (req, res) => {
  try {
    const data = JSON.parse(req.body);
    console.log(`🗑️ Shop redaction request received for shop: ${data.shop_domain}`);
    
    // Remove all shop data (48 hours after uninstall)
    await Store.findOneAndDelete({ shopifyShop: data.shop_domain });
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Shop redaction webhook error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;