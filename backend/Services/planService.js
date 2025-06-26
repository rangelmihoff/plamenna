const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

class PlanService {
  async initializeDefaultPlans() {
    const defaultPlans = [
      {
        name: 'Starter',
        price: 10,
        aiQueries: 50,
        productLimit: 150,
        aiProviders: ['deepseek', 'meta'],
        syncFrequency: 'every 2 weeks',
        seoOptimization: false,
        multiProductOptimization: false
      },
      {
        name: 'Professional',
        price: 39,
        aiQueries: 600,
        productLimit: 300,
        aiProviders: ['openai', 'deepseek', 'meta'],
        syncFrequency: 'every 48h',
        seoOptimization: true,
        multiProductOptimization: false
      },
      {
        name: 'Growth',
        price: 59,
        aiQueries: 1500,
        productLimit: 1000,
        aiProviders: ['openai', 'anthropic', 'deepseek', 'meta'],
        syncFrequency: 'every 24h',
        seoOptimization: true,
        multiProductOptimization: true
      },
      {
        name: 'Growth Extra',
        price: 119,
        aiQueries: 4000,
        productLimit: 2000,
        aiProviders: ['openai', 'anthropic', 'google', 'deepseek'],
        syncFrequency: 'every 12h',
        seoOptimization: true,
        multiProductOptimization: true
      },
      {
        name: 'Enterprise',
        price: 299,
        aiQueries: 10000,
        productLimit: 10000,
        aiProviders: ['openai', 'anthropic', 'google', 'deepseek', 'meta'],
        syncFrequency: 'every 2h',
        seoOptimization: true,
        multiProductOptimization: true
      }
    ];

    try {
      for (const planData of defaultPlans) {
        await Plan.findOneAndUpdate(
          { name: planData.name },
          planData,
          { upsert: true }
        );
      }
      logger.info('Default plans initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize default plans', { error: err });
      throw err;
    }
  }

  async getAvailablePlans() {
    try {
      return await Plan.find({}).sort({ price: 1 });
    } catch (err) {
      logger.error('Failed to fetch available plans', { error: err });
      throw err;
    }
  }

  async getPlanById(planId) {
    try {
      return await Plan.findById(planId);
    } catch (err) {
      logger.error(`Failed to fetch plan with ID ${planId}`, { error: err });
      throw err;
    }
  }

  async validatePlanFeatures(planId, requiredFeatures) {
    try {
      const plan = await this.getPlanById(planId);
      if (!plan) return false;

      return requiredFeatures.every(feature => plan[feature] === true);
    } catch (err) {
      logger.error('Plan feature validation failed', { error: err });
      return false;
    }
  }
}

module.exports = new PlanService();