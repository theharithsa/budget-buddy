export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  receiptUrl?: string;
  receiptFileName?: string;
  peopleIds?: string[]; // IDs of people this expense was spent for
  profileId?: string; // Profile this expense belongs to
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  profileId?: string; // Profile this budget belongs to
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  userId: string;
  isDefault: boolean; // One profile per user should be default
  createdAt: string;
  updatedAt: string;
  settings: ProfileSettings;
}

export interface ProfileSettings {
  allowedCategories?: string[]; // Restrict to specific categories
  budgetLimit?: number; // Overall profile budget limit
  currency: string; // Profile-specific currency
  exportFormat: 'excel' | 'csv' | 'pdf'; // Preferred export format
  autoBackup: boolean; // Auto backup profile data
  notifications: boolean; // Profile-specific notifications
}

export interface Category {
  name: string;
  color: string;
  icon: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: string; // User's display name
}

export interface Person {
  id: string;
  name: string;
  color: string;
  icon: string;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: string; // User's display name
  relationship?: string; // e.g., "Family", "Friend", "Colleague", etc.
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

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  budgets: Array<{
    category: string;
    limit: number;
    percentage?: number;
  }>;
  totalBudget: number;
  incomeLevel: 'low' | 'medium' | 'high' | 'custom';
  userId: string;
  isPublic: boolean;
  createdAt: string;
  createdBy: string;
  tags: string[];
  usageCount?: number;
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
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
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

export const getExpensesByDateRange = (expenses: Expense[], fromDate: string, toDate: string): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = expense.date;
    return expenseDate >= fromDate && expenseDate <= toDate;
  });
};

export const calculateCategorySpending = (expenses: Expense[], category: string): number => {
  return expenses
    .filter(expense => expense.category === category)
    .reduce((total, expense) => total + expense.amount, 0);
};

// Default monthly budget suggestions for Indian households
export const DEFAULT_MONTHLY_BUDGETS: Budget[] = [
  { id: 'food-budget', category: 'Food & Dining', limit: 15000, spent: 0 },
  { id: 'transport-budget', category: 'Transportation', limit: 8000, spent: 0 },
  { id: 'bills-budget', category: 'Bills & Utilities', limit: 12000, spent: 0 },
  { id: 'entertainment-budget', category: 'Entertainment', limit: 5000, spent: 0 },
  { id: 'shopping-budget', category: 'Shopping', limit: 10000, spent: 0 },
  { id: 'healthcare-budget', category: 'Healthcare', limit: 3000, spent: 0 }
];

