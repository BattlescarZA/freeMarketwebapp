import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { PortfolioSummary as PortfolioSummaryType } from '@/types';
import { cn } from '@/lib/utils';

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
  holdingsCount: number;
}

export function PortfolioSummary({ summary, holdingsCount }: PortfolioSummaryProps) {
  const isPositiveDay = summary.dayChange >= 0;
  const isPositiveTotal = summary.totalGainLoss >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Value */}
      <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Cost basis: {formatCurrency(summary.totalCost)}
          </p>
        </CardContent>
      </Card>

      {/* Today's Change */}
      <Card className={cn(
        isPositiveDay 
          ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20' 
          : 'bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20'
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Today's Change</CardTitle>
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            isPositiveDay ? 'bg-green-500/20' : 'bg-red-500/20'
          )}>
            {isPositiveDay ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold flex items-center gap-1",
            isPositiveDay ? 'text-green-500' : 'text-red-500'
          )}>
            {isPositiveDay ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            {formatCurrency(summary.dayChange)}
          </div>
          <p className={cn(
            "text-xs mt-1",
            isPositiveDay ? 'text-green-500/80' : 'text-red-500/80'
          )}>
            {formatPercent(summary.dayChangePercent)}
          </p>
        </CardContent>
      </Card>

      {/* Total Gain/Loss */}
      <Card className={cn(
        isPositiveTotal 
          ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20' 
          : 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20'
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Gain/Loss</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <PieChart className="h-4 w-4 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "text-2xl font-bold flex items-center gap-1",
            isPositiveTotal ? 'text-green-500' : 'text-red-500'
          )}>
            {isPositiveTotal ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
            {formatCurrency(summary.totalGainLoss)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {formatPercent(summary.totalGainLossPercent)} all time
          </p>
        </CardContent>
      </Card>

      {/* Holdings Count */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Holdings</CardTitle>
          <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{holdingsCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Across multiple assets
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
