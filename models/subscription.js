const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['basic', 'standard', 'growth', 'premium'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  features: {
    maxProducts: Number,
    aiProviders: [{
      type: String,
      enum: ['claude', 'openai', 'gemini', 'deepseek', 'llama']
    }],
    syncFrequency: String,  // '24h', '12h', '6h', '2h'
    analytics: {
      basic: Boolean,
      advanced: Boolean,
      realTime: Boolean
    },
    priorityListing: Boolean,
    support: String // 'email', 'priority', 'dedicated'
  }
});

const subscriptionPlans = [
  {
    name: 'basic',
    price: 19.99,
    features: {
      maxProducts: 200,
      aiProviders: ['claude'], // User can choose 1
      syncFrequency: '24h',
      analytics: {
        basic: true,
        advanced: false,
        realTime: false
      },
      priorityListing: false,
      support: 'email'
    }
  },
  {
    name: 'standard',
    price: 49.99,
    features: {
      maxProducts: 500,
      aiProviders: ['claude', 'openai'], // User can choose 2
      syncFrequency: '12h',
      analytics: {
        basic: true,
        advanced: true,
        realTime: false
      },
      priorityListing: false,
      support: 'priority'
    }
  },
  {
    name: 'growth',
    price: 99.99,
    features: {
      maxProducts: 1000,
      aiProviders: ['claude', 'openai', 'gemini', 'deepseek', 'llama'], // All 5
      syncFrequency: '6h',
      analytics: {
        basic: true,
        advanced: true,
        realTime: false
      },
      priorityListing: true,
      support: 'priority'
    }
  },
  {
    name: 'premium',
    price: 199.99,
    features: {
      maxProducts: 10000,
      aiProviders: ['claude', 'openai', 'gemini', 'deepseek', 'llama'], // All 5
      syncFrequency: '2h',
      analytics: {
        basic: true,
        advanced: true,
        realTime: true
      },
      priorityListing: true,
      support: 'dedicated'
    }
  }
];

module.exports = {
  SubscriptionPlan: mongoose.model('SubscriptionPlan', subscriptionPlanSchema),
  subscriptionPlans
};