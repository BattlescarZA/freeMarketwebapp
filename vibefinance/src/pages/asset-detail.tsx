import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Plus, Star, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { PriceChart } from '../components/finance/price-chart';
import { backendApi } from '../lib/api/backend-api';
import { formatCurrency, formatPercent } from '../lib/utils/format';

// Types for Yahoo Finance data
interface YahooFinanceQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  marketCap: number;
  currency: string;
  longName: string;
  shortName: string;
  exchange: string;
  quoteType: string;
  timestamp: string;
}

interface HistoricalPrice {
  date: string;
  price: number;
  volume: number;
}

export default function AssetDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<YahooFinanceQuote | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!ticker) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get real-time quote from Yahoo Finance
        const quoteData = await backendApi.external.yahooFinance.getQuote(ticker);
        setQuote(quoteData);
        
        // Get historical data (last 30 days)
        const today = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const period1 = thirtyDaysAgo.toISOString().split('T')[0];
        
        const historicalResponse = await backendApi.external.yahooFinance.getHistorical(
          ticker,
          period1,
          today,
          '1d'
        );
        
        // Transform Yahoo Finance historical data to our format
        const transformedHistorical = historicalResponse.map((item: any) => ({
          date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          price: item.close,
          volume: item.volume || 0,
        }));
        
        setHistoricalData(transformedHistorical);
      } catch (err: any) {
        console.error('Error fetching Yahoo Finance data:', err);
        setError(err.message || 'Failed to fetch market data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <h2 className="text-2xl font-bold mb-2">Loading Market Data</h2>
        <p className="text-muted-foreground">
          Fetching real-time data for {ticker}...
        </p>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-2">Unable to Load Data</h2>
        <p className="text-muted-foreground mb-4">
          {error || `Could not find data for ${ticker}`}
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const isPositive = quote.regularMarketChange >= 0;
  
  // Helper function to determine asset type from quoteType
  const getAssetType = (quoteType: string) => {
    switch (quoteType?.toLowerCase()) {
      case 'equity':
        return 'Stock';
      case 'etf':
        return 'ETF';
      case 'cryptocurrency':
        return 'Crypto';
      case 'currency':
        return 'Forex';
      case 'future':
        return 'Future';
      case 'index':
        return 'Index';
      default:
        return 'Security';
    }
  };

  const assetType = getAssetType(quote.quoteType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{quote.symbol}</h1>
            <Badge variant="secondary">{assetType}</Badge>
          </div>
          <p className="text-muted-foreground">{quote.longName || quote.shortName}</p>
        </div>
        <Button variant="outline" size="sm">
          <Star className="mr-2 h-4 w-4" />
          Add to Watchlist
        </Button>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add to Portfolio
        </Button>
      </div>

      {/* Price Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(quote.regularMarketPrice)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span
                className={`text-2xl font-bold ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {formatCurrency(Math.abs(quote.regularMarketChange))}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Change %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                isPositive ? 'text-success' : 'text-destructive'
              }`}
            >
              {isPositive ? '+' : ''}
              {formatPercent(quote.regularMarketChangePercent / 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quote.regularMarketVolume?.toLocaleString() || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Chart */}
      <PriceChart ticker={quote.symbol} data={historicalData} />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Key Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Previous Close</span>
                <span className="font-medium">
                  {formatCurrency(quote.regularMarketPreviousClose)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Day Range</span>
                <span className="font-medium">
                  {formatCurrency(quote.regularMarketDayLow)} -{' '}
                  {formatCurrency(quote.regularMarketDayHigh)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Open</span>
                <span className="font-medium">
                  {formatCurrency(quote.regularMarketOpen)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="font-medium">
                  {quote.marketCap
                    ? `$${(quote.marketCap / 1e9).toFixed(2)}B`
                    : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge>{assetType}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticker</span>
                <span className="font-medium">{quote.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange</span>
                <span className="font-medium">
                  {quote.exchange || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium">
                  {quote.currency || 'USD'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* News Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Latest News</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-1">
                {quote.longName || quote.shortName} Reports Strong Q4 Earnings
              </h3>
              <p className="text-sm text-muted-foreground">
                Company exceeds analyst expectations with revenue growth...
              </p>
              <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-1">Analyst Upgrades {quote.symbol} to Buy</h3>
              <p className="text-sm text-muted-foreground">
                Major investment firm raises price target citing strong fundamentals...
              </p>
              <p className="text-xs text-muted-foreground mt-2">1 day ago</p>
            </div>
            <div className="pb-4">
              <h3 className="font-medium mb-1">Market Analysis: Tech Sector Outlook</h3>
              <p className="text-sm text-muted-foreground">
                Industry experts weigh in on the future of technology stocks...
              </p>
              <p className="text-xs text-muted-foreground mt-2">3 days ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
