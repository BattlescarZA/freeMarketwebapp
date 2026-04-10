// Polygon.io API Integration
// Free tier: 5 API calls/minute, 2 years historical data

const POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY || '';
const BASE_URL = 'https://api.polygon.io/v2';

export const polygonApi = {
  // Get real-time stock quote
  getQuote: async (symbol: string) => {
    if (!POLYGON_API_KEY) {
      console.warn('Polygon API key not configured');
      return null;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/aggs/ticker/${symbol}/prev?apiKey=${POLYGON_API_KEY}`
      );
      if (!response.ok) throw new Error('Polygon API error');
      return await response.json();
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  },

  // Get daily bars (OHLCV)
  getDailyBars: async (symbol: string, from: string, to: string) => {
    if (!POLYGON_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/aggs/ticker/${symbol}/range/1/day/${from}/${to}?apiKey=${POLYGON_API_KEY}`
      );
      if (!response.ok) throw new Error('Polygon API error');
      return await response.json();
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  },

  // Get ticker details
  getTickerDetails: async (symbol: string) => {
    if (!POLYGON_API_KEY) return null;
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers/${symbol}?apiKey=${POLYGON_API_KEY}`
      );
      if (!response.ok) throw new Error('Polygon API error');
      return await response.json();
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  },

  // Search tickers
  searchTickers: async (query: string) => {
    if (!POLYGON_API_KEY) return null;
    try {
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?search=${query}&active=true&apiKey=${POLYGON_API_KEY}`
      );
      if (!response.ok) throw new Error('Polygon API error');
      return await response.json();
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  },

  // Get market status
  getMarketStatus: async () => {
    if (!POLYGON_API_KEY) return null;
    try {
      const response = await fetch(
        `https://api.polygon.io/v1/marketstatus/now?apiKey=${POLYGON_API_KEY}`
      );
      if (!response.ok) throw new Error('Polygon API error');
      return await response.json();
    } catch (error) {
      console.error('Polygon API error:', error);
      return null;
    }
  },
};
