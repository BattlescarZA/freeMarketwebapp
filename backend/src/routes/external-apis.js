// External API routes - proxies for financial data APIs
const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const YahooFinance = require('yahoo-finance2').default;
const { cacheMiddleware } = require('../middleware/cache-middleware');
const rateLimitService = require('../services/rate-limit-service');

// Create Yahoo Finance instance
const yahooFinance = new YahooFinance();

// API Configuration from environment
const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY || '';
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || '';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const NEWS_API_KEY = process.env.NEWS_API_KEY || '';

// Rate limit middleware for each API
const massiveRateLimit = rateLimitService.createRateLimitMiddleware('massive');
const alphaVantageRateLimit = rateLimitService.createRateLimitMiddleware('alphavantage');
const finnhubRateLimit = rateLimitService.createRateLimitMiddleware('finnhub');
const newsapiRateLimit = rateLimitService.createRateLimitMiddleware('newsapi');
const coingeckoRateLimit = rateLimitService.createRateLimitMiddleware('coingecko');
const yahooFinanceRateLimit = rateLimitService.createRateLimitMiddleware('yahoofinance');

// Helper function for making external API requests
async function makeExternalApiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'VibeFinance/1.0',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('External API request failed:', error.message);
    throw error;
  }
}

// ===== MASSIVE API ENDPOINTS =====
router.get('/api/external/massive/quote/:symbol', cacheMiddleware, async (req, res) => {
  try {
    if (!MASSIVE_API_KEY) {
      return res.status(400).json({ error: 'Massive API key not configured' });
    }

    const { symbol } = req.params;
    const url = `https://api.massive.com/v2/aggs/ticker/${symbol}/prev?apiKey=${MASSIVE_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/massive/daily-bars/:symbol', massiveRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!MASSIVE_API_KEY) {
      return res.status(400).json({ error: 'Massive API key not configured' });
    }

    const { symbol } = req.params;
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from or to query parameters' });
    }

    const url = `https://api.massive.com/v2/aggs/ticker/${symbol}/range/1/day/${from}/${to}?apiKey=${MASSIVE_API_KEY}`;
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/massive/ticker-details/:symbol', massiveRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!MASSIVE_API_KEY) {
      return res.status(400).json({ error: 'Massive API key not configured' });
    }

    const { symbol } = req.params;
    const url = `https://api.massive.com/v3/reference/tickers/${symbol}?apiKey=${MASSIVE_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Massive dividends endpoint (example from documentation)
router.get('/api/external/massive/dividends', massiveRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!MASSIVE_API_KEY) {
      return res.status(400).json({ error: 'Massive API key not configured' });
    }

    const { ticker, limit = 10 } = req.query;
    let url = `https://api.massive.com/v3/reference/dividends?apiKey=${MASSIVE_API_KEY}&limit=${limit}`;
    
    if (ticker) {
      url += `&ticker=${ticker}`;
    }
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ALPHA VANTAGE API ENDPOINTS =====
router.get('/api/external/alphavantage/quote/:symbol', alphaVantageRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return res.status(400).json({ error: 'Alpha Vantage API key not configured' });
    }

    const { symbol } = req.params;
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/alphavantage/intraday/:symbol', alphaVantageRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return res.status(400).json({ error: 'Alpha Vantage API key not configured' });
    }

    const { symbol } = req.params;
    const { interval = '5min' } = req.query;
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/alphavantage/search/:keywords', alphaVantageRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!ALPHA_VANTAGE_API_KEY) {
      return res.status(400).json({ error: 'Alpha Vantage API key not configured' });
    }

    const { keywords } = req.params;
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== COINGECKO API ENDPOINTS =====
router.get('/api/external/coingecko/coins/markets', coingeckoRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { vs_currency = 'usd', per_page = 100, page = 1 } = req.query;
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vs_currency}&per_page=${per_page}&page=${page}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/coingecko/coins/:id', coingeckoRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const url = `https://api.coingecko.com/api/v3/coins/${id}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/coingecko/simple/price', coingeckoRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { ids, vs_currencies = 'usd' } = req.query;
    
    if (!ids) {
      return res.status(400).json({ error: 'Missing ids query parameter' });
    }

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`;
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FINNHUB API ENDPOINTS =====
router.get('/api/external/finnhub/quote/:symbol', finnhubRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!FINNHUB_API_KEY) {
      return res.status(400).json({ error: 'Finnhub API key not configured' });
    }

    const { symbol } = req.params;
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/finnhub/company-profile/:symbol', finnhubRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!FINNHUB_API_KEY) {
      return res.status(400).json({ error: 'Finnhub API key not configured' });
    }

    const { symbol } = req.params;
    const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== NEWSAPI ENDPOINTS =====
router.get('/api/external/newsapi/top-headlines', newsapiRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!NEWS_API_KEY) {
      return res.status(400).json({ error: 'NewsAPI key not configured' });
    }

    const { category = 'business', country = 'us', pageSize = 20 } = req.query;
    const url = `https://newsapi.org/v2/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/newsapi/everything', newsapiRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!NEWS_API_KEY) {
      return res.status(400).json({ error: 'NewsAPI key not configured' });
    }

    const { q, from, to, sortBy = 'publishedAt', pageSize = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Missing q (query) parameter' });
    }

    let url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&sortBy=${sortBy}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
    
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    
    const data = await makeExternalApiRequest(url);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MASSIVE API ENDPOINTS =====
