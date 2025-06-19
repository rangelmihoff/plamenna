const Shop = require('../models/shop.model');
const aiService = require('../services/ai.service');

// Функция за създаване на Shopify REST клиент
const getShopifyRestClient = async (shopId) => {
    const shopData = await Shop.findById(shopId);
    if (!shopData) throw new Error("Shop not found");

    const client = new shopify.clients.Rest({
        session: {
            shop: shopData.shopify_domain,
            accessToken: shopData.access_token,
        }
    });
    return client;
};


exports.getProducts = async (req, res) => {
    try {
        const client = await getShopifyRestClient(req.shopId);
        const response = await client.get({
            path: 'products',
            query: { limit: 50, fields: 'id,title,handle,image,body_html,metafields' }
        });

        res.status(200).json(response.body.products);
    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).json({ message: 'Error fetching products', error });
    }
};

exports.optimizeProduct = async (req, res) => {
    const { productId, productData, aiProvider } = req.body;
    
    try {
        const shop = await Shop.findById(req.shopId).populate('plan');
        if (!shop) return res.status(404).json({ message: "Shop not found."});
        if (!shop.plan) return res.status(403).json({ message: "Please select a subscription plan first."});

        // Проверка дали планът позволява тази функция
        if(!shop.plan.features.includes('SEO_GENERATION')) {
            return res.status(403).json({ message: "Your current plan does not include SEO optimization."});
        }
        
        // Проверка на лимита за заявки
        if(shop.current_queries >= shop.plan.ai_queries) {
            return res.status(403).json({ message: "You have reached your AI query limit for this month."});
        }
        
        // Извикване на AI услугата
        const optimization = await aiService.generateSeo(productData, aiProvider);
        
        // Ъпдейт на продукта в Shopify
        const client = await getShopifyRestClient(req.shopId);
        await client.put({
            path: `products/${productId}`,
            data: {
                product: {
                    id: productId,
                    metafields: [
                        { key: 'title_tag', value: optimization.metaTitle, namespace: 'global', type: 'string' },
                        { key: 'description_tag', value: optimization.metaDescription, namespace: 'global', type: 'string' }
                    ]
                }
            }
        });
        
        // Увеличаване на брояча на заявки
        shop.current_queries += 1;
        await shop.save();

        res.status(200).json({ message: 'Product optimized successfully!', optimization });

    } catch (error) {
        console.error("Error optimizing product:", error);
        res.status(500).json({ message: 'Error optimizing product', error: error.message });
    }
};


exports.syncProducts = async (req, res) => {
    // Тази функция може да се задейства от cron job или ръчно
    // Целта е да изтегли всички продукти и да ги кешира/структурира
    // за подаване към AI при нужда.
    // Поради сложността, тук е представена само основата.
    try {
        const client = await getShopifyRestClient(req.shopId);
        const shop = await Shop.findById(req.shopId).populate('plan');

        // Проверка на плана за честота на синхронизация
        // ... логика за проверка дали е време за синхронизация ...

        const { body } = await client.get({ path: 'products', query: { limit: shop.plan.product_limit }});
        
        // Тук продуктите могат да се запишат в отделна MongoDB колекция
        // или да се форматират и запишат във файл, достъпен за AI
        console.log(`Synced ${body.products.length} products for ${shop.shopify_domain}`);
        
        // Пример за структуриране на данните
        const aiReadyData = body.products.map(p => ({
            id: p.id,
            name: p.title,
            description: p.body_html.replace(/<[^>]*>?/gm, ''), // премахване на HTML тагове
            price: p.variants?.[0]?.price || 0,
            availability: p.variants?.some(v => v.inventory_quantity > 0) ? 'In Stock' : 'Out of Stock'
        }));

        // TODO: Запазване на aiReadyData
        
        res.status(200).json({ message: 'Sync process initiated.', count: body.products.length });
    } catch (error) {
        console.error("Error syncing products:", error);
        res.status(500).json({ message: 'Error syncing products', error: error.message });
    }
};