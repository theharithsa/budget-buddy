/**
 * Lightweight KautilyaAI Integration for Firebase Functions
 * Simplified wisdom system for enhanced chat responses
 */

import { UserFinancialContext, WisdomCategory } from './types.js';

// Simplified Arthashastra principles for Firebase Functions
const CORE_WISDOM = [
  {
    id: 'kosha_mula_danda',
    principle: 'Treasury is the foundation of governance',
    sanskritTerm: 'कोष मूल दण्ड',
    modernInterpretation: 'Financial stability is the foundation of all life decisions. Build your emergency fund before pursuing other goals.',
    financialApplications: ['Emergency fund building', 'Financial security', 'Risk management'],
    category: 'financial_planning' as WisdomCategory,
    tags: ['emergency fund', 'stability', 'foundation']
  },
  {
    id: 'arthagama_vyaya',
    principle: 'Income should exceed expenditure',
    sanskritTerm: 'अर्थागम व्यय',
    modernInterpretation: 'Live below your means. Consistent surplus between income and expenses creates wealth over time.',
    financialApplications: ['Budgeting', 'Expense management', 'Wealth building'],
    category: 'expense_management' as WisdomCategory,
    tags: ['income', 'expenses', 'surplus', 'budgeting']
  },
  {
    id: 'mitavyaya',
    principle: 'Moderate spending brings prosperity',
    sanskritTerm: 'मितव्यय',
    modernInterpretation: 'Balanced spending - neither extreme frugality nor excessive spending. Find the middle path that allows both present enjoyment and future security.',
    financialApplications: ['Lifestyle balance', 'Spending optimization', 'Long-term planning'],
    category: 'expense_management' as WisdomCategory,
    tags: ['balance', 'moderation', 'lifestyle']
  },
  {
    id: 'sangraha_pariraksha',
    principle: 'Accumulation and protection of wealth',
    sanskritTerm: 'संग्रह परिरक्षा',
    modernInterpretation: 'Wealth creation has two phases: accumulation through savings and investments, and protection through diversification and insurance.',
    financialApplications: ['Investment strategy', 'Asset protection', 'Diversification'],
    category: 'investment_principles' as WisdomCategory,
    tags: ['wealth', 'investment', 'protection', 'diversification']
  },
  {
    id: 'kala_yoga',
    principle: 'Right action at the right time',
    sanskritTerm: 'काल योग',
    modernInterpretation: 'Timing matters in financial decisions. Market cycles, life stages, and economic conditions should influence when you buy, sell, or invest.',
    financialApplications: ['Market timing', 'Life planning', 'Opportunity recognition'],
    category: 'investment_principles' as WisdomCategory,
    tags: ['timing', 'opportunity', 'cycles', 'strategy']
  }
];

/**
 * Simplified Financial Context Analysis
 */
export function analyzeSimpleContext(expenses: any[], budgets: any[]): UserFinancialContext {
  const currentDate = new Date();
  const currentMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentDate.getMonth() && 
           expenseDate.getFullYear() === currentDate.getFullYear();
  });

  const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryTotals = currentMonthExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([category]) => category);

  // Determine current situation
  let currentSituation: UserFinancialContext['currentSituation'] = 'budgeting';
  
  if (budgets.length === 0) {
    currentSituation = 'budgeting';
  } else {
    const isOverBudget = budgets.some(budget => {
      const categoryExpenses = currentMonthExpenses
        .filter(exp => exp.category === budget.category)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return categoryExpenses > budget.limit;
    });
    
    if (isOverBudget) {
      currentSituation = 'overspending';
    } else if (totalExpenses > 0) {
      currentSituation = 'financial_planning';
    }
  }

  return {
    currentSituation,
    spendingPatterns: {
      monthlyExpenses: totalExpenses,
      topCategories,
      savingsRate: 0.15 // Default assumption
    },
    financialGoals: ['Financial stability', 'Better budgeting'],
    riskProfile: 'moderate',
    lifeStage: 'professional'
  };
}

/**
 * Find relevant wisdom for user query
 */
