# VibeFinance - Polygon.io API Integration Guide

## 🎯 Overview

This guide covers the integration of Polygon.io REST API for market data in VibeFinance.

**API Tier:** Free  
**Rate Limit:** 5 API calls per minute  
**Data Delay:** 15 minutes (real-time requires paid tier)

---

## 🔑 Step 1: Get API Key

1. Go to [Polygon.io](https://polygon.io)
2. Sign up for free account
3. Verify email
4. Go to Dashboard > API Keys
5. Copy your API key
6. Add to `.env.local`:
```env
VITE_POLYGON_API_KEY=your_api_key_here
```

---

## 📡 Step 2: API Client Implementation

### File: `src/lib/api/polygon.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

const POLYGON_BASE_URL = 'https://api.polygon.io';
const API_KEY = import.meta.env.VITE_POLYGON_API_KEY;

class PolygonAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: POLYGON_BASE_URL,
      params: {
        apiKey: API_KEY,
      },
    });
  }

  /**
   * Get current price snapshot for a ticker
   */
  async getCurrentPrice(ticker: string): Promise<PriceSnapshot> {
    try {
      const response = await this.client.get(
        `/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}`
      );
      
      const data = response.data.ticker;
      
      return {
        ticker: data.ticker,
        price: data.day.c, // Close price
        open: data.day.o,
        high: data.day.h,
        low: data.day.l,
        volume: data.day.v,
        change: data.todaysChange,
        changePercent: data.todaysChangePerc,
        previousClose: data.prevDay?.c || 0,
        timestamp: new Date(data.updated / 1000000), // Convert from nanoseconds
      };
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
      throw new Error(`Failed to fetch price for ${ticker}`);
    }
  }

  /**
   * Get historical aggregated bars (OHLCV)
   */
  async getHistoricalData(
    ticker: string,
    timespan: Timespan = '1day',
    from: Date,
    to: Date = new Date()
  ): Promise<HistoricalBar[]> {
    try {
      const fromStr = this.formatDate(from);
      const toStr = this.formatDate(to);
      
      const response = await this.client.get(
        `/v2/aggs/ticker/${ticker}/range/1/${timespan}/${fromStr}/${toStr}`
      );
      
      if (!response.data.results) {
        return [];
      }
      
      return response.data.results.map((bar: any) => ({
        timestamp: new Date(bar.t),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
        volumeWeighted: bar.vw,
        transactions: bar.n,
      }));
    } catch (error) {
      console.error(`Error fetching historical data for ${ticker}:`, error);
      throw new Error(`Failed to fetch historical data for ${ticker}`);
    }
  }

  /**
   * Search for tickers
   */
  async searchTickers(query: string, limit = 10): Promise<TickerSearchResult[]> {
    try {
      const response = await this.client.get('/v3/reference/tickers', {
        params: {
          search: query,
          active: true,
          limit,
        },
      });
      
      return response.data.results?.map((result: any) => ({
        ticker: result.ticker,
        name: result.name,
        market: result.market,
        locale: result.locale,
        primaryExchange: result.primary_exchange,
        type: result.type,
        active: result.active,
        currencyName: result.currency_name,
        logoUrl: result.branding?.logo_url,
      })) || [];
    } catch (error) {
      console.error(`Error searching tickers for ${query}:`, error);
      throw new Error(`Failed to search tickers`);
    }
  }

  /**
   * Get market news
   */
  async getNews(
    ticker?: string,
    limit = 10
  ): Promise<NewsArticle[]> {
    try {
      const params: any = {
        limit,
        order: 'desc',
      };
      
      if (ticker) {
        params.ticker = ticker;
      }
      
      const response = await this.client.get('/v2/reference/news', { params });
      
      return response.data.results?.map((article: any) => ({
        id: article.id,
        title: article.title,
        author: article.author,
        publishedAt: new Date(article.published_utc),
        url: article.article_url,
        imageUrl: article.image_url,
        description: article.description,
        tickers: article.tickers || [],
        sentiment: article.insights?.[0]?.sentiment || 'neutral',
      })) || [];
    } catch (error) {
      console.error(`Error fetching news:`, error);
      throw new Error(`Failed to fetch news`);
    }
  }

  /**
   * Get ticker details/metadata
   */
  async getTickerDetails(ticker: string): Promise<TickerDetails> {
    try {
      const response = await this.client.get(`/v3/reference/tickers/${ticker}`);
      
      const data = response.data.results;
      
      return {
        ticker: data.ticker,
        name: data.name,
        market: data.market,
        locale: data.locale,
        primaryExchange: data.primary_exchange,
        type: data.type,
        active: data.active,
        currencyName: data.currency_name,
        cik: data.cik,
        compositeFigi: data.composite_figi,
        shareClassFigi: data.share_class_figi,
        marketCap: data.market_cap,
        phoneNumber: data.phone_number,
        address: data.address,
        description: data.description,
        sicDescription: data.sic_description,
        listDate: data.list_date,
        logoUrl: data.branding?.logo_url,
        iconUrl: data.branding?.icon_url,
        homepageUrl: data.homepage_url,
        totalEmployees: data.total_employees,
      };
    } catch (error) {
      console.error(`Error fetching ticker details for ${ticker}:`, error);
      throw new Error(`Failed to fetch ticker details`);
    }
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

// Types
export type Timespan = '1min' | '5min' | '15min' | '30min' | '1hour' | '1day' | '1week' | '1month';

export interface PriceSnapshot {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  change: number;
  changePercent: number;
  previousClose: number;
  timestamp: Date;
}

export interface HistoricalBar {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  volumeWeighted?: number;
  transactions?: number;
}

export interface TickerSearchResult {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primaryExchange: string;
  type: string;
  active: boolean;
  currencyName: string;
  logoUrl?: string;
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

export interface TickerDetails {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primaryExchange: string;
  type: string;
  active: boolean;
  currencyName: string;
  cik?: string;
  compositeFigi?: string;
  shareClassFigi?: string;
  marketCap?: number;
  phoneNumber?: string;
  address?: any;
  description?: string;
  sicDescription?: string;
  listDate?: string;
  logoUrl?: string;
  iconUrl?: string;
  homepageUrl?: string;
  totalEmployees?: number;
}

// Export singleton instance
export const polygonAPI = new PolygonAPI();
```

---

## 🪝 Step 3: React Query Hooks

### File: `src/hooks/use-asset-price.ts`

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { polygonAPI, PriceSnapshot } from '@/lib/api/polygon';

export const useAssetPrice = (
  ticker: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
): UseQueryResult<PriceSnapshot, Error> => {
  return useQuery({
    queryKey: ['asset-price', ticker],
    queryFn: () => polygonAPI.getCurrentPrice(ticker),
    refetchInterval: options?.refetchInterval || 60_000, // 1 minute
    staleTime: 30_000, // 30 seconds
    enabled: options?.enabled ?? true,
    retry: 2,
  });
};

export const useMultipleAssetPrices = (
  tickers: string[],
  options?: {
    refetchInterval?: number;
  }
) => {
  return useQuery({
    queryKey: ['asset-prices', tickers.sort()],
    queryFn: async () => {
      const prices = await Promise.all(
        tickers.map(ticker => 
          polygonAPI.getCurrentPrice(ticker).catch(err => {
            console.warn(`Failed to fetch price for ${ticker}:`, err);
            return null;
          })
        )
      );
      
      return prices.filter((p): p is PriceSnapshot => p !== null);
    },
    refetchInterval: options?.refetchInterval || 60_000,
    staleTime: 30_000,
    enabled: tickers.length > 0,
  });
};
```

### File: `src/hooks/use-historical-data.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { polygonAPI, HistoricalBar, Timespan } from '@/lib/api/polygon';
import { subDays, subMonths, subYears, startOfYear } from 'date-fns';

export const useHistoricalData = (
  ticker: string,
  period: ChartPeriod = '1M'
) => {
  const { from, timespan } = getPeriodConfig(period);
  
  return useQuery({
    queryKey: ['historical-data', ticker, period],
    queryFn: () => polygonAPI.getHistoricalData(ticker, timespan, from),
    staleTime: 5 * 60_000, // 5 minutes
    enabled: !!ticker,
  });
};

type ChartPeriod = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX';

function getPeriodConfig(period: ChartPeriod): {
  from: Date;
  timespan: Timespan;
} {
  const now = new Date();
  
  switch (period) {
    case '1D':
      return { from: subDays(now, 1), timespan: '5min' };
    case '5D':
      return { from: subDays(now, 5), timespan: '15min' };
    case '1M':
      return { from: subMonths(now, 1), timespan: '1hour' };
    case '6M':
      return { from: subMonths(now, 6), timespan: '1day' };
    case 'YTD':
      return { from: startOfYear(now), timespan: '1day' };
    case '1Y':
      return { from: subYears(now, 1), timespan: '1day' };
    case '5Y':
      return { from: subYears(now, 5), timespan: '1week' };
    case 'MAX':
      return { from: subYears(now, 20), timespan: '1month' };
    default:
      return { from: subMonths(now, 1), timespan: '1day' };
  }
}
```

### File: `src/hooks/use-ticker-search.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { polygonAPI } from '@/lib/api/polygon';

export const useTickerSearch = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['ticker-search', query],
    queryFn: () => polygonAPI.searchTickers(query),
    enabled: enabled && query.length > 0,
    staleTime: 5 * 60_000, // 5 minutes
  });
};
```

### File: `src/hooks/use-market-news.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { polygonAPI } from '@/lib/api/polygon';

