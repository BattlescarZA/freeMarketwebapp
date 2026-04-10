import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockWatchlist, mockPrices } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { Plus, TrendingUp, TrendingDown, Eye, Trash2, Search, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WatchlistPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Watchlist</h1>
            <p className="text-muted-foreground mt-1">
              Track assets you're interested in
            </p>
          </div>
          <Button size="sm" variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            Add to Watchlist
          </Button>
        </div>

        {/* Watchlist Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockWatchlist.map((item, index) => {
            const priceData = mockPrices[item.asset!.ticker];
            const isPositive = priceData.change >= 0;
            const metTarget = item.targetPrice && priceData.price <= item.targetPrice;

            return (
              <Card 
                key={item.id} 
                className={cn(
                  "group hover-lift overflow-hidden",
                  metTarget && "border-success/50 ring-1 ring-success/20"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary">
                        {item.asset?.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.asset?.ticker}</CardTitle>
                        <CardDescription className="line-clamp-1">{item.asset?.name}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold">{formatCurrency(priceData.price)}</div>
                      <div className={cn(
                        "flex items-center gap-1 mt-1 text-sm font-medium",
                        isPositive ? 'text-success' : 'text-destructive'
                      )}>
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        {formatPercent(priceData.changePercent)}
                        <span className="text-muted-foreground font-normal">today</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Change</div>
                      <div className={cn(
                        "font-medium",
                        isPositive ? 'text-success' : 'text-destructive'
                      )}>
                        {isPositive ? '+' : ''}{formatCurrency(priceData.change)}
                      </div>
                    </div>
                  </div>

                  {item.targetPrice && (
                    <div className={cn(
                      "rounded-lg p-3 border",
                      metTarget 
                        ? 'bg-success/10 border-success/30' 
                        : 'bg-muted/50 border-border'
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Target Price</div>
                          <div className="font-semibold">{formatCurrency(item.targetPrice)}</div>
                        </div>
                        {metTarget && (
                          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                            Target Met!
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                      {item.notes}
                    </p>
                  )}

                  <Button className="w-full" size="sm">
                    Add to Portfolio
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {mockWatchlist.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No assets in watchlist</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                Start tracking assets you're interested in. We'll notify you when they hit your target price.
              </p>
              <Button variant="gradient">
                <Plus className="mr-2 h-4 w-4" />
                Add First Asset
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Asset Card */}
        <Link to="/search">
          <Card className="border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">Search for assets</h3>
              <p className="text-sm text-muted-foreground">
                Find stocks, ETFs, and cryptocurrencies
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </AppLayout>
  );
}
