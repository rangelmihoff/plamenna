// backend/controllers/authController.js (Debug Version)
import '@shopify/shopify-api/adapters/node';
import asyncHandler from 'express-async-handler';
import shopify from '@shopify/shopify-api';
const { shopifyApi, LATEST_API_VERSION } = shopify;
import Shop from '../models/Shop.js';
import logger from '../utils/logger.js';
import { createNewSubscription } from '../services/subscriptionService.js';
import { syncProductsForShop } from '../services/shopifyService.js';
const getShopifyClient = () => {
    if (!process.env.HOST) {
        logger.error("FATAL: HOST environment variable is not set.");
        throw new Error("HOST environment variable is not configured in Railway.");
    }
    if (!process.env.SHOPIFY_API_SCOPES) {
        logger.error("FATAL: SHOPIFY_API_SCOPES environment variable is not set.");
        throw new Error("SHOPIFY_API_SCOPES environment variable is not configured in Railway.");
    }
    return shopifyApi({
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecretKey: process.env.SHOPIFY_API_SECRET,
        scopes: process.env.SHOPIFY_API_SCOPES.split(','),
        hostName: process.env.HOST.replace(/https?:\/\//, ''),
        apiVersion: LATEST_API_VERSION,
        isEmbeddedApp: true,
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
    const shopifyClient = getShopifyClient();
    // FINAL CORRECTION: Pass the request and response objects to the 'begin' method.
    // The library needs this context to correctly handle the auth flow.
    await shopifyClient.auth.begin({
      shop: shopDomain,
      callbackPath: '/api/auth/shopify/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    });
    // The 'begin' method handles the redirect itself, so no need to call res.redirect() here.
    logger.info(`Redirecting to Shopify auth URL...`);
  } catch (error) {
    logger.error(`Auth initialization failed: ${error.message}`);
    res.status(500).send(`Server configuration error: ${error.message}. Please check your environment variables in Railway.`);
  }
});
const handleShopifyCallback = asyncHandler(async (req, res) => {
    logger.info('--- Shopify Callback Received ---');
    logger.info(`Callback Query: ${JSON.stringify(req.query)}`);
    const shopifyClient = getShopifyClient();
    const callback = await shopifyClient.auth.callback({
      rawRequest: req,
      rawResponse: res,
    });
    const { session } = callback;
    const { shop: shopifyDomain, accessToken } = session;
    logger.info(`Successfully received callback for shop: ${shopifyDomain}`);
    let shop = await Shop.findOne({ shopifyDomain });
    const client = new shopifyClient.clients.Rest({ session });
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