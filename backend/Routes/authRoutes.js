// backend/routes/authRoutes.js
// Defines the routes for the Shopify authentication process.

import express from 'express';
import { handleShopifyAuth, handleShopifyCallback } from '../controllers/authController.js';

const router = express.Router();

// @desc    Initiates the Shopify OAuth process.
// @route   GET /api/auth/shopify
// @access  Public
// The frontend redirects the merchant to this URL.
router.get('/shopify', handleShopifyAuth);

// @desc    Callback URL where Shopify redirects after authentication.
// @route   GET /api/auth/shopify/callback
// @access  Public
router.get('/shopify/callback', handleShopifyCallback);

export default router;
