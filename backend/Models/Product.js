const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  shopifyId: {
    type: String,
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  compareAtPrice: {
    type: Number,
  },
  handle: {
    type: String,
    required: true,
  },
  featuredImage: {
    type: String,
  },
  images: {
    type: [String],
  },
  available: {
    type: Boolean,
    default: true,
  },
  inventoryQuantity: {
    type: Number,
    default: 0,
  },
  seoTitle: {
    type: String,
  },
  seoDescription: {
    type: String,
  },
  seoKeywords: {
    type: [String],
  },
  seoAltText: {
    type: String,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  aiOptimized: {
    type: Boolean,
    default: false,
  },
  optimizedAt: {
    type: Date,
  },
  categories: {
    type: [String],
  },
  tags: {
    type: [String],
  },
  variants: [
    {
      id: String,
      title: String,
      price: Number,
      sku: String,
      inventoryQuantity: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.index({ shop: 1, shopifyId: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);