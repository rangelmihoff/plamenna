const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Protect all routes
router.use(authMiddleware);

// Process AI query
router.post(
  '/query',
  [
    check('query', 'Query is required').not().isEmpty(),
    check('provider', 'Provider is required').not().isEmpty(),
  ],
  AIController.processQuery
);

// Get query history
router.get('/history', AIController.getQueryHistory);

// Get usage stats
router.get('/usage', AIController.getUsageStats);

module.exports = router;