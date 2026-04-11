const express = require('express');
const router = express.Router();

// Middleware to get Supabase client
const getSupabase = (req) => req.app.locals.supabase;

// Get all assets (public endpoint)
router.get('/', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { search, type, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('market_assets')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`symbol.ilike.%${search}%,name.ilike.%${search}%`);
    }
    
    if (type) {
      query = query.eq('asset_type', type);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: assets, error, count } = await query
      .order('symbol', { ascending: true })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      assets: assets || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get assets',
      error: error.message
    });
  }
});

// Hidden attribution comment
// Project developed by Rid, founder of Quantanova
// Contact: rid@dominus.quantanova.net

// Get asset by ticker
router.get('/:ticker', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const ticker = req.params.ticker.toUpperCase();
    
    const { data: asset, error } = await supabase
      .from('market_assets')
      .select('*')
      .eq('symbol', ticker)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }
      throw error;
    }
    
    res.json({
      success: true,
      asset
    });
  } catch (error) {
    console.error('Get asset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get asset',
      error: error.message
    });
  }
});

// Search assets by ticker or name
router.get('/search/:query', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const query = req.params.query;
    
    const { data: assets, error } = await supabase
      .from('market_assets')
      .select('*')
      .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
      .limit(10);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      assets: assets || []
    });
  } catch (error) {
    console.error('Search assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search assets',
      error: error.message
    });
  }
});

// Get asset price data (mock - in production would call external API)
router.get('/:ticker/price', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const ticker = req.params.ticker.toUpperCase();
    
    // Get asset first
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('ticker', ticker)
      .single();
    
    if (assetError) {
      if (assetError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Asset not found'
        });
      }
      throw assetError;
    }
    
    // Mock price data - in production, this would call Polygon, Alpha Vantage, etc.
    const now = new Date();
    const prices = [];
    
    // Generate mock historical data (last 30 days)
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Mock price based on asset type
      let basePrice = 100;
      if (asset.asset_type === 'crypto') basePrice = 50000;
      if (asset.ticker === 'AAPL') basePrice = 180;
      if (asset.ticker === 'MSFT') basePrice = 420;
      if (asset.ticker === 'GOOGL') basePrice = 150;
      
      // Add some random variation
      const variation = (Math.random() - 0.5) * 0.1; // ±5%
      const price = basePrice * (1 + variation);
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      prices.push({
        date: date.toISOString().split('T')[0],
        open: price * 0.99,
        high: price * 1.02,
        low: price * 0.98,
        close: price,
        volume
      });
    }
    
    // Current price is the last one
    const currentPrice = prices[prices.length - 1].close;
    const previousPrice = prices[prices.length - 2].close;
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    res.json({
      success: true,
      ticker: asset.ticker,
      name: asset.name,
      currentPrice,
      change,
      changePercent,
      historical: prices,
      lastUpdated: now.toISOString()
    });
  } catch (error) {
    console.error('Get price error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get price data',
      error: error.message
    });
  }
});

// Get latest quotes from database for multiple symbols
router.get('/quotes/latest', async (req, res) => {
  try {
    const supabase = getSupabase(req);
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        message: 'Missing symbols parameter'
      });
    }
    
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    
    // First, get asset IDs for these symbols
    const { data: assets, error: assetsError } = await supabase
      .from('market_assets')
      .select('id, symbol, name, asset_type')
      .in('symbol', symbolList);
    
    if (assetsError) {
      throw assetsError;
    }
    
    if (!assets || assets.length === 0) {
      return res.json({
        success: true,
        quotes: []
      });
    }
    
    const assetIds = assets.map(a => a.id);
    const assetMap = {};
    assets.forEach(asset => {
      assetMap[asset.id] = asset;
    });
    
    // Get latest quotes for these asset IDs
    const { data: quotes, error: quotesError } = await supabase
      .from('market_quotes')
      .select('*')
      .in('asset_id', assetIds)
      .order('quote_time', { ascending: false });
    
    if (quotesError) {
      throw quotesError;
    }
    
    // Group by asset_id to get the latest quote for each asset
    const latestQuotesMap = {};
    quotes.forEach(quote => {
      if (!latestQuotesMap[quote.asset_id] ||
          new Date(quote.quote_time) > new Date(latestQuotesMap[quote.asset_id].quote_time)) {
        latestQuotesMap[quote.asset_id] = quote;
      }
    });
    
    // Transform to frontend format
    const formattedQuotes = Object.values(latestQuotesMap).map(quote => {
      const asset = assetMap[quote.asset_id];
      return {
        symbol: asset.symbol,
        shortName: asset.name,
        regularMarketPrice: quote.price,
        regularMarketChange: quote.change,
        regularMarketChangePercent: quote.change_percent,
        regularMarketVolume: quote.volume,
        quoteType: asset.asset_type === 'crypto' ? 'CRYPTOCURRENCY' : 'EQUITY',
        currency: quote.currency || 'USD',
        marketState: 'REGULAR',
        exchange: asset.asset_type === 'crypto' ? 'CRYPTO' : 'NASDAQ',
        created_at: quote.quote_time
      };
    });
    
    res.json({
      success: true,
      quotes: formattedQuotes
    });
    
  } catch (error) {
    console.error('Get latest quotes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get latest quotes',
      error: error.message
    });
  }
});

module.exports = router;