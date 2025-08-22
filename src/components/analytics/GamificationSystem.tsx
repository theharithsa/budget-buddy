import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  TrendingDown, 
  Calendar,
  Star,
  Award,
  Zap,
  Shield,
  Crown,
  Medal
} from 'lucide-react';
import { type Expense, type Budget, formatCurrency } from '@/lib/types';

interface GamificationSystemProps {
  expenses: Expense[];
  budgets: Budget[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'saving' | 'tracking' | 'budgeting' | 'consistency';
  progress: number;
  maxProgress: number;
  isCompleted: boolean;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
}

interface FinancialScore {
  overall: number;
  budgetCompliance: number;
  savingsRate: number;
  consistency: number;
  level: number;
  pointsToNextLevel: number;
  totalPoints: number;
}

export function GamificationSystem({ expenses, budgets }: GamificationSystemProps) {
  const gamificationData = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return {
        achievements: [],
        financialScore: {
          overall: 0,
          budgetCompliance: 0,
          savingsRate: 0,
          consistency: 0,
          level: 1,
          pointsToNextLevel: 100,
          totalPoints: 0
        },
        streaks: {
          currentSaving: 0,
          longestSaving: 0,
          budgetCompliance: 0
        }
      };
    }

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate streaks
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastExpenseDate = new Date(sortedExpenses[sortedExpenses.length - 1]?.date || currentDate);
    const daysSinceLastExpense = Math.floor((currentDate.getTime() - lastExpenseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Budget compliance calculation
    const monthlyExpensesByCategory = expenses.reduce((acc, expense) => {
      const expenseDate = new Date(expense.date);
      if (expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear) {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    const budgetCompliance = budgets.length > 0 
      ? budgets.reduce((acc, budget) => {
          const spent = monthlyExpensesByCategory[budget.category] || 0;
          const compliance = Math.min(100, (1 - Math.max(0, spent - budget.limit) / budget.limit) * 100);
          return acc + compliance;
        }, 0) / budgets.length
      : 100;

    // Consistency score (how regular spending is)
    const dailySpending = expenses.reduce((acc, expense) => {
      const date = expense.date;
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const spendingAmounts = Object.values(dailySpending);
    const avgDaily = spendingAmounts.reduce((sum, amt) => sum + amt, 0) / spendingAmounts.length || 0;
    const variance = spendingAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgDaily, 2), 0) / spendingAmounts.length || 0;
    const standardDeviation = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 100 - (standardDeviation / (avgDaily || 1)) * 100);

    // Define achievements
    const allAchievements: Achievement[] = [
      // Tracking Achievements
      {
        id: 'first_expense',
        title: 'Getting Started',
        description: 'Record your first expense',
        icon: Star,
        category: 'tracking',
        progress: expenses.length > 0 ? 1 : 0,
        maxProgress: 1,
        isCompleted: expenses.length > 0,
        points: 10,
        rarity: 'common',
        unlockedAt: expenses.length > 0 ? expenses[0].date : undefined
      },
      {
        id: 'expense_tracker',
        title: 'Expense Tracker',
        description: 'Record 50 expenses',
        icon: Target,
        category: 'tracking',
        progress: Math.min(50, expenses.length),
        maxProgress: 50,
        isCompleted: expenses.length >= 50,
        points: 100,
        rarity: 'rare',
        unlockedAt: expenses.length >= 50 ? expenses[49]?.date : undefined
      },
      {
        id: 'power_user',
        title: 'Power User',
        description: 'Record 200 expenses',
        icon: Trophy,
        category: 'tracking',
        progress: Math.min(200, expenses.length),
        maxProgress: 200,
        isCompleted: expenses.length >= 200,
        points: 500,
        rarity: 'epic',
        unlockedAt: expenses.length >= 200 ? expenses[199]?.date : undefined
      },

      // Saving Achievements
      {
        id: 'penny_pincher',
        title: 'Penny Pincher',
        description: 'Go 3 days without spending',
        icon: Shield,
        category: 'saving',
        progress: Math.min(3, daysSinceLastExpense),
        maxProgress: 3,
        isCompleted: daysSinceLastExpense >= 3,
        points: 50,
        rarity: 'common',
        unlockedAt: daysSinceLastExpense >= 3 ? currentDate.toISOString().split('T')[0] : undefined
      },
      {
        id: 'saver_supreme',
        title: 'Saver Supreme',
        description: 'Go 7 days without spending',
        icon: Crown,
        category: 'saving',
        progress: Math.min(7, daysSinceLastExpense),
        maxProgress: 7,
        isCompleted: daysSinceLastExpense >= 7,
        points: 200,
        rarity: 'epic',
        unlockedAt: daysSinceLastExpense >= 7 ? currentDate.toISOString().split('T')[0] : undefined
      },

      // Budget Achievements
      {
        id: 'budget_master',
        title: 'Budget Master',
        description: 'Stay within budget for a month',
        icon: Award,
        category: 'budgeting',
        progress: budgetCompliance,
        maxProgress: 100,
        isCompleted: budgetCompliance >= 95,
        points: 300,
        rarity: 'epic',
        unlockedAt: budgetCompliance >= 95 ? currentDate.toISOString().split('T')[0] : undefined
      },
      {
        id: 'frugal_genius',
        title: 'Frugal Genius',
        description: 'Spend less than 80% of your budget',
        icon: Medal,
        category: 'budgeting',
        progress: Math.max(0, 100 - (budgetCompliance > 0 ? (100 - budgetCompliance) * 5 : 0)),
        maxProgress: 100,
        isCompleted: budgetCompliance >= 80,
        points: 400,
        rarity: 'legendary',
        unlockedAt: budgetCompliance >= 80 ? currentDate.toISOString().split('T')[0] : undefined
      },

      // Consistency Achievements
      {
        id: 'consistent_tracker',
        title: 'Consistent Tracker',
        description: 'Maintain consistent spending patterns',
        icon: Zap,
        category: 'consistency',
        progress: consistencyScore,
        maxProgress: 100,
        isCompleted: consistencyScore >= 80,
        points: 250,
        rarity: 'rare',
        unlockedAt: consistencyScore >= 80 ? currentDate.toISOString().split('T')[0] : undefined
      }
    ];

    // Calculate total points and level
    const completedAchievements = allAchievements.filter(a => a.isCompleted);
    const totalPoints = completedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
    const level = Math.floor(totalPoints / 100) + 1;
    const pointsToNextLevel = (level * 100) - totalPoints;

    // Overall financial score
    const overallScore = Math.round((budgetCompliance + consistencyScore + (daysSinceLastExpense * 2)) / 3);

    const financialScore: FinancialScore = {
      overall: Math.min(100, overallScore),
      budgetCompliance: Math.round(budgetCompliance),
      savingsRate: daysSinceLastExpense > 0 ? Math.min(100, daysSinceLastExpense * 10) : 0,
      consistency: Math.round(consistencyScore),
      level,
      pointsToNextLevel,
      totalPoints
    };

    return {
      achievements: allAchievements,
      financialScore,
      streaks: {
        currentSaving: daysSinceLastExpense,
        longestSaving: daysSinceLastExpense, // Simplified for now
        budgetCompliance: budgetCompliance >= 95 ? 1 : 0
      }
    };
  }, [expenses, budgets]);

  const { achievements, financialScore, streaks } = gamificationData;

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Financial Score Overview */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Financial Score</CardTitle>
                <p className="text-sm text-muted-foreground">Level {financialScore.level} • {financialScore.totalPoints} points</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(financialScore.overall)}`}>
                {financialScore.overall}
              </div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(financialScore.budgetCompliance)}`}>
                {financialScore.budgetCompliance}%
              </div>
              <p className="text-sm text-muted-foreground">Budget Compliance</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(financialScore.savingsRate)}`}>
                {financialScore.savingsRate}%
              </div>
              <p className="text-sm text-muted-foreground">Savings Rate</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(financialScore.consistency)}`}>
                {financialScore.consistency}%
              </div>
              <p className="text-sm text-muted-foreground">Consistency</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {financialScore.level + 1}</span>
              <span>{financialScore.pointsToNextLevel} points needed</span>
            </div>
            <Progress 
              value={((financialScore.level * 100 - financialScore.pointsToNextLevel) / (financialScore.level * 100)) * 100} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <Card 
            key={achievement.id} 
            className={`enhanced-card hover-lift transition-all duration-200 ${
              achievement.isCompleted ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)} ${
                  achievement.isCompleted ? 'animate-pulse' : 'opacity-50'
                }`}>
                  <achievement.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{achievement.title}</h3>
                    <Badge 
                      variant={achievement.isCompleted ? 'default' : 'secondary'}
                      className={`text-xs ${getRarityColor(achievement.rarity)}`}
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {achievement.description}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{achievement.progress} / {achievement.maxProgress}</span>
                    </div>
                    <Progress 
                      value={(achievement.progress / achievement.maxProgress) * 100} 
                      className="h-1.5" 
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span className="text-muted-foreground">{achievement.points} points</span>
                    {achievement.isCompleted && (
                      <Badge variant="default" className="bg-green-600">
                        Completed!
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Streaks Section */}
      <Card className="enhanced-card hover-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Active Streaks</CardTitle>
              <p className="text-sm text-muted-foreground">Keep up the momentum!</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{streaks.currentSaving}</div>
              <p className="text-sm text-muted-foreground">Days without spending</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{streaks.budgetCompliance}</div>
              <p className="text-sm text-muted-foreground">Months on budget</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{achievements.filter(a => a.isCompleted).length}</div>
              <p className="text-sm text-muted-foreground">Achievements unlocked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