export const useMarketNews = (ticker?: string, limit = 10) => {
  return useQuery({
    queryKey: ['market-news', ticker, limit],
    queryFn: () => polygonAPI.getNews(ticker, limit),
    staleTime: 10 * 60_000, // 10 minutes
    refetchInterval: 15 * 60_000, // 15 minutes
  });
};
```

---

## ⚡ Step 4: Rate Limiting Strategy

### File: `src/lib/api/rate-limiter.ts`

```typescript
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private callsInMinute: number[] = [];
  private maxCallsPerMinute: number;

  constructor(maxCallsPerMinute = 5) {
    this.maxCallsPerMinute = maxCallsPerMinute;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Clean up old timestamps
      const now = Date.now();
      this.callsInMinute = this.callsInMinute.filter(
        timestamp => now - timestamp < 60_000
      );

      // Check if we can make a call
      if (this.callsInMinute.length < this.maxCallsPerMinute) {
        const fn = this.queue.shift();
        if (fn) {
          this.callsInMinute.push(Date.now());
          await fn();
        }
      } else {
        // Wait until we can make another call
        const oldestCall = this.callsInMinute[0];
        const waitTime = 60_000 - (now - oldestCall);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.processing = false;
  }
}

export const polygonRateLimiter = new RateLimiter(5);
```

---

## 🎨 Step 5: Component Integration Examples

### Price Ticker Component

```typescript
import { useAssetPrice } from '@/hooks/use-asset-price';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

