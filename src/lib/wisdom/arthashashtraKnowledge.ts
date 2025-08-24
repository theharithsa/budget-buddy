import { ArthashashtraPrinciple, FinancialScenario, WisdomCategory } from './types';

// Core Arthashastra Financial Principles (Based on Public Domain Sources)
// Using R. Shamasastry's 1915 translation and original interpretations

export const FINANCIAL_SCENARIOS: FinancialScenario[] = [
  {
    id: 'budgeting',
    name: 'Budget Creation & Management',
    description: 'Planning and controlling income and expenses',
    keywords: ['budget', 'plan', 'control expenses', 'manage money', 'allocate funds'],
    commonPatterns: ['overspending', 'no budget', 'irregular income', 'expense tracking']
  },
  {
    id: 'overspending',
    name: 'Overspending Control',
    description: 'Managing excessive or impulsive spending',
    keywords: ['overspend', 'too much', 'control spending', 'impulse buying', 'expensive'],
    commonPatterns: ['emotional spending', 'lifestyle inflation', 'peer pressure spending']
  },
  {
    id: 'saving',
    name: 'Savings & Wealth Accumulation',
    description: 'Building financial reserves and emergency funds',
    keywords: ['save', 'emergency fund', 'build wealth', 'accumulate', 'reserve'],
    commonPatterns: ['no emergency fund', 'low savings rate', 'irregular savings']
  },
  {
    id: 'investment',
    name: 'Investment & Growth',
    description: 'Growing wealth through strategic investments',
    keywords: ['invest', 'grow money', 'returns', 'portfolio', 'wealth building'],
    commonPatterns: ['risk aversion', 'lack of knowledge', 'market timing']
  },
  {
    id: 'debt_management',
    name: 'Debt Management',
    description: 'Managing and eliminating debt effectively',
    keywords: ['debt', 'loan', 'credit', 'emi', 'payoff', 'interest'],
    commonPatterns: ['high interest debt', 'multiple loans', 'minimum payments']
  },
  {
    id: 'financial_planning',
    name: 'Long-term Financial Planning',
    description: 'Strategic planning for financial goals and retirement',
    keywords: ['financial goal', 'retirement', 'long term', 'plan', 'future'],
    commonPatterns: ['no clear goals', 'procrastination', 'inadequate planning']
  }
];

