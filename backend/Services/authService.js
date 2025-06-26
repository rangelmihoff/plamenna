const Shop = require('../models/Shop');
const { Shopify } = require('@shopify/shopify-api');
const logger = require('../utils/logger');

class AuthService {
  async handleAuthCallback(req, res) {
    try {
      const session = await Shopify.Auth.validateAuthCallback(
        req,
        res,
        req.query
      );

      // Find or create shop record
      const shop = await Shop.findOneAndUpdate(
        { shopifyDomain: session.shop },
        {
          accessToken: session.accessToken,
          isActive: true,
          $setOnInsert: {
            trialEndDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5-day trial
            language: 'en'
          }
        },
        { upsert: true, new: true }
      );

      logger.info(`Shop ${session.shop} authenticated successfully`);
      return shop;
    } catch (err) {
      logger.error(`Auth callback error: ${err.message}`, { error: err });
      throw err;
    }
  }

  async getAuthUrl(req, res, shop) {
    try {
      return await Shopify.Auth.beginAuth(
        req,
        res,
        shop,
        '/auth/callback',
        false
      );
    } catch (err) {
      logger.error(`Auth URL generation error: ${err.message}`);
      throw err;
    }
  }

  async validateSession(req, res) {
    try {
      return await Shopify.Utils.loadCurrentSession(req, res, true);
    } catch (err) {
      logger.error(`Session validation error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = new AuthService();