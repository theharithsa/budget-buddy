import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { ExpenseCard } from '@/components/ExpenseCard';
import { BudgetManager } from '@/components/BudgetManager';
import { SpendingTrends } from '@/components/SpendingTrends';
import { RecurringTemplates } from '@/components/RecurringTemplates';
import { CategoryManager } from '@/components/CategoryManager';
import { BudgetAnalyzer } from '@/components/BudgetAnalyzer';
import { LoginPage } from '@/components/LoginPage';
import { AppHeader } from '@/components/AppHeader';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { Receipt, Wallet, TrendingUp, Search, SortDesc, Repeat, Palette, Brain } from '@phosphor-icons/react';
import { type Expense, type Budget, DEFAULT_CATEGORIES, getAllCategories, formatCurrency, getCurrentMonth, getMonthlyExpenses, calculateCategorySpending } from '@/lib/types';
import { toast } from 'sonner';

function FinanceApp() {
  const { user, loading: authLoading } = useAuth();
  const {
    expenses,
    budgets,
    customCategories,
    publicCategories,
    loading: dataLoading,
    addExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    deleteBudget,
    addTemplate,
    deleteTemplate,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    adoptCategory,
  } = useFirestoreData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [activeTab, setActiveTab] = useState('expenses');

  // Update budget spending when expenses change
  useEffect(() => {
    if (!user || !budgets.length) return;

    const currentMonth = getCurrentMonth();
    const monthlyExpenses = getMonthlyExpenses(expenses, currentMonth);
    
    // Update budgets with current spending
    budgets.forEach(budget => {
      const spent = calculateCategorySpending(monthlyExpenses, budget.category);
      if (budget.spent !== spent) {
        updateBudget(budget.id, { spent });
      }
    });
  }, [expenses, budgets, user, updateBudget]);

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      await addExpense(expenseData);
      toast.success('Expense added successfully');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleUpdateBudgets = (newBudgets: Budget[]) => {
    // Handle budget updates through the BudgetManager component
    // The component will call the appropriate Firebase functions
  };

  // Show loading spinner while authentication is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Filter and sort expenses
  const filteredAndSortedExpenses = expenses
    .filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const currentMonth = getCurrentMonth();
  const monthlyExpenses = getMonthlyExpenses(expenses, currentMonth);
  const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Monthly Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Month Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalSpent)}</div>
              <p className="text-xs text-muted-foreground">
                {monthlyExpenses.length} transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalBudget)}</div>
              <p className="text-xs text-muted-foreground">
                {budgets.length} categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalBudget > 0 && totalSpent > totalBudget ? 'text-destructive' : 'text-accent'}`}>
                {formatCurrency(Math.max(0, totalBudget - totalSpent))}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% used` : 'Set budgets to track'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt size={16} />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="budgets" className="flex items-center gap-2">
              <Wallet size={16} />
              Budgets
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Repeat size={16} />
              Templates
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Palette size={16} />
              Categories
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="flex items-center gap-2">
              <Brain size={16} />
              AI Analyzer
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp size={16} />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getAllCategories(customCategories).map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: 'date' | 'amount' | 'category') => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SortDesc size={16} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Sort by Date</SelectItem>
                    <SelectItem value="amount">Sort by Amount</SelectItem>
                    <SelectItem value="category">Sort by Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AddExpenseModal onAddExpense={handleAddExpense} customCategories={customCategories} />
            </div>

            {dataLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading expenses...</p>
              </div>
            ) : filteredAndSortedExpenses.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Receipt size={48} className="mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      {expenses.length === 0 ? 'No expenses yet' : 'No expenses match your filters'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {expenses.length === 0 
                        ? 'Start tracking your spending by adding your first expense.'
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                    {expenses.length === 0 && (
                      <AddExpenseModal onAddExpense={handleAddExpense} customCategories={customCategories} />
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredAndSortedExpenses.map((expense) => (
                  <ExpenseCard
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDeleteExpense}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManager 
              budgets={budgets} 
              onUpdateBudgets={handleUpdateBudgets}
              onAddBudget={addBudget}
              onUpdateBudget={updateBudget}
              onDeleteBudget={deleteBudget}
              customCategories={customCategories}
            />
          </TabsContent>

          <TabsContent value="templates">
            <RecurringTemplates 
              onAddExpense={handleAddExpense}
              onAddTemplate={addTemplate}
              onDeleteTemplate={deleteTemplate}
              customCategories={customCategories}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoryManager
              customCategories={customCategories}
              publicCategories={publicCategories}
              onAddCategory={addCustomCategory}
              onUpdateCategory={updateCustomCategory}
              onDeleteCategory={deleteCustomCategory}
              onAdoptCategory={adoptCategory}
            />
          </TabsContent>

          <TabsContent value="analyzer">
            <BudgetAnalyzer expenses={expenses} budgets={budgets} />
          </TabsContent>

          <TabsContent value="trends">
            <SpendingTrends expenses={expenses} />
          </TabsContent>
        </Tabs>
      </div>
      
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <FinanceApp />
    </AuthProvider>
  );
}

export default App;