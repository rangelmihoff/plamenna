const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Protect all routes
router.use(authMiddleware);

// Get products
router.get('/', ProductController.getProducts);

// Sync products
router.post('/sync', ProductController.syncProducts);

// Optimize product SEO
router.post(
  '/:productId/optimize',
  [
    check('fields', 'Fields to optimize are required').not().isEmpty(),
    check('fields', 'Fields must be an array').isArray(),
  ],
  ProductController.optimizeProductSEO
);

module.exports = router;