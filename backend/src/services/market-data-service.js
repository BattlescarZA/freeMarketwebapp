// Market data service for fetching and storing market data from various APIs
const { createClient } = require('@supabase/supabase-js');
const apiProviders = require('../config/api-providers');
const CacheService = require('./cache-service');
const rateLimitService = require('./rate-limit-service');
const fetch = require('node-fetch');

class MarketDataService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );
    this.cacheService = new CacheService(this.supabase);
    this.rateLimitService = rateLimitService;
  }

  // Get or create asset in database
  async getOrCreateAsset(symbol, assetData) {
    try {
      // Check if asset exists
      const { data: existingAsset, error: fetchError } = await this.supabase
        .from('market_assets')
        .select('*')
        .eq('symbol', symbol)
        .eq('data_source', assetData.data_source || 'yahoo')
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching asset:', fetchError);
      }

      if (existingAsset) {
        // Update existing asset
        const { data: updatedAsset, error: updateError } = await this.supabase
          .from('market_assets')
          .update({
            name: assetData.name || existingAsset.name,
            asset_type: assetData.asset_type || existingAsset.asset_type,
            exchange: assetData.exchange || existingAsset.exchange,
            currency: assetData.currency || existingAsset.currency,
            sector: assetData.sector || existingAsset.sector,
            industry: assetData.industry || existingAsset.industry,
            country: assetData.country || existingAsset.country,
            website: assetData.website || existingAsset.website,
            description: assetData.description || existingAsset.description,
            is_active: assetData.is_active !== undefined ? assetData.is_active : existingAsset.is_active,
            last_updated: new Date().toISOString()
          })
          .eq('id', existingAsset.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating asset:', updateError);
          return existingAsset;
        }

        return updatedAsset;
      } else {
        // Create new asset
        const { data: newAsset, error: createError } = await this.supabase
          .from('market_assets')
          .insert({
            symbol,
            name: assetData.name || symbol,
            asset_type: assetData.asset_type || 'stock',
            exchange: assetData.exchange || 'Unknown',
            currency: assetData.currency || 'USD',
            sector: assetData.sector || null,
            industry: assetData.industry || null,
            country: assetData.country || null,
            website: assetData.website || null,
            description: assetData.description || null,
            is_active: true,
            data_source: assetData.data_source || 'yahoo'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating asset:', createError);
          throw createError;
        }

        return newAsset;
      }
    } catch (error) {
      console.error('Error in getOrCreateAsset:', error);
      throw error;
    }
  }

  // Store quote in database
  async storeQuote(assetId, symbol, quoteData, dataSource) {
    try {
      const { data, error } = await this.supabase
        .from('market_quotes')
        .insert({
          asset_id: assetId,
          symbol,
          price: quoteData.price,
          change: quoteData.change,
          change_percent: quoteData.change_percent,
          previous_close: quoteData.previous_close,
          open: quoteData.open,
          day_high: quoteData.day_high,
          day_low: quoteData.day_low,
          volume: quoteData.volume,
          market_cap: quoteData.market_cap,
          avg_volume: quoteData.avg_volume,
          pe_ratio: quoteData.pe_ratio,
          dividend_yield: quoteData.dividend_yield,
          fifty_two_week_high: quoteData.fifty_two_week_high,
          fifty_two_week_low: quoteData.fifty_two_week_low,
          currency: quoteData.currency || 'USD',
          data_source: dataSource,
          quote_time: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing quote:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in storeQuote:', error);
      return null;
    }
  }

  // Store historical data in database
  async storeHistoricalData(assetId, symbol, historicalData, interval, dataSource) {
    try {
      const records = historicalData.map(item => ({
        asset_id: assetId,
        symbol,
        time_interval: interval,
        date: new Date(item.date).toISOString().split('T')[0],
        data_timestamp: new Date(item.date).toISOString(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjusted_close: item.adjusted_close || item.close,
        dividends: item.dividends || 0,
        stock_splits: item.stock_splits || 0,
        data_source: dataSource
      }));

      // Use upsert to avoid duplicates
      const { data, error } = await this.supabase
        .from('market_historical_data')
        .upsert(records, {
          onConflict: 'asset_id,time_interval,data_timestamp,data_source'
        });

      if (error) {
        console.error('Error storing historical data:', error);
        return 0;
      }

      return records.length;
    } catch (error) {
      console.error('Error in storeHistoricalData:', error);
      return 0;
    }
  }

  // Fetch quote from Yahoo Finance
  async fetchYahooFinanceQuote(symbol) {
    try {
      // Check rate limit
      const canMakeRequest = await this.rateLimitService.canMakeRequest('yahoofinance');
      if (!canMakeRequest) {
        console.log(`Rate limit exceeded for Yahoo Finance for symbol ${symbol}`);
        return null;
      }

      // Try cache first
      const cached = await this.cacheService.getCachedResponse('yahoofinance', 'quote', { symbol });
      if (cached) {
        return cached.data;
      }

      // Make API request
      const YahooFinance = require('yahoo-finance2').default;
      const yahooFinance = new YahooFinance();
      
      const quote = await yahooFinance.quote(symbol);
      
      // Record the request
      await this.rateLimitService.recordRequest('yahoofinance');
      
      // Transform to our format
      const transformedQuote = {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        change_percent: quote.regularMarketChangePercent,
        previous_close: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        day_high: quote.regularMarketDayHigh,
        day_low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        market_cap: quote.marketCap,
        avg_volume: quote.averageDailyVolume3Month,
        pe_ratio: quote.trailingPE,
        dividend_yield: quote.dividendYield,
        fifty_two_week_high: quote.fiftyTwoWeekHigh,
        fifty_two_week_low: quote.fiftyTwoWeekLow,
        currency: quote.currency || 'USD'
      };

      // Cache the response
      await this.cacheService.storeCachedResponse(
        'yahoofinance',
        'quote',
        { symbol },
        transformedQuote,
        200,
        'application/json',
        120 // 2 minutes TTL for quotes
      );

      return transformedQuote;
    } catch (error) {
      console.error(`Error fetching Yahoo Finance quote for ${symbol}:`, error.message);
      return null;
    }
  }

  // Fetch historical data from Yahoo Finance
  async fetchYahooFinanceHistorical(symbol, interval = '1d', from, to) {
    try {
      // Check rate limit
      const canMakeRequest = await this.rateLimitService.canMakeRequest('yahoofinance');
      if (!canMakeRequest) {
        console.log(`Rate limit exceeded for Yahoo Finance historical data for symbol ${symbol}`);
        return null;
      }

      // Try cache first
      const cacheKey = { symbol, interval, from, to };
      const cached = await this.cacheService.getCachedResponse('yahoofinance', 'historical', cacheKey);
      if (cached) {
        return cached.data;
      }

      // Make API request
      const YahooFinance = require('yahoo-finance2').default;
      const yahooFinance = new YahooFinance();
      
      const historical = await yahooFinance.historical(symbol, {
        period1: from,
        period2: to,
        interval: interval
      });
      
      // Record the request
      await this.rateLimitService.recordRequest('yahoofinance');
      
      // Transform to our format
      const transformedHistorical = historical.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        adjusted_close: item.adjClose || item.close,
        dividends: item.dividends || 0,
        stock_splits: item.split || 0
      }));

      // Cache the response
      await this.cacheService.storeCachedResponse(
        'yahoofinance',
        'historical',
        cacheKey,
        transformedHistorical,
        200,
        'application/json',
        3600 // 1 hour TTL for historical data
      );

      return transformedHistorical;
    } catch (error) {
      console.error(`Error fetching Yahoo Finance historical data for ${symbol}:`, error.message);
      return null;
    }
  }

  // Update quote for a symbol
  async updateQuote(symbol, dataSource = 'yahoo') {
    try {
      console.log(`Updating quote for ${symbol} from ${dataSource}`);
      
      let quoteData;
      let assetData = { data_source: dataSource };

      if (dataSource === 'yahoo') {
        quoteData = await this.fetchYahooFinanceQuote(symbol);
        if (quoteData) {
          assetData.name = quoteData.longName || quoteData.shortName || symbol;
          assetData.asset_type = this.determineAssetTypeFromSymbol(symbol);
          assetData.currency = quoteData.currency || 'USD';
        }
      } else {
        console.log(`Data source ${dataSource} not implemented yet`);
        return null;
      }

      if (!quoteData) {
        console.log(`Failed to fetch quote for ${symbol}`);
        return null;
      }

      // Get or create asset
      const asset = await this.getOrCreateAsset(symbol, assetData);
      
      // Store quote
      const storedQuote = await this.storeQuote(asset.id, symbol, quoteData, dataSource);
      
      // Log the update
      await this.logDataUpdate(asset.id, symbol, 'quote', dataSource, 'success', 1, 0);
      
      console.log(`Successfully updated quote for ${symbol}`);
      return storedQuote;
    } catch (error) {
      console.error(`Error updating quote for ${symbol}:`, error);
      await this.logDataUpdate(null, symbol, 'quote', dataSource, 'failed', 0, 0, error.message);
      return null;
    }
  }

  // Update historical data for a symbol
  async updateHistoricalData(symbol, interval = '1d', daysBack = 30, dataSource = 'yahoo') {
    try {
      console.log(`Updating historical data for ${symbol} (${interval}) from ${dataSource}`);
      
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - daysBack);
      
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      
      let historicalData;
      
      if (dataSource === 'yahoo') {
        historicalData = await this.fetchYahooFinanceHistorical(symbol, interval, fromStr, toStr);
      } else {
        console.log(`Data source ${dataSource} not implemented yet`);
        return 0;
      }

      if (!historicalData || historicalData.length === 0) {
        console.log(`No historical data fetched for ${symbol}`);
        return 0;
      }

      // Get or create asset
      const asset = await this.getOrCreateAsset(symbol, { data_source: dataSource });
      
      // Store historical data
      const recordsStored = await this.storeHistoricalData(
        asset.id, 
        symbol, 
        historicalData, 
        interval, 
        dataSource
      );
      
      // Log the update
      await this.logDataUpdate(
        asset.id, 
        symbol, 
        'historical', 
        dataSource, 
        'success', 
        recordsStored, 
        0,
        null,
        interval,
        fromStr,
        toStr
      );
      
      console.log(`Successfully stored ${recordsStored} historical records for ${symbol}`);
      return recordsStored;
    } catch (error) {
      console.error(`Error updating historical data for ${symbol}:`, error);
      await this.logDataUpdate(
        null, 
        symbol, 
        'historical', 
        dataSource, 
        'failed', 
        0, 
        0, 
        error.message,
        interval
      );
      return 0;
    }
  }

  // Update multiple symbols
  async updateMultipleSymbols(symbols, updateType = 'quote', dataSource = 'yahoo') {
    const results = [];
    
    for (const symbol of symbols) {
      try {
        let result;
        
        if (updateType === 'quote') {
          result = await this.updateQuote(symbol, dataSource);
        } else if (updateType === 'historical') {
          result = await this.updateHistoricalData(symbol, '1d', 30, dataSource);
        }
        
        results.push({
          symbol,
          success: !!result,
          result: updateType === 'quote' ? result : `${result} records`
        });
        
        // Small delay between requests to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error updating ${symbol}:`, error);
        results.push({
          symbol,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Update popular symbols (default set)
  async updatePopularSymbols() {
    const popularSymbols = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'JNJ', 'V',
      'BTC-USD', 'ETH-USD', 'SPY', 'QQQ', 'VTI', 'GLD', 'TLT', 'BND'
    ];
    
    console.log(`Updating quotes for ${popularSymbols.length} popular symbols`);
    const results = await this.updateMultipleSymbols(popularSymbols, 'quote', 'yahoo');
    
    // Also update historical data for a subset
    const historicalSymbols = popularSymbols.slice(0, 10);
    console.log(`Updating historical data for ${historicalSymbols.length} symbols`);
    const historicalResults = await this.updateMultipleSymbols(historicalSymbols, 'historical', 'yahoo');
    
    return {
      quoteResults: results,
      historicalResults: historicalResults
    };
  }

  // Log data update
  async logDataUpdate(assetId, symbol, dataType, dataSource, status, recordsUpdated, recordsInserted, errorMessage = null, interval = null, fromDate = null, toDate = null) {
    try {
      const { error } = await this.supabase
        .from('market_data_update_logs')
        .insert({
          asset_id: assetId,
          symbol,
          data_type: dataType,
          interval,
          from_date: fromDate,
          to_date: toDate,
          records_updated: recordsUpdated,
          records_inserted: recordsInserted,
          status,
          error_message: errorMessage,
          data_source: dataSource,
          started_at: new Date(Date.now() - 5000).toISOString(), // 5 seconds ago
          completed_at: new Date().toISOString(),
          duration_ms: 5000 // approximate
        });

      if (error) {
        console.error('Error logging data update:', error);
      }
    } catch (error) {
      console.error('Error in logDataUpdate:', error);
    }
  }

  // Helper function to determine asset type from symbol
  determineAssetTypeFromSymbol(symbol) {
    const symbolLower = symbol.toLowerCase();
    
    if (symbolLower.includes('-usd') || symbolLower.includes('btc') || symbolLower.includes('eth')) {
      return 'crypto';
    } else if (symbolLower.includes('spy') || symbolLower.includes('qqq') || symbolLower.includes('vti')) {
      return 'etf';
    } else {
      return 'stock';
    }
  }

  // Get update statistics
  async getUpdateStats(hoursBack = 24) {
    try {
      const since = new Date();
      since.setHours(since.getHours() - hoursBack);
      
      const { data, error } = await this.supabase
        .from('market_data_update_logs')
        .select('*')
        .gte('completed_at', since.toISOString())
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching update stats:', error);
        return null;
      }

      const stats = {
        totalUpdates: data.length,
        successful: data.filter(d => d.status === 'success').length,
        failed: data.filter(d => d.status === 'failed').length,
        byDataSource: {},
        byDataType: {}
      };

      // Group by data source and data type
      data.forEach(update => {
        const source = update.data_source;
        const type = update.data_type;
        
        if (!stats.byDataSource[source]) {
          stats.byDataSource[source] = { total: 0, success: 0, failed: 0 };
        }
        if (!stats.byDataType[type]) {
          stats.byDataType[type] = { total: 0, success: 0, failed: 0 };
        }
        
        stats.byDataSource[source].total++;
        stats.byDataType[type].total++;
        
        if (update.status === 'success') {
          stats.byDataSource[source].success++;
          stats.byDataType[type].success++;
        } else {
          stats.byDataSource[source].failed++;
          stats.byDataType[type].failed++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getUpdateStats:', error);
      return null;
    }
  }
}

module.exports = MarketDataService;