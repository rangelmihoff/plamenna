const { Shopify } = require('@shopify/shopify-api');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

class ShopifyService {
  async syncProducts(shopDomain) {
    const shop = await Shop.findOne({ shopifyDomain: shopDomain });
    if (!shop) throw new Error('Shop not found');

    const client = new Shopify.Clients.Rest(shop.shopifyDomain, shop.accessToken);

    // Fetch products from Shopify
    const response = await client.get({
      path: 'products',
      query: {
        limit: 250,
        fields: 'id,title,body_html,variants,images,handle,tags',
      },
    });

    const products = response.body.products;

    // Transform and save products
    const productPromises = products.map(async (shopifyProduct) => {
      const productData = this._transformProduct(shopifyProduct, shop._id);
      return Product.findOneAndUpdate(
        { shopifyId: shopifyProduct.id, shop: shop._id },
        productData,
        { upsert: true, new: true }
      );
    });

    await Promise.all(productPromises);
    await Analytics.create({
      shop: shop._id,
      syncedProducts: result.count,
      plan: subscription.plan.name
    });

    // Update shop sync timestamps
    shop.lastSync = new Date();
    await shop.save();

    return { count: products.length };
  }

  _transformProduct(shopifyProduct, shopId) {
    const mainImage = shopifyProduct.images.length > 0 ? shopifyProduct.images[0].src : null;
    const price = shopifyProduct.variants.length > 0 ? shopifyProduct.variants[0].price : 0;
    const compareAtPrice = shopifyProduct.variants.length > 0 ? shopifyProduct.variants[0].compare_at_price : null;
    const available = shopifyProduct.variants.some(v => v.inventory_quantity > 0);

    return {
      shop: shopId,
      shopifyId: shopifyProduct.id,
      title: shopifyProduct.title,
      description: shopifyProduct.body_html,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      handle: shopifyProduct.handle,
      featuredImage: mainImage,
      images: shopifyProduct.images.map(img => img.src),
      available,
      inventoryQuantity: shopifyProduct.variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0),
      categories: this._extractCategories(shopifyProduct.tags),
      tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map(t => t.trim()) : [],
      variants: shopifyProduct.variants.map(v => ({
        id: v.id,
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
        inventoryQuantity: v.inventory_quantity || 0,
      })),
      lastUpdated: new Date(),
    };
  }

  _extractCategories(tags) {
    if (!tags) return [];
    const categoryPrefixes = ['category:', 'cat:', 'type:'];
    const categoryTags = tags.split(',')
      .map(t => t.trim())
      .filter(t => categoryPrefixes.some(prefix => t.startsWith(prefix)))
      .map(t => t.replace(/^(category|cat|type):/i, '').trim());
    return [...new Set(categoryTags)];
  }
}

module.exports = new ShopifyService();