import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

interface MetricTableProps {
  data: MetricData;
  metric: MetricDefinition;
}

export function MetricTable({ data, metric }: MetricTableProps) {
  const formatValue = (value: number) => {
    if (data.metadata?.isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    if (data.metadata?.type === 'count') {
      return value.toString();
    }
    return formatCurrency(value);
  };

  const getBudgetComparison = (index: number) => {
    if (!data.metadata?.budgetValues) return null;
    const budget = data.metadata.budgetValues[index];
    const actual = data.values[index];
    if (budget === 0) return null;
    
    const percentage = (actual / budget) * 100;
    const isOver = percentage > 100;
    
    return {
      budget,
      percentage,
      isOver,
      difference: actual - budget
    };
  };

  const tableData = data.labels.map((label, index) => ({
    name: label,
    value: data.values[index],
    budget: data.metadata?.budgetValues?.[index],
    comparison: getBudgetComparison(index)
  }));

  // Sort by value descending for most metrics
  const sortedData = [...tableData].sort((a, b) => b.value - a.value);

  const getValueColor = (value: number, comparison: any) => {
    if (comparison?.isOver) return 'text-red-600';
    if (data.metadata?.type === 'spikes') return 'text-orange-600';
    return 'text-foreground';
  };

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Category</TableHead>
              <TableHead className="text-right">
                {data.metadata?.isPercentage ? 'Percentage' : 
                 data.metadata?.type === 'count' ? 'Count' : 'Amount'}
              </TableHead>
              {data.metadata?.budgetValues && (
                <>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Comparison</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </>
              )}
              {data.metadata?.type === 'timeseries' && (
                <TableHead className="text-right">Trend</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow key={item.name}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.name}
                    {data.metadata?.type === 'spikes' && (
                      <Badge variant="destructive" className="text-xs">Spike</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className={`text-right font-mono ${getValueColor(item.value, item.comparison)}`}>
                  {formatValue(item.value)}
                </TableCell>
                
                {data.metadata?.budgetValues && item.comparison && (
                  <>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.comparison.budget)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div className={`font-mono text-sm ${item.comparison.isOver ? 'text-red-600' : 'text-green-600'}`}>
                          {item.comparison.percentage.toFixed(1)}%
                        </div>
                        <div className={`text-xs ${item.comparison.isOver ? 'text-red-500' : 'text-green-500'}`}>
                          {item.comparison.isOver ? '+' : ''}{formatCurrency(item.comparison.difference)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={item.comparison.isOver ? "destructive" : "default"}
                        className="text-xs"
                      >
                        {item.comparison.isOver ? 'Over Budget' : 'On Track'}
                      </Badge>
                    </TableCell>
                  </>
                )}
                
                {data.metadata?.type === 'timeseries' && (
                  <TableCell className="text-right">
                    {index > 0 && (
                      <div className="flex items-center justify-end gap-1">
                        {item.value > sortedData[index - 1]?.value ? (
                          <span className="text-green-600 text-xs">↗ +{formatCurrency(item.value - sortedData[index - 1].value)}</span>
                        ) : (
                          <span className="text-red-600 text-xs">↘ {formatCurrency(item.value - sortedData[index - 1].value)}</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Summary Footer */}
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Items:</span>
            <span className="ml-2 font-medium">{data.labels.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {data.metadata?.isPercentage ? 'Total:' : 
               data.metadata?.type === 'count' ? 'Total Count:' : 'Total Amount:'}
            </span>
            <span className="ml-2 font-medium">
              {data.metadata?.isPercentage ? '100%' :
               data.metadata?.type === 'count' ? data.values.reduce((sum, val) => sum + val, 0) :
               formatCurrency(data.values.reduce((sum, val) => sum + val, 0))}
            </span>
          </div>
          {!data.metadata?.isPercentage && data.metadata?.type !== 'count' && (
            <>
              <div>
                <span className="text-muted-foreground">Average:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(data.values.reduce((sum, val) => sum + val, 0) / data.values.length)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Highest:</span>
                <span className="ml-2 font-medium">
                  {formatCurrency(Math.max(...data.values))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
