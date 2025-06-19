const axios = require('axios');

// API ключове от променливите на средата
const apiKeys = {
    Claude: process.env.CLAUDE_API_KEY,
    OpenAI: process.env.OPENAI_API_KEY,
    Gemini: process.env.GEMINI_API_KEY,
    DeepSeek: process.env.DEEPSEEK_API_KEY,
    Llama: process.env.LLAMA_API_KEY,
};

const generateSeoPrompt = (productData) => {
    return `Generate SEO metadata for a Shopify product. Create a compelling meta title (max 60 characters) and a meta description (max 160 characters).
    Product Information:
    - Title: ${productData.title}
    - Description: ${productData.description.substring(0, 500)}
    - Price: ${productData.price}
    
    Respond in JSON format with two keys: "metaTitle" and "metaDescription".`;
};


exports.generateSeo = async (productData, provider) => {
    const prompt = generateSeoPrompt(productData);
    const apiKey = apiKeys[provider];

    if (!apiKey) {
        throw new Error(`API key for ${provider} is not configured.`);
    }

    try {
        let response;
        // Забележка: Всеки AI има различен API endpoint и структура на заявката.
        // Това е опростен пример, който трябва да се адаптира за всеки доставчик.
        // Тук е имплементиран само за OpenAI като най-популярен.
        switch (provider) {
            case 'OpenAI':
                response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 100
                }, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                });
                
                const content = JSON.parse(response.data.choices[0].message.content);
                return {
                    metaTitle: content.metaTitle,
                    metaDescription: content.metaDescription
                };

            // TODO: Имплементирайте заявки за Claude, Gemini, DeepSeek, Llama
            case 'Claude':
            case 'Gemini':
            case 'DeepSeek':
            case 'Llama':
                // Връщаме примерни данни, докато не се имплементира
                console.warn(`API call for ${provider} is not implemented. Returning mock data.`);
                return {
                    metaTitle: `AI Title for ${productData.title}`.substring(0, 60),
                    metaDescription: `AI generated description for ${productData.title}.`.substring(0, 160)
                };

            default:
                throw new Error(`Unsupported AI provider: ${provider}`);
        }
    } catch (error) {
        console.error(`Error calling ${provider} API:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to generate SEO with ${provider}.`);
    }
};

// ... други AI услуги ...