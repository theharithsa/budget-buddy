import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt, 
  Target,
  Calendar,
  ArrowRight,
  DollarSign,
  CreditCard,
  Activity,
  Users,
  Crown,
  BarChart3,
  PieChart as PieChartIcon,
  CalendarDays,
  Gauge,
  ArrowUpDown,
  Store,
  Repeat,
  Zap
} from 'lucide-react';
import { TimeframePicker, type DateRange } from '@/components/TimeframePicker';
import { type Expense, type Budget, formatCurrency, getExpensesByDateRange, calculateCategorySpending, getAllCategories, getAllPeople } from '@/lib/types';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  customCategories: any[];
  customPeople: any[];
  publicPeople: any[];
  onNavigate: (tab: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export function Dashboard({ expenses, budgets, customCategories, customPeople, publicPeople, onNavigate }: DashboardProps) {
  // Initialize date range to current month
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { 
      from: start.toISOString().split('T')[0], 
      to: end.toISOString().split('T')[0] 
    };
  });

  const filteredExpenses = useMemo(() => {
    return getExpensesByDateRange(expenses, dateRange.from, dateRange.to);
  }, [expenses, dateRange]);

  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  const totalBudget = useMemo(() => {
    return budgets.reduce((sum, budget) => sum + budget.limit, 0);
  }, [budgets]);

  // Category spending data for pie chart
  const categorySpending = useMemo(() => {
    const categories = getAllCategories(customCategories);
    const categoryData: { [key: string]: number } = {};
    
    categories.forEach(category => {
      categoryData[category.name] = calculateCategorySpending(filteredExpenses, category.name);
    });
    
    return Object.entries(categoryData)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        icon: categories.find(c => c.name === category)?.icon || '📊'
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredExpenses, customCategories]);

  // Monthly trends data for the last 6 months
  const monthlyTrends = useMemo(() => {
    const monthsData: { [key: string]: number } = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthsData[monthKey] = 0;
    }

    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      const monthKey = `${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}`;
      if (monthsData.hasOwnProperty(monthKey)) {
        monthsData[monthKey] += expense.amount;
      }
    });

    return Object.entries(monthsData).map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      amount: amount,
      fullMonth: month
    }));
  }, [expenses]);

  // Month-to-month comparison
  const monthComparison = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
    });
    
    const currentTotal = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const lastTotal = lastMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const change = currentTotal - lastTotal;
    const changePercent = lastTotal > 0 ? (change / lastTotal) * 100 : 0;
    
    return {
      current: currentTotal,
      last: lastTotal,
      change,
      changePercent
    };
  }, [expenses]);

  // Budget progress data
  const budgetProgress = useMemo(() => {
    const categories = getAllCategories(customCategories);
    return budgets.map(budget => {
      const categoryExpenses = filteredExpenses.filter(expense => expense.category === budget.category);
      const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      const category = categories.find(c => c.name === budget.category);
      
      return {
        ...budget,
        spent,
        remaining: Math.max(0, budget.limit - spent),
        percentage: Math.min(100, percentage),
        icon: category?.icon || '📊',
        status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'good'
      };
    });
  }, [budgets, filteredExpenses, customCategories]);

  // Simple forecast
  const forecastData = useMemo(() => {
    if (filteredExpenses.length === 0) {
      return [
        { period: 'Current', amount: totalSpent, type: 'actual' },
        { period: 'Projected', amount: totalSpent, type: 'forecast' }
      ];
    }
    
    const daysInPeriod = filteredExpenses.length > 0 ? 
      Math.max(1, Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24))) : 1;
    const avgDailySpending = totalSpent / daysInPeriod;
    const remainingDays = Math.max(0, new Date(dateRange.to).getDate() - new Date().getDate());
    const projectedTotal = totalSpent + (avgDailySpending * remainingDays);
    
    return [
      { period: 'Current', amount: totalSpent, type: 'actual' },
      { period: 'Projected', amount: projectedTotal, type: 'forecast' }
    ];
  }, [filteredExpenses, totalSpent, dateRange]);

  const getDateRangeLabel = () => {
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
    
    if (dateRange.from === currentMonthStart && dateRange.to === currentMonthEnd) {
      return "This Month";
    }
    
    const fromDate = new Date(dateRange.from + 'T00:00:00');
    const toDate = new Date(dateRange.to + 'T00:00:00');
    
    if (dateRange.from === dateRange.to) {
      return fromDate.toLocaleDateString();
    }
    
    return `${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
  };

  return (
    <div className="space-y-8 p-1">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Financial Analytics Dashboard
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Comprehensive insights into your spending patterns and financial health
          </p>
        </div>
        <div className="flex-shrink-0">
          <TimeframePicker 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
            className="w-64"
          />
        </div>
      </div>

      {/* Enhanced Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">
              Total Spent
            </CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-sm text-blue-600/80 dark:text-blue-300/80 font-medium">
              {filteredExpenses.length} transactions • {getDateRangeLabel()}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
              Budget Progress
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-3">
              {formatCurrency(totalBudget)}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600/80 dark:text-emerald-300/80 font-medium">
                  {totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}% used
                </span>
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                  {formatCurrency(Math.max(0, totalBudget - totalSpent))} left
                </span>
              </div>
              <Progress 
                value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} 
                className="h-2 bg-emerald-100 dark:bg-emerald-900/30" 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wide">
              Monthly Change
            </CardTitle>
            <div className={`p-2 rounded-lg ${monthComparison.change >= 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              {monthComparison.change >= 0 ? 
                <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" /> : 
                <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
              }
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className={`text-3xl font-bold mb-2 ${monthComparison.change >= 0 ? 'text-red-900 dark:text-red-100' : 'text-green-900 dark:text-green-100'}`}>
              {monthComparison.change >= 0 ? '+' : ''}{formatCurrency(monthComparison.change)}
            </div>
            <p className="text-sm text-amber-600/80 dark:text-amber-300/80 font-medium">
              {monthComparison.changePercent >= 0 ? '+' : ''}{monthComparison.changePercent.toFixed(1)}% vs last month
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
              Forecast
            </CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              {forecastData.length > 1 ? formatCurrency(forecastData[1].amount) : formatCurrency(totalSpent)}
            </div>
            <p className="text-sm text-purple-600/80 dark:text-purple-300/80 font-medium">
              Projected period-end total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-12 p-1 bg-muted/30 rounded-xl">
          <TabsTrigger value="overview" className="text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Trends
          </TabsTrigger>
          <TabsTrigger value="budgets" className="text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Budgets
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Enhanced Category Donut Chart */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <PieChartIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Spending Breakdown</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Distribution across categories
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                {categorySpending.length > 0 ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={categorySpending}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {categorySpending.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-3">
                      {categorySpending.slice(0, 6).map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div>
                              <div className="flex items-center gap-1">
                                <span className="text-lg">{category.icon}</span>
                                <span className="font-medium text-sm">{category.name}</span>
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-sm text-primary">
                            {totalSpent > 0 ? Math.round((category.value / totalSpent) * 100) : 0}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-muted/20 rounded-full mx-auto w-fit">
                        <PieChartIcon className="h-12 w-12 opacity-50" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">No spending data available</p>
                        <p className="text-sm">Add some expenses to see the breakdown</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Monthly Trend */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Monthly Spending Trend</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Last 6 months comparison
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-8">
                {monthlyTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `₹${value}`} 
                        tick={{ fontSize: 12, fill: '#666' }}
                        axisLine={{ stroke: '#e0e0e0' }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), 'Amount']}
                        labelFormatter={(label) => `Month: ${label}`}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        dot={{ fill: '#8884d8', r: 5, strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 7, fill: '#8884d8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground">
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-muted/20 rounded-full mx-auto w-fit">
                        <Activity className="h-12 w-12 opacity-50" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">Not enough data for trends</p>
                        <p className="text-sm">Add more expenses across months to see trends</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-8 mt-8">
          <div className="grid grid-cols-1 gap-8">
            {/* Budget vs Actual Performance */}
            {budgetProgress.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Gauge className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Budget Performance</CardTitle>
                      <CardDescription className="text-base mt-1">
                        How you're tracking against your budgets
                      </CardDescription>
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
          </div>
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-8 mt-8">
          <div className="text-center py-12">
            <div className="p-4 bg-muted/20 rounded-full mx-auto w-fit mb-4">
              <Target className="h-12 w-12 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Budget Management</h3>
            <p className="text-muted-foreground mb-6">
              Set up and manage your budgets to track spending goals
            </p>
            <Button onClick={() => onNavigate('budgets')}>
              Go to Budget Manager
            </Button>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-8 mt-8">
          <div className="text-center py-12">
            <div className="p-4 bg-muted/20 rounded-full mx-auto w-fit mb-4">
              <Activity className="h-12 w-12 opacity-50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-muted-foreground mb-6">
              Get intelligent analysis of your spending patterns and financial advice
            </p>
            <Button onClick={() => onNavigate('analyzer')}>
              Open AI Analyzer
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
          <CardDescription className="text-base">
            Jump to common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2" 
              onClick={() => onNavigate('expenses')}
            >
              <Receipt className="h-5 w-5" />
              <span className="text-sm">Add Expense</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2" 
              onClick={() => onNavigate('budgets')}
            >
              <Target className="h-5 w-5" />
              <span className="text-sm">Manage Budgets</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2" 
              onClick={() => onNavigate('categories')}
            >
              <Wallet className="h-5 w-5" />
              <span className="text-sm">Categories</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-16 flex-col gap-2" 
              onClick={() => onNavigate('analyzer')}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-sm">AI Insights</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
