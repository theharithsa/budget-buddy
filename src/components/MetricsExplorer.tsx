import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeframePicker, type DateRange } from '@/components/TimeframePicker';
import { MetricsBuilder } from '@/components/MetricsBuilder';
import { useIsMobile } from '@/hooks/use-mobile';
import ApexCharts from 'apexcharts';
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Target,
  Users,
  Tag,
  Calendar,
  Calculator,
  Filter,
  Download,
  RefreshCw,
  Receipt,
  Table,
  Gauge,
  DollarSign,
  Grid3x3,
  Settings,
  Layers
} from 'lucide-react';
import { type Expense, type Budget, type CustomCategory, type Person, getAllCategories, getAllPeople, formatCurrency } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeContext';

interface MetricsExplorerProps {
  expenses: Expense[];
  budgets: Budget[];
  customCategories: CustomCategory[];
  customPeople: Person[];
  publicPeople: Person[];
}

type MetricGroup = 'category' | 'budget' | 'people' | 'description' | 'time' | 'ratios';
type ChartType = 'line' | 'bar' | 'donut' | 'table' | 'single' | 'heatmap';

interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  group: MetricGroup;
  chartTypes: ChartType[];
  defaultChart: ChartType;
}

interface MetricData {
  labels: string[];
  values: number[];
  metadata?: Record<string, any>;
}

const METRIC_DEFINITIONS: MetricDefinition[] = [
  // Category Metrics
  {
    id: 'total-spend-category',
    name: 'Total Spending by Category',
    description: 'Total amount spent across all categories',
    group: 'category',
    chartTypes: ['bar', 'donut', 'table'],
    defaultChart: 'bar'
  },
  {
    id: 'category-percentage',
    name: 'Category Distribution',
    description: 'Percentage breakdown of spending by category',
    group: 'category',
    chartTypes: ['donut', 'bar', 'table'],
    defaultChart: 'donut'
  },
  {
    id: 'category-trend',
    name: 'Category Trends Over Time',
    description: 'Monthly spending trends by category',
    group: 'category',
    chartTypes: ['line', 'bar', 'table', 'heatmap'],
    defaultChart: 'line'
  },
  // Budget Metrics
  {
    id: 'budget-vs-actual',
    name: 'Budget vs Actual Spending',
    description: 'Comparison of budgeted vs actual spending',
    group: 'budget',
    chartTypes: ['bar', 'table', 'single'],
    defaultChart: 'bar'
  },
  {
    id: 'budget-utilization',
    name: 'Budget Utilization',
    description: 'Percentage of budget used by category',
    group: 'budget',
    chartTypes: ['bar', 'single', 'table'],
    defaultChart: 'bar'
  },
  // People Metrics
  {
    id: 'total-spend-person',
    name: 'Total Spending by Person',
    description: 'Total amount spent per person',
    group: 'people',
    chartTypes: ['bar', 'donut', 'table'],
    defaultChart: 'bar'
  },
  {
    id: 'person-percentage',
    name: 'Person Distribution',
    description: 'Percentage breakdown of spending by person',
    group: 'people',
    chartTypes: ['donut', 'bar', 'table'],
    defaultChart: 'donut'
  },
  // Description/Tags Metrics
  {
    id: 'top-merchants',
    name: 'Top Merchants',
    description: 'Most common merchant names from descriptions',
    group: 'description',
    chartTypes: ['bar', 'table'],
    defaultChart: 'bar'
  },
  // Time Metrics
  {
    id: 'monthly-trend',
    name: 'Monthly Spending Trend',
    description: 'Spending trends over time',
    group: 'time',
    chartTypes: ['line', 'bar', 'table'],
    defaultChart: 'line'
  },
  {
    id: 'daily-average',
    name: 'Daily Average Spending',
    description: 'Average spending per day',
    group: 'time',
    chartTypes: ['line', 'single'],
    defaultChart: 'single'
  },
  // Ratio Metrics
  {
    id: 'savings-rate',
    name: 'Savings Rate',
    description: 'Percentage of income saved',
    group: 'ratios',
    chartTypes: ['single', 'line'],
    defaultChart: 'single'
  },
  {
    id: 'avg-transaction-size',
    name: 'Average Transaction Size',
    description: 'Average amount per transaction',
    group: 'ratios',
    chartTypes: ['single', 'line'],
    defaultChart: 'single'
  }
];

