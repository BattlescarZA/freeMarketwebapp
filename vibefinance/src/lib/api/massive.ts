// Massive API Integration
// Free tier: 5 API calls/minute
// API Key: Y8chIvy4efR2v8cIuNjpQEOzcWhwpK1j

const MASSIVE_API_KEY = import.meta.env.VITE_MASSIVE_API_KEY || 'Y8chIvy4efR2v8cIuNjpQEOzcWhwpK1j';
const BASE_URL = 'https://api.massive.com/v3';

// Cache configuration - 5 minutes to respect rate limits
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ApiCache {
  private _cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this._cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > CACHE_DURATION) {
      // Cache expired
      this._cache.delete(key);
      return null;
    }

    console.log(`[Massive API] Cache hit for ${key}`);
    return entry.data;
  }

  set<T>(key: string, data: T): void {
    this._cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    console.log(`[Massive API] Cached ${key}`);
  }

  clear(): void {
    this._cache.clear();
  }

  // Get expired entry if available (for rate limit fallback)
  getExpired<T>(key: string): CacheEntry<T> | null {
    return this._cache.get(key) || null;
  }

  // Get cache size
  getSize(): number {
    return this._cache.size;
  }

  // Get all cache keys
  getKeys(): string[] {
    return Array.from(this._cache.keys());
  }

  // Generate cache key from endpoint and params
  generateKey(endpoint: string, params?: Record<string, any>): string {
    if (!params) return endpoint;
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    return `${endpoint}?${paramString}`;
  }
}

const cache = new ApiCache();

// Generic fetch with caching
async function fetchWithCache<T>(
  endpoint: string,
  params?: Record<string, any>
): Promise<T | null> {
  const cacheKey = cache.generateKey(endpoint, params);
  
  // Check cache first
  const cached = cache.get<T>(cacheKey);
  if (cached) return cached;

  // Build URL
  let url = `${BASE_URL}${endpoint}`;
  const queryParams = new URLSearchParams();
  
  // Add API key
  queryParams.append('apiKey', MASSIVE_API_KEY);
  
  // Add other params
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
  }
  
  url += `?${queryParams.toString()}`;

  try {
    console.log(`[Massive API] Fetching: ${endpoint}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[Massive API] Rate limit hit - using cached data if available');
        // Return expired cache if we hit rate limit
        const expiredEntry = cache.getExpired<T>(cacheKey);
        if (expiredEntry) {
          console.log('[Massive API] Returning expired cache due to rate limit');
          return expiredEntry.data;
        }
      }
      throw new Error(`Massive API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache successful response
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('[Massive API] Error:', error);
    return null;
  }
}