export const DEFAULT_RECURRING_TEMPLATES: RecurringTemplate[] = [
  // Housing & Utilities
  { 
    id: 'rent', 
    name: 'House Rent', 
    amount: 25000, 
    category: 'Bills & Utilities', 
    description: 'Monthly house rent payment',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'electricity', 
    name: 'Electricity Bill', 
    amount: 2500, 
    category: 'Bills & Utilities', 
    description: 'Monthly electricity bill (MSEB/BESCOM)',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'water', 
    name: 'Water Bill', 
    amount: 800, 
    category: 'Bills & Utilities', 
    description: 'Municipal water supply bill',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'gas', 
    name: 'LPG Cylinder', 
    amount: 1000, 
    category: 'Bills & Utilities', 
    description: 'LPG gas cylinder refill',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'maintenance', 
    name: 'Society Maintenance', 
    amount: 3000, 
    category: 'Bills & Utilities', 
    description: 'Monthly society maintenance charges',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Communication & Internet
  { 
    id: 'phone', 
    name: 'Mobile Recharge', 
    amount: 699, 
    category: 'Bills & Utilities', 
    description: 'Monthly mobile plan (Jio/Airtel)',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'internet', 
    name: 'Broadband Internet', 
    amount: 999, 
    category: 'Bills & Utilities', 
    description: 'Monthly internet/wifi plan',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'dth', 
    name: 'DTH/Cable TV', 
    amount: 350, 
    category: 'Entertainment', 
    description: 'DTH television subscription',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Subscriptions & Entertainment
  { 
    id: 'netflix', 
    name: 'Netflix', 
    amount: 199, 
    category: 'Entertainment', 
    description: 'Netflix mobile subscription',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'hotstar', 
    name: 'Disney+ Hotstar', 
    amount: 299, 
    category: 'Entertainment', 
    description: 'Disney+ Hotstar VIP plan',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'prime', 
    name: 'Amazon Prime', 
    amount: 179, 
    category: 'Entertainment', 
    description: 'Amazon Prime monthly membership',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'spotify', 
    name: 'Spotify Premium', 
    amount: 119, 
    category: 'Entertainment', 
    description: 'Spotify Premium music subscription',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'youtube', 
    name: 'YouTube Premium', 
    amount: 129, 
    category: 'Entertainment', 
    description: 'YouTube Premium subscription',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Health & Fitness
  { 
    id: 'gym', 
    name: 'Gym Membership', 
    amount: 2000, 
    category: 'Healthcare', 
    description: 'Monthly gym membership fees',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'health-insurance', 
    name: 'Health Insurance', 
    amount: 2500, 
    category: 'Healthcare', 
    description: 'Monthly health insurance premium',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Transportation
  { 
    id: 'petrol', 
    name: 'Petrol/Fuel', 
    amount: 5000, 
    category: 'Transportation', 
    description: 'Monthly petrol/fuel expense',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'car-emi', 
    name: 'Car EMI', 
    amount: 15000, 
    category: 'Transportation', 
    description: 'Monthly car loan EMI',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'bike-emi', 
    name: 'Bike EMI', 
    amount: 4000, 
    category: 'Transportation', 
    description: 'Monthly bike loan EMI',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'vehicle-insurance', 
    name: 'Vehicle Insurance', 
    amount: 1200, 
    category: 'Transportation', 
    description: 'Monthly vehicle insurance premium',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Education & Learning
  { 
    id: 'school-fees', 
    name: 'School Fees', 
    amount: 8000, 
    category: 'Education', 
    description: 'Monthly school fees',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'tuition', 
    name: 'Tuition Classes', 
    amount: 5000, 
    category: 'Education', 
    description: 'Monthly tuition fees',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Food & Groceries
  { 
    id: 'milk', 
    name: 'Daily Milk', 
    amount: 1800, 
    category: 'Food & Dining', 
    description: 'Monthly milk delivery',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'grocery-delivery', 
    name: 'Grocery Delivery', 
    amount: 2000, 
    category: 'Food & Dining', 
    description: 'Monthly grocery delivery (Grofers/BigBasket)',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Financial Services
  { 
    id: 'home-loan', 
    name: 'Home Loan EMI', 
    amount: 35000, 
    category: 'Bills & Utilities', 
    description: 'Monthly home loan EMI',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'personal-loan', 
    name: 'Personal Loan EMI', 
    amount: 8000, 
    category: 'Bills & Utilities', 
    description: 'Monthly personal loan EMI',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'credit-card', 
    name: 'Credit Card Bill', 
    amount: 12000, 
    category: 'Bills & Utilities', 
    description: 'Monthly credit card payment',
    frequency: 'monthly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Quarterly Bills
  { 
    id: 'property-tax', 
    name: 'Property Tax', 
    amount: 5000, 
    category: 'Bills & Utilities', 
    description: 'Quarterly property tax payment',
    frequency: 'quarterly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },

  // Yearly Subscriptions
  { 
    id: 'life-insurance', 
    name: 'Life Insurance Premium', 
    amount: 24000, 
    category: 'Healthcare', 
    description: 'Annual life insurance premium',
    frequency: 'yearly',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'income-tax', 
    name: 'Income Tax', 
    amount: 50000, 
    category: 'Bills & Utilities', 
    description: 'Annual income tax payment',
    frequency: 'yearly',
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

// Default people for common expense sharing
export const DEFAULT_PEOPLE: { name: string; color: string; icon: string; relationship: string }[] = [
  { name: 'Myself', color: 'oklch(0.6 0.2 260)', icon: '👤', relationship: 'Self' },
  { name: 'Spouse/Partner', color: 'oklch(0.65 0.25 350)', icon: '💑', relationship: 'Family' },
  { name: 'Family', color: 'oklch(0.7 0.2 30)', icon: '👨‍👩‍👧‍👦', relationship: 'Family' },
  { name: 'Kids', color: 'oklch(0.75 0.25 120)', icon: '👶', relationship: 'Family' },
  { name: 'Parents', color: 'oklch(0.6 0.15 60)', icon: '👴', relationship: 'Family' },
  { name: 'Friends', color: 'oklch(0.65 0.2 180)', icon: '👫', relationship: 'Friends' },
  { name: 'Colleagues', color: 'oklch(0.55 0.2 220)', icon: '👥', relationship: 'Work' },
];

// Helper function to get all available categories (default + custom)
export const getAllCategories = (customCategories: CustomCategory[] = []): Category[] => {
  const customAsCategory = customCategories.map(cat => ({
    name: cat.name,
    color: cat.color,
    icon: cat.icon
  }));
  
  return [...DEFAULT_CATEGORIES, ...customAsCategory];
};

// Helper function to get all available people (default + custom)
export const getAllPeople = (allPeople: Person[] = []): { name: string; color: string; icon: string; id?: string; relationship?: string }[] => {
  const defaultPeople = DEFAULT_PEOPLE.map((person, index) => ({
    ...person,
    id: `default-${index}`
  }));
  
  const customAsPeople = allPeople.map(person => ({
    name: person.name,
    color: person.color,
    icon: person.icon,
    id: person.id,
    relationship: person.relationship
  }));
  
  return [...defaultPeople, ...customAsPeople];
};

// Default profile templates for quick setup
export const DEFAULT_PROFILE_TEMPLATES = [
  {
    name: 'Personal',
    description: 'Personal expenses and budgeting',
    color: 'oklch(0.6 0.2 260)',
    icon: '👤',
    settings: {
      currency: 'USD',
      exportFormat: 'excel' as const,
      autoBackup: true,
      notifications: true
    }
  },
  {
    name: 'Work',
    description: 'Work-related expenses and business costs',
    color: 'oklch(0.55 0.2 220)',
    icon: '💼',
    settings: {
      allowedCategories: ['Transport', 'Meals', 'Office Supplies', 'Travel', 'Accommodation'],
      currency: 'USD',
      exportFormat: 'excel' as const,
      autoBackup: true,
      notifications: false
    }
  },
  {
    name: 'Family',
    description: 'Family expenses and household budgeting',
    color: 'oklch(0.7 0.2 30)',
    icon: '👨‍👩‍👧‍👦',
    settings: {
      allowedCategories: ['Groceries', 'Utilities', 'Healthcare', 'Education', 'Entertainment'],
      currency: 'USD',
      exportFormat: 'excel' as const,
      autoBackup: true,
      notifications: true
    }
  },
  {
    name: 'Travel',
    description: 'Travel and vacation expenses',
    color: 'oklch(0.65 0.25 120)',
    icon: '✈️',
    settings: {
      allowedCategories: ['Transport', 'Accommodation', 'Meals', 'Entertainment', 'Shopping'],
      currency: 'USD',
      exportFormat: 'excel' as const,
      autoBackup: true,
      notifications: false
    }
  }
];

// Excel/CSV export utility function
export const exportToExcel = async (expenses: Expense[], profileName: string) => {
  const headers = ['Date', 'Category', 'Description', 'Amount', 'Receipt'];
  const rows = expenses.map(expense => [
    new Date(expense.date).toLocaleDateString(),
    expense.category,
    expense.description,
    expense.amount.toFixed(2),
    expense.receiptUrl ? 'Yes' : 'No'
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${profileName}-expenses-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Profile filtering utilities
export const filterExpensesByProfile = (expenses: Expense[], profileId: string): Expense[] => {
  return expenses.filter(expense => expense.profileId === profileId);
};

export const filterBudgetsByProfile = (budgets: Budget[], profileId: string): Budget[] => {
  return budgets.filter(budget => budget.profileId === profileId);
};