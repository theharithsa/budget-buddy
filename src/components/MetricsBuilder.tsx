import React, { useState, useEffect, useRef } from 'react';
import { useFirestoreData } from '../hooks/useFirestoreData';
import { useTheme } from '../contexts/ThemeContext';
import { useIsMobile } from '../hooks/use-mobile';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { TimeframePicker } from './TimeframePicker';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Table,
  Plus,
  X,
  Filter,
  Database,
  Target,
  Clock,
  DollarSign
} from 'lucide-react';
import ApexCharts from 'apexcharts';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { getAllPeople, formatCurrency } from '../lib/types';

// Simplified Dynatrace-style metric definition
interface MetricQuery {
  id: string;
  name: string;
  metric: string;
  splitBy: string;
  filters: MetricFilter[];
  limit: number;
  chartType: 'line' | 'bar' | 'donut' | 'table';
}

interface MetricFilter {
  dimension: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
}

// Available metrics (like Dynatrace metrics)
const AVAILABLE_METRICS = [
  { id: 'expense.amount', name: 'Total Amount', unit: 'currency', aggregation: 'sum' },
  { id: 'expense.count', name: 'Transaction Count', unit: 'count', aggregation: 'count' },
  { id: 'expense.avg_amount', name: 'Average Amount', unit: 'currency', aggregation: 'avg' },
  { id: 'budget.utilization', name: 'Budget Utilization', unit: 'percentage', aggregation: 'calculated' },
  { id: 'expense.velocity', name: 'Spending Velocity', unit: 'currency_per_day', aggregation: 'rate' }
];

// Available dimensions (like Dynatrace dimensions)
const AVAILABLE_DIMENSIONS = [
  { id: 'category', name: 'Category', type: 'string' },
  { id: 'person', name: 'Person', type: 'string' },
  { id: 'date', name: 'Date', type: 'timestamp' },
  { id: 'month', name: 'Month', type: 'string' },
  { id: 'day_of_week', name: 'Day of Week', type: 'string' },
  { id: 'amount_range', name: 'Amount Range', type: 'range' }
];

