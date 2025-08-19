export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  category: string;
  limit: number;
  spent: number;
}

export interface Category {
  name: string;
  color: string;
  icon: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  amount: number;
  category: string;
  description: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  isDefault: boolean;
  createdAt: string;
}

export const DEFAULT_CATEGORIES: Category[] = [
  { name: 'Food & Dining', color: 'oklch(0.65 0.2 40)', icon: '🍽️' },
  { name: 'Transportation', color: 'oklch(0.6 0.25 220)', icon: '🚗' },
  { name: 'Shopping', color: 'oklch(0.7 0.2 300)', icon: '🛍️' },
  { name: 'Entertainment', color: 'oklch(0.65 0.25 330)', icon: '🎬' },
  { name: 'Bills & Utilities', color: 'oklch(0.5 0.15 20)', icon: '⚡' },
  { name: 'Healthcare', color: 'oklch(0.6 0.2 140)', icon: '🏥' },
  { name: 'Education', color: 'oklch(0.55 0.2 260)', icon: '📚' },
  { name: 'Travel', color: 'oklch(0.65 0.2 180)', icon: '✈️' },
  { name: 'Other', color: 'oklch(0.6 0.1 240)', icon: '📝' },
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getCurrentMonth = (): string => {
  return new Date().toISOString().slice(0, 7); // YYYY-MM format
};

export const getMonthlyExpenses = (expenses: Expense[], month: string): Expense[] => {
  return expenses.filter(expense => expense.date.startsWith(month));
};

export const calculateCategorySpending = (expenses: Expense[], category: string): number => {
  return expenses
    .filter(expense => expense.category === category)
    .reduce((total, expense) => total + expense.amount, 0);
};

export const DEFAULT_RECURRING_TEMPLATES: RecurringTemplate[] = [
  { 
    id: 'rent', 
    name: 'Rent/Mortgage', 
    amount: 1200, 
    category: 'Bills & Utilities', 
    description: 'Monthly rent payment',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'electricity', 
    name: 'Electricity Bill', 
    amount: 80, 
    category: 'Bills & Utilities', 
    description: 'Monthly electricity bill',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'phone', 
    name: 'Phone Bill', 
    amount: 50, 
    category: 'Bills & Utilities', 
    description: 'Monthly phone service',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'internet', 
    name: 'Internet', 
    amount: 60, 
    category: 'Bills & Utilities', 
    description: 'Monthly internet service',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'netflix', 
    name: 'Netflix', 
    amount: 15, 
    category: 'Entertainment', 
    description: 'Netflix subscription',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'spotify', 
    name: 'Spotify', 
    amount: 10, 
    category: 'Entertainment', 
    description: 'Spotify Premium',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'gym', 
    name: 'Gym Membership', 
    amount: 30, 
    category: 'Healthcare', 
    description: 'Monthly gym membership',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'insurance', 
    name: 'Car Insurance', 
    amount: 120, 
    category: 'Transportation', 
    description: 'Car insurance premium',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];