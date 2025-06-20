const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const planController = require('../controllers/plan.controller');
const authMiddleware = require('../middleware/auth.middleware');
const authController = require('../controllers/auth.controller');

// Shopify install route (GET /api/shopify/install) - публичен
router.get('/shopify/install', authController.install);

// Всички маршрути тук са защитени и изискват валиден JWT
router.use(authMiddleware.verifyToken);

// Маршрути за планове
router.get('/plans', planController.getPlans);
router.post('/select-plan', planController.selectPlan);
router.get('/shop-status', planController.getShopStatus);

// Маршрути за продукти
router.get('/products', productController.getProducts);
router.post('/optimize-product', productController.optimizeProduct);

// Маршрут за синхронизация
router.post('/sync-products', productController.syncProducts);

// ... други бъдещи маршрути ...

module.exports = router;