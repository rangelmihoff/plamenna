const express = require('express');
const router = express.Router();
const { Shopify } = require('@shopify/shopify-api');
const Shop = require('../models/Shop');
const SubscriptionService = require('../services/subscriptionService');

// Install route
router.get('/install', async (req, res) => {
  const authRoute = await Shopify.Auth.beginAuth(
    req,
    res,
    req.query.shop,
    '/auth/callback',
    false
  );
  res.redirect(authRoute);
});

// Callback route
router.get('/callback', async (req, res) => {
  try {
    const session = await Shopify.Auth.validateAuthCallback(
      req,
      res,
      req.query
    );

    // Initialize default subscription (trial)
    await SubscriptionService.initializePlans();
    const shop = await Shop.findOne({ shopifyDomain: session.shop });
    await SubscriptionService.createSubscription(shop._id, 'Starter');

    res.redirect(`/?shop=${session.shop}&host=${req.query.host}`);
  } catch (err) {
    console.error('Auth callback error:', err);
    res.status(500).send('Error during authentication');
  }
});

module.exports = router;