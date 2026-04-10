import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { backendApi } from '@/lib/api/backend-api';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { Search, TrendingUp, TrendingDown, ExternalLink, Star, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
  quoteType?: string;
  longname?: string;
  exchDisp?: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  currency?: string;
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  // Perform search
  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Update URL with search query
      setSearchParams({ q: searchTerm });
      
      // Call backend API for search
      const data = await backendApi.external.yahooFinance.search(searchTerm);
      
      // Transform Yahoo Finance search results
      const transformedResults: SearchResult[] = data.quotes?.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: quote.quoteType || 'EQUITY',
        exchange: quote.exchange || quote.exchDisp || 'N/A',
        quoteType: quote.quoteType,
        longname: quote.longname,
        exchDisp: quote.exchDisp,
        sector: quote.sector,
        industry: quote.industry,
        marketCap: quote.marketCap,
        regularMarketPrice: quote.regularMarketPrice,
        regularMarketChange: quote.regularMarketChange,
        regularMarketChangePercent: quote.regularMarketChangePercent,
        regularMarketVolume: quote.regularMarketVolume,
        currency: quote.currency,
      })) || [];
      
      setResults(transformedResults);
      saveToRecentSearches(searchTerm);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [setSearchParams, saveToRecentSearches]);

  // Initial search when query changes
  useEffect(() => {
    if (query) {
      setSearchInput(query);
      performSearch(query);
    }
  }, [query, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  const handleQuickSearch = (term: string) => {
    setSearchInput(term);
    performSearch(term);
  };

  const getAssetTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'equity':
      case 'stock':
        return 'bg-blue-500/10 text-blue-500';
      case 'etf':
        return 'bg-purple-500/10 text-purple-500';
      case 'cryptocurrency':
      case 'crypto':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'forex':
        return 'bg-green-500/10 text-green-500';
      case 'index':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'equity':
      case 'stock':
        return 'Stock';
      case 'etf':
        return 'ETF';
      case 'cryptocurrency':
      case 'crypto':
        return 'Crypto';
      case 'forex':
        return 'Forex';
      case 'index':
        return 'Index';
      default:
        return type || 'Asset';
    }
  };

  const handleViewAsset = (symbol: string) => {
    navigate(`/asset/${symbol}`);
  };

  const handleAddToWatchlist = async (symbol: string, name: string) => {
    try {
      // TODO: Implement add to watchlist functionality
      console.log('Adding to watchlist:', symbol, name);
      // await backendApi.watchlist.addToWatchlist(userId, symbol);
      alert(`Added ${symbol} to watchlist`);
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Market Search</h1>
            <p className="text-muted-foreground mt-1">
              Search for stocks, ETFs, cryptocurrencies, and more
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for stocks, ETFs, cryptocurrencies (e.g., AAPL, BTC-USD, SPY)..."
                  className="pl-10"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="gradient">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </form>

            {/* Quick Search Suggestions */}
            {recentSearches.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">Recent searches:</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickSearch(term)}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Try searching for:</p>
              <div className="flex flex-wrap gap-2">
                {['AAPL', 'GOOGL', 'TSLA', 'BTC-USD', 'SPY', 'MSFT', 'AMZN', 'NVDA', 'ETH-USD', 'VOO'].map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSearch(term)}
                  >
                    {term}
                  </Button>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Cryptocurrencies:</span>
                {['Bitcoin', 'Ethereum', 'Solana', 'Cardano', 'Dogecoin', 'XRP'].map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleQuickSearch(term)}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Search className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Search Error</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button variant="outline" onClick={() => performSearch(searchInput)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Search Results ({results.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                Powered by Yahoo Finance
              </p>
            </div>

            {results.map((result, index) => {
              const isPositive = (result.regularMarketChange || 0) >= 0;
              
              return (
                <Card 
                  key={`${result.symbol}-${index}`}
                  className="group hover-lift overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Asset Info */}
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary">
                          {result.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{result.symbol}</h3>
                            <Badge className={getAssetTypeColor(result.type)}>
                              {getAssetTypeLabel(result.type)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {result.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {result.exchange} • {result.sector || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="text-right">
                        {result.regularMarketPrice !== undefined ? (
                          <>
                            <div className="text-2xl font-bold">
                              {formatCurrency(result.regularMarketPrice, result.currency)}
                            </div>
                            <div className={cn(
                              "flex items-center justify-end gap-1 text-sm",
                              isPositive ? "text-success" : "text-destructive"
                            )}>
                              {isPositive ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              <span>
                                {formatCurrency(result.regularMarketChange || 0, result.currency)}
                              </span>
                              <span>
                                ({formatPercent((result.regularMarketChangePercent || 0) / 100)})
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Market Cap: {result.marketCap ? formatCurrency(result.marketCap, result.currency) : 'N/A'}
                            </p>
                          </>
                        ) : (
                          <p className="text-muted-foreground">Price data not available</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewAsset(result.symbol)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToWatchlist(result.symbol, result.name)}
                        >
                          <Star className="mr-2 h-4 w-4" />
                          Watchlist
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : query ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No results found</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                No assets found for "{query}". Try a different search term.
              </p>
              <Button variant="outline" onClick={() => setSearchInput('')}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Search the markets</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Enter a stock symbol, company name, or cryptocurrency to get real-time market data.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {['Apple Inc.', 'Bitcoin', 'S&P 500 ETF', 'Tesla', 'Microsoft'].map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickSearch(term)}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}