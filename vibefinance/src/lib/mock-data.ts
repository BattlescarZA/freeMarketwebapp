import { Holding, Transaction, Asset, WatchlistItem, PriceData } from '@/types';

// Mock Assets
export const mockAssets: Asset[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    assetType: 'stock',
    exchange: 'NASDAQ',
    createdAt: new Date(),
  },
  {
    id: '2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    assetType: 'stock',
    exchange: 'NASDAQ',
    createdAt: new Date(),
  },
  {
    id: '3',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    assetType: 'stock',
    exchange: 'NASDAQ',
    createdAt: new Date(),
  },
  {
    id: '4',
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    assetType: 'stock',
    exchange: 'NASDAQ',
    createdAt: new Date(),
  },
  {
    id: '5',
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    assetType: 'etf',
    exchange: 'NYSE',
    createdAt: new Date(),
  },
  {
    id: '6',
    ticker: 'BTC-USD',
    name: 'Bitcoin',
    assetType: 'crypto',
    createdAt: new Date(),
  },
];

// Mock Holdings
export const mockHoldings: Holding[] = [
  {
    id: '1',
    portfolioId: '1',
    assetId: '1',
    asset: mockAssets[0],
    quantity: 10,
    averageCost: 150.50,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
  },
  {
    id: '2',
    portfolioId: '1',
    assetId: '2',
    asset: mockAssets[1],
    quantity: 15,
    averageCost: 320.00,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: '3',
    portfolioId: '1',
    assetId: '3',
    asset: mockAssets[2],
    quantity: 8,
    averageCost: 135.75,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date(),
  },
  {
    id: '4',
    portfolioId: '1',
    assetId: '5',
    asset: mockAssets[4],
    quantity: 50,
    averageCost: 420.00,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
];

// Mock Price Data
export const mockPrices: Record<string, PriceData> = {
  'AAPL': {
    ticker: 'AAPL',
    price: 178.52,
    change: 2.34,
    changePercent: 1.33,
    open: 176.18,
    high: 179.25,
    low: 175.90,
    volume: 52_456_789,
    previousClose: 176.18,
    timestamp: new Date(),
    dayLow: 175.90,
    dayHigh: 179.25,
    yearLow: 124.17,
    yearHigh: 199.62,
    marketCap: 2_800_000_000_000,
  },
  'MSFT': {
    ticker: 'MSFT',
    price: 405.63,
    change: 5.12,
    changePercent: 1.28,
    open: 400.51,
    high: 407.20,
    low: 399.80,
    volume: 28_345_678,
    previousClose: 400.51,
    timestamp: new Date(),
    dayLow: 399.80,
    dayHigh: 407.20,
    yearLow: 309.45,
    yearHigh: 420.82,
    marketCap: 3_020_000_000_000,
  },
  'GOOGL': {
    ticker: 'GOOGL',
    price: 142.87,
    change: 1.45,
    changePercent: 1.03,
    open: 141.42,
    high: 143.50,
    low: 141.20,
    volume: 18_234_567,
    previousClose: 141.42,
    timestamp: new Date(),
    dayLow: 141.20,
    dayHigh: 143.50,
    yearLow: 102.21,
    yearHigh: 153.78,
    marketCap: 1_780_000_000_000,
  },
  'TSLA': {
    ticker: 'TSLA',
    price: 245.32,
    change: -3.45,
    changePercent: -1.39,
    open: 248.77,
    high: 250.10,
    low: 244.50,
    volume: 45_678_901,
    previousClose: 248.77,
    timestamp: new Date(),
    dayLow: 244.50,
    dayHigh: 250.10,
    yearLow: 101.81,
    yearHigh: 299.29,
    marketCap: 778_000_000_000,
  },
  'SPY': {
    ticker: 'SPY',
    price: 485.23,
    change: 2.67,
    changePercent: 0.55,
    open: 482.56,
    high: 486.10,
    low: 481.90,
    volume: 65_432_109,
    previousClose: 482.56,
    timestamp: new Date(),
    dayLow: 481.90,
    dayHigh: 486.10,
    yearLow: 362.17,
    yearHigh: 495.63,
    marketCap: 450_000_000_000,
  },
  'BTC-USD': {
    ticker: 'BTC-USD',
    price: 52345.67,
    change: 1234.56,
    changePercent: 2.42,
    open: 51111.11,
    high: 53000.00,
    low: 50900.00,
    volume: 234_567_890,
    previousClose: 51111.11,
    timestamp: new Date(),
    dayLow: 50900.00,
    dayHigh: 53000.00,
    yearLow: 15460.00,
    yearHigh: 73750.00,
    marketCap: 1_025_000_000_000,
  },
};

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    portfolioId: '1',
    assetId: '1',
    asset: mockAssets[0],
    transactionType: 'buy',
    quantity: 10,
    price: 150.50,
    fees: 1.00,
    transactionDate: new Date('2024-01-15'),
    notes: 'Initial purchase',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    portfolioId: '1',
    assetId: '2',
    asset: mockAssets[1],
    transactionType: 'buy',
    quantity: 15,
    price: 320.00,
    fees: 1.50,
    transactionDate: new Date('2024-02-01'),
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '3',
    portfolioId: '1',
    assetId: '3',
    asset: mockAssets[2],
    transactionType: 'buy',
    quantity: 8,
    price: 135.75,
    fees: 0.75,
    transactionDate: new Date('2024-01-20'),
    createdAt: new Date('2024-01-20'),
  },
];

// Mock Watchlist
export const mockWatchlist: WatchlistItem[] = [
  {
    id: '1',
    userId: '1',
    assetId: '4',
    asset: mockAssets[3],
    targetPrice: 250.00,
    notes: 'Watch for dip',
    createdAt: new Date(),
  },
  {
    id: '2',
    userId: '1',
    assetId: '6',
    asset: mockAssets[5],
    targetPrice: 50000.00,
    notes: 'Waiting for good entry',
    createdAt: new Date(),
  },
];

// Helper to calculate portfolio value
export function calculatePortfolioValue() {
  let totalValue = 0;
  let totalCost = 0;

  mockHoldings.forEach(holding => {
    const price = mockPrices[holding.asset!.ticker];
    if (price) {
      totalValue += holding.quantity * price.price;
      totalCost += holding.quantity * holding.averageCost;
    }
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = (totalGainLoss / totalCost) * 100;

  // Calculate day change (simplified)
  let dayChange = 0;
  mockHoldings.forEach(holding => {
    const price = mockPrices[holding.asset!.ticker];
    if (price) {
      dayChange += holding.quantity * price.change;
    }
  });
  const dayChangePercent = (dayChange / totalValue) * 100;

  return {
    totalValue,
    totalCost,
    totalGainLoss,
    totalGainLossPercent,
    dayChange,
    dayChangePercent,
  };
}
