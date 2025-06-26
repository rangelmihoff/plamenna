const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const SubscriptionService = require('../services/subscriptionService');
const { Shopify } = require('@shopify/shopify-api');

class SubscriptionController {
  async getPlans(req, res, next) {
    try {
      const plans = await Plan.find({});
      res.json({
        success: true,
        data: plans
      });
    } catch (err) {
      next(err);
    }
  }

  async getCurrentSubscription(req, res, next) {
    try {
      const { shop } = req;
      const subscription = await Subscription.findOne({ shop: shop._id }).populate('plan');
      
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'No subscription found'
        });
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (err) {
      next(err);
    }
  }

  async createSubscription(req, res, next) {
    try {
      const { shop } = req;
      const { planName } = req.body;

      // Check if already has active subscription
      const existing = await Subscription.findOne({ shop: shop._id });
      if (existing && existing.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Shop already has an active subscription'
        });
      }

      // Create billing charge with Shopify
      const plan = await Plan.findOne({ name: planName });
      if (!plan) {
        return res.status(404).json({
          success: false,
          message: 'Plan not found'
        });
      }

      const client = new Shopify.Clients.Rest(shop.shopifyDomain, shop.accessToken);
      const charge = await client.post({
        path: 'recurring_application_charges',
        data: {
          recurring_application_charge: {
            name: `AI SEO 2.0 - ${plan.name} Plan`,
            price: plan.price,
            return_url: `${process.env.HOST}/auth/callback`,
            test: process.env.NODE_ENV !== 'production',
            trial_days: 5
          }
        }
      });

      // Store charge ID temporarily (will be confirmed via webhook)
      const subscription = new Subscription({
        shop: shop._id,
        plan: plan._id,
        chargeId: charge.body.recurring_application_charge.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        isActive: false // Will be activated after payment
      });

      await subscription.save();

      res.json({
        success: true,
        data: {
          confirmationUrl: charge.body.recurring_application_charge.confirmation_url
        }
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubscriptionController();