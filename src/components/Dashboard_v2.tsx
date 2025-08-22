import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
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
  Trophy,
  Sparkles
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

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="enhanced-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              All time spending
            </p>
          </CardContent>
        </Card>

        <Card className="enhanced-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlySpent)}</div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 && `${formatCurrency(totalBudget - monthlySpent)} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card className="enhanced-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBudget > 0 ? `${Math.round((monthlySpent / totalBudget) * 100)}%` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalBudget > 0 ? 'of budget used' : 'No budgets set'}
            </p>
          </CardContent>
        </Card>

        <Card className="enhanced-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length}</div>
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

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
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
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="amount"
                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spent']} />
                    </PieChart>
                  </ResponsiveContainer>
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

            {/* Monthly Trends */}
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
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spent']} />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
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
                  <div className="space-y-3">
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
              <Sparkles className="h-5 w-5 text-white" />
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
