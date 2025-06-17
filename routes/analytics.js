const express = require('express');
const Store = require('../models/Store');
const AIQuery = require('../models/AIQuery');
const router = express.Router();

// Get analytics dashboard data
router.get('/store/:shop/dashboard', async (req, res) => {
  try {
    const { shop } = req.params;
    const { period = '30d' } = req.query;
    
    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get AI queries for this period
    const aiQueries = await AIQuery.find({
      'productsMatched.storeId': store._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });

    // Basic analytics
    const totalQueries = aiQueries.length;
    const uniqueProducts = new Set();
    const providerBreakdown = {};
    const dailyStats = {};

    aiQueries.forEach(query => {
      // Count provider usage
      providerBreakdown[query.provider] = (providerBreakdown[query.provider] || 0) + 1;
      
      // Count unique products mentioned
      query.productsMatched.forEach(match => {
        if (match.mentioned) {
          uniqueProducts.add(match.productId);
        }
      });

      // Daily stats
      const dateKey = query.timestamp.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { queries: 0, mentions: 0 };
      }
      dailyStats[dateKey].queries++;
      dailyStats[dateKey].mentions += query.productsMatched.filter(m => m.mentioned).length;
    });

    // Top recommended products
    const productMentions = {};
    aiQueries.forEach(query => {
      query.productsMatched.forEach(match => {
        if (match.mentioned) {
          const productId = match.productId;
          if (!productMentions[productId]) {
            const product = store.products.find(p => p.shopifyId === productId);
            productMentions[productId] = {
              productId,
              title: product?.title || 'Unknown Product',
              mentions: 0,
              lastMentioned: query.timestamp
            };
          }
          productMentions[productId].mentions++;
          if (query.timestamp > productMentions[productId].lastMentioned) {
            productMentions[productId].lastMentioned = query.timestamp;
          }
        }
      });
    });

    const topProducts = Object.values(productMentions)
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);

    res.json({
      overview: {
        totalQueries,
        uniqueProductsMentioned: uniqueProducts.size,
        totalProducts: store.products.length,
        aiProviders: store.subscription.aiProviders.length
      },
      providerBreakdown,
      dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      })).sort((a, b) => new Date(a.date) - new Date(b.date)),
      topProducts,
      recentQueries: aiQueries.slice(0, 20).map(query => ({
        id: query._id,
        query: query.query,
        provider: query.provider,
        timestamp: query.timestamp,
        productsMentioned: query.productsMatched.filter(m => m.mentioned).length
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed product analytics
router.get('/store/:shop/products/:productId/analytics', async (req, res) => {
  try {
    const { shop, productId } = req.params;
    const { period = '30d' } = req.query;
    
    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const product = store.products.find(p => p.shopifyId === productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get queries that mentioned this product
    const queries = await AIQuery.find({
      'productsMatched': {
        $elemMatch: {
          storeId: store._id,
          productId: productId,
          mentioned: true
        }
      },
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });

    // Analyze queries
    const totalMentions = queries.length;
    const providerBreakdown = {};
    const queryTypes = [];

    queries.forEach(query => {
      providerBreakdown[query.provider] = (providerBreakdown[query.provider] || 0) + 1;
      queryTypes.push({
        query: query.query,
        provider: query.provider,
        timestamp: query.timestamp
      });
    });

    res.json({
      product: {
        id: product.shopifyId,
        title: product.title,
        price: product.price,
        tags: product.tags
      },
      analytics: {
        totalMentions,
        providerBreakdown,
        recentQueries: queryTypes.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export analytics data
router.get('/store/:shop/export', async (req, res) => {
  try {
    const { shop } = req.params;
    const { format = 'json', period = '30d' } = req.query;
    
    const store = await Store.findOne({ shopifyShop: shop });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if store has advanced analytics feature
    const hasAdvancedAnalytics = ['growth', 'premium'].includes(store.subscription.plan);
    if (!hasAdvancedAnalytics) {
      return res.status(403).json({ error: 'Advanced analytics not available in current plan' });
    }

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case '30d': startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case '90d': startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      default: startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const queries = await AIQuery.find({
      'productsMatched.storeId': store._id,
      timestamp: { $gte: startDate }
    }).sort({ timestamp: -1 });

    const exportData = {
      store: shop,
      period,
      exportDate: new Date().toISOString(),
      summary: {
        totalQueries: queries.length,
        dateRange: { start: startDate, end: now }
      },
      queries: queries.map(query => ({
        id: query._id,
        query: query.query,
        provider: query.provider,
        timestamp: query.timestamp,
        productsMatched: query.productsMatched.map(match => ({
          productId: match.productId,
          mentioned: match.mentioned,
          relevanceScore: match.relevanceScore
        }))
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData.queries);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${shop}-${period}.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analytics-${shop}-${period}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to convert to CSV
function convertToCSV(queries) {
  const headers = ['Timestamp', 'Query', 'Provider', 'Products Mentioned', 'Total Matches'];
  const rows = queries.map(query => [
    query.timestamp.toISOString(),
    `"${query.query.replace(/"/g, '""')}"`,
    query.provider,
    query.productsMatched.filter(m => m.mentioned).length,
    query.productsMatched.length
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

module.exports = router;