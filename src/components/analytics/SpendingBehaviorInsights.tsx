import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Calendar, 
  Award,
  Target,
  Clock,
  Brain
} from 'lucide-react';
import { type Expense, formatCurrency } from '@/lib/types';

interface SpendingBehaviorInsightsProps {
  expenses: Expense[];
}

interface SpendingPattern {
  category: string;
  amount: number;
  frequency: number;
  lastPurchase: string;
  avgAmount: number;
  trend: 'up' | 'down' | 'stable';
}

interface SpendingStreak {
  type: 'saving' | 'spending';
  days: number;
  category?: string;
  isActive: boolean;
}

interface ImpulsePattern {
  category: string;
  impulseCount: number;
  totalAmount: number;
  avgTimeToDecision: number; // hours
  confidence: number; // 0-100
}

export function SpendingBehaviorInsights({ expenses }: SpendingBehaviorInsightsProps) {
  const behaviorAnalysis = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        spendingPatterns: [],
        streaks: [],
        impulsePatterns: [],
        needsVsWants: { needs: 0, wants: 0, total: 0 },
        timePatterns: {},
        seasonality: {},
        consistency: 0
      };
    }

    // Group expenses by category for pattern analysis
    const categoryGroups = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = [];
      }
      acc[expense.category].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    // Analyze spending patterns
    const spendingPatterns: SpendingPattern[] = Object.entries(categoryGroups).map(([category, categoryExpenses]) => {
      const amounts = categoryExpenses.map(e => e.amount);
      const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const totalAmount = amounts.reduce((sum, amt) => sum + amt, 0);
      
      // Simple trend analysis based on recent vs older expenses
      const sortedByDate = categoryExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentHalf = sortedByDate.slice(0, Math.ceil(sortedByDate.length / 2));
      const olderHalf = sortedByDate.slice(Math.ceil(sortedByDate.length / 2));
      
      const recentAvg = recentHalf.reduce((sum, e) => sum + e.amount, 0) / recentHalf.length || 0;
      const olderAvg = olderHalf.reduce((sum, e) => sum + e.amount, 0) / olderHalf.length || 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (recentAvg > olderAvg * 1.1) trend = 'up';
      else if (recentAvg < olderAvg * 0.9) trend = 'down';

      return {
        category,
        amount: totalAmount,
        frequency: categoryExpenses.length,
        lastPurchase: sortedByDate[0]?.date || '',
        avgAmount,
        trend
      };
    }).sort((a, b) => b.amount - a.amount);

    // Analyze spending streaks
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const streaks: SpendingStreak[] = [];
    
    // Calculate saving streak (days without expenses)
    const today = new Date();
    const lastExpenseDate = new Date(sortedExpenses[sortedExpenses.length - 1]?.date || today);
    const daysSinceLastExpense = Math.floor((today.getTime() - lastExpenseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastExpense > 0) {
      streaks.push({
        type: 'saving',
        days: daysSinceLastExpense,
        isActive: true
      });
    }

    // Analyze impulse spending patterns
    const impulseCategories = ['Entertainment', 'Shopping', 'Dining', 'Online Shopping'];
    const impulsePatterns: ImpulsePattern[] = impulseCategories.map(category => {
      const categoryExpenses = expenses.filter(e => e.category === category);
      
      // Heuristic: Consider purchases made on weekends or late hours as potentially impulsive
      const impulseCount = categoryExpenses.filter(expense => {
        const date = new Date(expense.date);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        // Simple heuristic for impulse detection
        return isWeekend || expense.amount > (spendingPatterns.find(p => p.category === category)?.avgAmount || 0) * 1.5;
      }).length;

      return {
        category,
        impulseCount,
        totalAmount: categoryExpenses.reduce((sum, e) => sum + e.amount, 0),
        avgTimeToDecision: 2, // Placeholder
        confidence: Math.min(100, (impulseCount / Math.max(categoryExpenses.length, 1)) * 100)
      };
    }).filter(p => p.impulseCount > 0);

    // Needs vs Wants analysis
    const needsCategories = ['Groceries', 'Transportation', 'Healthcare', 'Utilities', 'Rent'];
    const needs = expenses.filter(e => needsCategories.includes(e.category)).reduce((sum, e) => sum + e.amount, 0);
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const wants = total - needs;

    // Time pattern analysis
    const timePatterns = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const hour = date.getHours();
      
      if (!acc[dayOfWeek]) acc[dayOfWeek] = 0;
      acc[dayOfWeek] += expense.amount;
      
      return acc;
    }, {} as Record<string, number>);

    // Spending consistency (0-100 score)
    const dailySpending = expenses.reduce((acc, expense) => {
      const date = expense.date;
      if (!acc[date]) acc[date] = 0;
      acc[date] += expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const spendingAmounts = Object.values(dailySpending);
    const avgDaily = spendingAmounts.reduce((sum, amt) => sum + amt, 0) / spendingAmounts.length || 0;
    const variance = spendingAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgDaily, 2), 0) / spendingAmounts.length || 0;
    const standardDeviation = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - (standardDeviation / avgDaily) * 100) || 0;

    return {
      spendingPatterns: spendingPatterns.slice(0, 5), // Top 5 categories
      streaks,
      impulsePatterns: impulsePatterns.slice(0, 3), // Top 3 impulse categories
      needsVsWants: { needs, wants, total },
      timePatterns,
      seasonality: {},
      consistency: Math.round(consistencyScore)
    };
  }, [expenses]);

  const {
    spendingPatterns,
    streaks,
    impulsePatterns,
    needsVsWants,
    timePatterns,
    consistency
  } = behaviorAnalysis;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Spending Streaks */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <Award className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Spending Streaks</CardTitle>
              <p className="text-sm text-muted-foreground">Your financial discipline</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {streaks.length > 0 ? (
            streaks.map((streak, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {streak.type === 'saving' ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">
                      {streak.type === 'saving' ? 'Saving' : 'Spending'} Streak
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {streak.category || 'Overall'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{streak.days} days</p>
                  <Badge variant={streak.isActive ? 'default' : 'secondary'}>
                    {streak.isActive ? 'Active' : 'Ended'}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No streaks detected yet</p>
              <p className="text-sm">Start tracking to build streaks!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Needs vs Wants */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Needs vs Wants</CardTitle>
              <p className="text-sm text-muted-foreground">Spending psychology</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {needsVsWants.total > 0 ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">Needs</span>
                  <span className="text-sm font-bold">{formatCurrency(needsVsWants.needs)}</span>
                </div>
                <Progress 
                  value={(needsVsWants.needs / needsVsWants.total) * 100} 
                  className="h-2" 
                />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-orange-600">Wants</span>
                  <span className="text-sm font-bold">{formatCurrency(needsVsWants.wants)}</span>
                </div>
                <Progress 
                  value={(needsVsWants.wants / needsVsWants.total) * 100} 
                  className="h-2" 
                />
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Needs Ratio</span>
                  <span className="text-lg font-bold">
                    {Math.round((needsVsWants.needs / needsVsWants.total) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(needsVsWants.needs / needsVsWants.total) > 0.7 
                    ? "Great discipline! You're prioritizing essentials." 
                    : "Consider balancing needs vs wants for better financial health."}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No spending data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Impulse Spending Analysis */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Impulse Spending</CardTitle>
              <p className="text-sm text-muted-foreground">Spontaneous purchases</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {impulsePatterns.length > 0 ? (
            impulsePatterns.map((pattern, index) => (
              <div key={index} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{pattern.category}</p>
                    <p className="text-sm text-muted-foreground">
                      {pattern.impulseCount} impulse purchases
                    </p>
                  </div>
                  <Badge variant={pattern.confidence > 70 ? 'destructive' : 'secondary'}>
                    {pattern.confidence}% confidence
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">
                    {formatCurrency(pattern.totalAmount)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No impulse patterns detected</p>
              <p className="text-sm">You're showing good spending control!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Spending Consistency */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Spending Consistency</CardTitle>
              <p className="text-sm text-muted-foreground">Predictability score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{consistency}%</div>
            <Progress value={consistency} className="h-3 mb-3" />
            <p className="text-sm text-muted-foreground">
              {consistency >= 80 
                ? "Excellent! Your spending is very predictable."
                : consistency >= 60 
                ? "Good consistency with some variability."
                : "High variability in your spending patterns."}
            </p>
          </div>
          
          {Object.keys(timePatterns).length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm font-medium mb-2">Weekly Patterns</p>
              <div className="space-y-2">
                {Object.entries(timePatterns)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([day, amount]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span>{day}</span>
                      <span className="font-medium">{formatCurrency(amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
