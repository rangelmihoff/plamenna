const Analytics = require('../models/Analytics');
const Subscription = require('../models/Subscription');

class AnalyticsController {
  async getDashboardStats(req, res) {
    try {
      const { shop } = req;
      const { period = '30d' } = req.query;

      const dateFilter = this._getDateFilter(period);
      
      const [stats, subscription] = await Promise.all([
        Analytics.aggregate([
          { $match: { shop: shop._id, date: dateFilter } },
          { 
            $group: {
              _id: null,
              totalProducts: { $sum: "$syncedProducts" },
              totalQueries: { $sum: "$aiQueries" },
              tokensUsed: { 
                $mergeObjects: "$tokensUsed" 
              }
            }
          }
        ]),
        Subscription.findOne({ shop: shop._id }).populate('plan')
      ]);

      const result = {
        products: {
          current: stats[0]?.totalProducts || 0,
          limit: subscription.plan.productLimit
        },
        queries: {
          current: stats[0]?.totalQueries || 0,
          limit: subscription.plan.aiQueries
        },
        tokens: this._formatTokenStats(stats[0]?.tokensUsed || {}, subscription)
      };

      // Growth Extra и Enterprise статистики
      if (['Growth Extra', 'Enterprise'].includes(subscription.plan.name)) {
        result.marketingStats = await this._getMarketingStats(shop._id, dateFilter);
      }

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  _getDateFilter(period) {
    const now = new Date();
    switch (period) {
      case '7d': return { $gte: new Date(now.setDate(now.getDate() - 7)) };
      case '30d': return { $gte: new Date(now.setDate(now.getDate() - 30)) };
      case '90d': return { $gte: new Date(now.setDate(now.getDate() - 90)) };
      default: return { $gte: new Date(0) };
    }
  }

  _formatTokenStats(tokensUsed, subscription) {
    return Object.entries(subscription.tokensAllocated.toObject()).map(([provider, allocated]) => ({
      provider,
      used: tokensUsed[provider] || 0,
      allocated,
      remaining: Math.max(0, allocated - (tokensUsed[provider] || 0))
    }));
  }

  async _getMarketingStats(shopId, dateFilter) {
    // Имплементация за специфични marketing метрики
    return {
      topProducts: [...], 
      conversionRate: 0.15,
      aiGeneratedRevenue: 4200
    };
  }
}

module.exports = new AnalyticsController();