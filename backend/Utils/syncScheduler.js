const cron = require('node-cron');
const Shop = require('../models/Shop');
const ShopifyService = require('../services/shopifyService');
const Subscription = require('../models/Subscription');

class SyncScheduler {
  constructor() {
    this.jobs = new Map();
  }

  async initialize() {
    // Load all active shops and schedule their sync
    const shops = await Shop.find({ isActive: true }).populate({
      path: 'subscription',
      populate: { path: 'plan' }
    });

    for (const shop of shops) {
      this.scheduleShopSync(shop);
    }
  }

  scheduleShopSync(shop) {
    if (this.jobs.has(shop._id.toString())) {
      this.jobs.get(shop._id.toString()).stop();
    }

    const frequency = this.getCronFrequency(shop.subscription.plan.syncFrequency);
    if (!frequency) return;

    const job = cron.schedule(frequency, async () => {
      try {
        console.log(`Running sync for shop: ${shop.shopifyDomain}`);
        await ShopifyService.syncProducts(shop.shopifyDomain);
        
        // Update sync timestamps
        await Shop.findByIdAndUpdate(shop._id, {
          lastSync: new Date(),
          nextSync: this.getNextSyncDate(shop.subscription.plan.syncFrequency)
        });
      } catch (err) {
        console.error(`Sync failed for ${shop.shopifyDomain}:`, err);
      }
    });

    this.jobs.set(shop._id.toString(), job);
  }

  getCronFrequency(syncFrequency) {
    switch (syncFrequency) {
      case 'every 2 weeks': return '0 0 */14 * *';
      case 'every 48h': return '0 0 */2 * *';
      case 'every 24h': return '0 0 * * *';
      case 'every 12h': return '0 */12 * * *';
      case 'every 2h': return '0 */2 * * *';
      default: return null;
    }
  }

  getNextSyncDate(syncFrequency) {
    const now = new Date();
    switch (syncFrequency) {
      case 'every 2 weeks': return new Date(now.setDate(now.getDate() + 14));
      case 'every 48h': return new Date(now.setHours(now.getHours() + 48));
      case 'every 24h': return new Date(now.setHours(now.getHours() + 24));
      case 'every 12h': return new Date(now.setHours(now.getHours() + 12));
      case 'every 2h': return new Date(now.setHours(now.getHours() + 2));
      default: return null;
    }
  }
}

module.exports = new SyncScheduler();