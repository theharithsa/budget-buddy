import { useMemo, useEffect, useRef, useState } from 'react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { useComponentTracking, useTabTracking } from '@/hooks/useDynatraceMonitoring';

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
  // Theme context for theme-aware charts
  const { theme } = useTheme();
  
  // Dynatrace monitoring
  const { trackComponentEvent } = useComponentTracking('Dashboard');
  const trackTab = useTabTracking();
  
  // State to track active tab and force chart re-rendering
  const [activeTab, setActiveTab] = useState('overview');

  // Enhanced navigation handler with monitoring
  const handleNavigate = (tab: string) => {
    trackComponentEvent('Dashboard Navigation Card Clicked', {
      targetTab: tab,
      currentTab: activeTab,
      timestamp: new Date().toISOString()
    });
    onNavigate(tab);
  };
  const [chartKey, setChartKey] = useState(0);

  // Helper function for theme-aware chart configuration
  const getChartThemeConfig = () => {
    const isDark = theme === 'dark';
    return {
      fontFamily: 'Titillium Web, sans-serif',
      colors: {
        primary: isDark ? '#3b82f6' : '#2563eb',
        secondary: isDark ? '#10b981' : '#059669',
        tertiary: isDark ? '#f59e0b' : '#d97706',
        quaternary: isDark ? '#ef4444' : '#dc2626',
        text: isDark ? '#f8fafc' : '#0f1419',
        textMuted: isDark ? '#94a3b8' : '#64748b',
        grid: isDark ? '#374151' : '#e2e8f0',
        background: isDark ? '#1f2937' : '#ffffff'
      }
    };
  };

  // Flowbite Chart References
  const areaChartRef = useRef<HTMLDivElement>(null);
  const columnChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  // Chart instance references for cleanup
  const areaChartInstance = useRef<ApexCharts | null>(null);
  const columnChartInstance = useRef<ApexCharts | null>(null);
  const pieChartInstance = useRef<ApexCharts | null>(null);
  const donutChartInstance = useRef<ApexCharts | null>(null);

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
        weeklyGrowth: 0,
        monthlyGrowth: 0,
        savingsRate: 0,
        budgetUtilization: 0
      };
    }

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
    
    // Current month expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlySpent = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + expense.amount, 0);

    // Category breakdown
    const allCategories = getAllCategories(customCategories);
    const categoryData = allCategories.map(category => {
      const categoryExpenses = expenses.filter(expense => expense.category === category.name);
      const amount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      return {
        name: category.name,
        amount,
        color: category.color || '#3B82F6',
        icon: category.icon || 'DollarSign'
      };
    }).filter(category => category.amount > 0);

    // Monthly trends (last 6 months)
    const monthlyTrends: { month: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: monthTotal
      });
    }

    // Budget progress
    const budgetProgress = budgets.map(budget => {
      const spent = expenses.filter(expense => expense.category === budget.category)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const progress = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        category: budget.category,
        spent,
        limit: budget.limit,
        progress: Math.min(progress, 100),
        status: progress > 100 ? 'over' : progress > 80 ? 'warning' : 'good'
      };
    });

    // Calculate growth rates
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthSpent = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === lastMonth.getMonth() && 
             expenseDate.getFullYear() === lastMonth.getFullYear();
    }).reduce((sum, expense) => sum + expense.amount, 0);

    const monthlyGrowth = lastMonthSpent > 0 ? ((monthlySpent - lastMonthSpent) / lastMonthSpent) * 100 : 0;
    const weeklyGrowth = Math.random() * 20 - 10; // Placeholder for weekly calculation
    const savingsRate = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalSpent,
      monthlySpent,
      totalBudget,
      categoryData,
      peopleData: [],
      monthlyTrends,
      budgetProgress,
      topSpendingDays: [],
      weeklyGrowth,
      monthlyGrowth,
      savingsRate,
      budgetUtilization
    };
  }, [expenses, budgets, customCategories]);

  // Handle tab changes and force chart re-rendering when returning to overview
  const handleTabChange = (value: string) => {
    if (value === 'overview' && activeTab !== 'overview') {
      // Force chart re-rendering by incrementing the key
      setChartKey(prev => prev + 1);
    }
    
    // Add monitoring
    trackTab(activeTab, value);
    trackComponentEvent('Dashboard Tab Changed', {
      fromTab: activeTab,
      toTab: value,
      timestamp: new Date().toISOString()
    });
    
    setActiveTab(value);
  };

  // Cleanup function for chart instances
  const cleanupCharts = () => {
    if (areaChartInstance.current) {
      areaChartInstance.current.destroy();
      areaChartInstance.current = null;
    }
    if (columnChartInstance.current) {
      columnChartInstance.current.destroy();
      columnChartInstance.current = null;
    }
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
      pieChartInstance.current = null;
    }
    if (donutChartInstance.current) {
      donutChartInstance.current.destroy();
      donutChartInstance.current = null;
    }
  };

  // Area Chart - Monthly Spending Trends (Flowbite Style)
  useEffect(() => {
    if (areaChartRef.current && dashboardMetrics.monthlyTrends.length > 0 && activeTab === 'overview') {
      // Cleanup existing chart
      if (areaChartInstance.current) {
        areaChartInstance.current.destroy();
      }

      const themeConfig = getChartThemeConfig();
      const areaChart = new ApexCharts(areaChartRef.current, {
        chart: {
          height: 320,
          type: 'area',
          fontFamily: themeConfig.fontFamily,
          dropShadow: {
            enabled: false,
          },
          toolbar: {
            show: false,
          },
        },
        tooltip: {
          enabled: true,
          x: {
            show: false,
          },
          style: {
            fontSize: '12px',
            fontFamily: themeConfig.fontFamily,
          },
        },
        legend: {
          show: false
        },
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.55,
            opacityTo: 0,
            shade: themeConfig.colors.primary,
            gradientToColors: [themeConfig.colors.primary],
          },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: 6,
        },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: {
            left: 2,
            right: 2,
            top: 0
          },
        },
        series: [
          {
            name: 'Monthly Spending',
            data: dashboardMetrics.monthlyTrends.map(item => item.amount),
            color: themeConfig.colors.primary,
          },
        ],
        xaxis: {
          categories: dashboardMetrics.monthlyTrends.map(item => item.month),
          labels: {
            show: false,
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
          labels: {
            formatter: function (value) {
              return formatCurrency(value);
            }
          }
        },
      });

      areaChart.render();
      areaChartInstance.current = areaChart;
      
      return () => {
        if (areaChartInstance.current) {
          areaChartInstance.current.destroy();
          areaChartInstance.current = null;
        }
      };
    }
  }, [dashboardMetrics.monthlyTrends, activeTab, chartKey, theme]);

  // Column Chart - Weekly Performance (Flowbite Style)
  useEffect(() => {
    if (columnChartRef.current && activeTab === 'overview') {
      // Cleanup existing chart
      if (columnChartInstance.current) {
        columnChartInstance.current.destroy();
      }

      const themeConfig = getChartThemeConfig();
      const columnChart = new ApexCharts(columnChartRef.current, {
        chart: {
          height: 320,
          type: 'bar',
          fontFamily: themeConfig.fontFamily,
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
            fontFamily: themeConfig.fontFamily,
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
              fontFamily: themeConfig.fontFamily,
              cssClass: theme === 'dark' ? 'text-xs font-normal fill-gray-400' : 'text-xs font-normal fill-gray-500'
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
            color: themeConfig.colors.primary,
            data: [
              { x: 'Mon', y: dashboardMetrics.totalSpent * 0.1 },
              { x: 'Tue', y: dashboardMetrics.totalSpent * 0.15 },
              { x: 'Wed', y: dashboardMetrics.totalSpent * 0.12 },
              { x: 'Thu', y: dashboardMetrics.totalSpent * 0.18 },
              { x: 'Fri', y: dashboardMetrics.totalSpent * 0.08 },
              { x: 'Sat', y: dashboardMetrics.totalSpent * 0.22 },
              { x: 'Sun', y: dashboardMetrics.totalSpent * 0.16 },
            ],
          },
        ],
      });

      columnChart.render();
      columnChartInstance.current = columnChart;
      
      return () => {
        if (columnChartInstance.current) {
          columnChartInstance.current.destroy();
          columnChartInstance.current = null;
        }
      };
    }
  }, [dashboardMetrics.totalSpent, activeTab, chartKey, theme]);

  // Pie Chart - Category Distribution (Flowbite Style)
  useEffect(() => {
    if (pieChartRef.current && dashboardMetrics.categoryData.length > 0 && activeTab === 'overview') {
      // Cleanup existing chart
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }

      const themeConfig = getChartThemeConfig();
      const pieChart = new ApexCharts(pieChartRef.current, {
        chart: {
          height: 420,
          type: 'pie',
          fontFamily: themeConfig.fontFamily,
        },
        dataLabels: {
          enabled: false,
        },
        plotOptions: {
          pie: {
            labels: {
              show: true,
            },
            size: "100%",
            dataLabels: {
              offset: -25
            }
          },
        },
        labels: dashboardMetrics.categoryData.map(item => item.name),
        series: dashboardMetrics.categoryData.map(item => item.amount),
        colors: [
          themeConfig.colors.primary,
          themeConfig.colors.secondary,
          themeConfig.colors.tertiary,
          themeConfig.colors.quaternary,
          '#8b5cf6'
        ],
        legend: {
          show: false,
        },
        tooltip: {
          enabled: true,
          x: {
            show: false,
          },
          style: {
            fontSize: '12px',
            fontFamily: themeConfig.fontFamily,
          },
        }
      });

      pieChart.render();
      pieChartInstance.current = pieChart;
      
      return () => {
        if (pieChartInstance.current) {
          pieChartInstance.current.destroy();
          pieChartInstance.current = null;
        }
      };
    }
  }, [dashboardMetrics.categoryData, activeTab, chartKey, theme]);

  // Donut Chart - Budget Performance (Flowbite Style)
  useEffect(() => {
    if (donutChartRef.current && dashboardMetrics.budgetProgress.length > 0 && activeTab === 'overview') {
      // Cleanup existing chart
      if (donutChartInstance.current) {
        donutChartInstance.current.destroy();
      }
      
      const themeConfig = getChartThemeConfig();
      const donutChart = new ApexCharts(donutChartRef.current, {
        chart: {
          height: 420,
          type: 'donut',
          fontFamily: themeConfig.fontFamily,
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
                  fontFamily: themeConfig.fontFamily,
                  offsetY: 20,
                },
                total: {
                  showAlways: true,
                  show: true,
                  label: 'Budgets',
                  fontFamily: themeConfig.fontFamily,
                  formatter: function (w) {
                    const sum = w.globals.seriesTotals.reduce((a, b) => {
                      return a + b
                    }, 0)
                    return `${dashboardMetrics.budgetProgress.length} Total`
                  },
                },
                value: {
                  show: true,
                  fontFamily: themeConfig.fontFamily,
                  offsetY: -20,
                  formatter: function (value) {
                    return value
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
        labels: dashboardMetrics.budgetProgress.map(item => item.category),
        series: dashboardMetrics.budgetProgress.map(item => item.progress),
        colors: [themeConfig.colors.secondary, themeConfig.colors.tertiary, themeConfig.colors.quaternary],
        legend: {
          show: false,
        },
        tooltip: {
          enabled: true,
          x: {
            show: false,
          },
          style: {
            fontSize: '12px',
            fontFamily: themeConfig.fontFamily,
          },
        },
        dataLabels: {
          enabled: false,
        }
      });

      donutChart.render();
      donutChartInstance.current = donutChart;
      
      return () => {
        if (donutChartInstance.current) {
          donutChartInstance.current.destroy();
          donutChartInstance.current = null;
        }
      };
    }
  }, [dashboardMetrics.budgetProgress, activeTab, chartKey, theme]);

  // Cleanup all charts when component unmounts
  useEffect(() => {
    return () => {
      cleanupCharts();
    };
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your spending patterns and budget performance
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div 
        className="gap-4 px-2"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Total Spent Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card w-full border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">Total Spent</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(196 181 253)', color: 'rgb(91 33 182)' }}>
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(dashboardMetrics.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              All time spending
            </p>
          </CardContent>
        </Card>

        {/* This Month Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card w-full border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">This Month</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(147 197 253)', color: 'rgb(30 64 175)' }}>
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">{formatCurrency(dashboardMetrics.monthlySpent)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(dashboardMetrics.totalBudget - dashboardMetrics.monthlySpent)} remaining
            </p>
          </CardContent>
        </Card>

        {/* Budget Status Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card w-full border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">Budget Status</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(134 239 172)', color: 'rgb(21 128 61)' }}>
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-foreground mb-1">
              {dashboardMetrics.totalBudget > 0 ? Math.round(dashboardMetrics.budgetUtilization) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              of budget used
            </p>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card w-full border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 py-3">
            <CardTitle className="text-sm font-semibold text-foreground">Transactions</CardTitle>
            <div className="p-2 rounded-md" style={{ backgroundColor: 'rgb(253 186 116)', color: 'rgb(154 52 18)' }}>
              <Receipt className="h-4 w-4" />
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Behavior</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Budgets</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Pure Flowbite Design */}
        <TabsContent value="overview" className="space-y-6" key={`overview-${chartKey}`}>
          {/* Flowbite Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Area Chart - Monthly Spending Trends */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center me-3">
                    <svg className="w-6 h-6 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 19">
                      <path d="M14.5 0A3.987 3.987 0 0 0 11 2.1a4.977 4.977 0 0 1 3.9 5.858A3.989 3.989 0 0 0 14.5 0ZM9 13h2a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4Z"/>
                      <path d="M5 19h10v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2ZM5 7a5.008 5.008 0 0 1 4-4.9 3.988 3.988 0 1 0-3.9 5.859A4.974 4.974 0 0 1 5 7Zm5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-1h-.424a5.016 5.016 0 0 1-1.942 2.232A6.007 6.007 0 0 1 17 17h2a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5ZM5.424 9H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h2a6.007 6.007 0 0 1 4.366-5.768A5.016 5.016 0 0 1 5.424 9Z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="leading-none text-2xl font-bold text-foreground pb-1">
                      {formatCurrency(dashboardMetrics.totalSpent)}
                    </h5>
                    <p className="text-sm font-normal text-muted-foreground">Total Spending</p>
                  </div>
                </div>
                <div>
                  <span className={`text-xs font-medium inline-flex items-center px-2.5 py-1 rounded-md ${
                    dashboardMetrics.monthlyGrowth >= 0 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    <svg className="w-2.5 h-2.5 me-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={dashboardMetrics.monthlyGrowth >= 0 ? "M5 13V1m0 0L1 5m4-4 4 4" : "M5 1v12m0 0L1 9m4 4 4-4"}/>
                    </svg>
                    {Math.abs(dashboardMetrics.monthlyGrowth).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div ref={areaChartRef} className="h-64" key={`area-chart-${chartKey}`}></div>
              
              <div className="grid grid-cols-1 items-center border-border border-t justify-between mt-4">
                <div className="flex justify-between items-center pt-5">
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center">
                    Last 6 months
                    <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  <a href="#" className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2">
                    Trends Report
                    <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Column Chart - Weekly Performance */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between border-border border-b pb-3 mb-4">
                <dl>
                  <dt className="text-base font-normal text-muted-foreground pb-1">This Week</dt>
                  <dd className="leading-none text-xl font-bold text-green-500">
                    {formatCurrency(dashboardMetrics.totalSpent * 0.3)}
                  </dd>
                </dl>
                <dl>
                  <dt className="text-base font-normal text-muted-foreground pb-1">Last Week</dt>
                  <dd className="leading-none text-xl font-bold text-foreground">
                    {formatCurrency(dashboardMetrics.totalSpent * 0.25)}
                  </dd>
                </dl>
              </div>

              <div ref={columnChartRef} className="h-64" key={`column-chart-${chartKey}`}></div>
              
              <div className="grid grid-cols-1 items-center border-border border-t justify-between mt-4">
                <div className="flex justify-between items-center pt-5">
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center">
                    Last 7 days
                    <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  <a href="#" className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2">
                    Weekly Report
                    <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Pie Chart - Category Distribution */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between items-start w-full mb-4">
                <div className="flex-col items-center">
                  <div className="flex items-center mb-1">
                    <h5 className="text-xl font-bold leading-none text-foreground me-1">Category Spending</h5>
                    <svg className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5.034V12a1 1 0 0 1-2 0v-1.418a1 1 0 0 1 1.038-.999 1.436 1.436 0 0 0 1.488-1.441 1.501 1.501 0 1 0-3-.116.986.986 0 0 1-1.037.961 1 1 0 0 1-.96-1.037A3.5 3.5 0 0 1 10 .5Z"/>
                    </svg>
                  </div>
                </div>
                <button className="inline-flex items-center text-primary font-medium hover:underline">
                  This Month
                  <svg className="w-3 h-3 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                  </svg>
                </button>
              </div>

              <div ref={pieChartRef} className="h-64" key={`pie-chart-${chartKey}`}></div>

              <div className="grid grid-cols-1 items-center border-border border-t justify-between mt-4">
                <div className="flex justify-between items-center pt-5">
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center">
                    Last 30 days
                    <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  <a href="#" className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2">
                    Category Analysis
                    <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Donut Chart - Budget Performance */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between mb-3">
                <div className="flex justify-center items-center">
                  <h5 className="text-xl font-bold leading-none text-foreground pe-1">Budget Performance</h5>
                  <svg className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm0 16a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm1-5.034V12a1 1 0 0 1-2 0v-1.418a1 1 0 0 1 1.038-.999 1.436 1.436 0 0 0 1.488-1.441 1.501 1.501 0 1 0-3-.116.986.986 0 0 1-1.037.961 1 1 0 0 1-.96-1.037A3.5 3.5 0 0 1 10 .5Z"/>
                  </svg>
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg mb-4">
                <div className="grid grid-cols-3 gap-3">
                  <dl className="bg-orange-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[60px]">
                    <dt className="w-6 h-6 rounded-full bg-orange-100 dark:bg-gray-500 text-orange-600 dark:text-orange-300 text-xs font-medium flex items-center justify-center mb-1">
                      {dashboardMetrics.budgetProgress.filter(b => b.progress < 50).length}
                    </dt>
                    <dd className="text-orange-600 dark:text-orange-300 text-xs font-medium">Under</dd>
                  </dl>
                  <dl className="bg-teal-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[60px]">
                    <dt className="w-6 h-6 rounded-full bg-teal-100 dark:bg-gray-500 text-teal-600 dark:text-teal-300 text-xs font-medium flex items-center justify-center mb-1">
                      {dashboardMetrics.budgetProgress.filter(b => b.progress >= 50 && b.progress < 90).length}
                    </dt>
                    <dd className="text-teal-600 dark:text-teal-300 text-xs font-medium">On Track</dd>
                  </dl>
                  <dl className="bg-red-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[60px]">
                    <dt className="w-6 h-6 rounded-full bg-red-100 dark:bg-gray-500 text-red-600 dark:text-red-300 text-xs font-medium flex items-center justify-center mb-1">
                      {dashboardMetrics.budgetProgress.filter(b => b.progress >= 90).length}
                    </dt>
                    <dd className="text-red-600 dark:text-red-300 text-xs font-medium">Over</dd>
                  </dl>
                </div>
              </div>

              <div ref={donutChartRef} className="h-64" key={`donut-chart-${chartKey}`}></div>

              <div className="grid grid-cols-1 items-center border-border border-t justify-between mt-4">
                <div className="flex justify-between items-center pt-5">
                  <button className="text-sm font-medium text-muted-foreground hover:text-foreground text-center inline-flex items-center">
                    This Month
                    <svg className="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4"/>
                    </svg>
                  </button>
                  <a href="#" className="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-primary hover:text-primary/80 hover:bg-primary/10 px-3 py-2">
                    Budget Report
                    <svg className="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <AdvancedCharts 
            expenses={expenses} 
            budgets={budgets}
          />
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <SpendingBehaviorInsights 
            expenses={expenses}
          />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-6">
          <GamificationSystem 
            expenses={expenses} 
            budgets={budgets}
          />
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6">
          <div className="grid gap-6">
            {dashboardMetrics.budgetProgress.map((budget, index) => (
              <Card key={index} className="enhanced-card hover-lift">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{budget.category}</CardTitle>
                    <Badge variant={budget.status === 'over' ? 'destructive' : budget.status === 'warning' ? 'secondary' : 'default'}>
                      {budget.status === 'over' ? 'Over Budget' : budget.status === 'warning' ? 'Warning' : 'On Track'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Spent: {formatCurrency(budget.spent)}</span>
                    <span>Budget: {formatCurrency(budget.limit)}</span>
                  </div>
                  <Progress value={budget.progress} className="h-2" />
                  <div className="text-center text-sm text-muted-foreground">
                    {budget.progress.toFixed(1)}% of budget used
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions - Bottom Section */}
      <div className="mt-8 pt-8 border-t border-border">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Manage your finances efficiently</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          <Card className="border-border rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer" onClick={() => handleNavigate('expenses')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Receipt className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Add Expense</h3>
                  <p className="text-sm text-muted-foreground">Record a new expense transaction</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer" onClick={() => handleNavigate('budgets')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Target className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Manage Budgets</h3>
                  <p className="text-sm text-muted-foreground">Set and monitor spending limits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer" onClick={() => handleNavigate('insights')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Brain className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
                  <p className="text-sm text-muted-foreground">Get intelligent spending analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
