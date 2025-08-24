// Types for Financial Wisdom System
export interface ArthashashtraPrinciple {
  id: string;
  principle: string;
  sanskritTerm: string;
  sanskritText?: string;
  publicDomainTranslation: string;
  modernInterpretation: string;
  financialApplications: string[];
  relevantScenarios: FinancialScenario[];
  culturalContext: string;
  practicalAdvice: string[];
  category: WisdomCategory;
  tags: string[];
}

export interface ContextualWisdom {
  principle: ArthashashtraPrinciple;
  relevanceScore: number;
  personalizedApplication: string;
  actionableSteps: string[];
  modernExamples: string[];
  warnings?: string[];
}

export interface FinancialScenario {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  commonPatterns: string[];
}

export interface UserFinancialContext {
  currentSituation: 'budgeting' | 'overspending' | 'saving' | 'investing' | 'debt_management' | 'financial_planning';
  spendingPatterns: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    topCategories: string[];
    savingsRate?: number;
  };
  financialGoals: string[];
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  lifeStage: 'student' | 'professional' | 'family' | 'retired';
}

export interface GlobalFinancialWisdom {
  source: 'arthashastra' | 'ancient_wisdom' | 'modern_classic' | 'behavioral_finance';
  author: string;
  principle: string;
  quote: string;
  modernApplication: string;
  relevantContexts: string[];
}

export type WisdomCategory = 
  | 'wealth_creation'
  | 'expense_management' 
  | 'saving_strategies'
  | 'investment_principles'
  | 'risk_management'
  | 'financial_planning'
  | 'debt_management'
  | 'economic_cycles'
  | 'trade_commerce'
  | 'financial_ethics';

export interface WisdomEngineResponse {
  primaryWisdom: ContextualWisdom;
  supportingWisdom: ContextualWisdom[];
  personalizedGuidance: string;
  culturalContext: string;
  modernParallels: string[];
  actionPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

// Basic Expense and Budget types for compatibility
export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  receiptUrl?: string;
  peopleIds?: string[];
}

export interface Budget {
  id?: string;
  category: string;
  limit: number;
  period: 'monthly' | 'weekly';
}
