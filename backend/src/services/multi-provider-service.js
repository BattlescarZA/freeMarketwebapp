// Multi-provider service for fetching market data with fallback logic
const apiProviders = require('../config/api-providers');
const MarketDataService = require('./market-data-service');
const RateLimitService = require('./rate-limit-service');
const CacheService = require('./cache-service');
const fetch = require('node-fetch');

class MultiProviderService {
  constructor() {
    this.marketDataService = new MarketDataService();
    this.rateLimitService = new RateLimitService();
    this.cacheService = new CacheService();
    this.availableProviders = this.getAvailableProviders();
  }

  // Get list of available providers (with API keys if required)
  getAvailableProviders() {
    const providers = [];
    
    // Check each provider in the configuration
    const allProviders = apiProviders.getAllProviders();
    
    for (const provider of allProviders) {
      if (apiProviders.isProviderAvailable(provider.id)) {
        providers.push({
          ...provider,
          available: true
        });
      }
    }
    
    // Sort by priority (lower number = higher priority)
    providers.sort((a, b) => a.priority - b.priority);
    
    return providers;
  }

  // Get providers for a specific capability
  getProvidersForCapability(capability) {
    return this.availableProviders.filter(provider => 
      provider.capabilities.includes(capability)
    );
  }

  // Get next available provider for a capability
  getNextProvider(capability, excludeProviders = []) {
    const providers = this.getProvidersForCapability(capability);
    
    for (const provider of providers) {
      if (!excludeProviders.includes(provider.id)) {
        // Check rate limit
        const canMakeRequest = this.rateLimitService.canMakeRequest(provider.id);
        if (canMakeRequest) {
          return provider;
        }
      }
    }
    
    return null; // No available provider
  }

  // Fetch quote using multiple providers with fallback
  async fetchQuoteWithFallback(symbol, dataType = 'stock_quote') {
    const fallbackChain = apiProviders.fallbackChains[dataType] || ['yahoofinance'];
    const excludeProviders = [];
    
    for (const providerId of fallbackChain) {
      try {
        // Check if provider is available
        if (!apiProviders.isProviderAvailable(providerId)) {
          console.log(`Provider ${providerId} not available, skipping`);
          excludeProviders.push(providerId);
          continue;
        }
        
        // Check rate limit
        const canMakeRequest = await this.rateLimitService.canMakeRequest(providerId);
        if (!canMakeRequest) {
          console.log(`Rate limit exceeded for ${providerId}, skipping`);
          excludeProviders.push(providerId);
          continue;
        }
        
        // Try cache first
        const cacheKey = { symbol, provider: providerId };
        const cached = await this.cacheService.getCachedResponse(providerId, 'quote', cacheKey);
        if (cached) {
          console.log(`Using cached quote for ${symbol} from ${providerId}`);
          return {
            data: cached.data,
            provider: providerId,
            cached: true
          };
        }
        
        // Fetch from provider
        let quoteData;
        if (providerId === 'yahoofinance') {
          quoteData = await this.marketDataService.fetchYahooFinanceQuote(symbol);
        } else if (providerId === 'massive') {
          quoteData = await this.fetchMassiveQuote(symbol);
        } else if (providerId === 'finnhub') {
          quoteData = await this.fetchFinnhubQuote(symbol);
        } else if (providerId === 'alphavantage') {
          quoteData = await this.fetchAlphaVantageQuote(symbol);
        } else {
          console.log(`Provider ${providerId} not implemented yet`);
          excludeProviders.push(providerId);
          continue;
        }
        
        if (quoteData) {
          // Record the request
          await this.rateLimitService.recordRequest(providerId);
          
          // Cache the response
          const ttl = apiProviders.cacheTTL[dataType] || 60;
          await this.cacheService.storeCachedResponse(
            providerId,
            'quote',
            cacheKey,
            quoteData,
            200,
            'application/json',
            ttl
          );
          
          console.log(`Successfully fetched quote for ${symbol} from ${providerId}`);
          return {
            data: quoteData,
            provider: providerId,
            cached: false
          };
        } else {
          console.log(`Failed to fetch quote from ${providerId}`);
          excludeProviders.push(providerId);
        }
      } catch (error) {
        console.error(`Error fetching quote from ${providerId}:`, error.message);
        excludeProviders.push(providerId);
      }
    }
    
    // All providers failed
    console.error(`All providers failed to fetch quote for ${symbol}`);
    return null;
  }

