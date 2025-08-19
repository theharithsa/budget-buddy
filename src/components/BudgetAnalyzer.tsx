import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, BarChart3 } from '@phosphor-icons/react';
import { type Expense, type Budget, formatCurrency, getCurrentMonth, getMonthlyExpenses, calculateCategorySpending } from '@/lib/types';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

interface BudgetAnalysis {
  overallScore: number;
  insights: string[];
  recommendations: string[];
  categoryAnalysis: {
    category: string;
    status: 'healthy' | 'warning' | 'overspent';
    message: string;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    spent: number;
    budget: number;
    difference: number;
  }[];
  topCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  savingsOpportunities: {
    category: string;
    potentialSavings: number;
    suggestion: string;
  }[];
  spendingPattern: {
    day: string;
    amount: number;
  }[];
}

interface BudgetAnalyzerProps {
  expenses: Expense[];
  budgets: Budget[];
}

export function BudgetAnalyzer({ expenses, budgets }: BudgetAnalyzerProps) {
  const [analysis, setAnalysis] = useState<BudgetAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  const analyzeSpending = async () => {
    setLoading(true);
    try {
      // Prepare data for GPT analysis
      const currentMonth = getCurrentMonth();
      const monthlyExpenses = getMonthlyExpenses(expenses, currentMonth);
      const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);
      
      // Category spending analysis
      const categorySpending = budgets.map(budget => ({
        category: budget.category,
        budgeted: budget.limit,
        spent: calculateCategorySpending(monthlyExpenses, budget.category),
        percentage: budget.limit > 0 ? (calculateCategorySpending(monthlyExpenses, budget.category) / budget.limit) * 100 : 0
      }));

      // Recent expenses for pattern analysis
      const recentExpenses = expenses.slice(-50).map(exp => ({
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        description: exp.description
      }));

      // Create comprehensive prompt for GPT
      const prompt = spark.llmPrompt`
        Analyze this user's spending data and provide comprehensive budget insights:

        CURRENT MONTH DATA:
        - Total Budget: ₹${totalBudget}
        - Total Spent: ₹${totalSpent}
        - Budget Utilization: ${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%

        CATEGORY BREAKDOWN:
        ${categorySpending.map(cat => 
          `- ${cat.category}: Budgeted ₹${cat.budgeted}, Spent ₹${cat.spent} (${cat.percentage.toFixed(1)}%)`
        ).join('\n')}

        RECENT TRANSACTIONS (Last 50):
        ${recentExpenses.map(exp => 
          `- ${exp.date}: ${exp.category} - ₹${exp.amount} (${exp.description})`
        ).join('\n')}

        Please provide analysis in the following JSON structure:
        {
          "overallScore": (number 0-100, financial health score),
          "insights": [
            "Key insight about spending patterns",
            "Another important observation"
          ],
          "recommendations": [
            "Specific actionable recommendation",
            "Another improvement suggestion"
          ],
          "categoryAnalysis": [
            {
              "category": "Category name",
              "status": "healthy|warning|overspent",
              "message": "Specific message about this category",
              "percentage": (percentage of budget used)
            }
          ],
          "savingsOpportunities": [
            {
              "category": "Category name",
              "potentialSavings": (amount in rupees),
              "suggestion": "How to save money in this category"
            }
          ]
        }

        Focus on:
        1. Spending patterns and trends
        2. Budget efficiency
        3. Categories that need attention
        4. Realistic savings opportunities
        5. Behavioral insights from transaction patterns
        6. Emergency fund recommendations
        7. Long-term financial planning advice

        Be specific, actionable, and consider Indian financial context.
      `;

      const response = await spark.llm(prompt, 'gpt-4o', true);
      const gptAnalysis = JSON.parse(response);

      // Generate additional chart data
      const monthlyTrend = generateMonthlyTrend(expenses, budgets);
      const topCategories = generateTopCategories(monthlyExpenses);
      const spendingPattern = generateSpendingPattern(monthlyExpenses);

      const fullAnalysis: BudgetAnalysis = {
        ...gptAnalysis,
        monthlyTrend,
        topCategories,
        spendingPattern
      };

      setAnalysis(fullAnalysis);
      setLastAnalyzed(new Date());
      toast.success('Budget analysis completed!');
    } catch (error) {
      console.error('Error analyzing budget:', error);
      toast.error('Failed to analyze budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = (expenses: Expense[], budgets: Budget[]) => {
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    return months.map(month => {
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        const monthName = expDate.toLocaleDateString('en-US', { month: 'short' });
        return monthName === month;
      });
      const spent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const budget = budgets.reduce((sum, b) => sum + b.limit, 0);
      return {
        month,
        spent,
        budget,
        difference: budget - spent
      };
    });
  };

  const generateTopCategories = (expenses: Expense[]) => {
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
    
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  };

  const generateSpendingPattern = (expenses: Expense[]) => {
    const dayTotals = expenses.reduce((acc, exp) => {
      const day = new Date(exp.date).toLocaleDateString('en-US', { weekday: 'short' });
      acc[day] = (acc[day] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      amount: dayTotals[day] || 0
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-600" size={16} />;
      case 'overspent':
        return <TrendingDown className="text-red-600" size={16} />;
      default:
        return null;
    }
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-primary" size={24} />
            Smart Budget Analyzer
          </h2>
          <p className="text-muted-foreground">
            AI-powered insights into your spending patterns and budget optimization
          </p>
        </div>
        <Button 
          onClick={analyzeSpending} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <BarChart3 size={16} />
          )}
          {loading ? 'Analyzing...' : 'Analyze Budget'}
        </Button>
      </div>

      {lastAnalyzed && (
        <Alert>
          <AlertDescription>
            Last analyzed: {lastAnalyzed.toLocaleDateString()} at {lastAnalyzed.toLocaleTimeString()}
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Financial Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                  {analysis.overallScore}/100
                </div>
                <Progress value={analysis.overallScore} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Savings Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(analysis.savingsOpportunities?.reduce((sum, opp) => sum + opp.potentialSavings, 0) || 0)}
                </div>
                <p className="text-xs text-muted-foreground">Potential monthly savings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Categories Tracked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analysis.categoryAnalysis?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Budget categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Spending Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analysis.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Area type="monotone" dataKey="budget" stackId="1" stroke="#8884d8" fill="#8884d8" opacity={0.3} />
                    <Area type="monotone" dataKey="spent" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysis.topCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="amount"
                    >
                      {analysis.topCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatCurrency(value as number), '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Weekly Spending Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Spending Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysis.spendingPattern}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `₹${value}`} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Spent']} />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Budget vs Actual */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs Actual Spending</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analysis.categoryAnalysis?.map(cat => ({
                      category: cat.category,
                      budget: 100,
                      spent: cat.percentage
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="budget" fill="#e5e7eb" opacity={0.3} />
                    <Bar dataKey="spent" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.insights?.map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle size={20} />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations?.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-accent/10 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <p className="text-sm">{recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.categoryAnalysis?.map((category, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{category.category}</h4>
                      {getStatusIcon(category.status)}
                    </div>
                    <Progress value={category.percentage} className="h-2" />
                    <p className="text-sm text-muted-foreground">{category.message}</p>
                    <Badge variant={category.status === 'healthy' ? 'default' : category.status === 'warning' ? 'secondary' : 'destructive'}>
                      {category.percentage.toFixed(1)}% used
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Savings Opportunities */}
          {analysis.savingsOpportunities && analysis.savingsOpportunities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Savings Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{opportunity.category}</span>
                          <Badge variant="outline" className="text-green-700 border-green-300">
                            Save {formatCurrency(opportunity.potentialSavings)}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700">{opportunity.suggestion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Brain size={64} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Analyze Your Budget</h3>
              <p className="text-muted-foreground mb-6">
                Get AI-powered insights into your spending patterns, budget efficiency, and personalized recommendations.
              </p>
              <Button onClick={analyzeSpending} size="lg">
                Start Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}