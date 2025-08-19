import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp } from '@phosphor-icons/react';
import { type Expense, DEFAULT_CATEGORIES, formatCurrency, getCurrentMonth, getMonthlyExpenses } from '@/lib/types';

interface SpendingTrendsProps {
  expenses: Expense[];
}

export function SpendingTrends({ expenses }: SpendingTrendsProps) {
  const currentMonth = getCurrentMonth();
  const monthlyExpenses = getMonthlyExpenses(expenses, currentMonth);

  const categoryData = useMemo(() => {
    const categoryTotals = DEFAULT_CATEGORIES.map(category => {
      const total = monthlyExpenses
        .filter(expense => expense.category === category.name)
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        name: category.name,
        value: total,
        color: category.color,
        icon: category.icon,
      };
    }).filter(item => item.value > 0);

    return categoryTotals.sort((a, b) => b.value - a.value);
  }, [monthlyExpenses]);

  const last6MonthsData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthExpenses = getMonthlyExpenses(expenses, monthKey);
      const total = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: total,
      });
    }
    
    return months;
  }, [expenses]);

  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${label}: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp size={24} className="text-primary" />
          <h2 className="text-2xl font-bold">Spending Trends</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <TrendingUp size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No spending data</h3>
              <p className="text-muted-foreground">
                Add some expenses to see your spending trends and patterns.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp size={24} className="text-primary" />
        <h2 className="text-2xl font-bold">Spending Trends</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">
              {monthlyExpenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryData[0]?.name || 'None'}
            </div>
            <p className="text-xs text-muted-foreground">
              {categoryData[0] ? formatCurrency(categoryData[0].value) : '$0.00'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average/Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent / new Date().getDate())}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on current month
            </p>
          </CardContent>
        </Card>
      </div>

      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => {
                  const percentage = (category.value / totalSpent) * 100;
                  return (
                    <div key={category.name} className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{category.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">
                            {formatCurrency(category.value)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>6-Month Spending Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={last6MonthsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="oklch(0.45 0.15 240)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}