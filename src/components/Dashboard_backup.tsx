import { useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import ApexCharts from 'apexcharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  Receipt,
  Target,
  Wallet,
  BarChart3,
  Activity,
  Gauge,
  Brain,
  Trophy
} from 'lucide-react';
import { type Expense, type Budget, type Person, formatCurrency, getAllCategories, getAllPeople } from '@/lib/types';
import { SpendingBehaviorInsights } from '@/components/analytics/SpendingBehaviorInsights';
import { AdvancedCharts } from '@/components/analytics/AdvancedCharts';
import { GamificationSystem } from '@/components/analytics/GamificationSystem';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  customCategories: any[];
  customPeople: Person[];
  publicPeople: Person[];
  onNavigate: (tab: string) => void;
}

export function Dashboard({ 
  expenses, 
  budgets, 
  customCategories, 
  customPeople, 
  publicPeople,
  onNavigate 
}: DashboardProps) {
  // Chart references for Overview charts only
  const originalPieChartRef = useRef<HTMLDivElement>(null);
  const originalLineChartRef = useRef<HTMLDivElement>(null);

  // Calculate key metrics
  const dashboardMetrics = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalSpent: 0,
        monthlySpent: 0,
        totalBudget: 0,
        categoryData: [],
        peopleData: [],
        monthlyTrends: [],
        budgetProgress: [],
        topSpendingDays: [],
        recentExpenses: []
      };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    // Total spending
    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Monthly spending
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    const monthlySpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Total budget
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);

    // Category breakdown
    const categorySpending = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryData = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    // People spending analysis
    const allPeople = getAllPeople([...customPeople, ...publicPeople]);
    const peopleSpending = expenses.reduce((acc, expense) => {
      if (expense.peopleIds && expense.peopleIds.length > 0) {
        expense.peopleIds.forEach(personId => {
          const person = allPeople.find(p => p.id === personId);
          if (person) {
            acc[person.name] = (acc[person.name] || 0) + expense.amount;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    const peopleData = Object.entries(peopleSpending)
      .map(([person, amount]) => ({ person, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Monthly trends (last 6 months)
    const monthlyTrends: Array<{ month: string; amount: number; count: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        amount: monthTotal,
        count: monthExpenses.length
      });
    }

    // Budget progress
    const budgetProgress = budgets.map(budget => {
      const categorySpent = monthlyExpenses
        .filter(expense => expense.category === budget.category)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const percentage = budget.limit > 0 ? (categorySpent / budget.limit) * 100 : 0;
      const status = percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good';

      // Get category icon from available categories
      const allCategories = getAllCategories(customCategories);
      const categoryInfo = allCategories.find(cat => cat.name === budget.category);

      return {
        category: budget.category,
        spent: categorySpent,
        limit: budget.limit,
        percentage: Math.min(percentage, 100),
        status,
        icon: categoryInfo?.icon || '📦'
      };
    });

    // Top spending days
    const dailySpending = expenses.reduce((acc, expense) => {
      const date = expense.date;
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topSpendingDays = Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent expenses
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return {
      totalSpent,
      monthlySpent,
      totalBudget,
      categoryData,
      peopleData,
      monthlyTrends,
      budgetProgress,
      topSpendingDays,
      recentExpenses
    };
  }, [expenses, budgets, customCategories, customPeople, publicPeople]);

  // Flowbite chart data calculation
  const flowbiteChartData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        totalSpent: 0,
        weeklyGrowth: 0,
        monthlyData: [],
        categoryData: { labels: [], series: [] },
        budgetPerformance: { labels: [], series: [] }
      };
    }

    // Calculate total spending and growth
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate weekly growth (mock calculation for demo)
    const weeklyGrowth = 23.5;

    // Monthly spending trend data (last 6 months)
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        fullDate: new Date(date)
      };
    });

    const monthlyData = last6Months.map(({ month, fullDate }) => {
      const monthSpending = expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === fullDate.getMonth() && 
                 expenseDate.getFullYear() === fullDate.getFullYear();
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return Math.round(monthSpending);
    });

    // Category data for pie/donut charts
    const categorySpending = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryEntries = Object.entries(categorySpending)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 categories

    const categoryData = {
      labels: categoryEntries.map(([category]) => category),
      series: categoryEntries.map(([, amount]) => Math.round(amount))
    };

    // Budget performance data
    const budgetPerformance = {
      labels: budgets.map(b => b.category).slice(0, 6),
      series: budgets.slice(0, 6).map(budget => {
        const spent = expenses
          .filter(exp => exp.category === budget.category)
          .reduce((sum, exp) => sum + exp.amount, 0);
        return Math.round((spent / budget.limit) * 100);
      })
    };

    return {
      totalSpent,
      weeklyGrowth,
      monthlyData,
      categoryData,
      budgetPerformance
    };
  }, [expenses, budgets]);

  // Column Chart - Weekly Performance
  useEffect(() => {
    if (columnChartRef.current) {
      const columnChart = new ApexCharts(columnChartRef.current, {
        chart: {
          height: 320,
          type: 'bar',
          fontFamily: 'Inter, sans-serif',
          toolbar: {
            show: false,
          },
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '70%',
            borderRadiusApplication: 'end',
            borderRadius: 8,
          },
        },
        tooltip: {
          shared: true,
          intersect: false,
          style: {
            fontFamily: 'Inter, sans-serif',
          },
        },
        states: {
          hover: {
            filter: {
              type: 'darken',
              value: 1,
            },
          },
        },
        stroke: {
          show: true,
          width: 0,
          colors: ['transparent'],
        },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: {
            left: 2,
            right: 2,
            top: -14
          },
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: false,
        },
        xaxis: {
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
            }
          },
          axisBorder: {
            show: false,
          },
          axisTicks: {
            show: false,
          },
        },
        yaxis: {
          show: false,
        },
        fill: {
          opacity: 1,
        },
        series: [
          {
            name: 'Daily Spending',
            color: '#1A56DB',
            data: [
              { x: 'Mon', y: flowbiteChartData.totalSpent * 0.1 },
              { x: 'Tue', y: flowbiteChartData.totalSpent * 0.15 },
              { x: 'Wed', y: flowbiteChartData.totalSpent * 0.12 },
              { x: 'Thu', y: flowbiteChartData.totalSpent * 0.18 },
              { x: 'Fri', y: flowbiteChartData.totalSpent * 0.08 },
              { x: 'Sat', y: flowbiteChartData.totalSpent * 0.22 },
              { x: 'Sun', y: flowbiteChartData.totalSpent * 0.16 },
            ],
          },
        ],
      });

      columnChart.render();
      return () => columnChart.destroy();
    }
  }, [flowbiteChartData.totalSpent]);

  // Pie Chart - Category Distribution
  useEffect(() => {
    if (pieChartRef.current && flowbiteChartData.categoryData.series.length > 0) {
      const pieChart = new ApexCharts(pieChartRef.current, {
        series: flowbiteChartData.categoryData.series,
        colors: ['#1C64F2', '#16BDCA', '#9061F9', '#FDBA8C', '#E74694'],
        chart: {
          height: 420,
          width: '100%',
          type: 'pie',
        },
        stroke: {
          colors: ['white'],
          lineCap: '',
        },
        plotOptions: {
          pie: {
            labels: {
              show: true,
            },
            size: '100%',
            dataLabels: {
              offset: -25
            }
          },
        },
        labels: flowbiteChartData.categoryData.labels,
        dataLabels: {
          enabled: true,
          style: {
            fontFamily: 'Inter, sans-serif',
          },
        },
        legend: {
          position: 'bottom',
          fontFamily: 'Inter, sans-serif',
        },
        yaxis: {
          labels: {
            formatter: function (value) {
              return formatCurrency(value);
            },
          },
        },
        xaxis: {
          labels: {
            formatter: function (value) {
              return formatCurrency(value);
            },
          },
          axisTicks: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
        },
      });

      pieChart.render();
      return () => pieChart.destroy();
    }
  }, [flowbiteChartData.categoryData]);

  // Donut Chart - Budget Performance
  useEffect(() => {
    if (donutChartRef.current && flowbiteChartData.budgetPerformance.series.length > 0) {
      const donutChart = new ApexCharts(donutChartRef.current, {
        series: flowbiteChartData.budgetPerformance.series,
        colors: ['#1C64F2', '#16BDCA', '#FDBA8C', '#E74694', '#9061F9', '#84CC16'],
        chart: {
          height: 320,
          width: '100%',
          type: 'donut',
        },
        stroke: {
          colors: ['transparent'],
          lineCap: '',
        },
        plotOptions: {
          pie: {
            donut: {
              labels: {
                show: true,
                name: {
                  show: true,
                  fontFamily: 'Inter, sans-serif',
                  offsetY: 20,
                },
                total: {
                  showAlways: true,
                  show: true,
                  label: 'Avg Budget Usage',
                  fontFamily: 'Inter, sans-serif',
                  formatter: function (w) {
                    const sum = w.globals.seriesTotals.reduce((a, b) => {
                      return a + b;
                    }, 0);
                    return Math.round(sum / w.globals.seriesTotals.length) + '%';
                  },
                },
                value: {
                  show: true,
                  fontFamily: 'Inter, sans-serif',
                  offsetY: -20,
                  formatter: function (value) {
                    return value + '%';
                  },
                },
              },
              size: '80%',
            },
          },
        },
        grid: {
          padding: {
            top: -2,
          },
        },
        labels: flowbiteChartData.budgetPerformance.labels,
        dataLabels: {
          enabled: false,
        },
        legend: {
          position: 'bottom',
          fontFamily: 'Inter, sans-serif',
        },
        yaxis: {
          labels: {
            formatter: function (value) {
              return value + '%';
            },
          },
        },
        xaxis: {
          labels: {
            formatter: function (value) {
              return value + '%';
            },
          },
          axisTicks: {
            show: false,
          },
          axisBorder: {
            show: false,
          },
        },
      });

      donutChart.render();
      return () => donutChart.destroy();
    }
  }, [flowbiteChartData.budgetPerformance]);

  const {
    totalSpent,
    monthlySpent,
    totalBudget,
    categoryData,
    peopleData,
    monthlyTrends,
    budgetProgress,
    topSpendingDays,
    recentExpenses
  } = dashboardMetrics;

  // Original Overview Charts - Restored useEffect hooks
  useEffect(() => {
    if (originalPieChartRef.current && categoryData.length > 0) {
      const pieChart = new ApexCharts(originalPieChartRef.current, {
        chart: {
          type: 'pie',
          height: 300,
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
          }
        },
        series: categoryData.map(item => item.amount),
        labels: categoryData.map(item => item.category),
        colors: [
          '#1C64F2', '#16BDCA', '#9061F9', '#FDBA8C', '#E74694',
          '#F05252', '#84CC16', '#F59E0B', '#10B981', '#8B5CF6'
        ],
        plotOptions: {
          pie: {
            donut: {
              size: '0%'
            }
          }
        },
        tooltip: {
          style: {
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          y: {
            formatter: (value: number) => formatCurrency(value)
          }
        },
        legend: {
          position: 'bottom',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          markers: {
            width: 8,
            height: 8,
            radius: 6,
          },
          itemMargin: {
            horizontal: 8,
            vertical: 4,
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
      });

      pieChart.render();
      return () => pieChart.destroy();
    }
  }, [categoryData]);

  useEffect(() => {
    if (originalLineChartRef.current && monthlyTrends.length > 0) {
      const lineChart = new ApexCharts(originalLineChartRef.current, {
        chart: {
          type: 'area',
          height: 300,
          toolbar: { show: false },
          zoom: { enabled: false },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
          }
        },
        series: [{
          name: 'Monthly Spending',
          data: monthlyTrends.map(trend => ({
            x: trend.month,
            y: trend.amount
          }))
        }],
        xaxis: {
          type: 'category',
          categories: monthlyTrends.map(trend => trend.month),
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              fontSize: '12px',
              fontFamily: 'Inter, sans-serif',
            },
            formatter: (value: number) => formatCurrency(value)
          }
        },
        colors: ['#1C64F2'],
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.25,
            gradientToColors: ['#1C64F2'],
            inverseColors: false,
            opacityFrom: 0.5,
            opacityTo: 0.1,
            stops: [0, 100]
          }
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 6,
          colors: ['#1C64F2'],
          strokeColors: '#ffffff',
          strokeWidth: 2,
          hover: {
            size: 8
          }
        },
        grid: {
          borderColor: '#E5E7EB',
          strokeDashArray: 3,
          xaxis: {
            lines: { show: false }
          },
          yaxis: {
            lines: { show: true }
          }
        },
        tooltip: {
          style: {
            fontSize: '14px',
            fontFamily: 'Inter, sans-serif',
          },
          y: {
            formatter: (value: number) => formatCurrency(value)
          }
        },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              height: 280
            }
          }
        }]
      });

      lineChart.render();
      return () => lineChart.destroy();
    }
  }, [monthlyTrends]);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your spending patterns and financial health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onNavigate('expenses')}>
            <Receipt className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
          <Button onClick={() => onNavigate('analyzer')}>
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div 
        className="gap-4 px-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}
      >
        <Card className="shadow-sm bg-card w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">Total Spent</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(196 181 253)', color: 'rgb(91 33 182)' }}>
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              All time spending
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">This Month</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(147 197 253)', color: 'rgb(30 64 175)' }}>
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(monthlySpent)}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 && `${formatCurrency(totalBudget - monthlySpent)} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">Budget Status</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(134 239 172)', color: 'rgb(22 101 52)' }}>
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">
              {totalBudget > 0 ? `${Math.round((monthlySpent / totalBudget) * 100)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? 'of budget used' : 'No budgets set'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">Transactions</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(254 215 170)', color: 'rgb(154 52 18)' }}>
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">
              Total recorded expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="gamification" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Budgets
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Simplified with Working Charts */}
        <TabsContent value="overview" className="space-y-6">
          {/* Original Overview Charts - Restored */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown - Original */}
            <Card className="enhanced-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Spending by Category</CardTitle>
                    <p className="text-sm text-muted-foreground">Your top spending categories</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div ref={originalPieChartRef} className="w-full h-[300px]"></div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No expense data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends - Original */}
            <Card className="enhanced-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Monthly Trends</CardTitle>
                    <p className="text-sm text-muted-foreground">Last 6 months spending</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {monthlyTrends.length > 0 ? (
                  <div ref={originalLineChartRef} className="w-full h-[300px]"></div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No trend data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Top Spending Days */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Expenses */}
            <Card className="enhanced-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <Receipt className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recent Expenses</CardTitle>
                    <p className="text-sm text-muted-foreground">Your latest transactions</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recentExpenses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    {recentExpenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">{expense.category} • {expense.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(expense.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent expenses</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Spending Days */}
            <Card className="enhanced-card hover-lift">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Top Spending Days</CardTitle>
                    <p className="text-sm text-muted-foreground">Your highest spending days</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {topSpendingDays.length > 0 ? (
                  <div className="space-y-3">
                    {topSpendingDays.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(day.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No spending data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Charts Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedCharts expenses={expenses} budgets={budgets} />
        </TabsContent>

        {/* Behavioral Insights Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <SpendingBehaviorInsights expenses={expenses} />
        </TabsContent>

        {/* Gamification Tab */}
        <TabsContent value="gamification" className="space-y-6">
          <GamificationSystem expenses={expenses} budgets={budgets} />
        </TabsContent>

        {/* Budget Performance Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Budget Progress */}
            {budgetProgress.length > 0 && (
              <Card className="enhanced-card hover-lift">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                      <Gauge className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Budget Performance</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        How you're tracking against your budgets this month
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-8">
                  <div className="grid gap-4">
                    {budgetProgress.map((budget) => (
                      <div key={budget.category} className="p-4 bg-muted/20 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{budget.icon}</span>
                            <span className="font-semibold">{budget.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">
                              {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                            </div>
                            <div className={`text-sm font-medium ${
                              budget.status === 'over' ? 'text-red-600' :
                              budget.status === 'warning' ? 'text-amber-600' :
                              'text-green-600'
                            }`}>
                              {budget.percentage.toFixed(1)}% used
                            </div>
                          </div>
                        </div>
                        <Progress 
                          value={budget.percentage} 
                          className={`h-3 ${
                            budget.status === 'over' ? 'bg-red-100' :
                            budget.status === 'warning' ? 'bg-amber-100' :
                            'bg-green-100'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {budgetProgress.length === 0 && (
              <div className="text-center py-12">
                <div className="p-4 bg-muted/20 rounded-full mx-auto w-fit mb-4">
                  <Target className="h-12 w-12 opacity-50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Budgets Set</h3>
                <p className="text-muted-foreground mb-6">
                  Set up budgets to track your spending goals and see detailed performance metrics
                </p>
                <Button onClick={() => onNavigate('budgets')}>
                  Create Your First Budget
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Jump to common tasks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover-lift" 
              onClick={() => onNavigate('expenses')}
            >
              <Receipt className="h-5 w-5" />
              <span className="text-sm">Add Expense</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover-lift" 
              onClick={() => onNavigate('budgets')}
            >
              <Target className="h-5 w-5" />
              <span className="text-sm">Manage Budgets</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover-lift" 
              onClick={() => onNavigate('categories')}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-sm">Categories</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2 hover-lift" 
              onClick={() => onNavigate('analyzer')}
            >
              <Brain className="h-5 w-5" />
              <span className="text-sm">AI Insights</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
