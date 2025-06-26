const Product = require('../models/Product');
const ShopifyService = require('../services/shopifyService');
const AIService = require('../services/aiService');
const { validationResult } = require('express-validator');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { shop } = req;
      const { page = 1, limit = 10, search } = req.query;

      const query = { shop: shop._id };
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } },
        ];
      }

      const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ lastUpdated: -1 });

      const count = await Product.countDocuments(query);

      res.json({
        success: true,
        data: products,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async syncProducts(req, res, next) {
    try {
      const { shop } = req;
      const result = await ShopifyService.syncProducts(shop.shopifyDomain);
      res.json({
        success: true,
        message: `Synced ${result.count} products`,
      });
    } catch (err) {
      next(err);
    }
  }

  async optimizeProductSEO(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shop } = req;
      const { productId } = req.params;
      const { fields } = req.body;

      // Check if plan allows SEO optimization
      const subscription = await SubscriptionService.checkSubscription(shop._id);
      if (!subscription.plan.seoOptimization) {
        return res.status(403).json({
          success: false,
          message: 'SEO optimization not available in your plan',
        });
      }

      const product = await Product.findOne({ _id: productId, shop: shop._id });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Generate SEO content with AI
      const optimizationResults = {};
      const prompt = this._createSEOPrompt(product, fields);

      const aiResponse = await AIService.processQuery(
        shop._id,
        prompt,
        subscription.plan.aiProviders[0]
      );

      // Parse AI response and update product
      const updates = this._parseAIResponse(aiResponse.response);
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { ...updates, aiOptimized: true, optimizedAt: new Date() },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedProduct,
      });
    } catch (err) {
      next(err);
    }
  }

  _createSEOPrompt(product, fields) {
    let prompt = `Optimize the following product for SEO. Product details:\n`;
    prompt += `Title: ${product.title}\n`;
    prompt += `Description: ${product.description}\n`;
    prompt += `Price: ${product.price}\n`;
    prompt += `Category: ${product.categories.join(', ')}\n`;
    prompt += `Tags: ${product.tags.join(', ')}\n\n`;
    prompt += `Generate the following SEO elements:\n`;

    if (fields.includes('title')) {
      prompt += `- SEO title (max 60 characters)\n`;
    }
    if (fields.includes('description')) {
      prompt += `- Meta description (max 160 characters)\n`;
    }
    if (fields.includes('keywords')) {
      prompt += `- 5-10 relevant keywords\n`;
    }
    if (fields.includes('altText') && product.featuredImage) {
      prompt += `- Alt text for the product image\n`;
    }

    prompt += `Return the response in JSON format with the fields you generate.`;

    return prompt;
  }

  _parseAIResponse(response) {
    try {
      const parsed = JSON.parse(response);
      const updates = {};

      if (parsed.title) updates.seoTitle = parsed.title;
      if (parsed.description) updates.seoDescription = parsed.description;
      if (parsed.keywords) updates.seoKeywords = parsed.keywords;
      if (parsed.altText) updates.seoAltText = parsed.altText;

      return updates;
    } catch (err) {
      console.error('Error parsing AI response:', err);
      return {};
    }
  }
}

module.exports = new ProductController();