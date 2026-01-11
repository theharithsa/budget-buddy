import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Sparkles,
  Target,
  Receipt,
  PiggyBank,
  MessageSquare,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis
} from 'recharts';
import { type Expense, type Budget, type Person, formatCurrency, getAllCategories } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardProps {
  expenses: Expense[];
  budgets: Budget[];
  customCategories: any[];
  customPeople: Person[];
  publicPeople: Person[];
  onNavigate: (tab: string) => void;
  onAddExpense?: () => void;
}

// Category emoji and color mapping
const categoryConfig: Record<string, { emoji: string; gradient: string }> = {
  'Food & Dining': { emoji: '🍽️', gradient: 'from-orange-400 to-red-500' },
  'Transportation': { emoji: '🚗', gradient: 'from-blue-400 to-cyan-500' },
  'Entertainment': { emoji: '🎬', gradient: 'from-purple-400 to-pink-500' },
  'Healthcare': { emoji: '🏥', gradient: 'from-emerald-400 to-teal-500' },
  'Education': { emoji: '📚', gradient: 'from-indigo-400 to-blue-500' },
  'Bills & Utilities': { emoji: '⚡', gradient: 'from-yellow-400 to-orange-500' },
  'Shopping': { emoji: '🛍️', gradient: 'from-pink-400 to-rose-500' },
  'Travel': { emoji: '✈️', gradient: 'from-sky-400 to-blue-500' },
  'Personal Care': { emoji: '💆', gradient: 'from-violet-400 to-purple-500' },
  'Groceries': { emoji: '🛒', gradient: 'from-green-400 to-emerald-500' },
  'Subscriptions': { emoji: '📱', gradient: 'from-slate-400 to-gray-500' },
  'Other': { emoji: '📝', gradient: 'from-gray-400 to-slate-500' }
};

