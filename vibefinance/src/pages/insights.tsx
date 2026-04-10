import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, PieChart, Target, AlertCircle, Lightbulb, ArrowRight, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockInsights = [
  {
    id: '1',
    type: 'performance',
    icon: TrendingUp,
    title: 'Strong Portfolio Performance',
    description: 'Your portfolio is up 22.3% all-time, outperforming the S&P 500 by 8.2%',
    sentiment: 'positive' as const,
    actionable: false,
  },
  {
    id: '2',
    type: 'allocation',
    icon: PieChart,
    title: 'Tech Sector Concentration',
    description: 'Your portfolio has 65% allocation to technology stocks. Consider diversifying.',
    sentiment: 'warning' as const,
    actionable: true,
    action: {
      label: 'View Recommendations',
      onClick: () => console.log('Show diversification suggestions'),
    },
  },
  {
    id: '3',
    type: 'opportunity',
    icon: Target,
    title: 'TSLA Reached Target Price',
    description: 'Tesla has dropped to your target price of $250. Consider entering a position.',
    sentiment: 'positive' as const,
    actionable: true,
    action: {
      label: 'Add to Portfolio',
      onClick: () => console.log('Add TSLA to portfolio'),
    },
  },
  {
    id: '4',
    type: 'suggestion',
    icon: Lightbulb,
    title: 'Rebalancing Opportunity',
    description: 'AAPL now represents 35% of your portfolio. Consider taking some profits.',
    sentiment: 'neutral' as const,
    actionable: true,
    action: {
      label: 'View Details',
      onClick: () => console.log('Show rebalancing details'),
    },
  },
];

export function InsightsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gradient">Insights</h1>
            <p className="text-muted-foreground mt-1">
              AI-powered analysis and recommendations for your portfolio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Brain className="mr-2 h-4 w-4" />
              Run Analysis
            </Button>
          </div>
        </div>

        {/* AI Feature Card */}
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <CardHeader className="relative">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Advanced portfolio analysis powered by artificial intelligence
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <p className="text-sm text-muted-foreground max-w-2xl">
              Get personalized investment insights, market trends analysis, risk assessment, 
              and automated recommendations based on your portfolio and market conditions.
            </p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                Real-time analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Brain className="h-4 w-4 text-primary" />
                Smart recommendations
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-primary" />
                Risk alerts
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights List */}
        <div className="grid gap-4">
          {mockInsights.map((insight, index) => {
            const Icon = insight.icon;
            
            return (
              <Card 
                key={insight.id} 
                className="group hover-lift"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "rounded-xl p-3 flex-shrink-0",
                        insight.sentiment === 'positive' ? 'bg-success/10 text-success' :
                        insight.sentiment === 'warning' ? 'bg-warning/10 text-warning' :
                        'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{insight.title}</CardTitle>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              insight.sentiment === 'positive' ? 'border-success/30 text-success bg-success/5' :
                              insight.sentiment === 'warning' ? 'border-warning/30 text-warning bg-warning/5' :
                              'border-muted-foreground/30 text-muted-foreground'
                            )}
                          >
                            {insight.type}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {insight.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    {insight.actionable && insight.action && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={insight.action.onClick}
                      >
                        {insight.action.label}
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {insight.actionable && insight.action && (
                  <CardContent className="pt-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={insight.action.onClick}
                    >
                      {insight.action.label}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* More Insights Coming Soon */}
        <Card className="border-dashed border-2 bg-gradient-to-br from-muted/50 to-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">More Insights Coming Soon</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              We're working on personalized portfolio recommendations, risk analysis,
              market predictions, and automated rebalancing suggestions.
            </p>
            <Button variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Stay Tuned
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
