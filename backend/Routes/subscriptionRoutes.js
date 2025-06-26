const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscriptionController');
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');

// Protect all routes
router.use(authMiddleware);

// Get available plans
router.get('/plans', SubscriptionController.getPlans);

// Get current subscription
router.get('/current', SubscriptionController.getCurrentSubscription);

// Create new subscription
router.post(
  '/',
  [
    check('planName', 'Plan name is required').not().isEmpty()
  ],
  SubscriptionController.createSubscription
);

module.exports = router;