const METRIC_GROUPS = [
  { id: 'category', name: 'Category Analytics', icon: Receipt },
  { id: 'budget', name: 'Budget Tracking', icon: Target },
  { id: 'people', name: 'People Analytics', icon: Users },
  { id: 'description', name: 'Merchants & Tags', icon: Tag },
  { id: 'time', name: 'Time Analysis', icon: Calendar },
  { id: 'ratios', name: 'Financial Ratios', icon: Calculator },
];

export function MetricsExplorer({ 
  expenses, 
  budgets, 
  customCategories, 
  customPeople, 
  publicPeople 
}: MetricsExplorerProps) {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [selectedGroup, setSelectedGroup] = useState<MetricGroup>('category');
  const [selectedMetric, setSelectedMetric] = useState<string>('total-spend-category');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [chartKey, setChartKey] = useState(0);

  // Chart refs
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ApexCharts | null>(null);

  // Get all people including "Myself"
  const allPeople = useMemo(() => {
    const myself = { id: 'myself', name: 'Myself', icon: '👤', color: '#6366f1' };
    const safePeople = getAllPeople([...(customPeople || []), ...(publicPeople || [])]);
    return [myself, ...safePeople];
  }, [customPeople, publicPeople]);

  // Filter expenses by date range
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      return expense.date >= dateRange.from && expense.date <= dateRange.to;
    });
  }, [expenses, dateRange]);

  // Theme configuration for charts
  const getChartThemeConfig = () => {
    const isDark = theme === 'dark';
    return {
      fontFamily: 'Inter, sans-serif',
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
        tertiary: '#f59e0b',
        quaternary: '#ef4444',
        text: isDark ? '#f1f5f9' : '#0f172a',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? '#374151' : '#e2e8f0',
        background: isDark ? '#1f2937' : '#ffffff'
      }
    };
  };

  // Calculate metric data
  const calculateMetricData = (metricId: string): MetricData | null => {
    switch (metricId) {
      case 'total-spend-category':
        return calculateTotalSpendByCategory();
      case 'category-percentage':
        return calculateCategoryPercentage();
      case 'category-trend':
        return calculateCategoryTrend();
      case 'budget-vs-actual':
        return calculateBudgetVsActual();
      case 'budget-utilization':
        return calculateBudgetUtilization();
      case 'total-spend-person':
        return calculateTotalSpendByPerson();
      case 'person-percentage':
        return calculatePersonPercentage();
      case 'top-merchants':
        return calculateTopMerchants();
      case 'monthly-trend':
        return calculateMonthlyTrend();
      case 'daily-average':
        return calculateDailyAverage();
      case 'savings-rate':
        return calculateSavingsRate();
      case 'avg-transaction-size':
        return calculateAvgTransactionSize();
      default:
        return null;
    }
  };

  // Metric calculation functions
  function calculateTotalSpendByCategory(): MetricData {
    const categories = getAllCategories([...customCategories]);
    const categorySpend = categories.reduce((acc, category) => {
      acc[category.name] = 0;
      return acc;
    }, {} as Record<string, number>);

    filteredExpenses.forEach(expense => {
      if (categorySpend.hasOwnProperty(expense.category)) {
        categorySpend[expense.category] += expense.amount;
      }
    });

    return {
      labels: Object.keys(categorySpend).filter(cat => categorySpend[cat] > 0),
      values: Object.keys(categorySpend).filter(cat => categorySpend[cat] > 0).map(cat => categorySpend[cat])
    };
  }

  function calculateCategoryPercentage(): MetricData {
    const categoryData = calculateTotalSpendByCategory();
    const total = categoryData.values.reduce((sum, val) => sum + val, 0) || 1;
    
    return {
      labels: categoryData.labels,
      values: categoryData.values.map(value => (value / total) * 100),
      metadata: { total, isPercentage: true }
    };
  }

  function calculateCategoryTrend(): MetricData {
    const monthlyData: Record<string, Record<string, number>> = {};
    
    filteredExpenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      if (!monthlyData[monthKey]) monthlyData[monthKey] = {};
      monthlyData[monthKey][expense.category] = (monthlyData[monthKey][expense.category] || 0) + expense.amount;
    });

    const months = Object.keys(monthlyData).sort();
    const categories = [...new Set(filteredExpenses.map(e => e.category))];
    
    return {
      labels: months,
      values: months.map(month => 
        categories.reduce((sum, cat) => sum + (monthlyData[month][cat] || 0), 0)
      ),
      metadata: { categories, monthlyData }
    };
  }

  function calculateBudgetVsActual(): MetricData {
    const budgetData = budgets.reduce((acc, budget) => {
      const spent = filteredExpenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      
      acc.labels.push(budget.category);
      acc.budgeted.push(budget.limit);
      acc.actual.push(spent);
      return acc;
    }, { labels: [] as string[], budgeted: [] as number[], actual: [] as number[] });

    return {
      labels: budgetData.labels,
      values: budgetData.actual,
      metadata: { budgeted: budgetData.budgeted }
    };
  }

  function calculateBudgetUtilization(): MetricData {
    const budgetData = calculateBudgetVsActual();
    const utilization = budgetData.values.map((actual, index) => {
      const budgeted = budgetData.metadata?.budgeted[index] || 1;
      return (actual / budgeted) * 100;
    });

    return {
      labels: budgetData.labels,
      values: utilization,
      metadata: { isPercentage: true }
    };
  }

  function calculateTotalSpendByPerson(): MetricData {
    const personSpend: Record<string, number> = {};
    
    // Initialize all people with 0
    allPeople.forEach(person => {
      personSpend[person.name] = 0;
    });

    filteredExpenses.forEach(expense => {
      if (expense.peopleIds && expense.peopleIds.length > 0) {
        const amountPerPerson = expense.amount / expense.peopleIds.length;
        expense.peopleIds.forEach(personId => {
          const person = allPeople.find(p => p.id === personId);
          if (person) {
            personSpend[person.name] += amountPerPerson;
          }
        });
      } else {
        // If no people assigned, attribute to "Myself"
        personSpend['Myself'] += expense.amount;
      }
    });

    // Filter out people with 0 spending
    const labels = Object.keys(personSpend).filter(name => personSpend[name] > 0);
    const values = labels.map(name => personSpend[name]);

    return { labels, values };
  }

  function calculatePersonPercentage(): MetricData {
    const personData = calculateTotalSpendByPerson();
    const total = personData.values.reduce((sum, val) => sum + val, 0) || 1;
    
    return {
      labels: personData.labels,
      values: personData.values.map(value => (value / total) * 100),
      metadata: { total, isPercentage: true }
    };
  }

  function calculateTopMerchants(): MetricData {
    // Extract merchant names from descriptions (focus on nouns and company names)
    const merchantCounts: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
      // Simple extraction: look for capitalized words that could be merchant names
      const words = expense.description.split(/\s+/);
      words.forEach(word => {
        // Filter for potential merchant names (capitalized, not common words)
        if (word.length > 2 && 
            /^[A-Z]/.test(word) && 
            !['The', 'And', 'For', 'With', 'At', 'To', 'From', 'By', 'Of', 'In', 'On'].includes(word)) {
          const cleanWord = word.replace(/[^\w]/g, '');
          if (cleanWord.length > 2) {
            merchantCounts[cleanWord] = (merchantCounts[cleanWord] || 0) + expense.amount;
          }
        }
      });
    });

    // Get top 10 merchants by spending
    const sortedMerchants = Object.entries(merchantCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedMerchants.map(([name]) => name),
      values: sortedMerchants.map(([,amount]) => amount)
    };
  }

  function calculateMonthlyTrend(): MetricData {
    const monthlySpend: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
      const monthKey = new Date(expense.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      monthlySpend[monthKey] = (monthlySpend[monthKey] || 0) + expense.amount;
    });

    const sortedMonths = Object.keys(monthlySpend).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    return {
      labels: sortedMonths,
      values: sortedMonths.map(month => monthlySpend[month])
    };
  }

  function calculateDailyAverage(): MetricData {
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const daysDiff = Math.max(1, Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24)));
    const dailyAverage = totalSpent / daysDiff;

    return {
      labels: ['Daily Average'],
      values: [dailyAverage]
    };
  }

  function calculateSavingsRate(): MetricData {
    // Simplified savings rate calculation - would need income data for accurate calculation
    const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const savingsRate = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;

    return {
      labels: ['Savings Rate'],
      values: [Math.max(0, savingsRate)],
      metadata: { isPercentage: true }
    };
  }

  function calculateAvgTransactionSize(): MetricData {
    const avgSize = filteredExpenses.length > 0 
      ? filteredExpenses.reduce((sum, e) => sum + e.amount, 0) / filteredExpenses.length 
      : 0;

    return {
      labels: ['Average Transaction'],
      values: [avgSize]
    };
  }

  // Get current metric data
  const currentMetric = METRIC_DEFINITIONS.find(m => m.id === selectedMetric);
  const metricData = calculateMetricData(selectedMetric);

  // Update chart when data changes
  useEffect(() => {
    if (!metricData || !chartRef.current) return;

    // Cleanup existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    const themeConfig = getChartThemeConfig();
    
    if (chartType === 'bar' || chartType === 'line') {
      const config = {
        chart: {
          height: 350,
          type: chartType,
          fontFamily: themeConfig.fontFamily,
          toolbar: { show: false },
          background: 'transparent'
        },
        series: [{
          name: currentMetric?.name || 'Value',
          data: metricData.values
        }],
        xaxis: {
          categories: metricData.labels,
          labels: {
            style: { colors: themeConfig.colors.textMuted }
          }
        },
        yaxis: {
          labels: {
            style: { colors: themeConfig.colors.textMuted },
            formatter: (value: number) => {
              if (metricData.metadata?.isPercentage) {
                return `${value.toFixed(1)}%`;
              }
              return formatCurrency(value);
            }
          }
        },
        colors: [themeConfig.colors.primary],
        dataLabels: { enabled: false },
        grid: {
          borderColor: themeConfig.colors.grid,
          strokeDashArray: 4
        },
        tooltip: {
          y: {
            formatter: (value: number) => {
              if (metricData.metadata?.isPercentage) {
                return `${value.toFixed(1)}%`;
              }
              return formatCurrency(value);
            }
          }
        }
      };

      chartInstance.current = new ApexCharts(chartRef.current, config);
      chartInstance.current.render();
    } else if (chartType === 'donut') {
      const config = {
        chart: {
          height: 350,
          type: 'donut',
          fontFamily: themeConfig.fontFamily,
          background: 'transparent'
        },
        series: metricData.values,
        labels: metricData.labels,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
        dataLabels: {
          enabled: true,
          formatter: (val: number) => `${val.toFixed(1)}%`
        },
        legend: {
          position: 'bottom',
          labels: {
            colors: themeConfig.colors.text
          }
        },
        tooltip: {
          y: {
            formatter: (value: number) => {
              if (metricData.metadata?.isPercentage) {
                return `${value.toFixed(1)}%`;
              }
              return formatCurrency(value);
            }
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '70%'
            }
          }
        }
      };

      chartInstance.current = new ApexCharts(chartRef.current, config);
      chartInstance.current.render();
    } else if (chartType === 'heatmap') {
      // Enhanced heatmap implementation with better color intensity
      const maxValue = Math.max(...metricData.values);
      const minValue = Math.min(...metricData.values);
      
      const config = {
        chart: {
          height: 400,
          type: 'heatmap',
          fontFamily: themeConfig.fontFamily,
          background: 'transparent',
          toolbar: { show: false }
        },
        series: [{
          name: 'Amount',
          data: metricData.labels.map((label, index) => ({
            x: label,
            y: metricData.values[index]
          }))
        }],
        plotOptions: {
          heatmap: {
            radius: 6,
            enableShades: true,
            shadeIntensity: 0.8,
            reverseNegativeShade: false,
            distributed: false,
            useFillColorAsStroke: false,
            colorScale: {
              ranges: [
                { from: minValue, to: minValue + (maxValue - minValue) * 0.2, color: '#e1f5fe', name: 'Low' },
                { from: minValue + (maxValue - minValue) * 0.2, to: minValue + (maxValue - minValue) * 0.4, color: '#81d4fa', name: 'Below Average' },
                { from: minValue + (maxValue - minValue) * 0.4, to: minValue + (maxValue - minValue) * 0.6, color: '#29b6f6', name: 'Average' },
                { from: minValue + (maxValue - minValue) * 0.6, to: minValue + (maxValue - minValue) * 0.8, color: '#1976d2', name: 'Above Average' },
                { from: minValue + (maxValue - minValue) * 0.8, to: maxValue, color: '#0d47a1', name: 'High' }
              ]
            }
          }
        },
        dataLabels: {
          enabled: true,
          style: {
            fontFamily: themeConfig.fontFamily,
            fontSize: '11px',
            fontWeight: '600',
            colors: ['#ffffff']
          },
          formatter: (val: number) => {
            return formatCurrency(val);
          }
        },
        xaxis: {
          labels: {
            style: {
              fontFamily: themeConfig.fontFamily,
              fontSize: '12px',
              colors: themeConfig.colors.textMuted
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              fontFamily: themeConfig.fontFamily,
              fontSize: '12px',
              colors: themeConfig.colors.textMuted
            }
          }
        },
        tooltip: {
          style: {
            fontFamily: themeConfig.fontFamily,
            fontSize: '14px'
          },
          y: {
            formatter: (value: number) => formatCurrency(value)
          }
        },
        legend: {
          show: true,
          position: 'bottom',
          labels: {
            colors: themeConfig.colors.text
          },
          fontFamily: themeConfig.fontFamily
        }
      };
      
      chartInstance.current = new ApexCharts(chartRef.current, config);
      chartInstance.current.render();
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [metricData, chartType, theme, selectedMetric, chartKey]);

  // Handle metric group change
  const handleGroupChange = (group: MetricGroup) => {
    setSelectedGroup(group);
    const groupMetrics = METRIC_DEFINITIONS.filter(m => m.group === group);
    if (groupMetrics.length > 0) {
      setSelectedMetric(groupMetrics[0].id);
      setChartType(groupMetrics[0].defaultChart);
    }
  };

  // Handle metric change
  const handleMetricChange = (metricId: string) => {
    setSelectedMetric(metricId);
    const metric = METRIC_DEFINITIONS.find(m => m.id === metricId);
    if (metric) {
      setChartType(metric.defaultChart);
    }
  };

  // Get available chart types for current metric
  const availableChartTypes = currentMetric?.chartTypes || [];

  // Get metrics for current group
  const groupMetrics = METRIC_DEFINITIONS.filter(m => m.group === selectedGroup);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Metrics Explorer</h1>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 text-xs font-medium">
              BETA
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Analyze your financial data with interactive charts and insights
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setChartKey(prev => prev + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs for Simple and Advanced Interfaces */}
      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simple" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Simple View
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced Query Builder
          </TabsTrigger>
        </TabsList>

        {/* Simple Interface Tab */}
        <TabsContent value="simple" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-6">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-4'}`}>
                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Time Period</label>
                  <TimeframePicker
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                  />
                </div>

                {/* Metric Group */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedGroup} onValueChange={handleGroupChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METRIC_GROUPS.map(group => {
                        const Icon = group.icon;
                        return (
                          <SelectItem key={group.id} value={group.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {group.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Metric Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Metric</label>
                  <Select value={selectedMetric} onValueChange={handleMetricChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {groupMetrics.map(metric => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metric.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chart Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Chart Type</label>
                  <Select value={chartType} onValueChange={(value: ChartType) => setChartType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChartTypes.map(type => {
                        const icons = {
                          line: LineChart,
                          bar: BarChart3,
                          donut: PieChart,
                          table: Table,
                          single: Gauge,
                          heatmap: Grid3x3
                        };
                        const Icon = icons[type];
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Chart Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {currentMetric?.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {currentMetric?.description}
              </p>
            </div>
            <Badge variant="secondary">
              {filteredExpenses.length} transactions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {metricData && metricData.values.length > 0 ? (
            <>
              {chartType === 'single' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {metricData.labels.map((label, index) => (
                    <Card key={index} className="text-center">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-center mb-2">
                          <DollarSign className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-3xl font-bold">
                          {metricData.metadata?.isPercentage 
                            ? `${metricData.values[index].toFixed(1)}%`
                            : formatCurrency(metricData.values[index])
                          }
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {label}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : chartType === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Item</th>
                        <th className="text-right p-2">Value</th>
                        <th className="text-right p-2">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricData.labels.map((label, index) => {
                        const total = metricData.values.reduce((sum, val) => sum + val, 0);
                        const percentage = total > 0 ? (metricData.values[index] / total) * 100 : 0;
                        return (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2">{label}</td>
                            <td className="text-right p-2">
                              {metricData.metadata?.isPercentage 
                                ? `${metricData.values[index].toFixed(1)}%`
                                : formatCurrency(metricData.values[index])
                              }
                            </td>
                            <td className="text-right p-2">
                              {percentage.toFixed(1)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div key={`chart-${chartKey}`} ref={chartRef} className="w-full h-[350px]" />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                No data available for the selected metric and time period.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {metricData && metricData.values.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(metricData.values.reduce((sum, val) => sum + val, 0))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Average</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(metricData.values.reduce((sum, val) => sum + val, 0) / metricData.values.length)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Highest</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {formatCurrency(Math.max(...metricData.values))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Items</span>
              </div>
              <div className="text-2xl font-bold mt-1">
                {metricData.values.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
        </TabsContent>

        {/* Advanced Interface Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <MetricsBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
