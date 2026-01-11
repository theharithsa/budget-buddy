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

// Category emoji and color mapping - Blue theme with varying shades
const categoryConfig: Record<string, { emoji: string; gradient: string }> = {
  'Food & Dining': { emoji: '🍽️', gradient: 'from-blue-500 to-blue-600' },
  'Transportation': { emoji: '🚗', gradient: 'from-blue-400 to-blue-500' },
  'Entertainment': { emoji: '🎬', gradient: 'from-indigo-500 to-blue-600' },
  'Healthcare': { emoji: '🏥', gradient: 'from-sky-500 to-blue-500' },
  'Education': { emoji: '📚', gradient: 'from-blue-600 to-indigo-600' },
  'Bills & Utilities': { emoji: '⚡', gradient: 'from-blue-500 to-indigo-500' },
  'Shopping': { emoji: '🛍️', gradient: 'from-indigo-400 to-blue-500' },
  'Travel': { emoji: '✈️', gradient: 'from-sky-400 to-blue-500' },
  'Personal Care': { emoji: '💆', gradient: 'from-blue-400 to-indigo-500' },
  'Groceries': { emoji: '🛒', gradient: 'from-blue-500 to-sky-500' },
  'Subscriptions': { emoji: '📱', gradient: 'from-slate-500 to-blue-500' },
  'Other': { emoji: '📝', gradient: 'from-blue-400 to-blue-500' }
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
      .slice(0, 10);

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
    }).sort((a, b) => b.spent - a.spent);

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
      totalExpenses: expenses.length,
      allTimeSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalCategories: new Set(expenses.map(e => e.category)).size,
      totalBudgets: budgets.length
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
      case 'over': return 'from-red-500 to-red-600';
      case 'warning': return 'from-blue-400 to-blue-500';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getBudgetStatusGradient = (status: string) => {
    switch (status) {
      case 'over': return 'from-red-500 to-red-600';
      case 'warning': return 'from-blue-400 to-blue-500';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const chartColor = isDark ? '#60a5fa' : '#3b82f6';
  const chartColorSecondary = isDark ? '#93c5fd' : '#60a5fa';

  return (
    <div className={`min-h-screen pb-28 ${isDark
      ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'
      : 'bg-gradient-to-b from-slate-100 via-slate-50 to-white'
      }`}>
      {/* Header */}
      <div className="px-5 pt-8 pb-4 md:px-8 md:pt-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
          {greeting}, <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.displayName?.split(' ')[0] || 'there'}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-2 tracking-wide uppercase font-medium">
          {currentMonth}
        </p>
      </div>

      {/* Hero Card - Premium Dark Design */}
      <div className="px-5 md:px-8 mt-4">
        <div className="grid grid-cols-2 gap-4">

          {/* Budget Status Card - Dark */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400 text-sm font-medium">Budget Status</span>
              </div>
              <span className="text-slate-500 text-sm">{currentMonth}</span>
            </div>

            {/* Large Number Display */}
            <div className="mb-8">
              <div className="flex items-baseline gap-2">
                <span className="text-7xl md:text-8xl font-bold text-white tracking-tight">
                  {Math.round(metrics.budgetProgress)}
                </span>
                <span className="text-3xl text-slate-500 font-medium">/ 100</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                  style={{ width: `${metrics.budgetProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">0%</span>
                <span className="text-slate-500">100%</span>
              </div>
            </div>
          </div>

          {/* Monthly Spent Card - Dark */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-4 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs md:text-sm font-medium">Monthly Spending</span>
              {metrics.monthlyChange !== 0 && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${metrics.monthlyChange > 0
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                  {metrics.monthlyChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(metrics.monthlyChange).toFixed(0)}%
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="mb-4 md:mb-6">
              <p className="text-2xl md:text-5xl font-bold text-white tracking-tight">
                {formatCurrency(metrics.monthlySpent)}
              </p>
              <p className="text-slate-500 text-xs md:text-sm mt-1 md:mt-2">
                {formatCurrency(metrics.remaining)} remaining of {formatCurrency(metrics.totalBudget)}
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
              <div>
                <p className="text-2xl font-bold text-white">{metrics.totalExpenses}</p>
                <p className="text-slate-500 text-xs">entries</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{budgets.length}</p>
                <p className="text-slate-500 text-xs">budgets</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{metrics.totalCategories}</p>
                <p className="text-slate-500 text-xs">categories</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 px-5 md:px-8">
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: Plus, label: 'Add', color: 'from-blue-500 to-blue-600', action: onAddExpense },
            { icon: Target, label: 'Budgets', color: 'from-blue-600 to-indigo-600', action: () => onNavigate('budgets') },
            { icon: BarChart3, label: 'Analytics', color: 'from-indigo-500 to-blue-600', action: () => onNavigate('explorer') },
            { icon: MessageSquare, label: 'Kautilya AI', color: 'from-sky-500 to-blue-500', action: () => onNavigate('ai-chat') },
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card border border-transparent shadow-lg hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:-translate-y-1 active:scale-95"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${item.color} shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bento Grid - Premium Design */}
      <div className="mt-8 px-5 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[140px]">

          {/* Large Featured Card - Budget Status */}
          <div className="col-span-2 md:col-span-1 row-span-2 rounded-3xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 flex flex-col justify-between shadow-2xl shadow-purple-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <p className="text-white/80 text-sm font-medium">Budget Remaining</p>
              <p className="text-4xl md:text-5xl font-black text-white mt-2 tracking-tight">
                {formatCurrency(metrics.remaining)}
              </p>
              <p className="text-white/70 text-sm mt-1">of {formatCurrency(metrics.totalBudget)}</p>
            </div>
            <div className="relative z-10 space-y-3">
              {/* Progress bar */}
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-500"
                  style={{ width: `${100 - metrics.budgetProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-xs font-medium">{Math.round(100 - metrics.budgetProgress)}% remaining</span>
                {metrics.monthlyChange > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/30 text-white text-xs font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    {Math.abs(metrics.monthlyChange).toFixed(0)}%
                  </span>
                ) : metrics.monthlyChange < 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-white text-xs font-semibold">
                    <TrendingDown className="w-3 h-3" />
                    {Math.abs(metrics.monthlyChange).toFixed(0)}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Daily Average Card */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 md:p-5 flex flex-col justify-between shadow-xl shadow-purple-500/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <p className="text-white/80 text-[10px] md:text-xs font-semibold uppercase tracking-wider">Daily Average</p>
            <div>
              <p className="text-xl md:text-3xl font-extrabold text-white">
                {formatCurrency(metrics.monthlySpent / Math.max(new Date().getDate(), 1))}
              </p>
              <p className="text-white/70 text-[10px] md:text-xs mt-1">per day this month</p>
            </div>
          </div>

          {/* This Week Card */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-4 md:p-5 flex flex-col justify-between shadow-xl shadow-pink-500/20 overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/2" />
            <p className="text-white/80 text-[10px] md:text-xs font-semibold uppercase tracking-wider">This Week</p>
            <div>
              <p className="text-xl md:text-3xl font-extrabold text-white">
                {formatCurrency(metrics.dailySpending.reduce((sum, d) => sum + d.amount, 0))}
              </p>
              <p className="text-white/70 text-[10px] md:text-xs mt-1">weekly total</p>
            </div>
          </div>

          {/* Top Category Card */}
          <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-xl shadow-rose-500/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-16 h-16 bg-white/20 rounded-full blur-xl -translate-y-1/2 -translate-x-1/2" />
            <div className="text-3xl md:text-5xl drop-shadow-lg relative z-10">{metrics.categoryData[0]?.emoji || '📊'}</div>
            <div className="relative z-10">
              <p className="text-white/80 text-[10px] md:text-xs font-semibold uppercase tracking-wider">Top Spend</p>
              <p className="text-base md:text-xl font-bold text-white">{metrics.categoryData[0]?.name?.split(' ')[0] || 'None'}</p>
              <p className="text-white/70 text-sm md:text-base font-semibold">{metrics.categoryData[0] ? formatCurrency(metrics.categoryData[0].amount) : '₹0'}</p>
            </div>
          </div>

          {/* Avg per Entry Card */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-4 md:p-5 flex flex-col justify-between shadow-lg shadow-indigo-500/20">
            <div className="flex items-center justify-between">
              <p className="text-white/80 text-[10px] md:text-xs font-semibold uppercase tracking-wider">Avg / Entry</p>
              <div className="p-1.5 rounded-lg bg-white/20">
                <Receipt className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-xl md:text-3xl font-extrabold text-white">
                {formatCurrency(metrics.totalExpenses > 0 ? metrics.allTimeSpent / metrics.totalExpenses : 0)}
              </p>
              <p className="text-white/70 text-[10px] md:text-xs mt-1">per transaction</p>
            </div>
          </div>

        </div>
      </div>
      {/* Weekly Spending Chart */}
      <div className="mt-10 px-5 md:px-8">
        <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">This Week</h2>
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
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Top Categories</h2>
          <button
            onClick={() => onNavigate('expenses')}
            className="group relative flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors cursor-pointer"
          >
            <span className="relative">
              View all
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out" />
            </span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {metrics.categoryData.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.categoryData.slice(0, 4).map((category) => (
              <Card
                key={category.name}
                className="border border-transparent shadow-xl hover:shadow-2xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden active:scale-95"
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
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Budget Status</h2>
            <button
              onClick={() => onNavigate('budgets')}
              className="group relative flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors cursor-pointer"
            >
              <span className="relative">
                Manage
                <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out" />
              </span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <Card className="border-0 shadow-xl">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - First 3 budgets */}
                <div className="space-y-4">
                  {metrics.budgetBreakdown.slice(0, 3).map((budget) => (
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
                </div>

                {/* Right Column - Next 3 budgets */}
                {metrics.budgetBreakdown.length > 3 && (
                  <div className="space-y-4">
                    {metrics.budgetBreakdown.slice(3, 6).map((budget) => (
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-10 px-5 md:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Recent Activity</h2>
          <button
            className="group relative flex items-center text-blue-600 font-bold hover:text-blue-700 transition-colors cursor-pointer"
            onClick={() => onNavigate('expenses')}
          >
            <span className="relative">
              View all
              <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300 ease-out" />
            </span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {metrics.recentExpenses.length > 0 ? (
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/30 max-h-[400px] overflow-y-auto custom-scrollbar">
              {metrics.recentExpenses.map((expense) => {
                const config = categoryConfig[expense.category] || { emoji: '📝', gradient: 'from-gray-400 to-slate-500' };
                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all cursor-pointer active:bg-blue-100/50 dark:active:bg-blue-900/30"
                    onClick={() => onNavigate('expenses')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-lg shadow`}>
                        {config.emoji}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {expense.description || expense.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {expense.app && expense.app !== 'Cash' ? expense.app : expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground text-sm">
                        {formatCurrency(expense.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
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
        )
        }
      </div >

      {/* AI Insight */}
      {
        metrics.monthlyChange > 15 && (
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
                    className="px-0 mt-2 text-blue-600 hover:text-blue-700 font-bold"
                    onClick={() => onNavigate('ai-chat')}
                  >
                    Get AI suggestions →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Summary Stats */}
      <div className="mt-10 px-5 md:px-8 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Receipt, value: metrics.totalExpenses, label: 'Transactions', gradient: 'from-blue-500 to-blue-600' },
            { icon: Target, value: budgets.length, label: 'Budgets', gradient: 'from-blue-600 to-indigo-600' },
            { icon: PiggyBank, value: metrics.categoryData.length, label: 'Categories', gradient: 'from-indigo-500 to-blue-600' },
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
      <div className="fixed bottom-6 right-5 z-50">
        <button
          onClick={onAddExpense}
          className="h-12 w-12 md:h-14 md:w-14 rounded-xl shadow-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/30 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div >
  );
}
