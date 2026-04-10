import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HoldingsTable } from '@/components/finance/holdings-table';
import { RecentTransactions } from '@/components/finance/recent-transactions';
import { AllocationChart } from '@/components/finance/allocation-chart';
import { PortfolioSummary } from '@/components/finance/portfolio-summary';
import { mockHoldings, mockPrices, mockTransactions, calculatePortfolioValue } from '@/lib/mock-data';
import { Plus, Download, PieChart, History, Wallet } from 'lucide-react';
import { AssetAllocation } from '@/types';

export function PortfolioPage() {
  const summary = calculatePortfolioValue();
  
  const holdingsWithPrices = mockHoldings.map(holding => {
    const priceData = mockPrices[holding.asset!.ticker];
    return {
      holding,
      currentPrice: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
    };
  });

  // Calculate allocation
  const allocation: AssetAllocation[] = mockHoldings.map((holding, index) => {
    const priceData = mockPrices[holding.asset!.ticker];
    const value = holding.quantity * priceData.price;
    const percentage = (value / summary.totalValue) * 100;
    
    return {
      ticker: holding.asset!.ticker,
      name: holding.asset!.name,
      value,
      percentage,
      color: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'][index % 6],
    };
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Portfolio</h1>
            <p className="text-muted-foreground mt-1">
              Manage your investments and track performance
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const { exportPortfolioToCSV } = require('@/lib/utils/csv-export');
                exportPortfolioToCSV(holdingsWithPrices);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button size="sm" variant="gradient">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <PortfolioSummary summary={summary} holdingsCount={mockHoldings.length} />

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Asset Allocation Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Asset Allocation
              </CardTitle>
              <CardDescription>Distribution of your portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <AllocationChart data={allocation} />
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Recent Transactions
                </CardTitle>
                <CardDescription>Your latest trades</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <RecentTransactions transactions={mockTransactions.slice(0, 5)} />
            </CardContent>
          </Card>
        </div>

        {/* Holdings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Holdings
              </CardTitle>
              <CardDescription>All assets in your portfolio</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Filter
              </Button>
              <Button variant="outline" size="sm">
                Sort
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <HoldingsTable holdings={holdingsWithPrices} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
