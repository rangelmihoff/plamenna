const AuthService = require('../services/authService');
const SubscriptionService = require('../services/subscriptionService');
const Shop = require('../models/Shop');
const logger = require('../utils/logger');

class AuthController {
  async install(req, res) {
    try {
      const { shop } = req.query;
      
      if (!shop) {
        logger.warn('Install request missing shop parameter');
        return res.status(400).json({
          success: false,
          message: 'Shop parameter is required'
        });
      }

      const authUrl = await AuthService.getAuthUrl(req, res, shop);
      res.redirect(authUrl);
    } catch (err) {
      logger.error(`Install error: ${err.message}`, { error: err });
      res.status(500).json({
        success: false,
        message: 'Failed to initiate installation'
      });
    }
  }

  async callback(req, res) {
    try {
      const shop = await AuthService.handleAuthCallback(req, res);
      
      // Initialize default subscription (trial)
      await SubscriptionService.initializePlans();
      await SubscriptionService.createSubscription(shop._id, 'Starter');

      // Redirect to app with session
      const redirectUrl = await this._getAppRedirectUrl(req, shop);
      res.redirect(redirectUrl);
    } catch (err) {
      logger.error(`Auth callback error: ${err.message}`, { error: err });
      res.status(500).send('Error during authentication');
    }
  }

  async validateSession(req, res) {
    try {
      const session = await AuthService.validateSession(req, res);
      
      if (!session) {
        logger.warn('Invalid session validation attempt');
        return res.status(401).json({
          success: false,
          message: 'Invalid session'
        });
      }

      const shop = await Shop.findOne({ shopifyDomain: session.shop });
      if (!shop) {
        logger.warn('Shop not found during session validation', { shop: session.shop });
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      res.json({
        success: true,
        data: {
          shop: shop.shopifyDomain,
          isActive: shop.isActive,
          trialEndDate: shop.trialEndDate
        }
      });
    } catch (err) {
      logger.error(`Session validation error: ${err.message}`, { error: err });
      res.status(500).json({
        success: false,
        message: 'Failed to validate session'
      });
    }
  }

  async _getAppRedirectUrl(req, shop) {
    const { host } = req.query;
    const appUrl = `https://${shop.shopifyDomain}/admin/apps/${process.env.SHOPIFY_API_KEY}`;
    
    if (host) {
      return `${appUrl}?shop=${shop.shopifyDomain}&host=${host}`;
    }
    return appUrl;
  }
}

module.exports = new AuthController();