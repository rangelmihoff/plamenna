const mongoose = require('mongoose');

const aiQuerySchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
  response: {
    type: String,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  provider: {
    type: String,
    required: true,
    enum: ['openai', 'anthropic', 'google', 'deepseek', 'meta'],
  },
  model: {
    type: String,
    required: true,
  },
  tokensUsed: {
    type: Number,
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  metadata: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('AIQuery', aiQuerySchema);