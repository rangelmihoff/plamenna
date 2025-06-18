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
      return res.status(400).json({ error: 'Shop parameter is required' });
    }

    if (!process.env.SHOPIFY_API_KEY) {
      return res.status(500).json({ error: 'SHOPIFY_API_KEY not configured' });
    }

    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
    if (!shopRegex.test(shop)) {
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
    console.log(`🔗 Full install URL: ${installUrl}`);
    
    res.redirect(installUrl);
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
    return res.status(400).json({ error: 'Missing required OAuth parameters' });
  }

  try {
    // Exchange code for access token
    const axios = require('axios');
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code: code
    });

    const { access_token } = tokenResponse.data;
    console.log(`🎉 Access token received for ${shop}`);

    // For now, return success message
    res.json({
      success: true,
      message: `App successfully installed on ${shop}!`,
      shop: shop,
      note: 'OAuth flow completed successfully. Database integration coming next...'
    });

  } catch (error) {
    console.error(`❌ OAuth error for ${shop}:`, error.message);
    res.status(500).json({
      error: 'OAuth flow failed',
      details: error.message
    });
  }
});

// AI Test Connectivity
app.get('/api/ai/test-connectivity', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working!',
    providers: {
      claude: process.env.CLAUDE_API_KEY ? 'configured' : 'missing',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing',
      deepseek: process.env.DEEPSEEK_API_KEY ? 'configured' : 'missing',
      llama: process.env.LLAMA_API_KEY ? 'configured' : 'missing'
    }
  });
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