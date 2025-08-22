import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle as Warning, 
  CheckCircle, 
  Circle, 
  BarChart3 as Chart, 
  Lightbulb,
  RefreshCw,
  DollarSign,
  Target,
  Activity
} from 'lucide-react';
import { type Expense, type Budget, formatCurrency, getCurrentMonth, getMonthlyExpenses, calculateCategorySpending } from '@/lib/types';
import ApexCharts from 'apexcharts';
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
  const [analysisMode, setAnalysisMode] = useState<'auto' | 'demo' | 'statistical'>('auto');

  // Flowbite Chart references
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const areaChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);

  // Calculate analysis data
  const analysisData = {
    totalSpent: expenses.reduce((sum, expense) => sum + expense.amount, 0),
    totalBudget: budgets.reduce((sum, budget) => sum + budget.limit, 0),
    categoryBreakdown: (() => {
      const categoryMap = new Map();
      expenses.forEach(expense => {
        const category = expense.category;
        categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
      });
      return Array.from(categoryMap.entries())
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6);
    })(),
    budgetUtilization: budgets.map(budget => {
      const spent = expenses.filter(e => e.category === budget.category)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category: budget.category,
        spent,
        budget: budget.limit,
        percentage: budget.limit > 0 ? (spent / budget.limit) * 100 : 0
      };
    })
  };

  // Flowbite Pie Chart - Category Spending
  useEffect(() => {
    if (pieChartRef.current && analysisData.categoryBreakdown.length > 0) {
      const chart = new ApexCharts(pieChartRef.current, {
        chart: {
          height: 420,
          type: 'pie',
          fontFamily: 'Inter, sans-serif',
        },
        dataLabels: { enabled: false },
        plotOptions: {
          pie: {
            labels: { show: true },
            size: "100%",
            dataLabels: { offset: -25 }
          },
        },
        labels: analysisData.categoryBreakdown.map(item => item.category),
        series: analysisData.categoryBreakdown.map(item => item.amount),
        colors: ['#1C64F2', '#16BDCA', '#9061F9', '#FDBA8C', '#E74694', '#F59E0B'],
        legend: { show: false },
        tooltip: {
          enabled: true,
          x: { show: false },
        }
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [analysisData.categoryBreakdown]);

  // Flowbite Bar Chart - Budget Comparison
  useEffect(() => {
    if (barChartRef.current && budgets.length > 0) {
      const chart = new ApexCharts(barChartRef.current, {
        chart: {
          height: 400,
          type: 'bar',
          fontFamily: 'Inter, sans-serif',
          toolbar: { show: false },
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
          style: { fontFamily: 'Inter, sans-serif' },
        },
        states: {
          hover: {
            filter: { type: 'darken', value: 1 },
          },
        },
        stroke: { show: true, width: 0, colors: ['transparent'] },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: -14 },
        },
        dataLabels: { enabled: false },
        legend: { show: false },
        xaxis: {
          categories: analysisData.budgetUtilization.map(item => item.category),
          floating: false,
          labels: {
            show: true,
            style: {
              fontFamily: 'Inter, sans-serif',
              cssClass: 'text-xs font-normal fill-gray-500 dark:fill-gray-400'
            }
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: { show: false },
        fill: { opacity: 1 },
        series: [
          {
            name: 'Budget',
            color: '#16BDCA',
            data: analysisData.budgetUtilization.map(item => item.budget),
          },
          {
            name: 'Spent',
            color: '#1A56DB',
            data: analysisData.budgetUtilization.map(item => item.spent),
          }
        ],
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [analysisData.budgetUtilization]);

  // Flowbite Area Chart - Monthly Trends
  useEffect(() => {
    if (areaChartRef.current && expenses.length > 0) {
      // Generate monthly data
      const monthlyData: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === date.getMonth() && 
                 expenseDate.getFullYear() === date.getFullYear();
        });
        const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        monthlyData.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          amount: monthTotal
        });
      }

      const chart = new ApexCharts(areaChartRef.current, {
        chart: {
          height: 350,
          type: 'area',
          fontFamily: 'Inter, sans-serif',
          dropShadow: { enabled: false },
          toolbar: { show: false },
        },
        tooltip: { enabled: true, x: { show: false } },
        legend: { show: false },
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.55,
            opacityTo: 0,
            shade: '#1C64F2',
            gradientToColors: ['#1C64F2'],
          },
        },
        dataLabels: { enabled: false },
        stroke: { width: 6 },
        grid: {
          show: false,
          strokeDashArray: 4,
          padding: { left: 2, right: 2, top: 0 },
        },
        series: [{
          name: 'Monthly Spending',
          data: monthlyData.map(item => item.amount),
          color: '#1A56DB',
        }],
        xaxis: {
          categories: monthlyData.map(item => item.month),
          labels: { show: true },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
        yaxis: {
          show: true,
          labels: {
            formatter: function (value) {
              return formatCurrency(value);
            }
          }
        },
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [expenses]);

  // Flowbite Donut Chart - Budget Performance
  useEffect(() => {
    if (donutChartRef.current && analysisData.budgetUtilization.length > 0) {
      const chart = new ApexCharts(donutChartRef.current, {
        chart: {
          height: 420,
          type: 'donut',
          fontFamily: 'Inter, sans-serif',
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
                  label: 'Budget Usage',
                  fontFamily: 'Inter, sans-serif',
                  formatter: function (w) {
                    const totalSpent = analysisData.totalSpent;
                    const totalBudget = analysisData.totalBudget;
                    const percentage = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0.0';
                    return `${percentage}%`;
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
        grid: { padding: { top: -2 } },
        labels: analysisData.budgetUtilization.map(item => item.category),
        series: analysisData.budgetUtilization.map(item => item.percentage),
        colors: ['#16BDCA', '#FDBA8C', '#E74694', '#1C64F2', '#9061F9'],
        legend: { show: false },
        tooltip: {
          enabled: true,
          x: { show: false },
        },
        dataLabels: { enabled: false }
      });
      chart.render();
      return () => chart.destroy();
    }
  }, [analysisData.budgetUtilization, analysisData.totalSpent, analysisData.totalBudget]);

  const generateStatisticalAnalysis = (): BudgetAnalysis => {
    const totalSpent = analysisData.totalSpent;
    const totalBudget = analysisData.totalBudget;
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    const overBudgetCategories = analysisData.budgetUtilization.filter(cat => cat.percentage > 100);
    const underBudgetCategories = analysisData.budgetUtilization.filter(cat => cat.percentage < 80);
    
    let overallScore = 100;
    if (budgetUtilization > 100) overallScore = Math.max(40, 100 - (budgetUtilization - 100));
    else if (budgetUtilization > 90) overallScore = 75;
    else if (budgetUtilization > 80) overallScore = 85;
    else overallScore = 95;

    return {
      overallScore,
      insights: [
        `You've spent ${formatCurrency(totalSpent)} out of your ${formatCurrency(totalBudget)} total budget (${budgetUtilization.toFixed(1)}%)`,
        `${overBudgetCategories.length} categories are over budget`,
        `${underBudgetCategories.length} categories have room for optimization`,
        `Your highest spending category is ${analysisData.categoryBreakdown[0]?.category || 'N/A'} at ${formatCurrency(analysisData.categoryBreakdown[0]?.amount || 0)}`
      ],
      recommendations: [
        overBudgetCategories.length > 0 ? `Focus on reducing spending in ${overBudgetCategories[0].category}` : 'Continue maintaining your spending discipline',
        budgetUtilization > 90 ? 'Consider increasing budgets for essential categories' : 'Good budget management - consider saving the excess',
        'Review your spending patterns weekly to stay on track',
        'Set up alerts for when you reach 80% of any budget category'
      ],
      categoryAnalysis: analysisData.budgetUtilization.map(cat => ({
        category: cat.category,
        status: cat.percentage > 100 ? 'overspent' : cat.percentage > 80 ? 'warning' : 'healthy',
        message: cat.percentage > 100 ? 
          `Over budget by ${formatCurrency(cat.spent - cat.budget)}` :
          cat.percentage > 80 ?
          `Approaching budget limit (${cat.percentage.toFixed(1)}% used)` :
          `Well within budget (${cat.percentage.toFixed(1)}% used)`,
        percentage: cat.percentage
      })),
      monthlyTrend: [],
      topCategories: analysisData.categoryBreakdown.slice(0, 5).map((cat, index) => ({
        category: cat.category,
        amount: cat.amount,
        percentage: (cat.amount / totalSpent) * 100
      })),
      savingsOpportunities: overBudgetCategories.slice(0, 3).map(cat => ({
        category: cat.category,
        potentialSavings: cat.spent - cat.budget,
        suggestion: `Reduce spending in ${cat.category} to get back within budget`
      })),
      spendingPattern: []
    };
  };

  const analyzeSpending = async () => {
    if (expenses.length === 0) {
      toast.error('No expenses to analyze');
      return;
    }

    setLoading(true);
    try {
      // For now, use statistical analysis (can be enhanced with AI later)
      const analysis = generateStatisticalAnalysis();
      setAnalysis(analysis);
      setLastAnalyzed(new Date());
      toast.success('Budget analysis completed successfully');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Analysis</h1>
          <p className="text-muted-foreground">
            AI-powered insights into your spending patterns
          </p>
        </div>
        <Button 
          onClick={analyzeSpending} 
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Analyze Budget
            </>
          )}
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center me-3">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h5 className="leading-none text-2xl font-bold text-foreground pb-1">
                    {analysis.overallScore}/100
                  </h5>
                  <p className="text-sm font-normal text-muted-foreground">Budget Score</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center me-3">
                  <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h5 className="leading-none text-2xl font-bold text-foreground pb-1">
                    {formatCurrency(analysisData.totalSpent)}
                  </h5>
                  <p className="text-sm font-normal text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow border border-border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center me-3">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h5 className="leading-none text-2xl font-bold text-foreground pb-1">
                    {((analysisData.totalSpent / analysisData.totalBudget) * 100).toFixed(1)}%
                  </h5>
                  <p className="text-sm font-normal text-muted-foreground">Budget Used</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid - Pure Flowbite Design */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Category Spending Pie Chart */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between items-start w-full mb-4">
                <div className="flex-col items-center">
                  <div className="flex items-center mb-1">
                    <h5 className="text-xl font-bold leading-none text-foreground me-1">Category Breakdown</h5>
                  </div>
                  <p className="text-sm font-normal text-muted-foreground">Spending by category</p>
                </div>
              </div>
              <div ref={pieChartRef} className="h-96"></div>
            </div>

            {/* Budget vs Actual Bar Chart */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center me-3">
                    <Chart className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h5 className="leading-none text-xl font-bold text-foreground pb-1">Budget Comparison</h5>
                    <p className="text-sm font-normal text-muted-foreground">Budget vs Actual spending</p>
                  </div>
                </div>
              </div>
              <div ref={barChartRef} className="h-96"></div>
            </div>

            {/* Monthly Trends Area Chart */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between pb-4 mb-4 border-b border-border">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center me-3">
                    <TrendingUp className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h5 className="leading-none text-xl font-bold text-foreground pb-1">Monthly Trends</h5>
                    <p className="text-sm font-normal text-muted-foreground">Spending over time</p>
                  </div>
                </div>
              </div>
              <div ref={areaChartRef} className="h-80"></div>
            </div>

            {/* Budget Performance Donut Chart */}
            <div className="bg-card rounded-lg shadow border border-border p-4 md:p-6">
              <div className="flex justify-between mb-3">
                <div className="flex justify-center items-center">
                  <h5 className="text-xl font-bold leading-none text-foreground pe-1">Budget Performance</h5>
                </div>
              </div>
              <div ref={donutChartRef} className="h-96"></div>
            </div>
          </div>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Key Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Circle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-100">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-900 dark:text-green-100">{rec}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Category Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.categoryAnalysis.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={cat.status === 'healthy' ? 'default' : cat.status === 'warning' ? 'secondary' : 'destructive'}
                      >
                        {cat.status === 'healthy' ? 'Healthy' : cat.status === 'warning' ? 'Warning' : 'Over Budget'}
                      </Badge>
                      <div>
                        <p className="font-medium">{cat.category}</p>
                        <p className="text-sm text-muted-foreground">{cat.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{cat.percentage.toFixed(1)}%</p>
                      <Progress value={Math.min(cat.percentage, 100)} className="w-20 h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analysis Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Click "Analyze Budget" to get AI-powered insights into your spending patterns and budget performance.
            </p>
            <Button onClick={analyzeSpending} disabled={loading}>
              <Brain className="mr-2 h-4 w-4" />
              Start Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
