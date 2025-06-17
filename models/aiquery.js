const mongoose = require('mongoose');

const aiQuerySchema = new mongoose.Schema({
  query: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['claude', 'openai', 'gemini', 'deepseek', 'llama'],
    required: true
  },
  response: String,
  productsMatched: [{
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store'
    },
    productId: String,
    relevanceScore: Number,
    mentioned: Boolean
  }],
  userLocation: String,
  userAgent: String,
  sessionId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

aiQuerySchema.index({ timestamp: -1 });
aiQuerySchema.index({ provider: 1 });
aiQuerySchema.index({ 'productsMatched.storeId': 1 });

module.exports = mongoose.model('AIQuery', aiQuerySchema);