const { Shopify } = require('@shopify/shopify-api');

module.exports = async (req, res, next) => {
  try {
    const session = await Shopify.Utils.loadCurrentSession(req, res, true);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find or create shop in database
    const shop = await Shop.findOneAndUpdate(
      { shopifyDomain: session.shop },
      {
        shopifyDomain: session.shop,
        accessToken: session.accessToken,
      },
      { upsert: true, new: true }
    );

    req.shop = shop;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};