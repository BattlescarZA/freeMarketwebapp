// CoinGecko API Integration
// Free tier: 10-30 calls/minute, no API key required for basic endpoints

const BASE_URL = 'https://api.coingecko.com/api/v3';

export const coinGeckoApi = {
  // Get coin list
  getCoinList: async () => {
    try {
      const response = await fetch(`${BASE_URL}/coins/list`);
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Get coin data with market info
  getCoinData: async (coinId: string) => {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`
      );
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Get simple price (for multiple coins)
  getSimplePrice: async (coinIds: string[], vsCurrencies: string[] = ['usd']) => {
    try {
      const ids = coinIds.join(',');
      const currencies = vsCurrencies.join(',');
      const response = await fetch(
        `${BASE_URL}/simple/price?ids=${ids}&vs_currencies=${currencies}&include_24hr_change=true&include_market_cap=true`
      );
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Get market data for top coins
  getMarkets: async (vsCurrency: string = 'usd', perPage: number = 100, page: number = 1) => {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false`
      );
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Get coin market chart (historical data)
  getMarketChart: async (coinId: string, days: number = 30, vsCurrency: string = 'usd') => {
    try {
      const response = await fetch(
        `${BASE_URL}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`
      );
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Search coins
  searchCoins: async (query: string) => {
    try {
      const response = await fetch(`${BASE_URL}/search?query=${query}`);
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Get trending coins
  getTrending: async () => {
    try {
      const response = await fetch(`${BASE_URL}/search/trending`);
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },

  // Get global crypto market data
  getGlobalData: async () => {
    try {
      const response = await fetch(`${BASE_URL}/global`);
      if (!response.ok) throw new Error('CoinGecko API error');
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  },
};
