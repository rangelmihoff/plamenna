const Shop = require('../models/Shop');
const SubscriptionService = require('../services/subscriptionService');
const ShopifyService = require('../services/shopifyService');

class ShopController {
  async getShopInfo(req, res, next) {
    try {
      const { shop } = req;
      
      // Get subscription info
      const subscription = await SubscriptionService.checkSubscription(shop._id);
      
      // Get product count
      const productCount = await Product.countDocuments({ shop: shop._id });
      
      res.json({
        success: true,
        data: {
          shop: {
            domain: shop.shopifyDomain,
            plan: subscription.plan.name,
            trialEndDate: shop.trialEndDate,
            isActive: shop.isActive,
            language: shop.language,
            lastSync: shop.lastSync,
            nextSync: shop.nextSync,
          },
          limits: {
            products: productCount,
            productLimit: subscription.plan.productLimit,
            queriesUsed: subscription.queriesUsed,
            queriesLimit: subscription.plan.aiQueries,
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }

  async updateShopSettings(req, res, next) {
    try {
      const { shop } = req;
      const { language } = req.body;

      if (language && !['en', 'fr', 'es', 'de'].includes(language)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid language code'
        });
      }

      const updates = {};
      if (language) updates.language = language;

      const updatedShop = await Shop.findByIdAndUpdate(
        shop._id,
        updates,
        { new: true }
      );

      res.json({
        success: true,
        data: updatedShop
      });
    } catch (err) {
      next(err);
    }
  }

  async getSyncStatus(req, res, next) {
    try {
      const { shop } = req;
      
      res.json({
        success: true,
        data: {
          lastSync: shop.lastSync,
          nextSync: shop.nextSync,
          syncFrequency: shop.plan.syncFrequency
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ShopController();