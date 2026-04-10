// API Provider Configuration for VibeFinance
// Free tier market data APIs with rate limits and capabilities

module.exports = {
  // ===== STOCK & EQUITY DATA =====
  stockProviders: [
    {
      id: 'massive',
      name: 'Massive',
      baseUrl: 'https://massive.co.za/api/v1',
      requiresKey: true,
      rateLimit: { requestsPerMinute: 5, requestsPerDay: null },
      capabilities: ['quotes', 'historical', 'company_info'],
      priority: 1, // Primary provider
      region: 'za'
    },
    {
      id: 'alphavantage',
      name: 'Alpha Vantage',
      baseUrl: 'https://www.alphavantage.co/query',
      requiresKey: true,
      rateLimit: { requestsPerMinute: 5, requestsPerDay: 500 },
      capabilities: ['quotes', 'historical', 'technical_indicators', 'forex', 'crypto'],
      priority: 2,
      region: 'global'
    },
    {
      id: 'finnhub',
      name: 'Finnhub',
      baseUrl: 'https://finnhub.io/api/v1',
      requiresKey: true,
      rateLimit: { requestsPerMinute: 60, requestsPerDay: null },
      capabilities: ['quotes', 'company_info', 'news', 'forex', 'crypto'],
      priority: 3,
      region: 'global'
    },
    {
      id: 'yahoofinance',
      name: 'Yahoo Finance',
      baseUrl: null, // Uses npm package directly
      requiresKey: false,
      rateLimit: { requestsPerMinute: 10, requestsPerDay: 1000 },
      capabilities: ['quotes', 'historical', 'company_info', 'options', 'search', 'news'],
      priority: 2, // High priority - reliable and free
      region: 'global',
      notes: 'Uses yahoo-finance2 npm package, no API key required'
    },
    {
      id: 'twelvedata',
      name: 'Twelve Data',
      baseUrl: 'https://api.twelvedata.com',
      requiresKey: true,
      rateLimit: { requestsPerMinute: 8, requestsPerDay: 800 },
      capabilities: ['quotes', 'historical', 'forex', 'crypto', 'etfs'],
      priority: 4,
      region: 'global'
    },
    {
      id: 'iexcloud',
      name: 'IEX Cloud',
      baseUrl: 'https://cloud.iexapis.com/stable',
      requiresKey: true,
      rateLimit: { requestsPerMonth: 50000 },
      capabilities: ['quotes', 'historical', 'fundamentals', 'news'],
      priority: 5,
      region: 'us'
    }
  ],

  // ===== CRYPTOCURRENCY DATA =====
  cryptoProviders: [
    {
      id: 'coingecko',
      name: 'CoinGecko',
      baseUrl: 'https://api.coingecko.com/api/v3',
      requiresKey: false,
      rateLimit: { requestsPerMinute: 50 },
      capabilities: ['prices', 'market_cap', 'volume', 'historical'],
      priority: 1,
      region: 'global'
    },
    {
      id: 'coinmarketcap',
      name: 'CoinMarketCap',
      baseUrl: 'https://pro-api.coinmarketcap.com/v1',
      requiresKey: true,
      rateLimit: { requestsPerDay: 333 },
      capabilities: ['prices', 'market_cap', 'listings'],
      priority: 2,
      region: 'global'
    }
  ],

  // ===== NEWS & SENTIMENT DATA =====
  newsProviders: [
    {
      id: 'newsapi',
      name: 'NewsAPI',
      baseUrl: 'https://newsapi.org/v2',
      requiresKey: true,
      rateLimit: { requestsPerDay: 100 },
      capabilities: ['headlines', 'everything', 'sources'],
      priority: 1,
      region: 'global'
    },
    {
      id: 'gnews',
      name: 'GNews',
      baseUrl: 'https://gnews.io/api/v4',
      requiresKey: true,
      rateLimit: { requestsPerDay: 100 },
      capabilities: ['headlines', 'search', 'sentiment'],
      priority: 2,
      region: 'global'
    }
  ],

  // ===== FOREX & COMMODITIES =====
  forexProviders: [
    {
      id: 'exchangerateapi',
      name: 'ExchangeRate-API',
      baseUrl: 'https://api.exchangerate-api.com/v4',
      requiresKey: false,
      rateLimit: { requestsPerMonth: 1500 },
      capabilities: ['exchange_rates', 'historical'],
      priority: 1,
      region: 'global'
    },
    {
      id: 'frankfurter',
      name: 'Frankfurter',
      baseUrl: 'https://api.frankfurter.app',
      requiresKey: false,
      rateLimit: { requestsPerMinute: 10 },
      capabilities: ['exchange_rates', 'historical'],
      priority: 2,
      region: 'eur'
    }
  ],

  // ===== ECONOMIC DATA =====
  economicProviders: [
    {
      id: 'fred',
      name: 'FRED',
      baseUrl: 'https://api.stlouisfed.org/fred',
      requiresKey: true,
      rateLimit: { requestsPerMonth: 1200 },
      capabilities: ['economic_indicators', 'historical'],
      priority: 1,
      region: 'us'
    }
  ],

  // ===== FALLBACK CHAINS =====
  // Order of providers to try for each data type
  fallbackChains: {
    stock_quote: ['massive', 'alphavantage', 'finnhub', 'twelvedata'],
    stock_historical: ['massive', 'alphavantage', 'twelvedata'],
    crypto_price: ['coingecko', 'coinmarketcap'],
    news: ['newsapi', 'gnews'],
    forex: ['exchangerateapi', 'frankfurter'],
    economic: ['fred']
  },

  // ===== CACHE CONFIGURATION =====
  cacheTTL: {
    stock_quote: 60, // 1 minute for stock quotes
    stock_historical: 3600, // 1 hour for historical data
    crypto_price: 60, // 1 minute for crypto prices
    news: 1800, // 30 minutes for news
    forex: 300, // 5 minutes for forex
    economic: 86400, // 24 hours for economic data
    company_info: 86400 // 24 hours for company info
  },

  // ===== API KEY CONFIGURATION =====
  // These should be set in environment variables
  apiKeys: {
    massive: process.env.MASSIVE_API_KEY || '',
    alphavantage: process.env.ALPHA_VANTAGE_API_KEY || '',
    finnhub: process.env.FINNHUB_API_KEY || '',
    twelvedata: process.env.TWELVE_DATA_API_KEY || '',
    iexcloud: process.env.IEX_CLOUD_API_KEY || '',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || '',
    newsapi: process.env.NEWS_API_KEY || '',
    gnews: process.env.GNEWS_API_KEY || '',
    fred: process.env.FRED_API_KEY || ''
  },

  // ===== PROVIDER STATUS =====
  // Check if provider is available (has API key if required)
  isProviderAvailable(providerId) {
    const provider = this.getAllProviders().find(p => p.id === providerId);
    if (!provider) return false;
    
    if (provider.requiresKey) {
      return !!this.apiKeys[providerId];
    }
    
    return true;
  },

  // Get all providers
  getAllProviders() {
    return [
      ...this.stockProviders,
      ...this.cryptoProviders,
      ...this.newsProviders,
      ...this.forexProviders,
      ...this.economicProviders
    ];
  },

  // Get available providers for a capability
  getProvidersForCapability(capability) {
    return this.getAllProviders()
      .filter(provider => provider.capabilities.includes(capability))
      .sort((a, b) => a.priority - b.priority);
  },

  // Get next available provider in fallback chain
  getNextProvider(chainName, excludeProviders = []) {
    const chain = this.fallbackChains[chainName];
    if (!chain) return null;
    
    for (const providerId of chain) {
      if (excludeProviders.includes(providerId)) continue;
      if (this.isProviderAvailable(providerId)) {
        return this.getAllProviders().find(p => p.id === providerId);
      }
    }
    
    return null;
  }
};