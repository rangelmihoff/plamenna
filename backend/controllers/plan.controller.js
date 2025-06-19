const Plan = require('../models/plan.model');
const Shop = require('../models/shop.model');

exports.getPlans = async (req, res) => {
    try {
        const plans = await Plan.find({});
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching plans', error: error.message });
    }
};

exports.selectPlan = async (req, res) => {
    try {
        const { planId } = req.body;
        const shopId = req.shopId;

        const plan = await Plan.findById(planId);
        if (!plan) {
            return res.status(404).json({ message: 'Plan not found.' });
        }
        
        // Тук би се интегрирала Shopify Billing API
        // Засега, просто записваме избрания план
        
        await Shop.findByIdAndUpdate(shopId, {
            plan: planId,
            // Рестартираме брояча на заявки при смяна на план
            current_queries: 0 
        });

        res.status(200).json({ message: `Successfully subscribed to ${plan.name} plan.` });
    } catch (error) {
        res.status(500).json({ message: 'Error selecting plan', error: error.message });
    }
};

exports.getShopStatus = async (req, res) => {
    try {
        const shop = await Shop.findById(req.shopId).populate('plan');
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found.' });
        }
        res.status(200).json(shop);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching shop status', error: error.message });
    }
};