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
import { PeopleManager } from '@/components/PeopleManager';
import { BudgetAnalyzer } from '@/components/BudgetAnalyzer';
import { LoginPage } from '@/components/LoginPage';
import { AppHeader } from '@/components/AppHeader';
import { Navigation } from '@/components/Navigation';
import { PWAInstallPrompt, PWAUpdatePrompt, PWAConnectionStatus } from '@/components/PWAComponents';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { 
  Search as MagnifyingGlass,
  Receipt,
  List
} from 'lucide-react';
import { type Expense, type Budget, DEFAULT_CATEGORIES, getAllCategories, formatCurrency, getCurrentMonth, getMonthlyExpenses, calculateCategorySpending } from '@/lib/types';
import { toast } from 'sonner';
import { PWAManager } from '@/lib/pwa';

function FinanceApp() {
  const { user, loading: authLoading } = useAuth();
  const {
    expenses,
    budgets,
    templates,
    customCategories,
    publicCategories,
    customPeople,
    publicPeople,
    budgetTemplates,
    publicBudgetTemplates,
    loading: dataLoading,
    addExpense,
    deleteExpense,
    addBudget,
    deleteBudget,
    updateBudget,
    addTemplate,
    deleteTemplate,
    addCategory,
    deleteCategory,
    addPerson,
    deletePerson,
    adoptPerson,
    updatePerson,
    addBudgetTemplate,
    deleteBudgetTemplate,
    adoptBudgetTemplate,
  } = useFirestoreData();

  const [activeTab, setActiveTab] = useState('expenses');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');

  // PWA Manager effect
  useEffect(() => {
    PWAManager.init();
  }, []);

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      await addExpense({
        ...expenseData,
        createdAt: new Date().toISOString(),
      });
      setShowAddExpense(false);
      toast.success('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      toast.success('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handleQuickAdd = (templateData: any) => {
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Content with proper spacing */}
        <div className="flex-1 container mx-auto px-4 py-6">
          {/* Monthly Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">This Month Spent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{formatCurrency(totalSpent)}</div>
                <p className="text-xs text-muted-foreground">
                  {monthlyExpenses.length} transactions this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{formatCurrency(totalBudget)}</div>
                <p className="text-xs text-muted-foreground">
                  {budgets.length} active budgets
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
            {/* Hidden TabsList for functionality only */}
            <TabsList className="hidden">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="analyzer">AI Analyzer</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">
                        <div className="flex items-center gap-2">
                          <List className="w-4 h-4" />
                          Date
                        </div>
                      </SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setShowAddExpense(true)}>
                  Add Expense
                </Button>
              </div>

              <div className="grid gap-4">
                {filteredAndSortedExpenses.length > 0 ? (
                  filteredAndSortedExpenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onDelete={() => handleDeleteExpense(expense.id)}
                      people={[...customPeople, ...publicPeople]}
                    />
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No expenses found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchTerm || categoryFilter !== 'all' 
                        ? 'Try adjusting your search or filter criteria'
                        : 'Start by adding your first expense'
                      }
                    </p>
                    {(!searchTerm && categoryFilter === 'all') && (
                      <Button onClick={() => setShowAddExpense(true)}>
                        Add Your First Expense
                      </Button>
                    )}
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="budgets">
              <BudgetManager 
                budgets={budgets}
                expenses={expenses}
                onAddBudget={addBudget}
                onDeleteBudget={deleteBudget}
                onUpdateBudget={updateBudget}
                customCategories={customCategories}
                budgetTemplates={budgetTemplates}
                publicBudgetTemplates={publicBudgetTemplates}
                onAdoptBudgetTemplate={adoptBudgetTemplate}
                onAddBudgetTemplate={addBudgetTemplate}
                onDeleteBudgetTemplate={deleteBudgetTemplate}
              />
            </TabsContent>

            <TabsContent value="templates">
              <RecurringTemplates 
                templates={templates}
                onAddTemplate={addTemplate}
                onDeleteTemplate={deleteTemplate}
                onQuickAdd={handleQuickAdd}
                customCategories={customCategories}
                customPeople={customPeople}
                publicPeople={publicPeople}
              />
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager 
                customCategories={customCategories}
                publicCategories={publicCategories}
                onAddCategory={addCategory}
                onDeleteCategory={deleteCategory}
              />
            </TabsContent>

            <TabsContent value="people">
              <PeopleManager 
                customPeople={customPeople}
                publicPeople={publicPeople}
                onAddPerson={addPerson}
                onDeletePerson={deletePerson}
                onAdoptPerson={adoptPerson}
                onUpdatePerson={updatePerson}
              />
            </TabsContent>

            <TabsContent value="analyzer">
              <BudgetAnalyzer 
                expenses={expenses}
                budgets={budgets}
                customCategories={customCategories}
              />
            </TabsContent>

            <TabsContent value="trends">
              <SpendingTrends expenses={expenses} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <PWAConnectionStatus />
      
      <Toaster position="top-right" />

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          isOpen={showAddExpense}
          onClose={() => setShowAddExpense(false)}
          onSubmit={handleAddExpense}
          customCategories={customCategories}
          customPeople={customPeople}
          publicPeople={publicPeople}
        />
      )}
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
