// Finnhub API Integration
// Free tier: 60 API calls/minute, WebSocket real-time data

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
const BASE_URL = 'https://finnhub.io/api/v1';

export const finnhubApi = {
  // Get real-time quote
  getQuote: async (symbol: string) => {
    if (!FINNHUB_API_KEY) {
      console.warn('Finnhub API key not configured');
      return null;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get company profile
  getCompanyProfile: async (symbol: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get company news
  getCompanyNews: async (symbol: string, from: string, to: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get basic financials
  getBasicFinancials: async (symbol: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/stock/metric?symbol=${symbol}&metric=all&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get insider transactions
  getInsiderTransactions: async (symbol: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/stock/insider-transactions?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get insider sentiment
  getInsiderSentiment: async (symbol: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/stock/insider-sentiment?symbol=${symbol}&from=2023-01-01&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get SEC filings
  getSECFilings: async (symbol: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/stock/filings?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Search symbols
  searchSymbols: async (query: string) => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/search?q=${query}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // Get market news
  getMarketNews: async (category: 'general' | 'forex' | 'crypto' | 'merger' = 'general') => {
    if (!FINNHUB_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/news?category=${category}&token=${FINNHUB_API_KEY}`
      );
      if (!response.ok) throw new Error('Finnhub API error');
      return await response.json();
    } catch (error) {
      console.error('Finnhub API error:', error);
      return null;
    }
  },

  // WebSocket connection for real-time data
  createWebSocket: (symbols: string[]) => {
    if (!FINNHUB_API_KEY) {
      console.warn('Finnhub API key not configured');
      return null;
    }
    
    const socket = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);
    
    socket.addEventListener('open', () => {
      symbols.forEach(symbol => {
        socket.send(JSON.stringify({ type: 'subscribe', symbol }));
      });
    });

    return socket;
  },
};
