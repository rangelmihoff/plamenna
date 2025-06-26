const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    unique: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  queriesUsed: {
    type: Number,
    default: 0,
  },
  lastBillingDate: {
    type: Date,
  },
  nextBillingDate: {
    type: Date,
  },
  chargeId: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tokensAllocated: {
    type: Map,
    of: Number,
    default: {
      openai: 0,
      anthropic: 0,
      google: 0,
      deepseek: 0,
      meta: 0
    }
  },
  tokensUsed: {
    type: Map,
    of: Number,
    default: {
      openai: 0,
      anthropic: 0,
      google: 0,
      deepseek: 0,
      meta: 0
    }
  }
});

subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Subscription', subscriptionSchema);