// backend/controllers/authController.js (Debug Version)
// This controller handles the entire Shopify OAuth 2.0 flow.

import asyncHandler from 'express-async-handler';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import Shop from '../models/Shop.js';
import logger from '../utils/logger.js';
import { createNewSubscription } from '../services/subscriptionService.js';
import { syncProductsForShop } from '../services/shopifyService.js';

const getShopifyClient = () => {
    // --- ROBUSTNESS FIX ---
    // Проверяваме дали HOST променливата е зададена, преди да я използваме.
    if (!process.env.HOST) {
        logger.error("FATAL: HOST environment variable is not set. The app cannot initialize.");
        // Хвърляме специфична грешка, за да улесним дебъгването.
        throw new Error("HOST environment variable is not configured in Railway.");
    }
    // --- END FIX ---

    return shopifyApi({
        apiKey: process.env.SHOPIFY_API_KEY,
        apiSecretKey: process.env.SHOPIFY_API_SECRET,
        scopes: process.env.SHOPIFY_API_SCOPES ? process.env.SHOPIFY_API_SCOPES.split(',') : [],
        hostName: process.env.HOST.replace(/https?:\/\//, ''),
        apiVersion: LATEST_API_VERSION,
        isEmbeddedApp: true,
        sessionStorage: new shopifyApi.session.MemorySessionStorage(),
    });
};

const handleShopifyAuth = asyncHandler(async (req, res) => {
  // --- DEBUGGING STEP ---
  logger.info('--- New Auth Request Received ---');
  logger.info(`Request Query: ${JSON.stringify(req.query)}`);
  // --- END DEBUGGING STEP ---

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
    // Прихващаме специфичната грешка и изпращаме полезен отговор.
    logger.error(`Auth initialization failed: ${error.message}`);
    res.status(500).send(`Server configuration error: ${error.message}. Please check your environment variables in Railway.`);
  }
});

const handleShopifyCallback = asyncHandler(async (req, res) => {
    // --- DEBUGGING STEP ---
    logger.info('--- Shopify Callback Received ---');
    logger.info(`Callback Query: ${JSON.stringify(req.query)}`);
    // --- END DEBUGGING STEP ---

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