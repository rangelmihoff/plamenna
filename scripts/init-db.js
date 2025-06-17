require('dotenv').config();
const mongoose = require('mongoose');
const { subscriptionPlans } = require('../models/Subscription');

async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify-ai-seo');
    console.log('Connected to MongoDB');

    // Create indexes
    console.log('Creating database indexes...');
    
    // Store indexes
    await mongoose.connection.db.collection('stores').createIndex({ shopifyShop: 1 }, { unique: true });
    await mongoose.connection.db.collection('stores').createIndex({ 'subscription.plan': 1 });
    await mongoose.connection.db.collection('stores').createIndex({ 'subscription.status': 1 });
    
    // AIQuery indexes
    await mongoose.connection.db.collection('aiqueries').createIndex({ timestamp: -1 });
    await mongoose.connection.db.collection('aiqueries').createIndex({ provider: 1 });
    await mongoose.connection.db.collection('aiqueries').createIndex({ 'productsMatched.storeId': 1 });

    console.log('✅ Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();