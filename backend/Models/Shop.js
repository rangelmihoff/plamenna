const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopifyDomain: {
    type: String,
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
  },
  trialEndDate: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5-day trial
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSync: {
    type: Date,
  },
  nextSync: {
    type: Date,
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'fr', 'es', 'de'],
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

shopSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Shop', shopSchema);