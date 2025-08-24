import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster } from '@/components/ui/sonner';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { EditExpenseModal } from '@/components/EditExpenseModal';
import { ExpenseCard } from '@/components/ExpenseCard';
import { TimeframePicker, type DateRange } from '@/components/TimeframePicker';
import { Dashboard } from '@/components/Dashboard';
import { BudgetManager } from '@/components/BudgetManager';
import { RecurringTemplates } from '@/components/RecurringTemplates';
import { CategoryManager } from '@/components/CategoryManager';
import { PeopleManager } from '@/components/PeopleManager';
import { BudgetAnalyzer } from '@/components/BudgetAnalyzer';
import { AIChatPage } from '@/components/AIChatPage';
import { ComingSoon } from '@/components/ComingSoon';
import { LoginPage } from '@/components/LoginPage';
import { AppHeader } from '@/components/AppHeader';
import { Navigation } from '@/components/Navigation';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Footer } from '@/components/Footer';
import { PWAInstallPrompt, PWAUpdatePrompt, PWAConnectionStatus } from '@/components/PWAComponents';
import { UpdateNotification } from '@/components/UpdateNotification';
import { CookieBanner } from '@/components/CookieBanner';
import { GeminiChat } from '@/components/GeminiChat';
import { FloatingAIButton } from '@/components/FloatingAIButton';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { 
  Search as MagnifyingGlass,
  Receipt,
  List,
  Grid3x3,
  LayoutGrid
} from 'lucide-react';
import { type Expense, type Budget, DEFAULT_CATEGORIES, getAllCategories, getAllPeople, formatCurrency, getCurrentMonth, getMonthlyExpenses, getExpensesByDateRange, calculateCategorySpending } from '@/lib/types';
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
    updateExpense,
    addBudget,
    deleteBudget,
    updateBudget,
    addTemplate,
    deleteTemplate,
    addCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    adoptCategory,
    addPerson,
    deletePerson,
    adoptPerson,
    updatePerson,
    addBudgetTemplate,
    updateBudgetTemplate,
    deleteBudgetTemplate,
    adoptBudgetTemplate,
  } = useFirestoreData();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [peopleFilter, setPeopleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'category'>('date');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Initialize view mode with localStorage persistence
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    const saved = localStorage.getItem('finbuddy-view-mode');
    return (saved as 'list' | 'grid') || 'grid';
  });
  
  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('finbuddy-view-mode', viewMode);
  }, [viewMode]);
  
  // Initialize date range to current month
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { 
      from: start.toISOString().split('T')[0], 
      to: end.toISOString().split('T')[0] 
    };
  });

  // Wrapper functions to match GeminiChat interface expectations
  const handleAddBudgetForChat = async (budget: any) => {
    await addBudget(budget);
  };

  const handleAddCategoryForChat = async (category: any) => {
    await addCustomCategory(category);
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    try {
      const result = await addExpense(expenseData);
      
      setShowAddExpense(false);
      toast.success('Expense added successfully!');
      
      return result; // Return the document ID for GeminiChat compatibility
      
    } catch (error) {
      console.error('❌ App.tsx - Error adding expense:', error);
      toast.error('Failed to add expense');
      throw error; // Re-throw to maintain error handling in GeminiChat
    }
  };

  // Wrapper for components that expect void return
  const handleAddExpenseVoid = async (expenseData: Omit<Expense, 'id' | 'createdAt'>): Promise<void> => {
    await handleAddExpense(expenseData);
  };

  const handleUpdateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    try {
      await updateExpense(expenseId, expenseData);
      setEditingExpense(null);
      toast.success('Expense updated successfully!');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
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

  const handleUpdateBudgets = (budgets: Budget[]) => {
    // This is a placeholder for bulk budget updates
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
      
      // Check if expense includes the selected person
      const matchesPeople = peopleFilter === 'all' || 
                           (expense.peopleIds && expense.peopleIds.includes(peopleFilter));
      
      // Check if expense date falls within the selected date range
      const expenseDate = expense.date;
      const matchesDateRange = expenseDate >= dateRange.from && expenseDate <= dateRange.to;
      
      return matchesSearch && matchesCategory && matchesPeople && matchesDateRange;
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
  
  // Calculate total spent for the selected date range
  const totalSpent = filteredAndSortedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  // Helper function to get display label for date range
  const getDateRangeLabel = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    if (dateRange.from === currentMonthStart && dateRange.to === currentMonthEnd) {
      return "This Month Spent";
    }
    
    const fromDate = new Date(dateRange.from + 'T00:00:00');
    const toDate = new Date(dateRange.to + 'T00:00:00');
    
    if (dateRange.from === dateRange.to) {
      return `Spent on ${fromDate.toLocaleDateString()}`;
    }
    
    return `Spent ${fromDate.toLocaleDateString()} - ${toDate.toLocaleDateString()}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar Navigation */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onSidebarToggle={setSidebarCollapsed}
      />
      
      {/* Main Content Area - with dynamic left margin for desktop sidebar */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Header */}
        <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Content with proper spacing and bottom padding for mobile nav */}
        <div className={`flex-1 max-w-7xl mx-auto px-4 py-6 w-full ${
          activeTab !== 'dashboard' ? 'pb-20 md:pb-6' : 'pb-6'
        }`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Hidden TabsList for functionality only */}
            <TabsList className="hidden">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
              <TabsTrigger value="analyzer">AI Analyzer</TabsTrigger>
              <TabsTrigger value="ai-chat">KautilyaAI Co-Pilot</TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <Dashboard 
                expenses={expenses}
                budgets={budgets}
                customCategories={customCategories}
                customPeople={customPeople}
                publicPeople={publicPeople}
                onNavigate={setActiveTab}
              />
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              {/* Filters Section */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Primary Filters Row */}
                  <div className="flex flex-col sm:flex-row gap-3 flex-1 min-w-0">
                    <div className="relative flex-1 max-w-sm">
                      <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <TimeframePicker 
                      dateRange={dateRange} 
                      onDateRangeChange={setDateRange}
                      className="w-60"
                    />
                  </div>

                  {/* View Controls */}
                  <div className="flex gap-2 items-center">
                    {/* View Mode Toggle */}
                    <div className="flex bg-background rounded-lg p-1 border">
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="h-8 px-3"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="h-8 px-3"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAddExpense(true);
                      }}
                      className="shrink-0"
                    >
                      Add Expense
                    </Button>
                  </div>
                </div>

                {/* Secondary Filters Row */}
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
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

                  <Select value={peopleFilter} onValueChange={setPeopleFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All People</SelectItem>
                      {getAllPeople([...customPeople, ...publicPeople]).map((person) => (
                        <SelectItem key={person.id} value={person.id!}>
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                              style={{ backgroundColor: person.color }}
                            >
                              {person.icon}
                            </span>
                            {person.name}
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
              </div>

              <div 
                className={viewMode === 'grid' ? "gap-4" : "space-y-4"}
                style={viewMode === 'grid' ? {
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem'
                } : {}}
              >
                {filteredAndSortedExpenses.length > 0 ? (
                  filteredAndSortedExpenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      onDelete={() => handleDeleteExpense(expense.id)}
                      onEdit={() => setEditingExpense(expense)}
                      customPeople={[...customPeople, ...publicPeople]}
                      viewMode={viewMode}
                    />
                  ))
                ) : (
                  <div className={viewMode === 'grid' ? "col-span-full" : ""}>
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
                  </div>
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
                onUpdateBudgets={handleUpdateBudgets}
                customCategories={customCategories}
                budgetTemplates={budgetTemplates}
                publicBudgetTemplates={publicBudgetTemplates}
                onAdoptBudgetTemplate={adoptBudgetTemplate}
                onAddBudgetTemplate={addBudgetTemplate}
                onUpdateBudgetTemplate={updateBudgetTemplate}
                onDeleteBudgetTemplate={deleteBudgetTemplate}
              />
            </TabsContent>

            <TabsContent value="templates">
              <RecurringTemplates 
                onAddExpense={handleAddExpenseVoid}
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

            <TabsContent value="people">
              <PeopleManager 
                user={user}
                customPeople={customPeople}
                publicPeople={publicPeople}
                onAddPerson={addPerson}
                onUpdatePerson={updatePerson}
                onDeletePerson={deletePerson}
                onAdoptPerson={adoptPerson}
              />
            </TabsContent>

            <TabsContent value="analyzer">
              <ComingSoon 
                title="AI Analyzer"
                description="Advanced AI-powered financial insights and recommendations"
                version="4.0"
                features={[
                  "Smart Budget Insights",
                  "Predictive Spending Analytics", 
                  "AI-Powered Categorization",
                  "Personalized Recommendations",
                  "Goal Achievement Tracking",
                  "Anomaly Detection"
                ]}
              />
            </TabsContent>

            <TabsContent value="ai-chat" className="h-full">
              <AIChatPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <PWAConnectionStatus />
      <UpdateNotification />
      
      {/* Bottom Navigation for Mobile - Hidden on Dashboard/Overview */}
      <BottomNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isVisible={activeTab !== 'dashboard'}
      />
      
      <Toaster position="top-right" />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAddExpense={handleAddExpenseVoid}
        customCategories={customCategories}
        customPeople={customPeople}
        publicPeople={publicPeople}
      />

      {/* Edit Expense Modal */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onUpdate={handleUpdateExpense}
          customCategories={customCategories}
          customPeople={customPeople}
          publicPeople={publicPeople}
        />
      )}

      {/* Gemini AI Chat */}
      {showAIChat && (
        <GeminiChat
          expenses={filteredAndSortedExpenses}
          budgets={budgets}
          onClose={() => setShowAIChat(false)}
          onAddExpense={addExpense}
          onUpdateExpense={updateExpense}
          onDeleteExpense={deleteExpense}
          onAddBudget={handleAddBudgetForChat}
          onUpdateBudget={updateBudget}
          onDeleteBudget={deleteBudget}
          onAddCategory={handleAddCategoryForChat}
          onUpdateCategory={updateCustomCategory}
          onDeleteCategory={deleteCustomCategory}
          onAddPerson={addPerson}
          onUpdatePerson={updatePerson}
          onDeletePerson={deletePerson}
          onAddTemplate={addTemplate}
          onDeleteTemplate={deleteTemplate}
        />
      )}

      {/* Floating AI Assistant Button */}
      <FloatingAIButton onClick={() => setShowAIChat(true)} />

      {/* Footer */}
      <Footer />
      
      {/* Cookie Banner */}
      <CookieBanner 
        onAccept={() => toast.success("Cookie preferences saved")} 
        onDecline={() => toast.info("Cookies declined - some features may be limited")}
      />
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
