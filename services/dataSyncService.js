const axios = require('axios');
const Store = require('../models/Store');
const AIIntegrationService = require('./aiIntegrationService');

class DataSyncService {
  constructor() {
    this.shopifyAPIVersion = '2023-10';
  }

  // Fetch products from Shopify
  async fetchShopifyProducts(shop, accessToken, limit = 250) {
    try {
      const url = `https://${shop}/admin/api/${this.shopifyAPIVersion}/products.json`;
      const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      };

      let allProducts = [];
      let nextPageInfo = null;
      
      do {
        const params = {
          limit: limit,
          fields: 'id,title,body_html,vendor,product_type,tags,handle,images,variants,seo_title,seo_description,created_at,updated_at'
        };
        
        if (nextPageInfo) {
          params.page_info = nextPageInfo;
        }

        const response = await axios.get(url, { headers, params });
        const products = response.data.products;
        
        allProducts = allProducts.concat(products);
        
        // Check for next page
        const linkHeader = response.headers.link;
        nextPageInfo = this.extractNextPageInfo(linkHeader);
        
      } while (nextPageInfo);

      return allProducts;
    } catch (error) {
      console.error(`Error fetching products for ${shop}:`, error.message);
      throw error;
    }
  }

  // Extract next page info from Link header
  extractNextPageInfo(linkHeader) {
    if (!linkHeader) return null;
    
    const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
    if (!nextLink) return null;
    
    const match = nextLink.match(/page_info=([^&>]+)/);
    return match ? match[1] : null;
  }

  // Transform Shopify product data to our format
  transformProductData(shopifyProducts) {
    return shopifyProducts.map(product => ({
      shopifyId: product.id.toString(),
      title: product.title,
      description: product.body_html ? product.body_html.replace(/<[^>]*>/g, '') : '',
      price: product.variants[0]?.price || 0,
      compareAtPrice: product.variants[0]?.compare_at_price || null,
      vendor: product.vendor,
      productType: product.product_type,
      tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
      images: product.images?.map(img => img.src) || [],
      variants: product.variants?.map(variant => ({
        id: variant.id.toString(),
        title: variant.title,
        price: parseFloat(variant.price),
        sku: variant.sku,
        inventory: variant.inventory_quantity || 0
      })) || [],
      seoTitle: product.seo_title,
      seoDescription: product.seo_description,
      handle: product.handle,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
      lastSyncedAt: new Date()
    }));
  }

  // Sync products for a single store
  async syncStore(storeId) {
    try {
      const store = await Store.findById(storeId);
      if (!store) {
        throw new Error(`Store with ID ${storeId} not found`);
      }

      console.log(`Starting sync for store: ${store.shopifyShop}`);

      // Check if store has active subscription
      if (store.subscription.status !== 'active' && store.subscription.status !== 'trial') {
        console.log(`Skipping sync for ${store.shopifyShop} - inactive subscription`);
        return { success: false, reason: 'inactive_subscription' };
      }

      // Fetch products from Shopify
      const shopifyProducts = await this.fetchShopifyProducts(
        store.shopifyShop, 
        store.accessToken,
        store.subscription.productLimit
      );

      // Limit products based on subscription plan
      const limitedProducts = shopifyProducts.slice(0, store.subscription.productLimit);
      
      // Transform products to our format
      const transformedProducts = this.transformProductData(limitedProducts);

      // Update store with new product data
      store.products = transformedProducts;
      store.lastSyncAt = new Date();
      await store.save();

      // Sync to AI providers
      const aiResults = await AIIntegrationService.syncToAIProviders(store);

      console.log(`Sync completed for ${store.shopifyShop}. Products: ${transformedProducts.length}`);

      return {
        success: true,
        productsSync: transformedProducts.length,
        aiResults: aiResults,
        timestamp: new Date()
      };

    } catch (error) {
      console.error(`Error syncing store ${storeId}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  // Sync stores by plan type
  async syncStoresByPlan(planType) {
    try {
      const stores = await Store.find({
        'subscription.plan': planType,
        'subscription.status': { $in: ['active', 'trial'] }
      });

      console.log(`Found ${stores.length} ${planType} plan stores to sync`);

      const results = [];
      for (const store of stores) {
        const result = await this.syncStore(store._id);
        results.push({
          storeId: store._id,
          shopifyShop: store.shopifyShop,
          ...result
        });

        // Add delay between stores to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      return results;
    } catch (error) {
      console.error(`Error syncing ${planType} plan stores:`, error.message);
      throw error;
    }
  }

  // Specific methods for each plan type
  async syncBasicPlanStores() {
    return this.syncStoresByPlan('basic');
  }

  async syncStandardPlanStores() {
    return this.syncStoresByPlan('standard');
  }

  async syncGrowthPlanStores() {
    return this.syncStoresByPlan('growth');
  }

  async syncPremiumPlanStores() {
    return this.syncStoresByPlan('premium');
  }

  // Manual sync for specific store (for premium users or testing)
  async manualSync(shopifyShop) {
    try {
      const store = await Store.findOne({ shopifyShop });
      if (!store) {
        throw new Error(`Store ${shopifyShop} not found`);
      }

      return await this.syncStore(store._id);
    } catch (error) {
      console.error(`Error in manual sync for ${shopifyShop}:`, error.message);
      throw error;
    }
  }

  // Get sync status for dashboard
  async getSyncStatus(shopifyShop) {
    try {
      const store = await Store.findOne({ shopifyShop });
      if (!store) {
        return { error: 'Store not found' };
      }

      return {
        lastSyncAt: store.lastSyncAt,
        productCount: store.products.length,
        subscriptionPlan: store.subscription.plan,
        syncFrequency: store.settings.syncFrequency,
        nextSyncEstimate: this.calculateNextSync(store),
        aiProviders: store.subscription.aiProviders
      };
    } catch (error) {
      console.error(`Error getting sync status for ${shopifyShop}:`, error.message);
      return { error: error.message };
    }
  }

  // Calculate next sync time based on plan
  calculateNextSync(store) {
    if (!store.lastSyncAt) return 'Pending first sync';

    const lastSync = new Date(store.lastSyncAt);
    const frequency = store.settings.syncFrequency;
    
    let hoursToAdd;
    switch (frequency) {
      case '2h': hoursToAdd = 2; break;
      case '6h': hoursToAdd = 6; break;
      case '12h': hoursToAdd = 12; break;
      case '24h': hoursToAdd = 24; break;
      default: hoursToAdd = 24;
    }

    const nextSync = new Date(lastSync.getTime() + (hoursToAdd * 60 * 60 * 1000));
    return nextSync;
  }
}

module.exports = new DataSyncService();