export function Dashboard({
  expenses,
  budgets,
  customCategories,
  onNavigate,
  onAddExpense
}: DashboardProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get greeting based on time
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonthNum = now.getMonth();
    const currentYear = now.getFullYear();

    // This month's expenses
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonthNum &&
        expenseDate.getFullYear() === currentYear;
    });

    const monthlySpent = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
    const budgetProgress = totalBudget > 0 ? (monthlySpent / totalBudget) * 100 : 0;
    const remaining = Math.max(0, totalBudget - monthlySpent);

    // Last month comparison
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === lastMonth.getMonth() &&
        expenseDate.getFullYear() === lastMonth.getFullYear();
    });
    const lastMonthSpent = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyChange = lastMonthSpent > 0
      ? ((monthlySpent - lastMonthSpent) / lastMonthSpent) * 100
      : 0;

    // Daily spending for last 7 days
    const dailySpending = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.toDateString() === date.toDateString();
      });
      dailySpending.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayExpenses.reduce((sum, e) => sum + e.amount, 0)
      });
    }

    // Monthly trend for last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthExp = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear();
      });
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount: monthExp.reduce((sum, e) => sum + e.amount, 0)
      });
    }

    // Category breakdown (top 5)
    const allCategories = getAllCategories(customCategories);
    const categoryData = allCategories.map(category => {
      const amount = monthlyExpenses
        .filter(e => e.category === category.name)
        .reduce((sum, e) => sum + e.amount, 0);
      const config = categoryConfig[category.name] || { emoji: '📝', gradient: 'from-gray-400 to-slate-500' };
      return {
        name: category.name,
        amount,
        emoji: config.emoji,
        gradient: config.gradient,
        color: category.color || '#3B82F6'
      };
    })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Recent transactions
    const recentExpenses = [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Budget breakdown
    const budgetBreakdown = budgets.map(budget => {
      const spent = monthlyExpenses
        .filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      const progress = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        category: budget.category,
        spent,
        limit: budget.limit,
        progress: Math.min(progress, 100),
        status: progress > 100 ? 'over' : progress > 80 ? 'warning' : 'good'
      };
    }).slice(0, 3);

    let status: 'good' | 'warning' | 'over' = 'good';
    if (budgetProgress > 100) status = 'over';
    else if (budgetProgress > 80) status = 'warning';

    return {
      monthlySpent,
      totalBudget,
      budgetProgress: Math.min(budgetProgress, 100),
      remaining,
      monthlyChange,
      dailySpending,
      monthlyTrend,
      categoryData,
      recentExpenses,
      budgetBreakdown,
      status,
      totalExpenses: expenses.length
    };
  }, [expenses, budgets, customCategories]);

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusGradient = () => {
    switch (metrics.status) {
      case 'over': return 'from-red-500 to-rose-600';
      case 'warning': return 'from-amber-500 to-orange-600';
      default: return 'from-emerald-500 to-green-600';
    }
  };

  const getBudgetStatusGradient = (status: string) => {
    switch (status) {
      case 'over': return 'from-red-500 to-rose-600';
      case 'warning': return 'from-amber-500 to-orange-600';
      default: return 'from-emerald-500 to-green-600';
    }
  };

  const chartColor = isDark ? '#818cf8' : '#6366f1';
  const chartColorSecondary = isDark ? '#34d399' : '#10b981';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-28">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 md:px-8 md:pt-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {greeting}, <span className="text-primary">{user?.displayName?.split(' ')[0] || 'there'}</span> 👋
        </h1>
        <p className="text-muted-foreground text-base mt-2">
          {currentMonth}
        </p>
      </div>

      {/* Hero Metric Card */}
      <div className="px-5 md:px-8 mt-4">
        <Card className={`border-0 shadow-2xl overflow-hidden ${isDark
          ? 'bg-gradient-to-br from-slate-800 via-slate-800 to-indigo-900/50'
          : 'bg-gradient-to-br from-white via-white to-indigo-50'
          }`}>
          <CardContent className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Amount and Progress */}
              <div className="lg:col-span-3">
                {/* Amount */}
                <div className="mb-6">
                  <p className="text-5xl md:text-6xl font-extrabold tracking-tighter bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                    {formatCurrency(metrics.monthlySpent)}
                  </p>
                  <p className="text-muted-foreground text-base mt-2 font-medium">
                    spent this month
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-3">
                  <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden backdrop-blur">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${getStatusGradient()} transition-all duration-1000 ease-out`}
                      style={{ width: `${metrics.budgetProgress}%` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold bg-gradient-to-r ${getStatusGradient()} bg-clip-text text-transparent`}>
                      {Math.round(metrics.budgetProgress)}% of budget
                    </span>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {formatCurrency(metrics.remaining)} left
                    </span>
                  </div>
                </div>

                {/* Month over Month */}
                {metrics.monthlyChange !== 0 && (
                  <div className="flex items-center gap-2 mt-4 text-sm font-semibold">
                    {metrics.monthlyChange > 0 ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10">
                        <TrendingUp className="w-4 h-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">
                          {Math.abs(metrics.monthlyChange).toFixed(0)}% vs last month
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10">
                        <TrendingDown className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {Math.abs(metrics.monthlyChange).toFixed(0)}% vs last month
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Trend Chart */}
              <div className="lg:col-span-2 flex flex-col">
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-3">
                  Last 6 months
                </p>
                <div className="flex-1 min-h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.monthlyTrend}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartColor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Spent']}
                        contentStyle={{
                          backgroundColor: isDark ? '#1e293b' : '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                          fontWeight: 600
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke={chartColor}
                        strokeWidth={3}
                        fill="url(#colorGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 px-5 md:px-8">
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Plus, label: 'Add', color: 'from-indigo-500 to-purple-600', action: onAddExpense },
            { icon: Target, label: 'Budgets', color: 'from-emerald-500 to-teal-600', action: () => onNavigate('budgets') },
            { icon: BarChart3, label: 'Analytics', color: 'from-violet-500 to-purple-600', action: () => onNavigate('explorer') },
            { icon: MessageSquare, label: 'AI Chat', color: 'from-amber-500 to-orange-600', action: () => onNavigate('ai-chat') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Spending Chart */}
      <div className="mt-10 px-5 md:px-8">
        <h2 className="text-lg font-bold text-foreground tracking-tight mb-4">This Week</h2>
        <Card className="border-0 shadow-xl">
          <CardContent className="p-5">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={metrics.dailySpending} barCategoryGap="20%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Spent']}
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                    fontWeight: 600
                  }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                />
                <Bar
                  dataKey="amount"
                  fill={chartColorSecondary}
                  radius={[8, 8, 8, 8]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="mt-10 px-5 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Top Categories</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-bold hover:text-primary/80"
            onClick={() => onNavigate('expenses')}
          >
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {metrics.categoryData.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
            {metrics.categoryData.map((category) => (
              <Card
                key={category.name}
                className="flex-shrink-0 w-32 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden"
                onClick={() => onNavigate('expenses')}
              >
                <div className={`h-1.5 bg-gradient-to-r ${category.gradient}`} />
                <CardContent className="p-4 text-center">
                  <div className="text-4xl mb-3">{category.emoji}</div>
                  <p className="text-base font-extrabold text-foreground">
                    {formatCurrency(category.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1 truncate">
                    {category.name.split(' ')[0]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-10 text-center">
              <Zap className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-semibold">No expenses this month</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Budget Overview */}
      {metrics.budgetBreakdown.length > 0 && (
        <div className="mt-10 px-5 md:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Budget Status</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary font-bold hover:text-primary/80"
              onClick={() => onNavigate('budgets')}
            >
              Manage
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <Card className="border-0 shadow-xl">
            <CardContent className="p-5 space-y-5">
              {metrics.budgetBreakdown.map((budget) => (
                <div key={budget.category}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-foreground">{budget.category}</span>
                    <span className="text-sm text-muted-foreground font-semibold">
                      {formatCurrency(budget.spent)} <span className="text-muted-foreground/60">/ {formatCurrency(budget.limit)}</span>
                    </span>
                  </div>
                  <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getBudgetStatusGradient(budget.status)} transition-all duration-700`}
                      style={{ width: `${budget.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-10 px-5 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Activity</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary font-bold hover:text-primary/80"
            onClick={() => onNavigate('expenses')}
          >
            View all
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {metrics.recentExpenses.length > 0 ? (
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/50">
              {metrics.recentExpenses.map((expense) => {
                const config = categoryConfig[expense.category] || { emoji: '📝', gradient: 'from-gray-400 to-slate-500' };
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => onNavigate('expenses')}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                        {config.emoji}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {expense.description || expense.category}
                        </p>
                        <p className="text-sm text-muted-foreground font-medium">
                          {expense.app && expense.app !== 'Cash' ? expense.app : expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-foreground">
                        -{formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground font-semibold">
                        {formatRelativeDate(expense.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl">
            <CardContent className="p-10 text-center">
              <Receipt className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-bold mb-4">No expenses yet</p>
              <Button
                onClick={onAddExpense}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first expense
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Insight */}
      {metrics.monthlyChange > 15 && (
        <div className="mt-10 px-5 md:px-8">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
            <CardContent className="p-5 flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-base">
                  Spending Alert
                </p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Your spending is <span className="text-amber-600 dark:text-amber-400 font-bold">{Math.round(metrics.monthlyChange)}% higher</span> than last month.
                  {metrics.categoryData[0] && ` Top category: ${metrics.categoryData[0].name}.`}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="px-0 mt-2 text-amber-600 hover:text-amber-700 font-bold"
                  onClick={() => onNavigate('ai-chat')}
                >
                  Get AI suggestions →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-10 px-5 md:px-8 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Receipt, value: metrics.totalExpenses, label: 'Transactions', gradient: 'from-blue-500 to-cyan-500' },
            { icon: Target, value: budgets.length, label: 'Budgets', gradient: 'from-emerald-500 to-teal-500' },
            { icon: PiggyBank, value: metrics.categoryData.length, label: 'Categories', gradient: 'from-violet-500 to-purple-500' },
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-xl overflow-hidden">
              <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="p-4 text-center">
                <stat.icon className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
                <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-6 z-50">
        <button
          onClick={onAddExpense}
          className="h-16 w-16 rounded-2xl shadow-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-110 hover:shadow-purple-500/30 hover:shadow-3xl flex items-center justify-center"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
