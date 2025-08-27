import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, DollarSign, Percent } from 'lucide-react';
import { formatCurrency } from '@/lib/types';

interface MetricData {
  labels: string[];
  values: number[];
  metadata?: Record<string, any>;
}

interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  group: string;
  chartTypes: string[];
  defaultChart: string;
}

interface MetricSingleValueProps {
  data: MetricData;
  metric: MetricDefinition;
}

export function MetricSingleValue({ data, metric }: MetricSingleValueProps) {
  const value = data.values[0] || 0;
  const label = data.labels[0] || metric.name;

  const formatValue = (val: number) => {
    if (data.metadata?.isPercentage) {
      return `${val.toFixed(1)}%`;
    }
    if (data.metadata?.type === 'count') {
      return val.toString();
    }
    return formatCurrency(val);
  };

  const getIcon = () => {
    if (data.metadata?.isPercentage) return Percent;
    if (data.metadata?.type === 'count') return Target;
    return DollarSign;
  };

  const getValueColor = () => {
    if (metric.id === 'savings-rate') {
      if (value >= 20) return 'text-green-600';
      if (value >= 10) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (metric.group === 'budget' && data.metadata?.totalBudget && data.metadata?.totalSpent) {
      const isOverBudget = data.metadata.totalSpent > data.metadata.totalBudget;
      return isOverBudget ? 'text-red-600' : 'text-green-600';
    }
    
    return 'text-foreground';
  };

  const getTrend = () => {
    if (data.values.length < 2) return null;
    
    const current = data.values[data.values.length - 1];
    const previous = data.values[data.values.length - 2];
    const change = current - previous;
    const changePercent = previous !== 0 ? (change / previous) * 100 : 0;
    
    return {
      change,
      changePercent,
      isPositive: change > 0,
      isNeutral: change === 0
    };
  };

  const getStatusBadge = () => {
    if (metric.id === 'savings-rate') {
      if (value >= 20) return { text: 'Excellent', variant: 'default' as const };
      if (value >= 10) return { text: 'Good', variant: 'secondary' as const };
      if (value >= 0) return { text: 'Fair', variant: 'outline' as const };
      return { text: 'Over Budget', variant: 'destructive' as const };
    }
    
    if (metric.group === 'budget') {
      if (data.metadata?.totalBudget && data.metadata?.totalSpent) {
        const isOverBudget = data.metadata.totalSpent > data.metadata.totalBudget;
        return {
          text: isOverBudget ? 'Over Budget' : 'On Track',
          variant: isOverBudget ? 'destructive' as const : 'default' as const
        };
      }
    }
    
    return null;
  };

  const Icon = getIcon();
  const trend = getTrend();
  const status = getStatusBadge();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Main Value Card */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-bold ${getValueColor()}`}>
                  {formatValue(value)}
                </p>
                {status && (
                  <Badge variant={status.variant} className="text-xs">
                    {status.text}
                  </Badge>
                )}
              </div>
              {trend && (
                <div className="flex items-center gap-1 text-sm">
                  {trend.isPositive ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : trend.isNeutral ? (
                    <Minus className="w-4 h-4 text-gray-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={trend.isPositive ? 'text-green-600' : trend.isNeutral ? 'text-gray-600' : 'text-red-600'}>
                    {trend.isPositive ? '+' : ''}{formatValue(trend.change)} ({trend.changePercent.toFixed(1)}%)
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-muted rounded-full">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Context Cards */}
      {data.metadata && (
        <>
          {/* Budget Context */}
          {data.metadata.totalBudget && data.metadata.totalSpent && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Budget Overview</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Budgeted:</span>
                      <span className="font-mono">{formatCurrency(data.metadata.totalBudget)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Spent:</span>
                      <span className="font-mono">{formatCurrency(data.metadata.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t pt-1">
                      <span>Difference:</span>
                      <span className={`font-mono ${data.metadata.totalSpent > data.metadata.totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(data.metadata.totalBudget - data.metadata.totalSpent)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Context */}
          {data.metadata.count && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Transaction Details</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Transactions:</span>
                      <span className="font-mono">{data.metadata.count}</span>
                    </div>
                    {data.metadata.total && (
                      <div className="flex justify-between text-sm">
                        <span>Total Amount:</span>
                        <span className="font-mono">{formatCurrency(data.metadata.total)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
