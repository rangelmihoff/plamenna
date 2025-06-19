const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema({
    shopify_domain: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    access_token: {
        type: String,
        required: true
    },
    plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        default: null // По подразбиране няма план, докато не избере
    },
    is_installed: {
        type: Boolean,
        default: false
    },
    current_queries: {
        type: Number,
        default: 0
    },
    trial_ends_at: {
        type: Date
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

// При създаване на нов магазин, задаваме 7-дневен пробен период
ShopSchema.pre('save', function(next) {
    if (this.isNew) {
        this.trial_ends_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    next();
});

const Shop = mongoose.model('Shop', ShopSchema);

module.exports = Shop;
