const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Първоначален маршрут за инсталация
// Пример: /api/auth?shop=my-store.myshopify.com
router.get('/', authController.install);

// Маршрут за callback от Shopify
router.get('/callback', authController.callback);

module.exports = router;