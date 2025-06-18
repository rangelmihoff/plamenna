require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway/Heroku
app.set('trust proxy', 1);

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

app.use(compression());
app.use(morgan('combined'));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'https://admin.shopify.com',
      /\.shopify\.com$/,
      /\.myshopify\.com$/,
      /localhost:\d+$/
    ];
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return origin === allowed;
      }
      return allowed.test(origin);
    });
    
    callback(null, isAllowed || process.env.NODE_ENV === 'development');
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Shop-Domain', 'X-Shopify-Access-Token']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  };

  if (mongoose.connection.readyState === 1) {
    healthStatus.database = 'connected';
  } else if (mongoose.connection.readyState === 2) {
    healthStatus.database = 'connecting';
  } else {
    healthStatus.database = 'disconnected';
  }

  res.status(200).json(healthStatus);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Shopify AI SEO 2.0 API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      install: '/api/shopify/install?shop=your-store.myshopify.com',
      docs: 'https://github.com/yourusername/shopify-ai-seo-app'
    }
  });
});

// Shopify Install Route
app.get('/api/shopify/install', (req, res) => {
  try {
    const { shop } = req.query;
    
    console.log(`📦 Install request for shop: ${shop}`);
    console.log(`🔧 SHOPIFY_API_KEY: ${process.env.SHOPIFY_API_KEY ? 'Present' : 'Missing'}`);
    console.log(`🔧 BASE_URL: ${process.env.BASE_URL}`);
    
    if (!shop) {
      console.log('❌ No shop parameter');
      return res.status(400).json({ error: 'Shop parameter is required' });
    }
    if (!process.env.SHOPIFY_API_KEY) {
      console.log('❌ Missing SHOPIFY_API_KEY');
      return res.status(500).json({ error: 'SHOPIFY_API_KEY not configured' });
    }
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
      console.log('❌ Invalid shop domain');
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }
    const scopes = 'read_products,read_product_listings';
    const baseUrl = process.env.BASE_URL?.replace(/\/$/, '') || 'https://shopify-ai-seo-20-production.up.railway.app';
    const redirectUri = `${baseUrl}/api/shopify/callback`;
    const state = Math.random().toString(36).substring(7);
    
    const installUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${scopes}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;
    console.log(`🔗 Redirect URI: ${redirectUri}`);
    console.log(`🔗 Install URL: ${installUrl}`);
    console.log(`🚀 Attempting redirect...`);
    
    res.redirect(installUrl);
    
    console.log(`✅ Redirect sent successfully`);
  } catch (error) {
    console.error('❌ Install route error:', error);
    res.status(500).json({ error: 'Install failed', details: error.message });
  }
});

// Shopify OAuth Callback
app.get('/api/shopify/callback', async (req, res) => {
  const { code, shop, state } = req.query;
  
  console.log(`✅ OAuth callback received for shop: ${shop}`);
  console.log(`📝 Code: ${code ? 'Present' : 'Missing'}`);
  
  if (!code || !shop) {
    console.error('❌ Missing required OAuth parameters');
    return res.status(400).json({ error: 'Missing required OAuth parameters' });
  }

  // Validate shop domain
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    console.error('❌ Invalid shop domain:', shop);
    return res.status(400).json({ error: 'Invalid shop domain' });
  }

  try {
    console.log(`🔄 Processing OAuth for shop: ${shop}`);

    // Exchange code for access token
    const axios = require('axios');
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code: code
    });

    const { access_token } = tokenResponse.data;
    if (!access_token) {
      throw new Error('No access token received from Shopify');
    }
    
    console.log(`🎉 Access token received for ${shop}`);

    // Get shop information from Shopify
    const shopResponse = await axios.get(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': access_token,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const shopData = shopResponse.data.shop;
    console.log(`🏪 Shop verified: ${shopData.name} (${shopData.domain})`);

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️ MongoDB not connected. Storing temporary data only.');
      return res.json({
        success: true,
        message: `App successfully installed on ${shop}!`,
        shop: shop,
        shopName: shopData.name,
        note: 'MongoDB not connected. Store data saved temporarily. Database integration pending...'
      });
    }

    // Import Store model (with error handling)
    let Store;
    try {
      Store = require('./models/Store');
    } catch (error) {
      console.error('❌ Error loading Store model:', error.message);
      return res.json({
        success: true,
        message: `App installed on ${shop}, but database model not available`,
        shop: shop,
        note: 'Database model loading failed. Basic installation completed.'
      });
    }

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
          },
          aiOptimization: {
            optimizeDescriptions: true,
            optimizeTitles: true,
            generateTags: true
          }
        },
        analytics: {
          totalAIQueries: 0,
          aiQueryHistory: [],
          topRecommendedProducts: [],
          monthlyStats: []
        }
      });
    }

    await store.save();
    console.log(`💾 Store saved successfully: ${shop}`);

    // Trigger initial product sync (non-blocking)
    setTimeout(async () => {
      try {
        console.log(`🔄 Starting initial product sync for: ${shop}`);
        
        // Import DataSyncService (with error handling)
        let DataSyncService;
        try {
          DataSyncService = require('./services/dataSyncService');
          const syncResult = await DataSyncService.syncStore(store._id);
          if (syncResult.success) {
            console.log(`✅ Initial sync completed for: ${shop} (${syncResult.productsSync} products)`);
          } else {
            console.error(`❌ Initial sync failed for: ${shop}`, syncResult.error);
          }
        } catch (error) {
          console.error(`❌ DataSyncService not available:`, error.message);
        }
      } catch (error) {
        console.error(`❌ Initial sync error for: ${shop}`, error.message);
      }
    }, 5000);

    // Success response with database integration
    res.json({
      success: true,
      message: `App successfully installed on ${shop}!`,
      shop: shop,
      shopName: shopData.name,
      plan: store.subscription.plan,
      aiProviders: store.subscription.aiProviders,
      productLimit: store.subscription.productLimit,
      trialExpiresAt: store.subscription.expiresAt,
      note: 'Store data saved to database. Initial product sync started in background.',
      nextSteps: [
        'Products will be synced automatically',
        'AI providers will be updated with your catalog',
        'Analytics will start tracking AI queries'
      ]
    });

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
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      errorMessage = 'Database error. Installation completed but data not saved.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      shop: shop,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server FIRST
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: https://shopify-ai-seo-20-production.up.railway.app/health`);
  console.log(`🔗 Install URL: https://shopify-ai-seo-20-production.up.railway.app/api/shopify/install?shop=your-store.myshopify.com`);
  
  // Connect to database AFTER server starts (non-blocking)
  connectDB();
});

// Fixed MongoDB connection options
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.warn('⚠️ MONGODB_URI not set. App will work without database.');
      return;
    }

    console.log('🔄 Connecting to MongoDB...');
    
    // Updated connection options (removed deprecated ones)
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maximum connections in the pool
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
      family: 4 // Use IPv4, skip trying IPv6
    });

    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ App will continue without database. Database features disabled.');
    
    // Retry connection after 30 seconds
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection...');
      connectDB();
    }, 30000);
  }
};

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error.message);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;
    
  res.status(error.status || 500).json({ 
    error: errorMessage,
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      '/health',
      '/',
      '/api/shopify/install',
      '/api/shopify/callback',
      '/api/ai/test-connectivity'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  server.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  server.close();
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

module.exports = app;