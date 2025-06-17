const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  shopifyShop: {
    type: String,
    required: true,
    unique: true
  },
  accessToken: {
    type: String,
    required: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'standard', 'growth', 'premium'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'trial'
    },
    aiProviders: [{
      type: String,
      enum: ['claude', 'openai', 'gemini', 'deepseek', 'llama']
    }],
    expiresAt: Date,
    productLimit: {
      type: Number,
      default: 200
    }
  },
  products: [{
    shopifyId: String,
    title: String,
    description: String,
    price: Number,
    compareAtPrice: Number,
    vendor: String,
    productType: String,
    tags: [String],
    images: [String],
    variants: [{
      id: String,
      title: String,
      price: Number,
      sku: String,
      inventory: Number
    }],
    seoTitle: String,
    seoDescription: String,
    handle: String,
    createdAt: Date,
    updatedAt: Date,
    lastSyncedAt: Date
  }],
  analytics: {
    totalAIQueries: {
      type: Number,
      default: 0
    },
    aiQueryHistory: [{
      provider: String,
      query: String,
      productsMentioned: [String],
      timestamp: Date,
      source: String // 'claude', 'openai', etc.
    }],
    topRecommendedProducts: [{
      productId: String,
      mentions: Number,
      lastMentioned: Date
    }],
    monthlyStats: [{
      month: String, // YYYY-MM
      queries: Number,
      mentions: Number,
      topProducts: [String]
    }]
  },
  settings: {
    syncFrequency: {
      type: String,
      enum: ['24h', '12h', '6h', '2h'],
      default: '24h'
    },
    enabledFeatures: {
      realTimeSync: {
        type: Boolean,
        default: false
      },
      advancedAnalytics: {
        type: Boolean,
        default: false
      },
      priorityListing: {
        type: Boolean,
        default: false
      }
    },
    aiOptimization: {
      optimizeDescriptions: {
        type: Boolean,
        default: true
      },
      optimizeTitles: {
        type: Boolean,
        default: true
      },
      generateTags: {
        type: Boolean,
        default: true
      }
    }
  },
  lastSyncAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
storeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
storeSchema.index({ shopifyShop: 1 });
storeSchema.index({ 'subscription.plan': 1 });
storeSchema.index({ 'subscription.status': 1 });

module.exports = mongoose.model('Store', storeSchema);