// backend/controllers/authController.js
// This controller handles the entire Shopify OAuth 2.0 flow.

import asyncHandler from 'express-async-handler';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import Shop from '../models/Shop.js';
import generateToken from '../utils/generateToken.js';
import logger from '../utils/logger.js';
import { createNewSubscription } from '../services/subscriptionService.js';
import { syncProductsForShop } from '../services/shopifyService.js';

// Initialize the Shopify API client library
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_API_SCOPES.split(','),
  hostName: process.env.HOST.replace(/https?:\/\//, ''),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  // This is important for session storage
  sessionStorage: new shopifyApi.session.MemorySessionStorage(),
});

/**
 * @desc    Initiates the Shopify OAuth process by redirecting the merchant.
 * @route   GET /api/auth/shopify
 * @access  Public
 */
const handleShopifyAuth = asyncHandler(async (req, res) => {
  const shopDomain = req.query.shop;
  if (!shopDomain) {
    res.status(400);
    throw new Error("Missing 'shop' parameter in auth request.");
  }

  logger.info(`Initiating auth for shop: ${shopDomain}`);
  
  const authUrl = await shopify.auth.begin({
    shop: shopDomain,
    callbackPath: '/api/auth/shopify/callback',
    isOnline: false, // Use offline access token for background jobs
  });

  res.redirect(authUrl);
});

/**
 * @desc    Handles the callback from Shopify after the merchant approves the installation.
 * @route   GET /api/auth/shopify/callback
 * @access  Public
 */
const handleShopifyCallback = asyncHandler(async (req, res) => {
  const callback = await shopify.auth.callback({
    rawRequest: req,
    rawResponse: res,
  });

  const { session } = callback;
  const { shop: shopifyDomain, accessToken } = session;
  logger.info(`Successfully received callback for shop: ${shopifyDomain}`);

  // Find or create the shop in our database
  let shop = await Shop.findOne({ shopifyDomain });

  // Get shop details from Shopify to store locally
  const client = new shopify.clients.Rest({ session });
  const shopData = await client.get({ path: 'shop' });

  if (shop) {
    // If shop exists (re-installation), update its access token and status
    shop.accessToken = accessToken;
    shop.isActive = true;
    shop.name = shopData.body.shop.name;
    shop.email = shopData.body.shop.email;
    shop.timezone = shopData.body.shop.timezone;
    await shop.save();
    logger.info(`Shop re-authenticated: ${shopifyDomain}`);
  } else {
    // If it's a new installation, create the shop record
    shop = await Shop.create({
      shopifyDomain,
      accessToken,
      name: shopData.body.shop.name,
      email: shopData.body.shop.email,
      timezone: shopData.body.shop.timezone,
    });
    logger.info(`New shop installed: ${shopifyDomain}`);
    
    // Create a new subscription on the Starter plan with a 5-day trial
    await createNewSubscription(shop._id, 'Starter');

    // Trigger an initial product sync in the background
    syncProductsForShop(shopifyDomain).catch(err => {
      logger.error(`Initial sync failed for ${shopifyDomain}: ${err.message}`);
    });
  }

  // --- Billing API Integration ---
  // In a real app, this is where you would redirect the merchant to approve the
  // recurring charge for the subscription.
  // For this project, we've automatically started a trial.

  // Redirect to the frontend app within the Shopify admin
  const host = req.query.host; // This is the base64 encoded admin URL
  res.redirect(`/?shop=${shopifyDomain}&host=${host}`);
});

export { handleShopifyAuth, handleShopifyCallback };
