// Импортиране на необходимите модули
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { shopifyApi, LATEST_API_VERSION, MemorySessionStorage, CustomSessionStorage } = require('@shopify/shopify-api');
require('@shopify/shopify-api/adapters/node');

// Импортиране на маршрути
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 8081;

console.log('MemorySessionStorage:', MemorySessionStorage);

// In-memory session storage (работи с всяка версия)
const sessionStore = {};
const sessionStorage = new (CustomSessionStorage || MemorySessionStorage)(
  async (id) => {
    return sessionStore[id] || undefined;
  },
  async (session) => {
    sessionStore[session.id] = session;
    return true;
  },
  async (id) => {
    delete sessionStore[id];
    return true;
  }
);

// Настройка на Shopify API
const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    scopes: (process.env.SCOPES || '').split(','),
    hostName: (process.env.SHOPIFY_APP_URL || '').replace(/https?:\/\//, ''),
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: true,
    sessionStorage,
});

global.shopify = shopify;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Свързване с MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Successfully connected to MongoDB Atlas.');
    // Попълване на плановете в базата данни при първоначално стартиране
    const Plan = require('./models/plan.model');
    Plan.seedPlans();
}).catch(err => {
    console.error('Connection error', err);
    process.exit();
});

// Насочване на API маршрутите
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes); // Всички останали API ендпойнти

// Сервиране на фронтенд приложението
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
    });
}

// Стартиране на сървъра
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
    console.log(`App URL: ${process.env.SHOPIFY_APP_URL}`);
});