export function MetricsBuilder() {
  const { expenses, budgets, customPeople, publicPeople } = useFirestoreData();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  // State management
  const [dateRange, setDateRange] = useState({
    from: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [queries, setQueries] = useState<MetricQuery[]>([
    {
      id: '1',
      name: 'Total Spending by Category',
      metric: 'expense.amount',
      splitBy: 'category',
      filters: [],
      limit: 10,
      chartType: 'bar'
    }
  ]);
  
  const [selectedQuery, setSelectedQuery] = useState<string>('1');
  
  // Chart refs
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const chartInstances = useRef<{ [key: string]: ApexCharts | null }>({});
  
  // Get all people data
  const allPeople = getAllPeople([...customPeople, ...publicPeople]);
  
  // Filter expenses by date range
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = parseISO(expense.date);
    return isWithinInterval(expenseDate, { 
      start: parseISO(dateRange.from), 
      end: parseISO(dateRange.to) 
    });
  });
  
  // Execute metric query (simplified implementation)
  const executeQuery = (query: MetricQuery) => {
    try {
      let data = filteredExpenses;
      
      // Apply filters with safe operations
      query.filters.forEach(filter => {
        if (!filter.dimension || !filter.operator || filter.value === undefined) return;
        
        data = data.filter(expense => {
          try {
            switch (filter.dimension) {
              case 'category':
                if (!expense.category) return false;
                return filter.operator === 'equals' 
                  ? expense.category === filter.value
                  : expense.category.toLowerCase().includes(filter.value.toLowerCase());
              case 'amount':
                const amount = expense.amount || 0;
                const filterValue = parseFloat(filter.value);
                if (isNaN(filterValue)) return true;
                switch (filter.operator) {
                  case 'greater_than': return amount > filterValue;
                  case 'less_than': return amount < filterValue;
                  default: return true;
                }
              case 'person':
                if (!expense.peopleIds || expense.peopleIds.length === 0) {
                  return filter.value === 'Personal';
                }
                const personNames = expense.peopleIds.map(id => {
                  const person = allPeople.find(p => p.id === id);
                  return person?.name || 'Unknown';
                });
                return filter.operator === 'equals'
                  ? personNames.includes(filter.value)
                  : personNames.some(name => name.toLowerCase().includes(filter.value.toLowerCase()));
              default:
                return true;
            }
          } catch (error) {
            console.warn('Filter error:', error);
            return true;
          }
        });
      });
    
    // Group by splitBy dimension
    const grouped: { [key: string]: number } = {};
    
    data.forEach(expense => {
      let key = '';
      switch (query.splitBy) {
        case 'category':
          key = expense.category;
          break;
        case 'person':
          if (expense.peopleIds && expense.peopleIds.length > 0) {
            expense.peopleIds.forEach(personId => {
              const person = allPeople.find(p => p.id === personId);
              const personKey = person?.name || 'Unknown';
              if (query.metric === 'expense.amount') {
                grouped[personKey] = (grouped[personKey] || 0) + (expense.amount / (expense.peopleIds?.length || 1));
              } else if (query.metric === 'expense.count') {
                grouped[personKey] = (grouped[personKey] || 0) + 1;
              }
            });
            return;
          } else {
            key = 'Personal';
          }
          break;
        case 'month':
          key = format(parseISO(expense.date), 'MMM yyyy');
          break;
        case 'day_of_week':
          key = format(parseISO(expense.date), 'EEEE');
          break;
        default:
          key = 'Total';
      }
      
      // Calculate metric value
      switch (query.metric) {
        case 'expense.amount':
          grouped[key] = (grouped[key] || 0) + expense.amount;
          break;
        case 'expense.count':
          grouped[key] = (grouped[key] || 0) + 1;
          break;
        case 'expense.avg_amount':
          // For average, we'll need to calculate differently
          grouped[key] = (grouped[key] || 0) + expense.amount;
          break;
      }
    });
    
    // Convert to sorted array and apply limit
    const sortedData = Object.entries(grouped)
      .sort(([,a], [,b]) => b - a)
      .slice(0, query.limit);
    
    return {
      labels: sortedData.map(([label]) => label),
      values: sortedData.map(([,value]) => value),
      metric: AVAILABLE_METRICS.find(m => m.id === query.metric)
    };
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        labels: [],
        values: [],
        metric: AVAILABLE_METRICS.find(m => m.id === query.metric)
      };
    }
  };
  
  // Add new query
  const addQuery = () => {
    const newQuery: MetricQuery = {
      id: Date.now().toString(),
      name: 'New Metric Query',
      metric: 'expense.amount',
      splitBy: 'category',
      filters: [],
      limit: 10,
      chartType: 'bar'
    };
    setQueries([...queries, newQuery]);
    setSelectedQuery(newQuery.id);
  };
  
  // Update query
  const updateQuery = (queryId: string, updates: Partial<MetricQuery>) => {
    setQueries(queries.map(q => 
      q.id === queryId ? { ...q, ...updates } : q
    ));
  };
  
  // Remove query
  const removeQuery = (queryId: string) => {
    setQueries(queries.filter(q => q.id !== queryId));
    if (selectedQuery === queryId && queries.length > 1) {
      setSelectedQuery(queries.find(q => q.id !== queryId)?.id || '');
    }
  };
  
  // Add filter
  const addFilter = (queryId: string) => {
    const query = queries.find(q => q.id === queryId);
    if (!query) return;
    
    const newFilter: MetricFilter = {
      dimension: 'category',
      operator: 'equals',
      value: ''
    };
    updateQuery(queryId, {
      filters: [...query.filters, newFilter]
    });
  };
  
  // Remove filter
  const removeFilter = (queryId: string, filterIndex: number) => {
    const query = queries.find(q => q.id === queryId);
    if (query) {
      const newFilters = [...query.filters];
      newFilters.splice(filterIndex, 1);
      updateQuery(queryId, { filters: newFilters });
    }
  };
  
  // Update filter
  const updateFilter = (queryId: string, filterIndex: number, updates: Partial<MetricFilter>) => {
    const query = queries.find(q => q.id === queryId);
    if (query) {
      const newFilters = [...query.filters];
      newFilters[filterIndex] = { ...newFilters[filterIndex], ...updates };
      updateQuery(queryId, { filters: newFilters });
    }
  };
  
  const currentQuery = queries.find(q => q.id === selectedQuery);
  const queryResult = currentQuery ? executeQuery(currentQuery) : null;
  
  // Theme configuration
  const getThemeConfig = () => {
    const isDark = theme === 'dark';
    return {
      colors: {
        primary: isDark ? '#3b82f6' : '#2563eb',
        text: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? '#334155' : '#e2e8f0'
      },
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    };
  };
  
  // Render chart
  useEffect(() => {
    if (!currentQuery || !queryResult || !chartRefs.current[selectedQuery]) return;
    
    // Cleanup existing chart
    if (chartInstances.current[selectedQuery]) {
      chartInstances.current[selectedQuery]?.destroy();
      chartInstances.current[selectedQuery] = null;
    }
    
    const themeConfig = getThemeConfig();
    const chartRef = chartRefs.current[selectedQuery];
    
    if ((currentQuery.chartType === 'bar' || currentQuery.chartType === 'line') && queryResult.values.length > 0) {
      const config = {
        chart: {
          height: 350,
          type: currentQuery.chartType,
          fontFamily: themeConfig.fontFamily,
          background: 'transparent',
          toolbar: { show: false }
        },
        series: [{
          name: queryResult.metric?.name || 'Value',
          data: queryResult.values
        }],
        xaxis: {
          categories: queryResult.labels,
          labels: {
            style: { colors: themeConfig.colors.textMuted }
          }
        },
        yaxis: {
          labels: {
            style: { colors: themeConfig.colors.textMuted },
            formatter: (value: number) => {
              if (queryResult.metric?.unit === 'currency') {
                return formatCurrency(value);
              }
              return value.toString();
            }
          }
        },
        colors: [themeConfig.colors.primary],
        dataLabels: { enabled: false },
        grid: {
          borderColor: themeConfig.colors.grid,
          strokeDashArray: 3
        },
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '60%'
          }
        },
        stroke: {
          width: currentQuery.chartType === 'line' ? 3 : 0,
          curve: 'smooth'
        }
      };
      
      chartInstances.current[selectedQuery] = new ApexCharts(chartRef, config);
      chartInstances.current[selectedQuery]?.render();
    } else if (currentQuery.chartType === 'donut' && queryResult.values.length > 0) {
      const config = {
        chart: {
          height: 350,
          type: 'donut',
          fontFamily: themeConfig.fontFamily,
          background: 'transparent'
        },
        series: queryResult.values,
        labels: queryResult.labels,
        colors: [
          themeConfig.colors.primary,
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4'
        ],
        legend: {
          labels: {
            colors: themeConfig.colors.text
          }
        },
        dataLabels: {
          style: {
            colors: ['#fff']
          }
        }
      };
      
      chartInstances.current[selectedQuery] = new ApexCharts(chartRef, config);
      chartInstances.current[selectedQuery]?.render();
    }
    
    return () => {
      if (chartInstances.current[selectedQuery]) {
        chartInstances.current[selectedQuery]?.destroy();
        chartInstances.current[selectedQuery] = null;
      }
    };
  }, [currentQuery, queryResult, selectedQuery, theme]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metrics Builder</h1>
          <p className="text-muted-foreground mt-1">
            Build custom metrics with Dynatrace-style query interface
          </p>
        </div>
        <Button onClick={addQuery} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Query
        </Button>
      </div>
      
      {/* Global Time Range */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Time Range:</span>
            <TimeframePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Query Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {queries.map((query) => (
          <div key={query.id} className="flex items-center gap-1">
            <Button
              variant={selectedQuery === query.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedQuery(query.id)}
              className="whitespace-nowrap"
            >
              {query.name}
            </Button>
            {queries.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeQuery(query.id)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      
      {currentQuery && (
        <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {/* Query Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Query Builder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Query Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Query Name</label>
                <Input
                  value={currentQuery?.name || ''}
                  onChange={(e) => currentQuery && updateQuery(currentQuery.id, { name: e.target.value })}
                  placeholder="Enter query name"
                />
              </div>
              
              {/* Metric & Split By Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Metric Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Metric</label>
                  <Select
                    value={currentQuery?.metric || ''}
                    onValueChange={(value) => currentQuery && updateQuery(currentQuery.id, { metric: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_METRICS.map(metric => (
                        <SelectItem key={metric.id} value={metric.id}>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {metric.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Split By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Split By</label>
                  <Select
                    value={currentQuery?.splitBy || ''}
                    onValueChange={(value) => currentQuery && updateQuery(currentQuery.id, { splitBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_DIMENSIONS.map(dimension => (
                        <SelectItem key={dimension.id} value={dimension.id}>
                          {dimension.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Filters</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => currentQuery && addFilter(currentQuery.id)}
                    className="h-7 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Add Filter
                  </Button>
                </div>
                
                {currentQuery?.filters?.map((filter, index) => (
                  <div key={`${currentQuery.id}-filter-${index}-${filter.dimension}-${filter.operator}`} className="flex gap-2 items-center p-2 border rounded">
                    <Select
                      value={filter.dimension}
                      onValueChange={(value) => currentQuery && updateFilter(currentQuery.id, index, { dimension: value })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_DIMENSIONS.map(dim => (
                          <SelectItem key={dim.id} value={dim.id}>
                            {dim.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={filter.operator}
                      onValueChange={(value: any) => currentQuery && updateFilter(currentQuery.id, index, { operator: value })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">=</SelectItem>
                        <SelectItem value="contains">contains</SelectItem>
                        <SelectItem value="greater_than">&gt;</SelectItem>
                        <SelectItem value="less_than">&lt;</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input
                      value={filter.value}
                      onChange={(e) => currentQuery && updateFilter(currentQuery.id, index, { value: e.target.value })}
                      placeholder="Value"
                      className="flex-1"
                    />
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => currentQuery && removeFilter(currentQuery.id, index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {/* Limit */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Limit</label>
                <Input
                  type="number"
                  value={currentQuery.limit}
                  onChange={(e) => updateQuery(currentQuery.id, { limit: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="100"
                />
              </div>
              
              {/* Chart Type & Limit Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chart Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visualization</label>
                  <Select
                    value={currentQuery?.chartType || 'bar'}
                    onValueChange={(value: any) => currentQuery && updateQuery(currentQuery.id, { chartType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Bar Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="line">
                        <div className="flex items-center gap-2">
                          <LineChart className="h-4 w-4" />
                          Line Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="donut">
                        <div className="flex items-center gap-2">
                          <PieChart className="h-4 w-4" />
                          Donut Chart
                        </div>
                      </SelectItem>
                      <SelectItem value="table">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          Table
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Limit */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit</label>
                  <Select
                    value={currentQuery?.limit?.toString() || '10'}
                    onValueChange={(value) => currentQuery && updateQuery(currentQuery.id, { limit: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 items</SelectItem>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
                      <SelectItem value="100">100 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Chart Display */}
          <div className={isMobile ? 'col-span-1' : 'col-span-2'}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {currentQuery.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {queryResult && queryResult.values.length > 0 ? (
                  <div
                    ref={el => { chartRefs.current[selectedQuery] = el; }}
                    className="w-full h-[350px]"
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-muted-foreground">
                      No data available for the current query
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Stats */}
            {queryResult && queryResult.values.length > 0 && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold">
                        {queryResult.metric?.unit === 'currency'
                          ? formatCurrency(queryResult.values.reduce((sum, val) => sum + val, 0))
                          : queryResult.values.reduce((sum, val) => sum + val, 0).toString()
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {queryResult.metric?.unit === 'currency'
                          ? formatCurrency(queryResult.values.reduce((sum, val) => sum + val, 0) / queryResult.values.length)
                          : (queryResult.values.reduce((sum, val) => sum + val, 0) / queryResult.values.length).toFixed(1)
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Average</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold">
                        {queryResult.values.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Items</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
