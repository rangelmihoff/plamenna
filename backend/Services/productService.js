const Product = require('../models/Product');
const AIService = require('./aiService');
const logger = require('../utils/logger');

class ProductService {
  async getProducts(shopId, { page = 1, limit = 10, search = '' }) {
    try {
      const query = { shop: shopId };
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }

      const [products, count] = await Promise.all([
        Product.find(query)
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .sort({ lastUpdated: -1 }),
        Product.countDocuments(query)
      ]);

      return {
        products,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit)
        }
      };
    } catch (err) {
      logger.error(`Product fetch error: ${err.message}`);
      throw err;
    }
  }

  async optimizeProductSEO(shopId, productId, fields) {
    try {
      const product = await Product.findOne({ _id: productId, shop: shopId });
      if (!product) {
        throw new Error('Product not found');
      }

      const prompt = this._generateSEOPrompt(product, fields);
      const aiResponse = await AIService.processQuery(shopId, prompt);

      const updates = this._parseAIResponse(aiResponse.response);
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { ...updates, aiOptimized: true, optimizedAt: new Date() },
        { new: true }
      );

      return updatedProduct;
    } catch (err) {
      logger.error(`SEO optimization error: ${err.message}`, { productId });
      throw err;
    }
  }

  _generateSEOPrompt(product, fields) {
    let prompt = `Generate SEO optimization for this product:\n\n`;
    prompt += `Title: ${product.title}\n`;
    prompt += `Description: ${product.description || 'N/A'}\n`;
    prompt += `Price: ${product.price}\n`;
    prompt += `Categories: ${product.categories?.join(', ') || 'N/A'}\n`;
    prompt += `Tags: ${product.tags?.join(', ') || 'N/A'}\n\n`;
    prompt += `Generate the following SEO elements:\n`;

    if (fields.includes('title')) {
      prompt += `- SEO title (max 60 chars, compelling and keyword-rich)\n`;
    }
    if (fields.includes('description')) {
      prompt += `- Meta description (max 160 chars, informative and engaging)\n`;
    }
    if (fields.includes('keywords')) {
      prompt += `- 5-10 relevant keywords (comma-separated)\n`;
    }
    if (fields.includes('altText') && product.featuredImage) {
      prompt += `- Alt text for product image (descriptive and concise)\n`;
    }

    prompt += `\nReturn a JSON object with the generated fields.`;
    return prompt;
  }

  _parseAIResponse(response) {
    try {
      const result = JSON.parse(response);
      const updates = {};

      if (result.title) updates.seoTitle = result.title;
      if (result.description) updates.seoDescription = result.description;
      if (result.keywords) {
        updates.seoKeywords = Array.isArray(result.keywords) 
          ? result.keywords 
          : result.keywords.split(',').map(k => k.trim());
      }
      if (result.altText) updates.seoAltText = result.altText;

      return updates;
    } catch (err) {
      logger.error('Failed to parse AI response', { response });
      throw new Error('Invalid AI response format');
    }
  }
}

module.exports = new ProductService();