// NewsAPI Integration
// Free tier: 100 requests/day

const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY || '';
const BASE_URL = 'https://newsapi.org/v2';

export const newsApi = {
  // Get top financial headlines
  getTopHeadlines: async (category: 'business' | 'technology' = 'business', country: string = 'us') => {
    if (!NEWS_API_KEY) {
      console.warn('News API key not configured');
      return null;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/top-headlines?country=${country}&category=${category}&apiKey=${NEWS_API_KEY}`
      );
      if (!response.ok) throw new Error('News API error');
      return await response.json();
    } catch (error) {
      console.error('News API error:', error);
      return null;
    }
  },

  // Search news
  searchNews: async (query: string, from?: string, to?: string) => {
    if (!NEWS_API_KEY) return null;
    try {
      let url = `${BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;
      if (from) url += `&from=${from}`;
      if (to) url += `&to=${to}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('News API error');
      return await response.json();
    } catch (error) {
      console.error('News API error:', error);
      return null;
    }
  },

  // Get stock-specific news
  getStockNews: async (symbol: string, companyName?: string) => {
    if (!NEWS_API_KEY) return null;
    try {
      const query = companyName ? `${symbol} OR "${companyName}"` : symbol;
      const response = await fetch(
        `${BASE_URL}/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`
      );
      if (!response.ok) throw new Error('News API error');
      return await response.json();
    } catch (error) {
      console.error('News API error:', error);
      return null;
    }
  },

  // Get crypto news
  getCryptoNews: async () => {
    if (!NEWS_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/everything?q=cryptocurrency OR bitcoin OR ethereum&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`
      );
      if (!response.ok) throw new Error('News API error');
      return await response.json();
    } catch (error) {
      console.error('News API error:', error);
      return null;
    }
  },

  // Get market news (general financial)
  getMarketNews: async () => {
    if (!NEWS_API_KEY) return null;
    try {
      const response = await fetch(
        `${BASE_URL}/everything?q=stock market OR finance OR investing&sortBy=publishedAt&language=en&pageSize=20&apiKey=${NEWS_API_KEY}`
      );
      if (!response.ok) throw new Error('News API error');
      return await response.json();
    } catch (error) {
      console.error('News API error:', error);
      return null;
    }
  },
};
