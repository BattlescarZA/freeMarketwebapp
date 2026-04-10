// Alpha Vantage API Integration
// Free tier: 25 API calls/day

const ALPHA_VANTAGE_API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';
const BASE_URL = 'https://www.alphavantage.co/query';

export const alphaVantageApi = {
  // Get stock quote
  getQuote: async (symbol: string) => {
    if (!ALPHA_VANTAGE_API_KEY) {
      console.warn('Alpha Vantage API key not configured');
      return null;
    }
    try {
      const response = await fetch(
        `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      if (!response.ok) throw new Error('Alpha Vantage API error');
      return await response.json();
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  },

  // Get intraday data
  getIntraday: async (symbol: string, interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min') => {
    if (!ALPHA_VANTAGE_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      if (!response.ok) throw new Error('Alpha Vantage API error');
      return await response.json();
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  },

  // Get daily time series
  getDailyTimeSeries: async (symbol: string, outputsize: 'compact' | 'full' = 'compact') => {
    if (!ALPHA_VANTAGE_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputsize}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      if (!response.ok) throw new Error('Alpha Vantage API error');
      return await response.json();
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  },

  // Search symbols
  searchSymbol: async (keywords: string) => {
    if (!ALPHA_VANTAGE_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      if (!response.ok) throw new Error('Alpha Vantage API error');
      return await response.json();
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  },

  // Get company overview
  getCompanyOverview: async (symbol: string) => {
    if (!ALPHA_VANTAGE_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      if (!response.ok) throw new Error('Alpha Vantage API error');
      return await response.json();
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  },

  // Get exchange rate (for crypto/fiat)
  getExchangeRate: async (fromCurrency: string, toCurrency: string) => {
    if (!ALPHA_VANTAGE_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${ALPHA_VANTAGE_API_KEY}`
      );
      if (!response.ok) throw new Error('Alpha Vantage API error');
      return await response.json();
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      return null;
    }
  },
};
