const AIQuery = require('../models/AIQuery');
const AIService = require('../services/aiService');
const Subscription = require('../models/Subscription');
const { validationResult } = require('express-validator');

class AIController {
  async processQuery(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shop } = req;
      const { query, provider } = req.body;

      const result = await AIService.processQuery(shop._id, query, provider);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getQueryHistory(req, res, next) {
    try {
      const { shop } = req;
      const { page = 1, limit = 10 } = req.query;

      const queries = await AIQuery.find({ shop: shop._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      const count = await AIQuery.countDocuments({ shop: shop._id });

      res.json({
        success: true,
        data: queries,
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

  async getUsageStats(req, res, next) {
    try {
      const { shop } = req;
      const subscription = await Subscription.findOne({ shop: shop._id }).populate('plan');

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }

      const queriesUsed = await AIQuery.countDocuments({
        shop: shop._id,
        createdAt: { $gte: subscription.startDate },
      });

      res.json({
        success: true,
        data: {
          plan: subscription.plan.name,
          queriesUsed,
          queriesLimit: subscription.plan.aiQueries,
          queriesRemaining: Math.max(0, subscription.plan.aiQueries - queriesUsed),
          nextBillingDate: subscription.nextBillingDate,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AIController();