// Export all API clients
export { supabase, auth, db } from './supabase';
export { backendApi } from './backend-api';
export { massiveApi, massiveCache } from './massive';
export { polygonApi } from './polygon';
export { alphaVantageApi } from './alphavantage';
export { coinGeckoApi } from './coingecko';
export { finnhubApi } from './finnhub';
export { newsApi } from './newsapi';

// API Usage Summary:
//
// 1. Backend API (Custom Node.js/Express)
//    - User authentication and session management
//    - Portfolio CRUD operations
//    - Transaction processing
//    - Watchlist management
//    - Business logic and data validation
//    URL: https://bfffreelukefinance.quantanova.net
//
// 2. Supabase (Database & Auth - via backend)
//    - Database storage (PostgreSQL)
//    - Row Level Security (RLS)
//    - Real-time subscriptions (future)
//
// 3. Polygon.io (Stocks & ETFs)
//    - Real-time quotes
//    - Historical OHLCV data
//    - Market status
//    Free tier: 5 API calls/minute
//
// 4. Alpha Vantage (Stocks, Forex, Crypto)
//    - Stock quotes
//    - Time series data
//    - Company fundamentals
//    Free tier: 25 API calls/day
//
// 5. CoinGecko (Cryptocurrency)
//    - Crypto prices
//    - Market data
//    - Trending coins
//    Free tier: 10-30 calls/minute (no key needed)
//
// 6. Finnhub (Stocks & WebSocket)
//    - Real-time quotes
//    - Company fundamentals
//    - Insider transactions
//    - WebSocket streaming
//    Free tier: 60 API calls/minute
//
// 7. NewsAPI (Financial News)
//    - Top headlines
//    - Stock-specific news
//    - Crypto news
//    Free tier: 100 requests/day
