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
import { ApiKeyManager } from '@/components/ApiKeyManager';
import { useKV } from '@github/spark/hooks';
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
  const [openAiKey] = useKV('openai-api-key', '');
  const [hasCustomKey, setHasCustomKey] = useState(false);

  useEffect(() => {
    setHasCustomKey(Boolean(openAiKey));
  }, [openAiKey]);

  const callOpenAIDirectly = async (prompt: string): Promise<string> => {
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial advisor specialized in Indian market conditions. Provide detailed, actionable financial insights. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Request failed'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  };

  const analyzeSpending = async (useDemo = false) => {
    setLoading(true);
    try {
      // Determine which AI service to use
      const hasSparkLLM = typeof window !== 'undefined' && window.spark && window.spark.llm && window.spark.llmPrompt;
      const hasOpenAIKey = Boolean(openAiKey);
      
      console.log('AI Analysis Options:', {
        hasSparkLLM,
        hasOpenAIKey,
        useDemo
      });

      let expensesData = expenses;
      let budgetsData = budgets;

      // If using demo mode or no data exists, create sample data
      if (useDemo || expenses.length === 0 || budgets.length === 0) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Generate sample expenses for better analysis
        expensesData = [
          { id: '1', amount: 8500, category: 'Food & Dining', description: 'Grocery shopping', date: new Date(currentYear, currentMonth, 5).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '2', amount: 15000, category: 'Transportation', description: 'Fuel expenses', date: new Date(currentYear, currentMonth, 8).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '3', amount: 3200, category: 'Entertainment', description: 'Movie tickets', date: new Date(currentYear, currentMonth, 10).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '4', amount: 25000, category: 'Housing', description: 'Monthly rent', date: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '5', amount: 4500, category: 'Shopping', description: 'Clothing', date: new Date(currentYear, currentMonth, 12).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '6', amount: 2800, category: 'Healthcare', description: 'Medical checkup', date: new Date(currentYear, currentMonth, 15).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '7', amount: 1200, category: 'Utilities', description: 'Electricity bill', date: new Date(currentYear, currentMonth, 3).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '8', amount: 6000, category: 'Food & Dining', description: 'Restaurants', date: new Date(currentYear, currentMonth, 18).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '9', amount: 3500, category: 'Transportation', description: 'Metro/Bus passes', date: new Date(currentYear, currentMonth, 20).toISOString().split('T')[0], createdAt: new Date().toISOString() },
          { id: '10', amount: 2000, category: 'Entertainment', description: 'Netflix subscription', date: new Date(currentYear, currentMonth, 22).toISOString().split('T')[0], createdAt: new Date().toISOString() },
        ];

        budgetsData = [
          { id: '1', category: 'Food & Dining', limit: 15000, spent: 14500, createdAt: new Date() },
          { id: '2', category: 'Transportation', limit: 20000, spent: 18500, createdAt: new Date() },
          { id: '3', category: 'Entertainment', limit: 8000, spent: 5200, createdAt: new Date() },
          { id: '4', category: 'Housing', limit: 30000, spent: 25000, createdAt: new Date() },
          { id: '5', category: 'Shopping', limit: 10000, spent: 4500, createdAt: new Date() },
          { id: '6', category: 'Healthcare', limit: 5000, spent: 2800, createdAt: new Date() },
          { id: '7', category: 'Utilities', limit: 3000, spent: 1200, createdAt: new Date() },
        ];

        if (useDemo) {
          toast.info('Running demo analysis with sample data');
        }
      }

      // Prepare data for GPT analysis
      const currentMonth = getCurrentMonth();
      const monthlyExpenses = getMonthlyExpenses(expensesData, currentMonth);
      const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalBudget = budgetsData.reduce((sum, budget) => sum + budget.limit, 0);
      
      // Category spending analysis
      const categorySpending = budgetsData.map(budget => ({
        category: budget.category,
        budgeted: budget.limit,
        spent: calculateCategorySpending(monthlyExpenses, budget.category),
        percentage: budget.limit > 0 ? (calculateCategorySpending(monthlyExpenses, budget.category) / budget.limit) * 100 : 0
      }));

      // Recent expenses for pattern analysis
      const recentExpenses = expensesData.slice(-50).map(exp => ({
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        description: exp.description
      }));

      // Create comprehensive prompt for AI analysis
      let gptAnalysis;
      
      if (useDemo || (!hasSparkLLM && !hasOpenAIKey)) {
        // Provide demo analysis without LLM call
        console.log('Using demo analysis mode - no AI service available');
        gptAnalysis = {
          overallScore: 75,
          insights: [
            `This month you've spent ₹${totalSpent.toLocaleString()} out of your ₹${totalBudget.toLocaleString()} budget (${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% utilization)`,
            "Your spending shows consistent patterns across categories with room for optimization",
            "Transportation and Food & Dining are your highest expense categories",
            "You have good potential for building emergency savings with current spending patterns"
          ],
          recommendations: [
            `Consider setting aside ₹${Math.floor(totalSpent * 0.1).toLocaleString()} monthly for emergency fund building`,
            "Review subscription services and recurring payments for potential savings",
            "Track daily expenses for the next 30 days to identify micro-spending patterns",
            "Set up automated transfers of 10-15% of income to savings account"
          ],
          categoryAnalysis: categorySpending.map(cat => ({
            category: cat.category,
            status: cat.percentage > 100 ? 'overspent' : cat.percentage > 80 ? 'warning' : 'healthy',
            message: cat.percentage > 100 
              ? `Exceeded budget by ₹${(cat.spent - cat.budgeted).toLocaleString()}. Consider reducing expenses in this category.` 
              : cat.percentage > 80 
              ? `Approaching budget limit. You have ₹${(cat.budgeted - cat.spent).toLocaleString()} remaining.`
              : `Spending is well controlled. You have ₹${(cat.budgeted - cat.spent).toLocaleString()} remaining.`,
            percentage: Math.min(cat.percentage, 100)
          })),
          savingsOpportunities: categorySpending
            .filter(cat => cat.spent > 1000)
            .slice(0, 3)
            .map(cat => ({
              category: cat.category,
              potentialSavings: Math.floor(cat.spent * 0.1),
              suggestion: `Optimize ${cat.category} spending by choosing alternatives and planning purchases`
            }))
        };
      } else {
        // Use available AI service (Spark LLM or OpenAI)
        const prompt = `
        You are a professional financial advisor analyzing Indian spending patterns. Provide comprehensive budget insights for this user:

        CURRENT MONTH DATA:
        - Total Budget: ₹${totalBudget}
        - Total Spent: ₹${totalSpent}
        - Budget Utilization: ${totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
        - Remaining Budget: ₹${Math.max(0, totalBudget - totalSpent)}

        CATEGORY BREAKDOWN:
        ${categorySpending.map(cat => 
          `- ${cat.category}: Budgeted ₹${cat.budgeted}, Spent ₹${cat.spent} (${cat.percentage.toFixed(1)}%)`
        ).join('\n')}

        RECENT TRANSACTIONS (Last 50):
        ${recentExpenses.slice(0, 30).map(exp => 
          `- ${exp.date}: ${exp.category} - ₹${exp.amount} (${exp.description})`
        ).join('\n')}

        ANALYSIS REQUIREMENTS:
        Please provide a detailed analysis in the following JSON structure. Be specific, actionable, and culturally relevant to Indian financial habits:

        {
          "overallScore": (number 0-100, financial health score based on budget adherence, spending patterns, and savings potential),
          "insights": [
            "Specific insight about spending patterns with actual numbers",
            "Trend analysis with actionable observations",
            "Behavioral pattern identification",
            "Emergency fund status assessment"
          ],
          "recommendations": [
            "Specific actionable recommendation with exact amounts",
            "Behavioral change suggestion with implementation steps",
            "Investment or savings opportunity with timeline",
            "Budget optimization strategy"
          ],
          "categoryAnalysis": [
            {
              "category": "Category name",
              "status": "healthy|warning|overspent",
              "message": "Specific actionable message about this category performance",
              "percentage": (exact percentage of budget used)
            }
          ],
          "savingsOpportunities": [
            {
              "category": "Category name",
              "potentialSavings": (realistic monthly savings amount in rupees),
              "suggestion": "Specific actionable strategy to achieve these savings"
            }
          ]
        }

        FOCUS AREAS:
        1. Spending Pattern Analysis: Identify weekly/monthly patterns and suggest optimizations
        2. Budget Efficiency: Rate how well each category budget is managed
        3. Overspending Categories: Prioritize categories that need immediate attention
        4. Smart Savings: Identify realistic savings opportunities without lifestyle impact
        5. Indian Context: Consider typical Indian expenses like family obligations, festivals, etc.
        6. Emergency Fund: Assess and recommend emergency fund building
        7. Investment Readiness: Evaluate if user is ready for investment planning
        8. Seasonal Adjustments: Account for Indian festival seasons and their impact

        SCORING CRITERIA:
        - 90-100: Excellent financial discipline, strong savings, well-planned spending
        - 80-89: Good budget management with minor optimization opportunities
        - 70-79: Average financial health with clear improvement areas
        - 60-69: Budget concerns requiring attention and behavioral changes
        - Below 60: Significant financial restructuring needed

        Provide insights that are specific, measurable, achievable, relevant, and time-bound (SMART).
      `;

        console.log('Sending prompt to AI service');
        
        try {
          let response;
          
          if (hasOpenAIKey) {
            console.log('Using OpenAI API with custom key');
            response = await callOpenAIDirectly(prompt);
            toast.success('AI analysis completed using your OpenAI API key!');
          } else if (hasSparkLLM) {
            console.log('Using Spark LLM');
            const sparkPrompt = spark.llmPrompt`${prompt}`;
            response = await spark.llm(sparkPrompt, 'gpt-4o', true);
            toast.success('AI analysis completed using Spark AI!');
          } else {
            throw new Error('No AI service available');
          }
          
          console.log('AI response received:', response);
          gptAnalysis = JSON.parse(response);
        } catch (llmError) {
          console.error('AI service error:', llmError);
          toast.error(`AI analysis failed: ${llmError.message || 'Unknown error'}`);
          
          // Fallback to demo analysis if AI fails
          gptAnalysis = {
            overallScore: 75,
            insights: [
              `You've spent ₹${totalSpent.toLocaleString()} out of your ₹${totalBudget.toLocaleString()} budget this month`,
              "Your highest spending category needs attention for better budget control",
              "You have good potential for optimizing recurring expenses",
              "Consider setting up automated savings to improve financial health"
            ],
            recommendations: [
              "Track daily expenses for better awareness and control",
              "Review and optimize your highest spending categories",
              "Set up automated transfers to savings account",
              "Create specific budget goals for the next month"
            ],
            categoryAnalysis: categorySpending.map(cat => ({
              category: cat.category,
              status: cat.percentage > 100 ? 'overspent' : cat.percentage > 80 ? 'warning' : 'healthy',
              message: cat.percentage > 100 
                ? `Over budget by ₹${(cat.spent - cat.budgeted).toLocaleString()}` 
                : cat.percentage > 80 
                ? `Approaching budget limit with ₹${(cat.budgeted - cat.spent).toLocaleString()} remaining`
                : `Well within budget with ₹${(cat.budgeted - cat.spent).toLocaleString()} remaining`,
              percentage: cat.percentage
            })),
            savingsOpportunities: categorySpending
              .filter(cat => cat.spent > cat.budgeted * 0.5)
              .slice(0, 3)
              .map(cat => ({
                category: cat.category,
                potentialSavings: Math.floor(cat.spent * 0.1),
                suggestion: `Consider reducing ${cat.category} expenses by 10% to save monthly`
              }))
          };
        }
      }

      // Generate additional chart data
      const monthlyTrend = generateMonthlyTrend(expensesData, budgetsData);
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
      
      if (useDemo) {
        toast.success('Demo analysis completed! This shows insights with sample data.');
      } else if (!hasSparkLLM && !hasOpenAIKey) {
        toast.success('Budget analysis completed using built-in algorithms!');
      }
      // Success messages for AI services are handled above
    } catch (error) {
      console.error('Error analyzing budget:', error);
      toast.error('Analysis failed. Please try again or use the demo mode.');
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
      {/* API Key Configuration */}
      <ApiKeyManager onApiKeyChange={setHasCustomKey} />
      
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
        <div className="flex items-center gap-2">
          {(expenses.length === 0 || budgets.length === 0) && (
            <Button 
              onClick={() => analyzeSpending(true)} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 size={16} />
              Try Demo
            </Button>
          )}
          <Button 
            onClick={() => analyzeSpending(false)} 
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
      </div>

      {/* Info Card */}
      {!analysis && !loading && (
        <div className="space-y-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Brain className="text-primary mt-1" size={20} />
                <div>
                  <h3 className="font-semibold mb-2">How the AI Analyzer Works</h3>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• <strong>Analyzes</strong> your spending patterns and budget efficiency</p>
                    <p>• <strong>Identifies</strong> savings opportunities and overspending areas</p>
                    <p>• <strong>Provides</strong> personalized recommendations for Indian financial habits</p>
                    <p>• <strong>Scores</strong> your financial health from 0-100</p>
                    {(expenses.length === 0 || budgets.length === 0) && (
                      <p className="text-accent font-medium">💡 No data yet? Try the demo to see sample insights!</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Alert>
            <AlertTriangle size={16} />
            <AlertDescription>
              <strong>AI Analysis Options:</strong>
              <br />
              • <strong>Spark AI:</strong> Built-in AI analysis (recommended)
              <br />
              • <strong>OpenAI GPT-4:</strong> Advanced analysis with your API key
              <br />
              • <strong>Demo Mode:</strong> See sample insights with demo data
              <br />
              • <strong>Built-in Algorithms:</strong> Statistical analysis without AI
            </AlertDescription>
          </Alert>
        </div>
      )}

      {lastAnalyzed && (
        <Alert>
          <Brain size={16} />
          <AlertDescription>
            Last analyzed: {lastAnalyzed.toLocaleDateString()} at {lastAnalyzed.toLocaleTimeString()}
            {analysis && (
              <span className="ml-2 text-sm">
                • Financial Health Score: <span className={getScoreColor(analysis.overallScore)}>{analysis.overallScore}/100</span>
              </span>
            )}
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
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(value as number), name === 'budget' ? 'Budget' : 'Spent']} 
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="budget" name="Budget" stackId="1" stroke="#8884d8" fill="#8884d8" opacity={0.3} />
                    <Area type="monotone" dataKey="spent" name="Spent" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
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
                      label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                      labelLine={false}
                    >
                      {analysis.topCategories.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        formatCurrency(value as number), 
                        `${props.payload.category} (${props.payload.percentage.toFixed(1)}%)`
                      ]} 
                    />
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
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value) => [formatCurrency(value as number), 'Average Spent']}
                      labelFormatter={(label) => `${label}s`}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
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
                {(expenses.length === 0 || budgets.length === 0) && (
                  <span className="block mt-2 text-sm">
                    Don't have data yet? Try our demo to see what insights look like!
                  </span>
                )}
              </p>
              <div className="flex items-center gap-4 justify-center">
                {(expenses.length === 0 || budgets.length === 0) && (
                  <Button onClick={() => analyzeSpending(true)} variant="outline" size="lg">
                    Try Demo
                  </Button>
                )}
                <Button onClick={() => analyzeSpending(false)} size="lg">
                  {expenses.length > 0 ? 'Analyze My Data' : 'Start Analysis'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}