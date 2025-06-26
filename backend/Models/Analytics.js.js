const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  syncedProducts: {
    type: Number,
    default: 0
  },
  aiQueries: {
    type: Number,
    default: 0
  },
  tokensUsed: {
    type: Map,
    of: Number,
    default: {}
  },
  plan: {
    type: String,
    enum: ['Starter', 'Professional', 'Growth', 'Growth Extra', 'Enterprise'],
    required: true
  }
}, { timestamps: true });

analyticsSchema.index({ shop: 1, date: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);