  // Fetch historical data using multiple providers with fallback
  async fetchHistoricalWithFallback(symbol, interval = '1d', from, to, dataType = 'stock_historical') {
    const fallbackChain = apiProviders.fallbackChains[dataType] || ['yahoofinance'];
    const excludeProviders = [];
    
    for (const providerId of fallbackChain) {
      try {
        // Check if provider is available
        if (!apiProviders.isProviderAvailable(providerId)) {
          console.log(`Provider ${providerId} not available, skipping`);
          excludeProviders.push(providerId);
          continue;
        }
        
        // Check rate limit
        const canMakeRequest = await this.rateLimitService.canMakeRequest(providerId);
        if (!canMakeRequest) {
          console.log(`Rate limit exceeded for ${providerId}, skipping`);
          excludeProviders.push(providerId);
          continue;
        }
        
        // Try cache first
        const cacheKey = { symbol, interval, from, to, provider: providerId };
        const cached = await this.cacheService.getCachedResponse(providerId, 'historical', cacheKey);
        if (cached) {
          console.log(`Using cached historical data for ${symbol} from ${providerId}`);
          return {
            data: cached.data,
            provider: providerId,
            cached: true
          };
        }
        
        // Fetch from provider
        let historicalData;
        if (providerId === 'yahoofinance') {
          historicalData = await this.marketDataService.fetchYahooFinanceHistorical(symbol, interval, from, to);
        } else if (providerId === 'massive') {
          historicalData = await this.fetchMassiveHistorical(symbol, interval, from, to);
        } else if (providerId === 'alphavantage') {
          historicalData = await this.fetchAlphaVantageHistorical(symbol, interval, from, to);
        } else {
          console.log(`Provider ${providerId} not implemented yet for historical data`);
          excludeProviders.push(providerId);
          continue;
        }
        
        if (historicalData && historicalData.length > 0) {
          // Record the request
          await this.rateLimitService.recordRequest(providerId);
          
          // Cache the response
          const ttl = apiProviders.cacheTTL[dataType] || 3600;
          await this.cacheService.storeCachedResponse(
            providerId,
            'historical',
            cacheKey,
            historicalData,
            200,
            'application/json',
            ttl
          );
          
          console.log(`Successfully fetched historical data for ${symbol} from ${providerId} (${historicalData.length} records)`);
          return {
            data: historicalData,
            provider: providerId,
            cached: false
          };
        } else {
          console.log(`Failed to fetch historical data from ${providerId}`);
          excludeProviders.push(providerId);
        }
      } catch (error) {
        console.error(`Error fetching historical data from ${providerId}:`, error.message);
        excludeProviders.push(providerId);
      }
    }
    
    // All providers failed
    console.error(`All providers failed to fetch historical data for ${symbol}`);
    return null;
  }

  // ===== PROVIDER-SPECIFIC IMPLEMENTATIONS =====