router.get('/api/external/massive/quote/:symbol', massiveRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!MASSIVE_API_KEY) {
      return res.status(400).json({ error: 'Massive API key not configured' });
    }

    const { symbol } = req.params;
    const url = `https://massive.co.za/api/v1/quote/${symbol}`;
    
    const data = await makeExternalApiRequest(url, {
      headers: {
        'Authorization': `Bearer ${MASSIVE_API_KEY}`,
      },
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/massive/historical/:symbol', massiveRateLimit, cacheMiddleware, async (req, res) => {
  try {
    if (!MASSIVE_API_KEY) {
      return res.status(400).json({ error: 'Massive API key not configured' });
    }

    const { symbol } = req.params;
    const { interval = '1d', from, to } = req.query;
    
    let url = `https://massive.co.za/api/v1/historical/${symbol}?interval=${interval}`;
    
    if (from) url += `&from=${from}`;
    if (to) url += `&to=${to}`;
    
    const data = await makeExternalApiRequest(url, {
      headers: {
        'Authorization': `Bearer ${MASSIVE_API_KEY}`,
      },
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== UNIFIED ENDPOINTS (aggregates multiple sources) =====
router.get('/api/external/unified/quote/:symbol', cacheMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { source = 'massive' } = req.query;
    
    let url;
    switch (source) {
      case 'massive':
        if (!MASSIVE_API_KEY) throw new Error('Massive API key not configured');
        url = `https://api.massive.com/v2/aggs/ticker/${symbol}/prev?apiKey=${MASSIVE_API_KEY}`;
        break;
      case 'alphavantage':
        if (!ALPHA_VANTAGE_API_KEY) throw new Error('Alpha Vantage API key not configured');
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        break;
      case 'finnhub':
        if (!FINNHUB_API_KEY) throw new Error('Finnhub API key not configured');
        url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid source specified' });
    }
    
    const data = await makeExternalApiRequest(url);
    res.json({ source, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== YAHOO FINANCE API ENDPOINTS =====
router.get('/api/external/yahoofinance/quote/:symbol', yahooFinanceRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    
    const quote = await yahooFinance.quote(symbol);
    
    // Transform to consistent format
    const transformedQuote = {
      symbol: quote.symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      regularMarketPreviousClose: quote.regularMarketPreviousClose,
      regularMarketOpen: quote.regularMarketOpen,
      regularMarketDayHigh: quote.regularMarketDayHigh,
      regularMarketDayLow: quote.regularMarketDayLow,
      regularMarketVolume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
      currency: quote.currency,
      longName: quote.longName,
      shortName: quote.shortName,
      exchange: quote.exchange,
      quoteType: quote.quoteType,
      timestamp: new Date().toISOString(),
    };
    
    res.json(transformedQuote);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/yahoofinance/historical/:symbol', yahooFinanceRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period1 = '2020-01-01', period2 = new Date().toISOString().split('T')[0], interval = '1d' } = req.query;
    
    const historical = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval,
    });
    
    res.json(historical);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/yahoofinance/search/:query', yahooFinanceRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    const queryLower = query.toLowerCase();
    
    // Get regular search results
    const searchResults = await yahooFinance.search(query);
    
    // Check if this is a cryptocurrency search
    const cryptoKeywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'litecoin', 'ltc', 'ripple', 'xrp', 'cardano', 'ada', 'solana', 'sol', 'dogecoin', 'doge'];
    const isCryptoSearch = cryptoKeywords.some(keyword => queryLower.includes(keyword));
    
    // If it's a crypto search and we don't have good results, add known crypto symbols
    if (isCryptoSearch && searchResults.quotes && searchResults.quotes.length < 5) {
      const knownCryptos = [
        { symbol: 'BTC-USD', name: 'Bitcoin USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'ETH-USD', name: 'Ethereum USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'USDT-USD', name: 'Tether USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'BNB-USD', name: 'Binance Coin USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'SOL-USD', name: 'Solana USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'XRP-USD', name: 'Ripple USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'ADA-USD', name: 'Cardano USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'DOGE-USD', name: 'Dogecoin USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'AVAX-USD', name: 'Avalanche USD', type: 'CRYPTOCURRENCY' },
        { symbol: 'DOT-USD', name: 'Polkadot USD', type: 'CRYPTOCURRENCY' },
      ];
      
      // Filter cryptos that match the search query
      const matchingCryptos = knownCryptos.filter(crypto =>
        crypto.symbol.toLowerCase().includes(queryLower) ||
        crypto.name.toLowerCase().includes(queryLower)
      );
      
      // Add matching cryptos to results
      if (matchingCryptos.length > 0) {
        // Try to get quote data for the cryptos to enrich the results
        const enrichedCryptos = await Promise.all(
          matchingCryptos.map(async (crypto) => {
            try {
              const quote = await yahooFinance.quote(crypto.symbol);
              return {
                symbol: quote.symbol,
                longname: quote.longName || crypto.name,
                shortname: quote.shortName || crypto.name,
                quoteType: 'CRYPTOCURRENCY',
                exchange: 'CCC',
                exchDisp: 'Cryptocurrency',
                marketCap: quote.marketCap,
                regularMarketPrice: quote.regularMarketPrice,
                regularMarketChange: quote.regularMarketChange,
                regularMarketChangePercent: quote.regularMarketChangePercent,
                currency: quote.currency || 'USD',
              };
            } catch (error) {
              // If we can't get quote, return basic info
              return {
                symbol: crypto.symbol,
                longname: crypto.name,
                shortname: crypto.name,
                quoteType: 'CRYPTOCURRENCY',
                exchange: 'CCC',
                exchDisp: 'Cryptocurrency',
                currency: 'USD',
              };
            }
          })
        );
        
        // Add enriched cryptos to the beginning of results
        searchResults.quotes = [...enrichedCryptos, ...(searchResults.quotes || [])];
      }
    }
    
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/external/yahoofinance/options/:symbol', yahooFinanceRateLimit, cacheMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { date } = req.query;
    
    const options = await yahooFinance.options(symbol, date);
    
    res.json(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Yahoo Finance to unified endpoint
router.get('/api/external/unified/quote/:symbol', cacheMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { source = 'massive' } = req.query;
    
    let url;
    switch (source) {
      case 'massive':
        if (!MASSIVE_API_KEY) throw new Error('Massive API key not configured');
        url = `https://api.massive.com/v2/aggs/ticker/${symbol}/prev?apiKey=${MASSIVE_API_KEY}`;
        break;
      case 'alphavantage':
        if (!ALPHA_VANTAGE_API_KEY) throw new Error('Alpha Vantage API key not configured');
        url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
        break;
      case 'finnhub':
        if (!FINNHUB_API_KEY) throw new Error('Finnhub API key not configured');
        url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;
        break;
      case 'yahoofinance':
        // Use Yahoo Finance directly
        try {
          const quote = await yahooFinance.quote(symbol);
          const transformedQuote = {
            symbol: quote.symbol,
            regularMarketPrice: quote.regularMarketPrice,
            regularMarketChange: quote.regularMarketChange,
            regularMarketChangePercent: quote.regularMarketChangePercent,
            regularMarketPreviousClose: quote.regularMarketPreviousClose,
            regularMarketOpen: quote.regularMarketOpen,
            regularMarketDayHigh: quote.regularMarketDayHigh,
            regularMarketDayLow: quote.regularMarketDayLow,
            regularMarketVolume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            currency: quote.currency,
            longName: quote.longName,
            shortName: quote.shortName,
            exchange: quote.exchange,
            quoteType: quote.quoteType,
            timestamp: new Date().toISOString(),
          };
          return res.json({ source: 'yahoofinance', data: transformedQuote });
        } catch (yahooError) {
          throw new Error(`Yahoo Finance error: ${yahooError.message}`);
        }
      default:
        return res.status(400).json({ error: 'Invalid source specified' });
    }
    
    const data = await makeExternalApiRequest(url);
    res.json({ source, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check for external APIs
router.get('/api/external/health', async (req, res) => {
  const healthStatus = {
    massive: !!MASSIVE_API_KEY,
    alphavantage: !!ALPHA_VANTAGE_API_KEY,
    coingecko: true, // No API key needed for basic usage
    finnhub: !!FINNHUB_API_KEY,
    newsapi: !!NEWS_API_KEY,
    yahoofinance: true, // Yahoo Finance doesn't need API key
    timestamp: new Date().toISOString(),
  };
  
  res.json(healthStatus);
});

module.exports = router;