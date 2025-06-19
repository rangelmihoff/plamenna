const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Starter", "Professional"
    price: { type: Number, required: true }, // in USD
    ai_queries: { type: Number, required: true },
    product_limit: { type: Number, required: true },
    ai_providers_count: { type: Number, required: true },
    available_providers: [{ type: String }], // ["DeepSeek", "Llama", "OpenAI", etc.]
    sync_interval_hours: { type: Number, required: true },
    features: [{ type: String }] // e.g., ["SEO_GENERATION", "BULK_OPTIMIZE"]
});

// Статичен метод за попълване на плановете
PlanSchema.statics.seedPlans = async function() {
    const plans = [
        {
            name: 'Starter',
            price: 10,
            ai_queries: 50,
            product_limit: 150,
            ai_providers_count: 1,
            available_providers: ['DeepSeek', 'Llama'],
            sync_interval_hours: 336, // 2 weeks
            features: []
        },
        {
            name: 'Professional',
            price: 39,
            ai_queries: 600,
            product_limit: 300,
            ai_providers_count: 2,
            available_providers: ['OpenAI', 'Llama', 'DeepSeek'],
            sync_interval_hours: 48,
            features: ['SEO_GENERATION', 'BULK_OPTIMIZE']
        },
        {
            name: 'Growth',
            price: 59,
            ai_queries: 1500,
            product_limit: 1000,
            ai_providers_count: 3,
            available_providers: ['Claude', 'OpenAI', 'Gemini', 'Llama', 'DeepSeek'],
            sync_interval_hours: 24,
            features: ['SEO_GENERATION', 'BULK_OPTIMIZE', 'ANALYTICS']
        },
        {
            name: 'Growth Extra',
            price: 119,
            ai_queries: 4000,
            product_limit: 2000,
            ai_providers_count: 4,
            available_providers: ['Claude', 'OpenAI', 'Gemini', 'Llama', 'DeepSeek'],
            sync_interval_hours: 12,
            features: ['SEO_GENERATION', 'BULK_OPTIMIZE', 'ANALYTICS']
        },
        {
            name: 'Enterprise',
            price: 299,
            ai_queries: 10000,
            product_limit: 10000,
            ai_providers_count: 5,
            available_providers: ['Claude', 'OpenAI', 'Gemini', 'Llama', 'DeepSeek'],
            sync_interval_hours: 2,
            features: ['SEO_GENERATION', 'BULK_OPTIMIZE', 'ANALYTICS', 'MULTI_PROVIDER']
        }
    ];

    for (const planData of plans) {
        await this.findOneAndUpdate({ name: planData.name }, planData, { upsert: true });
    }
    console.log('Subscription plans seeded successfully.');
};

const Plan = mongoose.model('Plan', PlanSchema);

module.exports = Plan;