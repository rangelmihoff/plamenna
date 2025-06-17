# ===========================================
# Shopify AI SEO 2.0 - Environment Variables
# ===========================================

# Server Configuration
NODE_ENV=production
PORT=3000

# Application URLs
BASE_URL=https://your-app-name.up.railway.app
FRONTEND_URL=https://your-frontend-domain.netlify.app

# ===========================================
# Database Configuration
# ===========================================

# MongoDB Atlas Connection String
# Format: mongodb+srv://username:password@cluster.mongodb.net/database?options
MONGODB_URI=mongodb+srv://aiseo-admin:YOUR_PASSWORD@ai-seo-cluster.xxxxx.mongodb.net/shopify-ai-seo?retryWrites=true&w=majority

# ===========================================
# Shopify App Configuration
# ===========================================

# Get these from: https://partners.shopify.com/
SHOPIFY_API_KEY=your_shopify_api_key_from_partners_dashboard
SHOPIFY_API_SECRET=your_shopify_api_secret_from_partners_dashboard

# Webhook verification secret (optional)
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_for_verification

# ===========================================
# AI Provider API Keys
# ===========================================

# Claude (Anthropic) - Get from: https://console.anthropic.com/
# Format: sk-ant-api03-...
CLAUDE_API_KEY=your_claude_api_key

# OpenAI - Get from: https://platform.openai.com/
# Format: sk-...
OPENAI_API_KEY=your_openai_api_key

# Google Gemini - Get from: https://makersuite.google.com/
# Format: AI...
GEMINI_API_KEY=your_gemini_api_key

# DeepSeek - Get from: https://platform.deepseek.com/
# Format: sk-...
DEEPSEEK_API_KEY=your_deepseek_api_key

# Llama (Together.ai) - Get from: https://api.together.xyz/
# Format: ...
LLAMA_API_KEY=your_together_ai_api_key

# ===========================================
# Security Configuration
# ===========================================

# JWT Secret (generate a strong random string)
# Use: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Session secret for additional security
SESSION_SECRET=another-random-secret-for-sessions

# ===========================================
# Optional: Monitoring & Analytics
# ===========================================

# Error tracking (optional)
# SENTRY_DSN=your_sentry_dsn_for_error_tracking

# Analytics (optional)
# GOOGLE_ANALYTICS_ID=your_ga_tracking_id

# ===========================================
# Development Only (remove in production)
# ===========================================

# Debug mode (set to false in production)
DEBUG=false

# Verbose logging
VERBOSE_LOGGING=false

# ===========================================
# Railway/Heroku Specific (auto-provided)
# ===========================================

# These are usually auto-provided by the platform:
# RAILWAY_STATIC_URL=...
# RAILWAY_PUBLIC_DOMAIN=...
# PORT=... (auto-assigned)