import { UserFinancialContext } from './types';
import { Expense, Budget } from '../types';

export class FinancialContextAnalyzer {
  /**
   * Analyze user's financial data to create context for wisdom engine
   */
  static analyzeUserFinancialContext(
    expenses: Expense[],
    budgets: Budget[],
    userProfile?: Partial<UserFinancialContext>
  ): UserFinancialContext {
    
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Filter current month expenses
    const currentMonthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && 
             expenseDate.getFullYear() === currentYear;
    });

    // Calculate spending patterns
    const spendingPatterns = this.calculateSpendingPatterns(currentMonthExpenses, expenses);
    
    // Determine current situation
    const currentSituation = this.determineCurrentSituation(
      currentMonthExpenses, 
      budgets, 
      spendingPatterns
    );

    // Analyze financial goals from budgets and spending
    const financialGoals = this.inferFinancialGoals(budgets, spendingPatterns);

    // Determine risk profile from spending behavior
    const riskProfile = this.determineRiskProfile(spendingPatterns, currentMonthExpenses);

    return {
      currentSituation,
      spendingPatterns,
      financialGoals,
      riskProfile: userProfile?.riskProfile || riskProfile,
      lifeStage: userProfile?.lifeStage || this.inferLifeStage(spendingPatterns)
    };
  }

  /**
   * Calculate detailed spending patterns
   */
  private static calculateSpendingPatterns(
    currentMonthExpenses: Expense[],
    allExpenses: Expense[]
  ) {
    const totalCurrentMonth = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // Calculate category breakdown for current month
    const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    // Get top spending categories
    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Calculate historical average for comparison
    const monthlyAverages = this.calculateMonthlyAverages(allExpenses);
    
    return {
      monthlyExpenses: totalCurrentMonth,
      topCategories,
      monthlyAverage: monthlyAverages.average,
      savingsRate: this.calculateSavingsRate(totalCurrentMonth, monthlyAverages.estimatedIncome),
      spendingTrend: this.calculateSpendingTrend(totalCurrentMonth, monthlyAverages.average)
    };
  }

  /**
   * Calculate monthly spending averages
   */
  private static calculateMonthlyAverages(expenses: Expense[]) {
    const monthlyTotals = new Map<string, number>();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + expense.amount);
    });

    const totals = Array.from(monthlyTotals.values());
    const average = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
    
    // Estimate income as 1.25x average expenses (assuming 20% savings rate)
    const estimatedIncome = average * 1.25;

    return { average, estimatedIncome };
  }

  /**
   * Calculate savings rate if income is estimated
   */
  private static calculateSavingsRate(monthlyExpenses: number, estimatedIncome: number): number {
    if (estimatedIncome <= 0) return 0;
    return Math.max(0, (estimatedIncome - monthlyExpenses) / estimatedIncome);
  }

  /**
   * Calculate spending trend (increasing/decreasing)
   */
  private static calculateSpendingTrend(currentExpenses: number, averageExpenses: number): 'increasing' | 'stable' | 'decreasing' {
    const threshold = 0.1; // 10% threshold
    const ratio = currentExpenses / averageExpenses;
    
    if (ratio > 1 + threshold) return 'increasing';
    if (ratio < 1 - threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * Determine current financial situation
   */
  private static determineCurrentSituation(
    currentMonthExpenses: Expense[],
    budgets: Budget[],
    spendingPatterns: any
  ): UserFinancialContext['currentSituation'] {
    
    // Check if user is overspending against budgets
    const isOverBudget = this.checkBudgetCompliance(currentMonthExpenses, budgets);
    if (isOverBudget) return 'overspending';

    // Check if user has low savings rate
    if (spendingPatterns.savingsRate < 0.1) return 'saving';

    // Check spending trend
    if (spendingPatterns.spendingTrend === 'increasing') return 'overspending';

    // Check if user has budgets set up
    if (budgets.length === 0) return 'budgeting';

    // Check for investment-related categories
    const hasInvestmentSpending = currentMonthExpenses.some(
      exp => ['Investment', 'SIP', 'Mutual Fund', 'Stocks'].includes(exp.category)
    );
    if (hasInvestmentSpending) return 'investing';

    // Default to financial planning
    return 'financial_planning';
  }

  /**
   * Check budget compliance
   */
  private static checkBudgetCompliance(expenses: Expense[], budgets: Budget[]): boolean {
    for (const budget of budgets) {
      const categoryExpenses = expenses
        .filter(exp => exp.category === budget.category)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      if (categoryExpenses > budget.limit) {
        return true; // Over budget
      }
    }
    return false;
  }

  /**
   * Infer financial goals from budgets and spending
   */
  private static inferFinancialGoals(budgets: Budget[], spendingPatterns: any): string[] {
    const goals: string[] = [];

    // Goals based on budgets
    if (budgets.some(b => ['Travel', 'Vacation'].includes(b.category))) {
      goals.push('Travel and experiences');
    }
    if (budgets.some(b => ['Education', 'Learning'].includes(b.category))) {
      goals.push('Education and skill development');
    }
    if (budgets.some(b => ['Investment', 'Savings'].includes(b.category))) {
      goals.push('Wealth building');
    }

    // Goals based on savings rate
    if (spendingPatterns.savingsRate > 0.2) {
      goals.push('Financial independence');
    } else if (spendingPatterns.savingsRate > 0.1) {
      goals.push('Emergency fund building');
    }

    // Default goals if none identified
    if (goals.length === 0) {
      goals.push('Financial stability', 'Better money management');
    }

    return goals;
  }

  /**
   * Determine risk profile from spending behavior
   */
  private static determineRiskProfile(spendingPatterns: any, expenses: Expense[]): UserFinancialContext['riskProfile'] {
    // Check for volatile spending (high variance)
    const amounts = expenses.map(exp => exp.amount);
    const variance = this.calculateVariance(amounts);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // High savings rate suggests conservative approach
    if (spendingPatterns.savingsRate > 0.25) return 'conservative';
    
    // High spending variance suggests more aggressive/risk-taking behavior
    if (coefficientOfVariation > 1.5) return 'aggressive';
    
    // Default to moderate
    return 'moderate';
  }

  /**
   * Infer life stage from spending patterns
   */
  private static inferLifeStage(spendingPatterns: any): UserFinancialContext['lifeStage'] {
    const categories = spendingPatterns.topCategories;
    
    // Student indicators
    if (categories.includes('Education') || categories.includes('Books')) {
      return 'student';
    }
    
    // Family indicators
    if (categories.includes('Childcare') || categories.includes('Family') || categories.includes('Kids')) {
      return 'family';
    }
    
    // Professional indicators (default for most working adults)
    return 'professional';
  }

  /**
   * Calculate variance of an array of numbers
   */
  private static calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Create a simple context for quick analysis
   */
  static createSimpleContext(
    currentSituation: UserFinancialContext['currentSituation'] = 'budgeting',
    monthlyIncome?: number
  ): UserFinancialContext {
    return {
      currentSituation,
      spendingPatterns: {
        monthlyIncome,
        topCategories: ['Food & Dining', 'Transportation', 'Shopping'],
        savingsRate: 0.15
      },
      financialGoals: ['Financial stability', 'Emergency fund'],
      riskProfile: 'moderate',
      lifeStage: 'professional'
    };
  }
}