export function PriceTicker({ ticker }: { ticker: string }) {
  const { data: price, isLoading, error } = useAssetPrice(ticker);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading price</div>;
  if (!price) return null;

  const isPositive = price.change >= 0;

  return (
    <div className="flex items-center gap-4">
      <div>
        <div className="text-2xl font-bold">
          {formatCurrency(price.price)}
        </div>
        <div className={isPositive ? 'text-green-500' : 'text-red-500'}>
          {isPositive ? '+' : ''}
          {formatCurrency(price.change)} ({formatPercent(price.changePercent)})
        </div>
      </div>
    </div>
  );
}
```

### Chart Component

```typescript
import { useHistoricalData } from '@/hooks/use-historical-data';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function PriceChart({ ticker, period }: { ticker: string; period: ChartPeriod }) {
  const { data: bars, isLoading } = useHistoricalData(ticker, period);

  if (isLoading) return <div>Loading chart...</div>;
  if (!bars || bars.length === 0) return <div>No data available</div>;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={bars}>
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value) => format(new Date(value), 'MMM d')}
        />
        <YAxis domain={['auto', 'auto']} />
        <Tooltip
          labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
        />
        <Line
          type="monotone"
          dataKey="close"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## 🧪 Step 6: Testing the Integration

### Test in Browser Console

