const { Shopify } = require('@shopify/shopify-api');
const Subscription = require('../models/Subscription');

module.exports = async (req, res, next) => {
  try {
    const topic = req.get('X-Shopify-Topic');
    const shop = req.get('X-Shopify-Shop-Domain');
    const payload = req.body;

    // Verify webhook
    await Shopify.Webhooks.Registry.process(req, res);
    
    // Process the webhook
    if (topic === 'APP_UNINSTALLED') {
      await handleAppUninstall(shop);
    } else if (topic === 'RECURRING_APPLICATION_CHARGE_ACTIVATED') {
      await handleChargeActivated(payload);
    }

    res.status(200).send('Webhook processed');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).send('Error processing webhook');
  }
};

async function handleAppUninstall(shopDomain) {
  await Shop.findOneAndUpdate(
    { shopifyDomain: shopDomain },
    { isActive: false, accessToken: null }
  );
}

async function handleChargeActivated(charge) {
  await Subscription.findOneAndUpdate(
    { chargeId: charge.id },
    { 
      isActive: true,
      lastBillingDate: new Date(charge.activated_on),
      nextBillingDate: new Date(charge.billing_on)
    }
  );
}