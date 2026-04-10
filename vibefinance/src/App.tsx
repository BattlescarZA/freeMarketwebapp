import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { backendApi } from '@/lib/api/backend-api';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, Search, Zap, BarChart3, Globe, Bitcoin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MarketQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  currency: string;
  longName: string;
  shortName: string;
  quoteType: string;
}

interface MarketOverview {
  topGainers: MarketQuote[];
  topLosers: MarketQuote[];
  popularStocks: MarketQuote[];
  popularCryptos: MarketQuote[];
}

function App() {
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        
        // Fetch popular symbols data from database instead of Yahoo Finance API
        const popularSymbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'BTC-USD', 'ETH-USD'];
        
        // Try to get quotes from database first
        let successfulQuotes: MarketQuote[] = [];
        try {
          const response = await backendApi.assets.getLatestQuotes(popularSymbols);
          if (response.success && response.quotes && response.quotes.length > 0) {
            successfulQuotes = response.quotes;
            console.log(`Got ${successfulQuotes.length} quotes from database`);
          } else {
            // Fallback to Yahoo Finance if database has no data
            console.log('No quotes in database, falling back to Yahoo Finance');
            const quotes = await Promise.allSettled(
              popularSymbols.map(symbol => backendApi.external.yahooFinance.getQuote(symbol))
            );

            successfulQuotes = quotes
              .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
              .map(result => result.value)
              .filter(quote => quote && quote.symbol);
          }
        } catch (dbError) {
          console.error('Error fetching from database, falling back to Yahoo Finance:', dbError);
          // Fallback to Yahoo Finance
          const quotes = await Promise.allSettled(
            popularSymbols.map(symbol => backendApi.external.yahooFinance.getQuote(symbol))
          );

          successfulQuotes = quotes
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value)
            .filter(quote => quote && quote.symbol);
        }

        // If we have no successful quotes, check if it's a rate limit error
        if (successfulQuotes.length === 0) {
          setError('No market data available. Please try again later.');
          return;
        }

        // Categorize quotes
        const stocks = successfulQuotes.filter(q =>
          !q.symbol.includes('-USD') || q.quoteType !== 'CRYPTOCURRENCY'
        );
        const cryptos = successfulQuotes.filter(q =>
          q.symbol.includes('-USD') || q.quoteType === 'CRYPTOCURRENCY'
        );

        // Sort by performance
        const sortedByChange = [...successfulQuotes].sort((a, b) =>
          (b.regularMarketChangePercent || 0) - (a.regularMarketChangePercent || 0)
        );

        const topGainers = sortedByChange.slice(0, Math.min(3, sortedByChange.length));
        const topLosers = [...sortedByChange].reverse().slice(0, Math.min(3, sortedByChange.length));
        
        setMarketOverview({
          topGainers,
          topLosers,
          popularStocks: stocks.slice(0, Math.min(5, stocks.length)),
          popularCryptos: cryptos.slice(0, Math.min(3, cryptos.length))
        });
        
        // Clear any previous errors if we got some data
        setError(null);
        
      } catch (err: any) {
        console.error('Error fetching market data:', err);
        setError(err.message || 'Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Refresh data every 60 seconds
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-success' : 'text-destructive';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Overview</h1>
              <p className="text-muted-foreground mt-1">
                Loading real-time market data...
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-8 bg-muted rounded animate-pulse mb-2"></div>
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Overview</h1>
              <p className="text-muted-foreground mt-1">
                Real-time market data
              </p>
            </div>
          </div>
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Failed to load market data</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Overview</h1>
            <p className="text-muted-foreground mt-1">
              Real-time market data and trends
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/search">
                <Search className="mr-2 h-4 w-4" />
                Search Markets
              </Link>
            </Button>
            <Button size="sm" variant="gradient" asChild>
              <Link to="/watchlist">
                <Zap className="mr-2 h-4 w-4" />
                Watchlist
              </Link>
            </Button>
          </div>
        </div>

        {/* Market Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Markets</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketOverview ? marketOverview.popularStocks.length + marketOverview.popularCryptos.length : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Active symbols tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Gainer</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {marketOverview?.topGainers[0] ? (
                <>
                  <div className="text-2xl font-bold">
                    {marketOverview.topGainers[0].symbol}
                  </div>
                  <div className={cn("flex items-center text-sm", getChangeColor(marketOverview.topGainers[0].regularMarketChangePercent))}>
                    {getChangeIcon(marketOverview.topGainers[0].regularMarketChangePercent)}
                    <span className="ml-1">
                      {formatPercent(marketOverview.topGainers[0].regularMarketChangePercent / 100)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Loser</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {marketOverview?.topLosers[0] ? (
                <>
                  <div className="text-2xl font-bold">
                    {marketOverview.topLosers[0].symbol}
                  </div>
                  <div className={cn("flex items-center text-sm", getChangeColor(marketOverview.topLosers[0].regularMarketChangePercent))}>
                    {getChangeIcon(marketOverview.topLosers[0].regularMarketChangePercent)}
                    <span className="ml-1">
                      {formatPercent(marketOverview.topLosers[0].regularMarketChangePercent / 100)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cryptocurrencies</CardTitle>
              <Bitcoin className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {marketOverview?.popularCryptos.length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Major crypto pairs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Market Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Gainers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5 text-success" />
                Top Gainers
              </CardTitle>
              <CardDescription>
                Today's best performing assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketOverview?.topGainers.map((quote, index) => (
                  <div key={quote.symbol} className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/10">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center mr-3">
                        <span className="font-bold text-success">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{quote.symbol}</div>
                        <div className="text-sm text-muted-foreground">{quote.shortName || quote.longName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(quote.regularMarketPrice, quote.currency)}</div>
                      <div className={cn("flex items-center justify-end text-sm", getChangeColor(quote.regularMarketChangePercent))}>
                        {getChangeIcon(quote.regularMarketChangePercent)}
                        <span className="ml-1">
                          {formatPercent(quote.regularMarketChangePercent / 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!marketOverview?.topGainers || marketOverview.topGainers.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No gainer data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Losers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="mr-2 h-5 w-5 text-destructive" />
                Top Losers
              </CardTitle>
              <CardDescription>
                Today's worst performing assets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketOverview?.topLosers.map((quote, index) => (
                  <div key={quote.symbol} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center mr-3">
                        <span className="font-bold text-destructive">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{quote.symbol}</div>
                        <div className="text-sm text-muted-foreground">{quote.shortName || quote.longName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(quote.regularMarketPrice, quote.currency)}</div>
                      <div className={cn("flex items-center justify-end text-sm", getChangeColor(quote.regularMarketChangePercent))}>
                        {getChangeIcon(quote.regularMarketChangePercent)}
                        <span className="ml-1">
                          {formatPercent(quote.regularMarketChangePercent / 100)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!marketOverview?.topLosers || marketOverview.topLosers.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">No loser data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Stocks */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Stocks</CardTitle>
            <CardDescription>
              Most tracked stocks with real-time prices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {marketOverview?.popularStocks.map((quote) => (
                <Link key={quote.symbol} to={`/asset/${quote.symbol}`}>
                  <Card className="group hover-lift transition-all hover:border-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary mb-3">
                          {quote.symbol.slice(0, 2)}
                        </div>
                        <div className="font-bold">{quote.symbol}</div>
                        <div className="text-sm text-muted-foreground mb-2 truncate w-full">
                          {quote.shortName || quote.longName}
                        </div>
                        <div className="font-bold text-lg">
                          {formatCurrency(quote.regularMarketPrice, quote.currency)}
                        </div>
                        <div className={cn("flex items-center text-sm mt-1", getChangeColor(quote.regularMarketChangePercent))}>
                          {getChangeIcon(quote.regularMarketChangePercent)}
                          <span className="ml-1">
                            {formatPercent(quote.regularMarketChangePercent / 100)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {(!marketOverview?.popularStocks || marketOverview.popularStocks.length === 0) && (
                <div className="col-span-5 text-center py-8 text-muted-foreground">
                  No stock data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cryptocurrencies */}
        {marketOverview?.popularCryptos && marketOverview.popularCryptos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bitcoin className="mr-2 h-5 w-5 text-yellow-500" />
                Cryptocurrencies
              </CardTitle>
              <CardDescription>
                Major cryptocurrency prices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {marketOverview.popularCryptos.map((quote) => (
                  <Link key={quote.symbol} to={`/asset/${quote.symbol}`}>
                    <Card className="group hover-lift transition-all hover:border-yellow-500/50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center mr-3">
                              <Bitcoin className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                              <div className="font-bold">{quote.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {quote.shortName || quote.longName}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatCurrency(quote.regularMarketPrice, quote.currency)}
                            </div>
                            <div className={cn("flex items-center justify-end text-sm", getChangeColor(quote.regularMarketChangePercent))}>
                              {getChangeIcon(quote.regularMarketChangePercent)}
                              <span className="ml-1">
                                {formatPercent(quote.regularMarketChangePercent / 100)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {(!marketOverview?.popularCryptos || marketOverview.popularCryptos.length === 0) && (
                  <div className="col-span-3 text-center py-8 text-muted-foreground">
                    No cryptocurrency data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

export default App;
