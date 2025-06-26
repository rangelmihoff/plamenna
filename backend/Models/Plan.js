const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['Starter', 'Professional', 'Growth', 'Growth Extra', 'Enterprise'],
  },
  price: {
    type: Number,
    required: true,
  },
  aiQueries: {
    type: Number,
    required: true,
  },
  productLimit: {
    type: Number,
    required: true,
  },
  aiProviders: {
    type: [String],
    required: true,
    enum: ['openai', 'anthropic', 'google', 'deepseek', 'meta'],
  },
  syncFrequency: {
    type: String,
    required: true,
  },
  seoOptimization: {
    type: Boolean,
    default: false,
  },
  multiProductOptimization: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

planSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Plan', planSchema);