export const massiveApi = {
  // Clear cache manually if needed
  clearCache: () => cache.clear(),

  // Get cache stats
  getCacheStats: () => ({
    size: cache.getSize(),
    entries: cache.getKeys(),
  }),

  // ========== Reference Data Endpoints ==========

  // Get dividends
  getDividends: async (params?: {
    ticker?: string;
    ex_dividend_date?: string;
    record_date?: string;
    declaration_date?: string;
    pay_date?: string;
    frequency?: number;
    cash_amount?: number;
    dividend_type?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/dividends', params);
  },

  // Get stock splits
  getStockSplits: async (params?: {
    ticker?: string;
    execution_date?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/splits', params);
  },

  // Get ticker details
  getTickerDetails: async (ticker: string) => {
    return fetchWithCache(`/reference/tickers/${ticker}`);
  },

  // Get all tickers
  getTickers: async (params?: {
    type?: string;
    market?: string;
    exchange?: string;
    cusip?: string;
    cik?: string;
    date?: string;
    search?: string;
    active?: boolean;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/tickers', params);
  },

  // Get ticker news
  getTickerNews: async (params?: {
    ticker?: string;
    published_utc?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/news', params);
  },

  // Get market holidays
  getMarketHolidays: async () => {
    return fetchWithCache('/reference/market-holidays');
  },

  // Get market status
  getMarketStatus: async () => {
    return fetchWithCache('/reference/market-status');
  },

  // Get exchanges
  getExchanges: async (params?: {
    asset_class?: string;
    locale?: string;
  }) => {
    return fetchWithCache('/reference/exchanges', params);
  },

  // Get conditions
  getConditions: async (params?: {
    asset_class?: string;
    data_type?: string;
    id?: number;
    sip?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/conditions', params);
  },

  // ========== Market Data Endpoints ==========

  // Get aggregates (OHLCV)
  getAggregates: async (
    ticker: string,
    multiplier: number,
    timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
    from: string,
    to: string,
    params?: {
      adjusted?: boolean;
      sort?: 'asc' | 'desc';
      limit?: number;
    }
  ) => {
    return fetchWithCache(
      `/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}`,
      params
    );
  },

  // Get previous close
  getPreviousClose: async (ticker: string, params?: { adjusted?: boolean }) => {
    return fetchWithCache(`/aggs/ticker/${ticker}/prev`, params);
  },

  // Get grouped daily
  getGroupedDaily: async (date: string, params?: { adjusted?: boolean }) => {
    return fetchWithCache(`/aggs/grouped/locale/us/market/stocks/${date}`, params);
  },

  // Get daily open/close
  getDailyOpenClose: async (ticker: string, date: string, params?: { adjusted?: boolean }) => {
    return fetchWithCache(`/aggs/ticker/${ticker}/range/1/day/${date}/${date}`, params);
  },

  // ========== Snapshot Endpoints ==========

  // Get all tickers snapshot
  getAllTickersSnapshot: async () => {
    return fetchWithCache('/snapshot/locale/us/markets/stocks/tickers');
  },

  // Get ticker snapshot
  getTickerSnapshot: async (ticker: string) => {
    return fetchWithCache(`/snapshot/locale/us/markets/stocks/tickers/${ticker}`);
  },

  // Get gainers/losers
  getGainersLosers: async (direction: 'gainers' | 'losers' = 'gainers') => {
    return fetchWithCache(`/snapshot/locale/us/markets/stocks/${direction}`);
  },

  // ========== Financials Endpoints ==========

  // Get stock financials
  getStockFinancials: async (params?: {
    ticker?: string;
    cik?: string;
    company_name?: string;
    sic?: string;
    filing_date?: string;
    period_of_report_date?: string;
    timeframe?: 'annual' | 'quarterly' | 'ttm';
    include_sources?: boolean;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/financials', params);
  },

  // Get insider transactions
  getInsiderTransactions: async (params?: {
    ticker?: string;
    issuer_name?: string;
    insider_name?: string;
    insider_cik?: string;
    transaction_type?: string;
    order?: 'asc' | 'desc';
    limit?: number;
    sort?: string;
  }) => {
    return fetchWithCache('/reference/insider-transactions', params);
  },

  // Get analyst ratings
  getAnalystRatings: async (params?: {
    ticker?: string;
    order?: 'asc' | 'desc';
    limit?: number;
  }) => {
    return fetchWithCache('/reference/analyst-ratings', params);
  },

  // ========== Options Endpoints ==========

  // Get options contracts
  getOptionsContracts: async (params?: {
    underlying_ticker?: string;
    contract_type?: 'call' | 'put';
    expiration_date?: string;
    strike_price?: number;
    order?: 'asc' | 'desc';
    limit?: number;
  }) => {
    return fetchWithCache('/reference/options/contracts', params);
  },

  // Get options aggregates
  getOptionsAggregates: async (
    optionsTicker: string,
    multiplier: number,
    timespan: string,
    from: string,
    to: string
  ) => {
    return fetchWithCache(
      `/aggs/ticker/${optionsTicker}/range/${multiplier}/${timespan}/${from}/${to}`
    );
  },
};

// Export cache instance for debugging
export { cache as massiveCache };
