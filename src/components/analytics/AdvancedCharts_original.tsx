import { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ApexCharts from 'apexcharts';
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';
import { type Expense, type Budget, formatCurrency } from '@/lib/types';

interface AdvancedChartsProps {
  expenses: Expense[];
  budgets: Budget[];
}

interface CategoryTrend {
  category: string;
  thisMonth: number;
  lastMonth: number;
  trend: number;
  color: string;
}

interface SpendingHeatmapData {
  day: string;
  hour: number;
  amount: number;
  count: number;
}

interface BudgetPerformanceData {
  category: string;
  spent: number;
  budget: number;
  percentage: number;
  status: 'good' | 'warning' | 'over';
}

export function AdvancedCharts({ expenses, budgets }: AdvancedChartsProps) {
  // Chart references for ApexCharts
  const barChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const radialChartRef = useRef<HTMLDivElement>(null);
  const chartData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        categoryTrends: [],
        spendingHeatmap: [],
        budgetPerformance: [],
        weeklySpending: [],
        categoryComparison: []
      };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Category trends (current vs last month)
    const categoryTrends: CategoryTrend[] = [];
    const categoryExpenses = expenses.reduce((acc, expense) => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      
      if (!acc[expense.category]) {
        acc[expense.category] = { thisMonth: 0, lastMonth: 0 };
      }
      
      if (expenseYear === currentYear && expenseMonth === currentMonth) {
        acc[expense.category].thisMonth += expense.amount;
      } else if (expenseYear === lastMonthYear && expenseMonth === lastMonth) {
        acc[expense.category].lastMonth += expense.amount;
      }
      
      return acc;
    }, {} as Record<string, { thisMonth: number; lastMonth: number }>);

    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
      '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
    ];

    Object.entries(categoryExpenses).forEach(([category, data], index) => {
      const trend = data.lastMonth > 0 
        ? ((data.thisMonth - data.lastMonth) / data.lastMonth) * 100 
        : data.thisMonth > 0 ? 100 : 0;
      
      categoryTrends.push({
        category,
        thisMonth: data.thisMonth,
        lastMonth: data.lastMonth,
        trend,
        color: colors[index % colors.length]
      });
    });

    // Weekly spending pattern
    const weeklySpending: Array<{ week: string; amount: number; date: string }> = [];
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= weekStart && expenseDate <= weekEnd;
      });
      
      const totalSpent = weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      weeklySpending.push({
        week: `Week ${Math.ceil(weekStart.getDate() / 7)}`,
        amount: totalSpent,
        date: weekStart.toISOString().split('T')[0]
      });
    }

    // Budget performance
    const budgetPerformance: BudgetPerformanceData[] = budgets.map(budget => {
      const categorySpent = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expense.category === budget.category &&
                 expenseDate.getMonth() === currentMonth &&
                 expenseDate.getFullYear() === currentYear;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      const percentage = (categorySpent / budget.limit) * 100;
      const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';

      return {
        category: budget.category,
        spent: categorySpent,
        budget: budget.limit,
        percentage: Math.min(percentage, 100),
        status
      };
    });

    // Category comparison (top 6 categories)
    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryComparison = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([category, amount], index) => ({
        category,
        amount,
        color: colors[index % colors.length]
      }));

    return {
      categoryTrends: categoryTrends.slice(0, 8),
      weeklySpending,
      budgetPerformance,
      categoryComparison
    };
  }, [expenses, budgets]);

  const { categoryTrends, weeklySpending, budgetPerformance, categoryComparison } = chartData;

  // Initialize ApexCharts
  useEffect(() => {
    // Bar Chart - Category Trends
    if (barChartRef.current && categoryTrends.length > 0) {
      const barChart = new ApexCharts(barChartRef.current, {
        chart: {
          type: 'bar',
          height: 300,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          background: 'transparent',
          toolbar: { show: false },
        },
        series: [
          {
            name: 'This Month',
            data: categoryTrends.map(item => item.thisMonth),
          },
          {
            name: 'Last Month',
            data: categoryTrends.map(item => item.lastMonth),
          },
        ],
        xaxis: {
          categories: categoryTrends.map(item => item.category),
          labels: {
            style: {
              colors: 'rgb(107 114 128)',
              fontSize: '12px',
            },
            rotate: -45,
            rotateAlways: true,
          },
        },
        yaxis: {
          labels: {
            style: { colors: 'rgb(107 114 128)', fontSize: '12px' },
            formatter: (value: number) => formatCurrency(value),
          },
        },
        colors: ['#1f77b4', '#ff7f0e'],
        plotOptions: {
          bar: {
            borderRadius: 4,
            columnWidth: '60%',
          },
        },
        dataLabels: { enabled: false },
        grid: {
          borderColor: 'rgb(229 231 235)',
          strokeDashArray: 3,
        },
        tooltip: {
          theme: 'light',
          y: { formatter: (value: number) => formatCurrency(value) },
        },
      });
      barChart.render();
      return () => barChart.destroy();
    }
  }, [categoryTrends]);

  useEffect(() => {
    // Line Chart - Weekly Spending
    if (lineChartRef.current && weeklySpending.length > 0) {
      const lineChart = new ApexCharts(lineChartRef.current, {
        chart: {
          type: 'line',
          height: 300,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          background: 'transparent',
          toolbar: { show: false },
        },
        series: [{
          name: 'Weekly Spending',
          data: weeklySpending.map(item => item.amount),
        }],
        xaxis: {
          categories: weeklySpending.map(item => item.week),
          labels: {
            style: { colors: 'rgb(107 114 128)', fontSize: '12px' },
          },
        },
        yaxis: {
          labels: {
            style: { colors: 'rgb(107 114 128)', fontSize: '12px' },
            formatter: (value: number) => formatCurrency(value),
          },
        },
        colors: ['#2dd4bf'],
        stroke: { width: 3, curve: 'smooth' },
        markers: {
          size: 6,
          colors: ['#2dd4bf'],
          strokeWidth: 2,
        },
        grid: {
          borderColor: 'rgb(229 231 235)',
          strokeDashArray: 3,
        },
        tooltip: {
          theme: 'light',
          y: { formatter: (value: number) => formatCurrency(value) },
        },
      });
      lineChart.render();
      return () => lineChart.destroy();
    }
  }, [weeklySpending]);

  useEffect(() => {
    // Radial Chart - Budget Performance
    if (radialChartRef.current && budgetPerformance.length > 0) {
      const radialChart = new ApexCharts(radialChartRef.current, {
        chart: {
          type: 'radialBar',
          height: 250,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          background: 'transparent',
        },
        plotOptions: {
          radialBar: {
            hollow: { size: '30%' },
            dataLabels: {
              name: { show: true, fontSize: '14px' },
              value: { 
                show: true, 
                fontSize: '16px',
                formatter: (val: number) => `${val.toFixed(1)}%`
              },
            },
          },
        },
        series: budgetPerformance.map(item => item.percentage),
        labels: budgetPerformance.map(item => item.category),
        colors: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
      });
      radialChart.render();
      return () => radialChart.destroy();
    }
  }, [budgetPerformance]);

  useEffect(() => {
    // Pie Chart - Category Comparison
    if (pieChartRef.current && categoryComparison.length > 0) {
      const pieChart = new ApexCharts(pieChartRef.current, {
        chart: {
          type: 'pie',
          height: 200,
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          background: 'transparent',
        },
        series: categoryComparison.map(item => item.amount),
        labels: categoryComparison.map(item => item.category),
        colors: categoryComparison.map(item => item.color),
        legend: {
          position: 'bottom',
          fontSize: '12px',
          labels: { colors: 'rgb(107 114 128)' },
        },
        tooltip: {
          theme: 'light',
          y: { formatter: (value: number) => formatCurrency(value) },
        },
        dataLabels: {
          enabled: true,
          formatter: (val: number) => `${val.toFixed(1)}%`,
          style: { fontSize: '12px', colors: ['#fff'] },
        },
      });
      pieChart.render();
      return () => pieChart.destroy();
    }
  }, [categoryComparison]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Trends Chart */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Category Trends</CardTitle>
              <p className="text-sm text-muted-foreground">This month vs last month</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categoryTrends.length > 0 ? (
            <div ref={barChartRef} className="w-full h-[300px]"></div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trend data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Spending Pattern */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Weekly Pattern</CardTitle>
              <p className="text-sm text-muted-foreground">Spending by week</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {weeklySpending.length > 0 ? (
            <div ref={lineChartRef} className="w-full h-[300px]"></div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No weekly data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Performance Radial Chart */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Budget Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Current month progress</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {budgetPerformance.length > 0 ? (
            <div className="space-y-4">
              <div ref={radialChartRef} className="w-full h-[250px]"></div>
              
              <div className="space-y-2">
                {budgetPerformance.slice(0, 4).map((budget, index) => (
                  <div key={budget.category} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: `var(--chart-${index + 1})` }}
                      />
                      <span>{budget.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
                      <Badge 
                        variant={
                          budget.status === 'over' ? 'destructive' : 
                          budget.status === 'warning' ? 'secondary' : 'default'
                        }
                      >
                        {budget.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No budget data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <PieChartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Category Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">Top spending categories</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {categoryComparison.length > 0 ? (
            <div className="space-y-4">
              <div ref={pieChartRef} className="w-full h-[200px]"></div>
              
              <div className="grid grid-cols-2 gap-2">
                {categoryComparison.map((category, index) => (
                  <div key={category.category} className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="truncate">{category.category}</span>
                    <span className="font-medium ml-auto">{formatCurrency(category.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <div className="text-center">
                <PieChartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No category data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
