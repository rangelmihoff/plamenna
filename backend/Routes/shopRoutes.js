const express = require('express');
const router = express.Router();
const ShopController = require('../controllers/shopController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Protect all routes
router.use(authMiddleware);

// Get shop info
router.get('/', ShopController.getShopInfo);

// Update shop settings
router.put(
  '/settings',
  [
    check('language', 'Invalid language code').optional().isIn(['en', 'fr', 'es', 'de'])
  ],
  ShopController.updateShopSettings
);

// Get sync status
router.get('/sync', ShopController.getSyncStatus);

module.exports = router;