export const ARTHASHASTRA_PRINCIPLES: ArthashashtraPrinciple[] = [
  {
    id: 'kosha_mula_danda',
    principle: 'Treasury as Foundation of Power',
    sanskritTerm: 'कोषमूलो दण्डः',
    sanskritText: 'कोषमूलो दण्डः दण्डमूलं राज्यम्',
    publicDomainTranslation: 'The treasury is the root of all power; power is the root of the kingdom (Shamasastry, 1915)',
    modernInterpretation: 'Financial stability forms the foundation of personal security and freedom',
    financialApplications: [
      'Building emergency funds as your financial foundation',
      'Establishing multiple income sources for security',
      'Creating a strong financial base before taking risks'
    ],
    relevantScenarios: [
      FINANCIAL_SCENARIOS.find(s => s.id === 'saving')!,
      FINANCIAL_SCENARIOS.find(s => s.id === 'financial_planning')!
    ],
    culturalContext: 'In ancient India, Kautilya emphasized that a strong treasury was essential for any ruler. This principle applies to personal finance - your savings and financial reserves give you the power to make independent decisions.',
    practicalAdvice: [
      'Start with building an emergency fund of 6-12 months expenses',
      'Diversify your income sources to reduce dependency',
      'Strengthen your financial position before taking investment risks',
      'View savings not as sacrifice, but as building your personal power'
    ],
    category: 'wealth_creation',
    tags: ['emergency_fund', 'financial_security', 'foundation', 'savings']
  },
  {
    id: 'arthagama_vyaya',
    principle: 'Income Should Exceed Expenditure',
    sanskritTerm: 'अर्थागमव्यय',
    sanskritText: 'आयाधिको व्ययो यस्य स राजा शक्तो भवेत्',
    publicDomainTranslation: 'He whose income exceeds his expenditure will be powerful (Shamasastry, 1915)',
    modernInterpretation: 'Sustainable wealth building requires living below your means and controlling expenses',
    financialApplications: [
      'Creating and maintaining a positive cash flow',
      'Tracking expenses to ensure they remain below income',
      'Building wealth through the surplus of income over expenses'
    ],
    relevantScenarios: [
      FINANCIAL_SCENARIOS.find(s => s.id === 'budgeting')!,
      FINANCIAL_SCENARIOS.find(s => s.id === 'overspending')!
    ],
    culturalContext: 'This fundamental principle from the Arthashastra recognizes that the surplus of income over expenditure is what creates prosperity - a timeless truth that applies to personal finance today.',
    practicalAdvice: [
      'Track all your expenses for at least a month to understand spending patterns',
      'Aim to spend 80-90% of your income, saving the rest',
      'Regularly review and optimize your expenses',
      'Increase income through skill development and side hustles'
    ],
    category: 'expense_management',
    tags: ['budgeting', 'cash_flow', 'spending_control', 'surplus']
  },
  {
    id: 'mitavyaya',
    principle: 'Moderate and Purposeful Spending',
    sanskritTerm: 'मितव्यय',
    sanskritText: 'मितव्ययो मितप्रज्ञो मितभाषी च पण्डितः',
    publicDomainTranslation: 'One who is moderate in expenditure, wise in judgment, and measured in speech is truly learned',
    modernInterpretation: 'Wisdom lies in spending thoughtfully and avoiding both extreme frugality and wasteful excess',
    financialApplications: [
      'Balanced approach to spending - neither miserly nor wasteful',
      'Purposeful allocation of funds based on priorities',
      'Avoiding both under-spending (missing opportunities) and over-spending'
    ],
    relevantScenarios: [
      FINANCIAL_SCENARIOS.find(s => s.id === 'budgeting')!,
      FINANCIAL_SCENARIOS.find(s => s.id === 'overspending')!
    ],
    culturalContext: 'Kautilya advocated for balance in all aspects of life, including spending. This principle teaches us that both extreme frugality and reckless spending are unwise.',
    practicalAdvice: [
      'Allocate funds for necessities, goals, and reasonable enjoyment',
      'Avoid both extreme penny-pinching and impulsive splurging',
      'Spend on things that add genuine value to your life',
      'Practice mindful spending - pause before major purchases'
    ],
    category: 'expense_management',
    tags: ['balanced_spending', 'mindful_consumption', 'priorities', 'moderation']
  },
  {
    id: 'sangraha_pariraksha',
    principle: 'Wealth Accumulation and Protection',
    sanskritTerm: 'संग्रहपरिरक्षा',
    sanskritText: 'धनसंग्रहो रक्षणं चैव कुर्यात्',
    publicDomainTranslation: 'One should both accumulate and protect wealth',
    modernInterpretation: 'Building wealth requires both active accumulation and careful protection from losses',
    financialApplications: [
      'Systematic wealth building through regular investments',
      'Protecting accumulated wealth through diversification',
      'Insurance and risk management to safeguard assets'
    ],
    relevantScenarios: [
      FINANCIAL_SCENARIOS.find(s => s.id === 'saving')!,
      FINANCIAL_SCENARIOS.find(s => s.id === 'investment')!
    ],
    culturalContext: 'The Arthashastra emphasizes that accumulating wealth is only half the battle - protecting it from various risks is equally important.',
    practicalAdvice: [
      'Set up automatic savings and investment plans',
      'Diversify investments across asset classes and geographies',
      'Get adequate insurance coverage for life, health, and property',
      'Protect against inflation by investing in growth assets'
    ],
    category: 'wealth_creation',
    tags: ['wealth_building', 'asset_protection', 'diversification', 'risk_management']
  },
  {
    id: 'vyavastha_niti',
    principle: 'Systematic Financial Organization',
    sanskritTerm: 'व्यवस्थानीति',
    sanskritText: 'व्यवस्थां कुर्यात् सर्वेषु कार्येषु',
    publicDomainTranslation: 'One should establish systematic organization in all affairs',
    modernInterpretation: 'Financial success requires systematic organization, record-keeping, and regular review',
    financialApplications: [
      'Maintaining detailed financial records and budgets',
      'Regular review and adjustment of financial plans',
      'Systematic approach to investments and savings'
    ],
    relevantScenarios: [
      FINANCIAL_SCENARIOS.find(s => s.id === 'budgeting')!,
      FINANCIAL_SCENARIOS.find(s => s.id === 'financial_planning')!
    ],
    culturalContext: 'Kautilya was a master organizer who believed that systematic approach to governance - and by extension, personal finance - was key to success.',
    practicalAdvice: [
      'Maintain detailed records of all income and expenses',
      'Review your financial situation monthly and adjust plans quarterly',
      'Use systematic investment plans (SIPs) for regular investing',
      'Create organized systems for tracking goals and progress'
    ],
    category: 'financial_planning',
    tags: ['organization', 'record_keeping', 'systematic_approach', 'planning']
  },
  {
    id: 'kala_yoga',
    principle: 'Timing and Opportunity in Wealth Creation',
    sanskritTerm: 'कालयोग',
    sanskritText: 'कालयोगात् सर्वं सिद्ध्यति',
    publicDomainTranslation: 'Everything succeeds through proper timing',
    modernInterpretation: 'Success in finance requires understanding market cycles and seizing opportunities at the right time',
    financialApplications: [
      'Understanding economic cycles for investment timing',
      'Starting investments early to benefit from compounding',
      'Recognizing opportunities during market downturns'
    ],
    relevantScenarios: [
      FINANCIAL_SCENARIOS.find(s => s.id === 'investment')!,
      FINANCIAL_SCENARIOS.find(s => s.id === 'financial_planning')!
    ],
    culturalContext: 'The concept of Kala (time) in Indian philosophy recognizes that timing is crucial in all endeavors, including wealth creation.',
    practicalAdvice: [
      'Start investing early to maximize the power of compounding',
      'Understand that markets move in cycles - use this to your advantage',
      'Be patient with long-term investments while staying alert to opportunities',
      'Dollar-cost average to reduce timing risk in volatile markets'
    ],
    category: 'investment_principles',
    tags: ['timing', 'market_cycles', 'compounding', 'patience']
  }
];

export const WISDOM_CATEGORIES: Record<WisdomCategory, { name: string; description: string }> = {
  wealth_creation: {
    name: 'Wealth Creation',
    description: 'Principles for building and accumulating wealth systematically'
  },
  expense_management: {
    name: 'Expense Management', 
    description: 'Guidelines for controlling and optimizing spending'
  },
  saving_strategies: {
    name: 'Saving Strategies',
    description: 'Methods for effective saving and building reserves'
  },
  investment_principles: {
    name: 'Investment Principles',
    description: 'Timeless principles for wise investment decisions'
  },
  risk_management: {
    name: 'Risk Management',
    description: 'Strategies for protecting wealth and managing financial risks'
  },
  financial_planning: {
    name: 'Financial Planning',
    description: 'Long-term planning and goal-setting strategies'
  },
  debt_management: {
    name: 'Debt Management',
    description: 'Approaches to managing and eliminating debt'
  },
  economic_cycles: {
    name: 'Economic Cycles',
    description: 'Understanding and navigating economic cycles'
  },
  trade_commerce: {
    name: 'Trade & Commerce',
    description: 'Principles of business and commercial activities'
  },
  financial_ethics: {
    name: 'Financial Ethics',
    description: 'Ethical considerations in financial decisions'
  }
};
