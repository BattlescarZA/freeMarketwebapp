import { Holding } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HoldingsTableProps {
  holdings: Array<{
    holding: Holding;
    currentPrice: number;
    change: number;
    changePercent: number;
  }>;
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Asset
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Quantity
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Avg Cost
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Price
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Value
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Gain/Loss
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              Today
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
              
            </th>
          </tr>
        </thead>
        <tbody>
          {holdings.map(({ holding, currentPrice, change, changePercent }, index) => {
            const totalValue = holding.quantity * currentPrice;
            const totalCost = holding.quantity * holding.averageCost;
            const gainLoss = totalValue - totalCost;
            const gainLossPercent = (gainLoss / totalCost) * 100;
            const isPositive = gainLoss >= 0;
            const isTodayPositive = change >= 0;

            return (
              <tr 
                key={holding.id} 
                className={cn(
                  "group border-b border-border/30 transition-all duration-200",
                  "hover:bg-accent/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Asset */}
                <td className="p-4 align-middle">
                  <Link 
                    to={`/asset/${holding.asset?.ticker}`}
                    className="flex items-center gap-3 group/row"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-primary border border-primary/20 group-hover/row:from-primary/30 group-hover/row:to-purple-500/30 transition-all">
                      {holding.asset?.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm group-hover/row:text-primary transition-colors">
                        {holding.asset?.ticker}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {holding.asset?.name}
                      </div>
                    </div>
                  </Link>
                </td>

                {/* Quantity */}
                <td className="p-4 align-middle text-right">
                  <span className="text-sm font-medium tabular-nums">
                    {holding.quantity.toLocaleString()}
                  </span>
                </td>

                {/* Avg Cost */}
                <td className="p-4 align-middle text-right">
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {formatCurrency(holding.averageCost)}
                  </span>
                </td>

                {/* Current Price */}
                <td className="p-4 align-middle text-right">
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(currentPrice)}
                  </span>
                </td>

                {/* Total Value */}
                <td className="p-4 align-middle text-right">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(totalValue)}
                  </span>
                </td>

                {/* Gain/Loss */}
                <td className="p-4 align-middle text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={cn(
                      "text-sm font-semibold tabular-nums flex items-center gap-1",
                      isPositive ? 'text-success' : 'text-destructive'
                    )}>
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {formatCurrency(Math.abs(gainLoss))}
                    </span>
                    <span className={cn(
                      "text-xs tabular-nums",
                      isPositive ? 'text-success/70' : 'text-destructive/70'
                    )}>
                      {formatPercent(gainLossPercent)}
                    </span>
                  </div>
                </td>

                {/* Today */}
                <td className="p-4 align-middle text-right">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-medium border-0",
                      isTodayPositive 
                        ? 'bg-success/10 text-success hover:bg-success/20' 
                        : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                    )}
                  >
                    {isTodayPositive ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {formatPercent(changePercent)}
                  </Badge>
                </td>

                {/* Actions */}
                <td className="p-4 align-middle text-right">
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
