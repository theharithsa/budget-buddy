import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToExpenses,
  subscribeToBudgets,
  subscribeToTemplates,
  subscribeToCustomCategories,
  subscribeToPublicCategories,
  subscribeToBudgetTemplates,
  subscribeToPublicBudgetTemplates,
  addExpenseToFirestore,
  updateExpenseInFirestore,
  deleteExpenseFromFirestore,
  addBudgetToFirestore,
  updateBudgetInFirestore,
  deleteBudgetFromFirestore,
  addTemplateToFirestore,
  deleteTemplateFromFirestore,
  addCustomCategoryToFirestore,
  updateCustomCategoryInFirestore,
  deleteCustomCategoryFromFirestore,
  adoptPublicCategory,
  addBudgetTemplateToFirestore,
  updateBudgetTemplateInFirestore,
  deleteBudgetTemplateFromFirestore,
  adoptPublicBudgetTemplate,
} from '@/lib/firebase';
import { type Expense, type Budget, type RecurringTemplate, type CustomCategory, type BudgetTemplate } from '@/lib/types';

export function useFirestoreData() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [publicCategories, setPublicCategories] = useState<CustomCategory[]>([]);
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
  const [publicBudgetTemplates, setPublicBudgetTemplates] = useState<BudgetTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !user.uid) {
      // Clear all data when user is not authenticated
      setExpenses([]);
      setBudgets([]);
      setTemplates([]);
      setCustomCategories([]);
      setPublicCategories([]);
      setBudgetTemplates([]);
      setPublicBudgetTemplates([]);
      setLoading(false);
      return;
    }

    console.log('Setting up Firebase subscriptions for user:', user.uid);
    setLoading(true);

    let unsubscribeFunctions: (() => void)[] = [];
    let timeoutId: NodeJS.Timeout;
    let isCleanedUp = false;

    // Add a delay to ensure Firebase auth is fully ready and permissions are set
    timeoutId = setTimeout(() => {
      if (isCleanedUp) return;

      try {
        // Subscribe to expenses
        const unsubscribeExpenses = subscribeToExpenses(user.uid, (expenseData) => {
          if (!isCleanedUp) {
            console.log('Received expenses data:', expenseData.length, 'expenses');
            setExpenses(expenseData);
          }
        });
        if (unsubscribeExpenses) {
          unsubscribeFunctions.push(unsubscribeExpenses);
        }

        // Subscribe to budgets
        const unsubscribeBudgets = subscribeToBudgets(user.uid, (budgetData) => {
          if (!isCleanedUp) {
            console.log('Received budgets data:', budgetData.length, 'budgets');
            setBudgets(budgetData);
          }
        });
        if (unsubscribeBudgets) {
          unsubscribeFunctions.push(unsubscribeBudgets);
        }

        // Subscribe to templates
        const unsubscribeTemplates = subscribeToTemplates(user.uid, (templateData) => {
          if (!isCleanedUp) {
            console.log('Received templates data:', templateData.length, 'templates');
            setTemplates(templateData);
          }
        });
        if (unsubscribeTemplates) {
          unsubscribeFunctions.push(unsubscribeTemplates);
        }

        // Subscribe to custom categories
        const unsubscribeCustomCategories = subscribeToCustomCategories(user.uid, (categoryData) => {
          if (!isCleanedUp) {
            console.log('Received custom categories data:', categoryData.length, 'categories');
            setCustomCategories(categoryData);
          }
        });
        if (unsubscribeCustomCategories) {
          unsubscribeFunctions.push(unsubscribeCustomCategories);
        }

        // Subscribe to public categories
        const unsubscribePublicCategories = subscribeToPublicCategories((categoryData) => {
          if (!isCleanedUp) {
            console.log('Received public categories data:', categoryData.length, 'public categories');
            setPublicCategories(categoryData);
          }
        });
        if (unsubscribePublicCategories) {
          unsubscribeFunctions.push(unsubscribePublicCategories);
        }

        // Subscribe to budget templates
        const unsubscribeBudgetTemplates = subscribeToBudgetTemplates(user.uid, (templateData) => {
          if (!isCleanedUp) {
            console.log('Received budget templates data:', templateData.length, 'budget templates');
            setBudgetTemplates(templateData);
          }
        });
        if (unsubscribeBudgetTemplates) {
          unsubscribeFunctions.push(unsubscribeBudgetTemplates);
        }

        // Subscribe to public budget templates
        const unsubscribePublicBudgetTemplates = subscribeToPublicBudgetTemplates((templateData) => {
          if (!isCleanedUp) {
            console.log('Received public budget templates data:', templateData.length, 'public budget templates');
            setPublicBudgetTemplates(templateData);
          }
        });
        if (unsubscribePublicBudgetTemplates) {
          unsubscribeFunctions.push(unsubscribePublicBudgetTemplates);
        }

        if (!isCleanedUp) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error setting up Firebase subscriptions:', error);
        if (!isCleanedUp) {
          setLoading(false);
        }
      }
    }, 500); // Increased delay to ensure auth is fully ready

    return () => {
      console.log('Cleaning up Firebase subscriptions');
      isCleanedUp = true;
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
    };
  }, [user]);

  // Expense operations
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) {
      console.error('addExpense: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('addExpense called with:', { userId: user.uid, expenseData });
    
    const expense = {
      ...expenseData,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const result = await addExpenseToFirestore(user.uid, expense);
      console.log('addExpense successful:', result);
      return result;
    } catch (error) {
      console.error('addExpense failed:', error);
      throw error;
    }
  };

  const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    if (!user) throw new Error('User not authenticated');
    await updateExpenseInFirestore(user.uid, expenseId, expenseData);
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteExpenseFromFirestore(user.uid, expenseId);
  };

  // Budget operations
  const addBudget = async (budgetData: Omit<Budget, 'id'>) => {
    if (!user) throw new Error('User not authenticated');
    await addBudgetToFirestore(user.uid, budgetData);
  };

  const updateBudget = async (budgetId: string, budgetData: Partial<Budget>) => {
    if (!user) throw new Error('User not authenticated');
    await updateBudgetInFirestore(user.uid, budgetId, budgetData);
  };

  const deleteBudget = async (budgetId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteBudgetFromFirestore(user.uid, budgetId);
  };

  // Template operations
  const addTemplate = async (templateData: Omit<RecurringTemplate, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const template = {
      ...templateData,
      createdAt: new Date().toISOString(),
    };
    
    await addTemplateToFirestore(user.uid, template);
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteTemplateFromFirestore(user.uid, templateId);
  };

  // Custom Category operations
  const addCustomCategory = async (categoryData: Omit<CustomCategory, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const category = {
      ...categoryData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      createdBy: user.displayName || user.email || 'Anonymous'
    };
    
    await addCustomCategoryToFirestore(user.uid, category);
  };

  const updateCustomCategory = async (categoryId: string, categoryData: Partial<CustomCategory>) => {
    if (!user) throw new Error('User not authenticated');
    await updateCustomCategoryInFirestore(user.uid, categoryId, categoryData);
  };

  const deleteCustomCategory = async (categoryId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteCustomCategoryFromFirestore(user.uid, categoryId);
  };

  const adoptCategory = async (publicCategory: CustomCategory) => {
    if (!user) throw new Error('User not authenticated');
    await adoptPublicCategory(user.uid, publicCategory);
  };

  // Budget Template operations
  const addBudgetTemplate = async (templateData: Omit<BudgetTemplate, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const template = {
      ...templateData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      createdBy: user.displayName || user.email || 'Anonymous'
    };
    
    await addBudgetTemplateToFirestore(user.uid, template);
  };

  const updateBudgetTemplate = async (templateId: string, templateData: Partial<BudgetTemplate>) => {
    if (!user) throw new Error('User not authenticated');
    await updateBudgetTemplateInFirestore(user.uid, templateId, templateData);
  };

  const deleteBudgetTemplate = async (templateId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteBudgetTemplateFromFirestore(user.uid, templateId);
  };

  const adoptBudgetTemplate = async (publicTemplate: BudgetTemplate) => {
    if (!user) throw new Error('User not authenticated');
    await adoptPublicBudgetTemplate(user.uid, publicTemplate);
  };

  return {
    expenses,
    budgets,
    templates,
    customCategories,
    publicCategories,
    budgetTemplates,
    publicBudgetTemplates,
    loading,
    addExpense,
    updateExpense,
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
    addBudgetTemplate,
    updateBudgetTemplate,
    deleteBudgetTemplate,
    adoptBudgetTemplate,
  };
}