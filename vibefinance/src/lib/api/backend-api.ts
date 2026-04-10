// Backend API client for VibeFinance
// This replaces direct Supabase calls with backend API calls

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:19112';

// Helper function for making API requests
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include cookies for auth
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Auth API
export const auth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName }),
    });
  },

  signIn: async (email: string, password: string) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  signOut: async () => {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return apiRequest('/api/auth/me');
  },

  testConnection: async () => {
    return apiRequest('/api/auth/test');
  },
};

// Portfolio API
export const portfolio = {
  getPortfolios: async (userId: string) => {
    return apiRequest(`/api/portfolio/user/${userId}`);
  },

  getPortfolio: async (portfolioId: string) => {
    return apiRequest(`/api/portfolio/${portfolioId}`);
  },

  createPortfolio: async (name: string, userId: string, description?: string) => {
    return apiRequest('/api/portfolio', {
      method: 'POST',
      body: JSON.stringify({ name, user_id: userId, description }),
    });
  },

  updatePortfolio: async (portfolioId: string, updates: any) => {
    return apiRequest(`/api/portfolio/${portfolioId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deletePortfolio: async (portfolioId: string) => {
    return apiRequest(`/api/portfolio/${portfolioId}`, {
      method: 'DELETE',
    });
  },

  getHoldings: async (portfolioId: string) => {
    return apiRequest(`/api/portfolio/${portfolioId}/holdings`);
  },

  getTransactions: async (portfolioId: string) => {
    return apiRequest(`/api/portfolio/${portfolioId}/transactions`);
  },

  getSummary: async (portfolioId: string) => {
    return apiRequest(`/api/portfolio/${portfolioId}/summary`);
  },
};

// Assets API
export const assets = {
  getAllAssets: async () => {
    return apiRequest('/api/assets');
  },

  getAsset: async (assetId: string) => {
    return apiRequest(`/api/assets/${assetId}`);
  },

  searchAssets: async (query: string) => {
    return apiRequest(`/api/assets/search?q=${encodeURIComponent(query)}`);
  },

  getAssetPrices: async (assetIds: string[]) => {
    return apiRequest('/api/assets/prices', {
      method: 'POST',
      body: JSON.stringify({ assetIds }),
    });
  },

  getMockPrices: async () => {
    return apiRequest('/api/assets/mock-prices');
  },

  // Get latest quotes from database for multiple symbols
  getLatestQuotes: async (symbols: string[]) => {
    const symbolsParam = symbols.join(',');
    return apiRequest(`/api/assets/quotes/latest?symbols=${encodeURIComponent(symbolsParam)}`);
  },
};

// Transactions API
export const transactions = {
  createTransaction: async (transactionData: any) => {
    return apiRequest('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  getTransaction: async (transactionId: string) => {
    return apiRequest(`/api/transactions/${transactionId}`);
  },

  updateTransaction: async (transactionId: string, updates: any) => {
    return apiRequest(`/api/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteTransaction: async (transactionId: string) => {
    return apiRequest(`/api/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  },

  getTransactionSummary: async (portfolioId: string) => {
    return apiRequest(`/api/transactions/summary/${portfolioId}`);
  },
};

// Watchlist API
export const watchlist = {
  getWatchlist: async (userId: string) => {
    return apiRequest(`/api/watchlist/user/${userId}`);
  },

  addToWatchlist: async (userId: string, assetId: string) => {
    return apiRequest('/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, asset_id: assetId }),
    });
  },

  removeFromWatchlist: async (watchlistId: string) => {
    return apiRequest(`/api/watchlist/${watchlistId}`, {
      method: 'DELETE',
    });
  },

  checkInWatchlist: async (userId: string, assetId: string) => {
    return apiRequest(`/api/watchlist/check?userId=${userId}&assetId=${assetId}`);
  },
};

// External APIs
export const external = {
  // Polygon.io
  polygon: {
    getQuote: async (symbol: string) => {
      return apiRequest(`/api/external/polygon/quote/${symbol}`);
    },
    getDailyBars: async (symbol: string, from: string, to: string) => {
      return apiRequest(`/api/external/polygon/daily-bars/${symbol}?from=${from}&to=${to}`);
    },
    getTickerDetails: async (symbol: string) => {
      return apiRequest(`/api/external/polygon/ticker-details/${symbol}`);
    },
  },

  // Alpha Vantage
  alphaVantage: {
    getQuote: async (symbol: string) => {
      return apiRequest(`/api/external/alphavantage/quote/${symbol}`);
    },
    getIntraday: async (symbol: string, interval: string = '5min') => {
      return apiRequest(`/api/external/alphavantage/intraday/${symbol}?interval=${interval}`);
    },
    search: async (keywords: string) => {
      return apiRequest(`/api/external/alphavantage/search/${keywords}`);
    },
  },

  // CoinGecko
  coinGecko: {
    getMarkets: async (vsCurrency: string = 'usd', perPage: number = 100, page: number = 1) => {
      return apiRequest(`/api/external/coingecko/coins/markets?vs_currency=${vsCurrency}&per_page=${perPage}&page=${page}`);
    },
    getCoin: async (id: string) => {
      return apiRequest(`/api/external/coingecko/coins/${id}`);
    },
    getPrices: async (ids: string, vsCurrencies: string = 'usd') => {
      return apiRequest(`/api/external/coingecko/simple/price?ids=${ids}&vs_currencies=${vsCurrencies}`);
    },
  },

  // Finnhub
  finnhub: {
    getQuote: async (symbol: string) => {
      return apiRequest(`/api/external/finnhub/quote/${symbol}`);
    },
    getCompanyProfile: async (symbol: string) => {
      return apiRequest(`/api/external/finnhub/company-profile/${symbol}`);
    },
  },

  // Yahoo Finance
  yahooFinance: {
    getQuote: async (symbol: string) => {
      return apiRequest(`/api/external/yahoofinance/quote/${symbol}`);
    },
    getHistorical: async (symbol: string, period1: string = '2020-01-01', period2: string = new Date().toISOString().split('T')[0], interval: string = '1d') => {
      return apiRequest(`/api/external/yahoofinance/historical/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`);
    },
    search: async (query: string) => {
      return apiRequest(`/api/external/yahoofinance/search/${query}`);
    },
    getOptions: async (symbol: string, date?: string) => {
      const url = date
        ? `/api/external/yahoofinance/options/${symbol}?date=${date}`
        : `/api/external/yahoofinance/options/${symbol}`;
      return apiRequest(url);
    },
  },

  // NewsAPI
  newsApi: {
    getTopHeadlines: async (category: string = 'business', country: string = 'us', pageSize: number = 20) => {
      return apiRequest(`/api/external/newsapi/top-headlines?category=${category}&country=${country}&pageSize=${pageSize}`);
    },
    getEverything: async (query: string, from?: string, to?: string, sortBy: string = 'publishedAt', pageSize: number = 20) => {
      let url = `/api/external/newsapi/everything?q=${encodeURIComponent(query)}&sortBy=${sortBy}&pageSize=${pageSize}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;
      return apiRequest(url);
    },
  },

  // Massive
  massive: {
    getQuote: async (symbol: string) => {
      return apiRequest(`/api/external/massive/quote/${symbol}`);
    },
    getHistorical: async (symbol: string, interval: string = '1d', from?: string, to?: string) => {
      let url = `/api/external/massive/historical/${symbol}?interval=${interval}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;
      return apiRequest(url);
    },
  },

  // Unified endpoints
  unified: {
    getQuote: async (symbol: string, source: string = 'polygon') => {
      return apiRequest(`/api/external/unified/quote/${symbol}?source=${source}`);
    },
  },

  // Health check
  health: async () => {
    return apiRequest('/api/external/health');
  },
};

// Health check
export const health = {
  check: async () => {
    return apiRequest('/health');
  },
};

// Export all APIs
export const backendApi = {
  auth,
  portfolio,
  assets,
  transactions,
  watchlist,
  external,
  health,
};

export default backendApi;