export function findRelevantWisdom(userQuery: string, context: UserFinancialContext): {
  wisdom: typeof CORE_WISDOM[0] | null;
  personalizedAdvice: string;
} {
  const queryLower = userQuery.toLowerCase();
  
  // Simple keyword matching
  let bestMatch = null;
  let bestScore = 0;

  for (const wisdom of CORE_WISDOM) {
    let score = 0;
    
    // Check for keyword matches
    for (const tag of wisdom.tags) {
      if (queryLower.includes(tag)) {
        score += 2;
      }
    }
    
    // Check for application area matches
    for (const app of wisdom.financialApplications) {
      if (queryLower.includes(app.toLowerCase())) {
        score += 3;
      }
    }
    
    // Context-based scoring
    switch (context.currentSituation) {
      case 'budgeting':
        if (wisdom.id === 'arthagama_vyaya' || wisdom.id === 'mitavyaya') score += 2;
        break;
      case 'overspending':
        if (wisdom.id === 'mitavyaya' || wisdom.id === 'arthagama_vyaya') score += 3;
        break;
      case 'saving':
        if (wisdom.id === 'kosha_mula_danda') score += 2;
        break;
      case 'investing':
        if (wisdom.id === 'sangraha_pariraksha' || wisdom.id === 'kala_yoga') score += 2;
        break;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = wisdom;
    }
  }

  const personalizedAdvice = generatePersonalizedAdvice(bestMatch, context, userQuery);

  return {
    wisdom: bestMatch,
    personalizedAdvice
  };
}

/**
 * Generate personalized advice based on wisdom and context
 */
function generatePersonalizedAdvice(
  wisdom: typeof CORE_WISDOM[0] | null, 
  context: UserFinancialContext, 
  userQuery: string
): string {
  if (!wisdom) {
    return `Based on your ${context.currentSituation} situation, focus on creating a balanced approach to your finances. Consider the principle of moderate spending - find balance between present needs and future security.`;
  }

  let advice = `Following Kautilya's principle of "${wisdom.principle}" (${wisdom.sanskritTerm}): ${wisdom.modernInterpretation}`;
  
  // Add context-specific guidance
  switch (context.currentSituation) {
    case 'budgeting':
      advice += ` Start by tracking your top spending categories: ${context.spendingPatterns.topCategories.join(', ')}.`;
      break;
    case 'overspending':
      advice += ` Review your spending in ${context.spendingPatterns.topCategories[0]} and look for areas to optimize.`;
      break;
    case 'saving':
      advice += ` Build your emergency fund systematically, even if it's just ₹500 per month to start.`;
      break;
  }

  return advice;
}

/**
 * Create enhanced prompt with wisdom integration
 */
export function createWisdomEnhancedPrompt(
  userQuery: string,
  expenses: any[],
  budgets: any[],
  originalPrompt: string
): string {
  const context = analyzeSimpleContext(expenses, budgets);
  const { wisdom, personalizedAdvice } = findRelevantWisdom(userQuery, context);

  let enhancedPrompt = originalPrompt;

  if (wisdom) {
    enhancedPrompt += `\n\nKautilyaAI Wisdom Context:
Ancient Principle: ${wisdom.principle} (${wisdom.sanskritTerm})
Modern Application: ${wisdom.modernInterpretation}
Personalized Guidance: ${personalizedAdvice}

Please incorporate this wisdom naturally into your response, explaining how it applies to the user's current situation.`;
  } else {
    enhancedPrompt += `\n\nKautilyaAI Context:
User's Financial Focus: ${context.currentSituation}
Top Spending Areas: ${context.spendingPatterns.topCategories.join(', ')}
Personalized Guidance: ${personalizedAdvice}

Please provide practical financial advice based on this context.`;
  }

  enhancedPrompt += `\n\nResponse Style: You are KautilyaAI, wise yet approachable, combining ancient financial wisdom with practical modern advice. Always provide actionable recommendations.`;

  return enhancedPrompt;
}

/**
 * Get daily wisdom for dashboard
 */
export function getDailyWisdom(): string {
  const today = new Date();
  const dayIndex = today.getDate() % CORE_WISDOM.length;
  const wisdom = CORE_WISDOM[dayIndex];
  
  return `${wisdom.principle} - ${wisdom.modernInterpretation}`;
}

/**
 * Generate post-action wisdom suggestions
 */
export function generateActionWisdom(actionType: string, amount?: number): string {
  switch (actionType) {
    case 'expense_added':
      if (amount && amount > 1000) {
        return "Kautilya teaches us that large expenditures should be planned, not impulsive. Consider if this expense aligns with your financial goals.";
      }
      return "Remember the principle of 'Mitavyaya' - moderate spending brings prosperity. Track your expenses regularly.";
    
    case 'budget_created':
      return "Following the principle of 'Arthagama Vyaya' - ensure your income exceeds your expenditure. A good budget is your roadmap to financial freedom.";
    
    case 'expense_deleted':
      return "Good financial discipline includes reviewing and correcting decisions. This aligns with the principle of continuous improvement in money management.";
    
    case 'chat_query':
      return "Remember Kautilya's teaching: 'Knowledge is the foundation of all prosperity.' Seek wisdom in your financial decisions.";
    
    default:
      return "Practice mindful financial decisions guided by the timeless wisdom of balanced living.";
  }
}