```typescript
// Test current price
import { polygonAPI } from '@/lib/api/polygon';

const price = await polygonAPI.getCurrentPrice('AAPL');
console.log(price);

// Test historical data
const history = await polygonAPI.getHistoricalData(
  'AAPL',
  '1day',
  new Date('2024-01-01'),
  new Date()
);
console.log(history);

// Test search
const results = await polygonAPI.searchTickers('apple');
console.log(results);
```

---

## 📊 API Endpoint Reference

### Available Endpoints

| Endpoint | Purpose | Rate Impact |
|----------|---------|-------------|
| `/v2/snapshot/locale/us/markets/stocks/tickers/{ticker}` | Current price | 1 call |
| `/v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}` | Historical data | 1 call |
| `/v3/reference/tickers` | Search tickers | 1 call |
| `/v2/reference/news` | Market news | 1 call |
| `/v3/reference/tickers/{ticker}` | Ticker details | 1 call |

### Response Codes

- `200` - Success
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (rate limit exceeded)
- `404` - Not found
- `429` - Too many requests

---

## 🚀 Optimization Tips

### 1. Batch Requests
```typescript
// Instead of individual calls
const prices = await Promise.all([
  polygonAPI.getCurrentPrice('AAPL'),
  polygonAPI.getCurrentPrice('MSFT'),
  polygonAPI.getCurrentPrice('GOOGL'),
]);
```

### 2. Aggressive Caching
```typescript
// Cache historical data for longer
staleTime: 60 * 60_000, // 1 hour for historical data
```

### 3. Debounce Search
```typescript
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 500);
const { data } = useTickerSearch(debouncedQuery);
```

### 4. Conditional Fetching
```typescript
// Only fetch when visible
const { data } = useAssetPrice(ticker, {
  enabled: isVisible,
  refetchInterval: isVisible ? 60_000 : false,
});
```

---

## 🔄 Fallback Strategy

### Mock Data for Development

```typescript
// src/lib/api/mock-data.ts
export const mockPriceData: PriceSnapshot = {
  ticker: 'AAPL',
  price: 178.52,
  open: 177.30,
  high: 179.25,
  low: 176.80,
  volume: 52_456_789,
  change: 1.22,
  changePercent: 0.69,
  previousClose: 177.30,
  timestamp: new Date(),
};

// Use in development
const USE_MOCK = import.meta.env.DEV && !import.meta.env.VITE_POLYGON_API_KEY;
```

---

## ⚠️ Common Errors & Solutions

### Error: `Invalid API Key`
**Solution:** Check your `.env.local` file and ensure the key is correct

### Error: `Too Many Requests`
**Solution:** Implement rate limiting or reduce refetch intervals

### Error: `Ticker not found`
**Solution:** Verify ticker symbol is correct and supported

### Error: `Network Error`
**Solution:** Check internet connection and Polygon.io status

---

## 📝 Best Practices

1. **Always handle errors gracefully**
2. **Respect rate limits (5 calls/min)**
3. **Cache aggressively**
4. **Use optimistic updates for better UX**
5. **Show loading states**
6. **Implement retry logic**
7. **Log errors for debugging**
8. **Consider upgrading to paid tier for production**

---

**Last Updated:** 2026-04-08  
**Status:** Polygon.io integration guide complete
