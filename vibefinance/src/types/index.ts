export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  currency: string;
  notifications: boolean;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  assetType: 'stock' | 'etf' | 'crypto' | 'other';
  exchange?: string;
  logoUrl?: string;
  createdAt: Date;
}

export interface Holding {
  id: string;
  portfolioId: string;
  assetId: string;
  asset?: Asset;
  quantity: number;
  averageCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  assetId: string;
  asset?: Asset;
  transactionType: 'buy' | 'sell';
  quantity: number;
  price: number;
  fees: number;
  transactionDate: Date;
  notes?: string;
  createdAt: Date;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  assetId: string;
  asset?: Asset;
  targetPrice?: number;
  notes?: string;
  createdAt: Date;
}

export interface PriceData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  timestamp: Date;
  dayLow?: number;
  dayHigh?: number;
  yearLow?: number;
  yearHigh?: number;
  marketCap?: number;
}

export interface HistoricalBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  author: string;
  publishedAt: Date;
  url: string;
  imageUrl?: string;
  description: string;
  tickers: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface AssetAllocation {
  ticker: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}
