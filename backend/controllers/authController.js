// backend/controllers/authController.js (Debug Version)
// This controller handles the entire Shopify OAuth 2.0 flow.

import asyncHandler from 'express-async-handler';
// FINAL, FINAL CORRECTION: Import MemorySessionStorage directly from the main package entry point.
import { shopifyApi, LATEST_API_VERSION, MemorySessionStorage } from '@shopify/shopify-api';
import Shop from '../models/Shop.js';
import logger from '../utils/logger.js';
import { createNewSubscription } from '../services/subscriptionService.js';
import { syncProductsForShop } from '../services/shopifyService.js';

const getShopifyClient = () => {
    if (!process.env.HOST) {
        logger.error("FATAL: HOST environment variable is not set. The app cannot initialize.");
        throw new Error("HOST environment variable is not configured in Railway.");
    }

    return shopifyApi({
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecretKey: process.env.SHOPIFY_API_SECRET,
        scopes: process.env.SHOPIFY_API_SCOPES ? process.env.SHOPIFY_API_SCOPES.split(',') : [],
        hostName: process.env.HOST.replace(/https?:\/\//, ''),
        apiVersion: LATEST_API_VERSION,
        isEmbeddedApp: true,
        // Use the correctly imported MemorySessionStorage.
        sessionStorage: new MemorySessionStorage(),
    });
};

const handleShopifyAuth = asyncHandler(async (req, res) => {
  logger.info('--- New Auth Request Received ---');
  logger.info(`Request Query: ${JSON.stringify(req.query)}`);

  const shopDomain = req.query.shop;
  if (!shopDomain) {
    logger.error("Auth Error: 'shop' parameter is missing from the request.");
    return res.status(400).send("Missing 'shop' parameter in auth request.");
  }

  logger.info(`Initiating auth for shop: ${shopDomain}`);
  
  try {
    const shopify = getShopifyClient();
    const authUrl = await shopify.auth.begin({
      shop: shopDomain,
      callbackPath: '/api/auth/shopify/callback',
      isOnline: false,
    });

    logger.info(`Redirecting to Shopify auth URL: ${authUrl.substring(0, 80)}...`);
    res.redirect(authUrl);
  } catch (error) {
    logger.error(`Auth initialization failed: ${error.message}`);
    res.status(500).send(`Server configuration error: ${error.message}. Please check your environment variables in Railway.`);
  }
});

const handleShopifyCallback = asyncHandler(async (req, res) => {
    logger.info('--- Shopify Callback Received ---');
    logger.info(`Callback Query: ${JSON.stringify(req.query)}`);

    const shopify = getShopifyClient();
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });

    const { session } = callback;
    const { shop: shopifyDomain, accessToken } = session;
    logger.info(`Successfully received callback for shop: ${shopifyDomain}`);

    let shop = await Shop.findOne({ shopifyDomain });

    const client = new shopify.clients.Rest({ session });
    const shopData = await client.get({ path: 'shop' });

    if (shop) {
      shop.accessToken = accessToken;
      shop.isActive = true;
      await shop.save();
      logger.info(`Shop re-authenticated: ${shopifyDomain}`);
    } else {
      shop = await Shop.create({
        shopifyDomain,
        accessToken,
        name: shopData.body.shop.name,
        email: shopData.body.shop.email,
        timezone: shopData.body.shop.timezone,
      });
      logger.info(`New shop installed: ${shopifyDomain}`);
      await createNewSubscription(shop._id, 'Starter');
      syncProductsForShop(shopifyDomain).catch(err => {
        logger.error(`Initial sync failed for ${shopifyDomain}: ${err.message}`);
      });
    }

    const host = req.query.host;
    logger.info(`Redirecting to frontend with host: ${host}`);
    res.redirect(`/?shop=${shopifyDomain}&host=${host}`);
});

export { handleShopifyAuth, handleShopifyCallback };