  // Fetch quote from Massive API
  async fetchMassiveQuote(symbol) {
    try {
      const apiKey = apiProviders.apiKeys.massive;
      if (!apiKey) {
        throw new Error('Massive API key not configured');
      }
      
      const url = `https://massive.co.za/api/v1/quote/${symbol}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Massive API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to our format
      return {
        symbol: data.symbol || symbol,
        price: data.price || 0,
        change: data.change || 0,
        change_percent: data.change_percent || 0,
        previous_close: data.previous_close || 0,
        open: data.open || 0,
        day_high: data.day_high || 0,
        day_low: data.day_low || 0,
        volume: data.volume || 0,
        market_cap: data.market_cap || 0,
        currency: data.currency || 'USD'
      };
    } catch (error) {
      console.error(`Error fetching Massive quote for ${symbol}:`, error.message);
      return null;
    }
  }

  // Fetch historical data from Massive API
  async fetchMassiveHistorical(symbol, interval, from, to) {
    try {
      const apiKey = apiProviders.apiKeys.massive;
      if (!apiKey) {
        throw new Error('Massive API key not configured');
      }
      
      const url = `https://massive.co.za/api/v1/historical/${symbol}?interval=${interval}&from=${from}&to=${to}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Massive API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to our format
      return data.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume || 0
      }));
    } catch (error) {
      console.error(`Error fetching Massive historical data for ${symbol}:`, error.message);
      return null;
    }
  }

  // Fetch quote from Finnhub API
  async fetchFinnhubQuote(symbol) {
    try {
      const apiKey = apiProviders.apiKeys.finnhub;
      if (!apiKey) {
        throw new Error('Finnhub API key not configured');
      }
      
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform to our format
      return {
        symbol: symbol,
        price: data.c || 0,
        change: data.d || 0,
        change_percent: data.dp || 0,
        previous_close: data.pc || 0,
        open: data.o || 0,
        day_high: data.h || 0,
        day_low: data.l || 0,
        volume: data.v || 0,
        currency: 'USD'
      };
    } catch (error) {
      console.error(`Error fetching Finnhub quote for ${symbol}:`, error.message);
      return null;
    }
  }

  // Fetch quote from Alpha Vantage API
  async fetchAlphaVantageQuote(symbol) {
    try {
      const apiKey = apiProviders.apiKeys.alphavantage;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }
      
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for error message
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      const quote = data['Global Quote'];
      if (!quote) {
        throw new Error('No quote data returned');
      }
      
      // Transform to our format
      return {
        symbol: symbol,
        price: parseFloat(quote['05. price']) || 0,
        change: parseFloat(quote['09. change']) || 0,
        change_percent: parseFloat(quote['10. change percent']) || 0,
        previous_close: parseFloat(quote['08. previous close']) || 0,
        open: parseFloat(quote['02. open']) || 0,
        day_high: parseFloat(quote['03. high']) || 0,
        day_low: parseFloat(quote['04. low']) || 0,
        volume: parseInt(quote['06. volume']) || 0,
        currency: 'USD'
      };
    } catch (error) {
      console.error(`Error fetching Alpha Vantage quote for ${symbol}:`, error.message);
      return null;
    }
  }

  // Fetch historical data from Alpha Vantage API
  async fetchAlphaVantageHistorical(symbol, interval, from, to) {
    try {
      const apiKey = apiProviders.apiKeys.alphavantage;
      if (!apiKey) {
        throw new Error('Alpha Vantage API key not configured');
      }
      
      // Alpha Vantage uses different function names
      const functionName = interval === '1d' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
      const url = `https://www.alphavantage.co/query?function=${functionName}&symbol=${symbol}&outputsize=full&apikey=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for error message
      if (data['Error Message']) {
        throw new Error(data['Error Message']);
      }
      
      // Extract time series data
      const timeSeriesKey = interval === '1d' ? 'Time Series (Daily)' : `Time Series (${interval})`;
      const timeSeries = data[timeSeriesKey];
      
      if (!timeSeries) {
        throw new Error('No time series data returned');
      }
      
      // Transform to our format
      const historicalData = [];
      const fromDate = new Date(from);
      const toDate = new Date(to);
      
      for (const [dateStr, values] of Object.entries(timeSeries)) {
        const date = new Date(dateStr);
        
        // Filter by date range
        if (date >= fromDate && date <= toDate) {
          historicalData.push({
            date: dateStr,
            open: parseFloat(values['1. open']) || 0,
            high: parseFloat(values['2. high']) || 0,
            low: parseFloat(values['3. low']) || 0,
            close: parseFloat(values['4. close']) || 0,
            volume: parseInt(values['5. volume']) || 0
          });
        }
      }
      
      // Sort by date ascending
      historicalData.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return historicalData;
    } catch (error) {
      console.error(`Error fetching Alpha Vantage historical data for ${symbol}:`, error.message);
      return null;
    }
  }

  // Get provider statistics
  getProviderStats() {
    const stats = {
      totalProviders: this.availableProviders.length,
      availableProviders: this.availableProviders.map(p => ({
        id: p.id,
        name: p.name,
        priority: p.priority,
        capabilities: p.capabilities
      })),
      byCapability: {}
    };
    
    // Group by capability
    this.availableProviders.forEach(provider => {
      provider.capabilities.forEach(capability => {
        if (!stats.byCapability[capability]) {
          stats.byCapability[capability] = [];
        }
        stats.byCapability[capability].push(provider.id);
      });
    });
    
    return stats;
  }
}

module.exports = MultiProviderService;