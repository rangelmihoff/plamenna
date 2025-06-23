const Shop = require('../models/shop.model');
const jwt = require('jsonwebtoken');

// Контролер за инсталиране на приложението
exports.install = async (req, res) => {
    try {
        await shopify.auth.begin({
            shop: req.query.shop,
            callbackPath: '/api/auth/callback',
            isOnline: false, // Използваме offline достъп за дълготраен токен
            rawRequest: req,
            rawResponse: res
        });
        // Просто return, защото SDK вече е изпратил redirect
        return;
    } catch (error) {
        console.error("Error during installation:", error);
        if (!res.headersSent) {
            return res.status(500).send(error.message);
        }
    }
};

// Контролер за обработка на callback след инсталация
exports.callback = async (req, res) => {
    try {
        const callback = await shopify.auth.callback({
            rawRequest: req,
            rawResponse: res
        });

        const { session } = callback;
        const { shop, accessToken } = session;

        // Запазване или обновяване на информацията за магазина в базата данни
        const shopData = await Shop.findOneAndUpdate(
            { shopify_domain: shop },
            { 
                shopify_domain: shop, 
                access_token: accessToken,
                is_installed: true
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        // Създаване на JWT токен за клиента
        const token = jwt.sign({ shop: shopData.shopify_domain, shopId: shopData._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Записваме токена в бисквитка за сигурност
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: true, // В production среда
            sameSite: 'None'
        });

        // Пренасочване към началната страница на приложението в Shopify Admin
        res.redirect(`https://admin.shopify.com/apps/${process.env.SHOPIFY_API_KEY}/${shop}`);

    } catch (error) {
        console.error("Error during auth callback:", error);
        return res.status(500).send(error.message);
    }
};
