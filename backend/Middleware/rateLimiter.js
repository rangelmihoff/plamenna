const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 AI requests per hour
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      success: false,
      message: 'AI request limit exceeded, please try again later'
    });
  }
});

module.exports = {
  apiLimiter,
  aiLimiter
};