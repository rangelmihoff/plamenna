const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Shop = require('../models/Shop');

class SubscriptionService {
  async initializePlans() {
    const plans = [
      {
        name: 'Starter',
        price: 10,
        aiQueries: 50,
        productLimit: 150,
        aiProviders: ['deepseek', 'meta'],
        syncFrequency: 'every 2 weeks',
        seoOptimization: false,
        multiProductOptimization: false,
      },
      {
        name: 'Professional',
        price: 39,
        aiQueries: 600,
        productLimit: 300,
        aiProviders: ['openai', 'deepseek', 'meta'],
        syncFrequency: 'every 48h',
        seoOptimization: true,
        multiProductOptimization: false,
      },
      // Add other plans similarly
    ];

    for (const planData of plans) {
      await Plan.findOneAndUpdate(
        { name: planData.name },
        planData,
        { upsert: true }
      );
    }
  }

  async createSubscription(shopId, planName) {
    const plan = await Plan.findOne({ name: planName });
    if (!plan) throw new Error('Plan not found');

    const subscription = new Subscription({
      shop: shopId,
      plan: plan._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      isActive: true,
      queriesUsed: 0,
    });

    await subscription.save();
    return subscription;
  }

  async checkSubscription(shopId) {
    return Subscription.findOne({ shop: shopId }).populate('plan');
  }
}

module.exports = new SubscriptionService();