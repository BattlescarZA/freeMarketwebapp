export const APP_NAME = 'VibeFinance';
export const APP_DESCRIPTION = 'Modern financial portfolio tracker';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  DASHBOARD: '/dashboard',
  PORTFOLIO: '/portfolio',
  ASSET_DETAIL: '/assets',
  WATCHLIST: '/watchlist',
  INSIGHTS: '/insights',
  SETTINGS: '/settings',
} as const;

export const CHART_PERIODS = [
  { label: '1D', value: '1D' },
  { label: '5D', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: 'MAX', value: 'MAX' },
] as const;

export const ASSET_TYPES = {
  STOCK: 'stock',
  ETF: 'etf',
  CRYPTO: 'crypto',
  OTHER: 'other',
} as const;

export const TRANSACTION_TYPES = {
  BUY: 'buy',
  SELL: 'sell',
} as const;

export const QUERY_KEYS = {
  PORTFOLIO: 'portfolio',
  HOLDINGS: 'holdings',
  TRANSACTIONS: 'transactions',
  ASSET_PRICE: 'asset-price',
  ASSET_PRICES: 'asset-prices',
  HISTORICAL_DATA: 'historical-data',
  WATCHLIST: 'watchlist',
  NEWS: 'news',
  USER: 'user',
} as const;
