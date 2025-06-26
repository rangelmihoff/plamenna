module.exports = {
  providers: {
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      models: ['gpt-4-turbo', 'gpt-3.5-turbo'],
    },
    anthropic: {
      name: 'Claude',
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
    },
    google: {
      name: 'Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: process.env.GOOGLE_API_KEY,
      models: ['gemini-pro'],
    },
    deepseek: {
      name: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY,
      models: ['deepseek-chat'],
    },
    meta: {
      name: 'Llama',
      baseUrl: 'https://api.meta.ai/v1',
      apiKey: process.env.META_API_KEY,
      models: ['llama-3-70b-instruct', 'llama-3-8b-instruct'],
    },
  },
  getProviderConfig: (providerName) => {
    const provider = this.providers[providerName.toLowerCase()];
    if (!provider) {
      throw new Error(`Provider ${providerName} not configured`);
    }
    return provider;
  },
};