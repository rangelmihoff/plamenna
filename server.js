require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway/Heroku
app.set('trust proxy', 1);

// Basic middleware (load first)
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

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

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

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many API requests from this IP, please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (BEFORE database connection and routes)
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  };

  // Optional: Add database status if connected
  if (mongoose.connection.readyState === 1) {
    healthStatus.database = 'connected';
  } else {
    healthStatus.database = 'connecting';
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

// Start server FIRST, then connect to database
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Now connect to database after server is running
  connectDB();
});

// Connect to MongoDB with retry logic (AFTER server starts)
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.warn('⚠️ MONGODB_URI not set. Database features will be disabled.');
      return;
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
    });

    console.log('✅ Connected to MongoDB');
    
    // Initialize routes AFTER database connection
    initializeRoutes();
    
    // Initialize cron jobs AFTER routes
    initializeCronJobs();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️ Continuing without database. Some features will be disabled.');
  }
};

// Initialize routes after database connection
const initializeRoutes = () => {
  try {
    // Import routes
    const shopifyRoutes = require('./routes/shopify');
    const aiRoutes = require('./routes/ai');
    const analyticsRoutes = require('./routes/analytics');
    const subscriptionRoutes = require('./routes/subscriptions');

    // Apply rate limiting
    app.use('/api/ai', apiLimiter);
    app.use('/api/shopify/install', authLimiter);
    app.use('/api/shopify/callback', authLimiter);
    app.use(generalLimiter);

    // Routes
    app.use('/api/shopify', shopifyRoutes);
    app.use('/api/ai', aiRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/subscriptions', subscriptionRoutes);

    console.log('✅ Routes initialized');
  } catch (error) {
    console.error('❌ Error initializing routes:', error.message);
  }
};

// Initialize cron jobs
const initializeCronJobs = () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('⚠️ Cron jobs disabled in development mode');
    return;
  }

  try {
    const DataSyncService = require('./services/dataSyncService');

    // Basic plan: every 24 hours
    cron.schedule('0 0 * * *', async () => {
      console.log('🔄 Running daily sync for basic plan users');
      try {
        await DataSyncService.syncBasicPlanStores();
      } catch (error) {
        console.error('❌ Basic plan sync failed:', error);
      }
    });

    // Standard plan: every 12 hours
    cron.schedule('0 */12 * * *', async () => {
      console.log('🔄 Running 12-hour sync for standard plan users');
      try {
        await DataSyncService.syncStandardPlanStores();
      } catch (error) {
        console.error('❌ Standard plan sync failed:', error);
      }
    });

    // Growth plan: every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('🔄 Running 6-hour sync for growth plan users');
      try {
        await DataSyncService.syncGrowthPlanStores();
      } catch (error) {
        console.error('❌ Growth plan sync failed:', error);
      }
    });

    // Premium plan: every 2 hours
    cron.schedule('0 */2 * * *', async () => {
      console.log('🔄 Running 2-hour sync for premium plan users');
      try {
        await DataSyncService.syncPremiumPlanStores();
      } catch (error) {
        console.error('❌ Premium plan sync failed:', error);
      }
    });

    console.log('✅ Cron jobs initialized');
  } catch (error) {
    console.error('❌ Error initializing cron jobs:', error.message);
  }
};

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
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
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🛑 ${signal} received. Shutting down gracefully...`);
  
  // Close server first
  server.close((err) => {
    if (err) {
      console.error('❌ Error closing server:', err);
    } else {
      console.log('✅ Server closed');
    }
  });

  // Close database connection
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

module.exports = app;