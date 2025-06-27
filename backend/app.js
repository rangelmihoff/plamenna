// backend/app.js
// This file defines and configures the Express application.
// It sets up middleware, routes, and error handlers.

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Import local modules
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { verifyShopifyWebhook } from './middleware/shopifyWebhook.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import shopRoutes from './routes/shopRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Initialize express app
const app = express();

// --- Core Middleware ---

// Enable CORS
app.use(cors());

// Set security-related HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "frame-ancestors": ["'self'", "https://*.myshopify.com", "https://admin.shopify.com"],
        },
    },
}));


// Shopify requires the raw body for webhook verification
// We apply this middleware only to the webhook route.
app.post('/api/webhooks/shopify', express.raw({ type: 'application/json' }), verifyShopifyWebhook, (req, res) => {
    // Process webhook here
    console.log('Webhook verified and processed:', req.body);
    res.sendStatus(200);
});

// Body parser for JSON for all other routes
app.use(express.json());

// Parser for URL-encoded data
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());


// --- API Routes ---
// Mount the various API routes under the /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/analytics', analyticsRoutes);

// --- Frontend Serving (for Production) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running in production
if (process.env.NODE_ENV === 'production') {
    // Serve the static files from the React frontend build folder
    const frontendDistPath = path.resolve(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendDistPath));

    // For any request that doesn't match an API route, send back the React app's index.html file
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
} else {
    // Development mode message
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}


// --- Error Handling Middleware (must be last) ---
// Custom 404 Not Found handler
app.use(notFound);
// Custom global error handler
app.use(errorHandler);

export default app;
