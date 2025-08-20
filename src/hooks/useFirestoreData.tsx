import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToExpenses,
  subscribeToBudgets,
  subscribeToTemplates,
  subscribeToCustomCategories,
  subscribeToPublicCategories,
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
} from '@/lib/firebase';
import { type Expense, type Budget, type RecurringTemplate, type CustomCategory } from '@/lib/types';

export function useFirestoreData() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [publicCategories, setPublicCategories] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      setTemplates([]);
      setCustomCategories([]);
      setPublicCategories([]);
      setLoading(false);
      return;
    }

    console.log('Setting up Firebase subscriptions for user:', user.uid);
    setLoading(true);

    let unsubscribeFunctions: (() => void)[] = [];

    try {
      // Subscribe to expenses
      const unsubscribeExpenses = subscribeToExpenses(user.uid, (expenseData) => {
        console.log('Received expenses data:', expenseData.length, 'expenses');
        setExpenses(expenseData);
      });
      unsubscribeFunctions.push(unsubscribeExpenses);

      // Subscribe to budgets
      const unsubscribeBudgets = subscribeToBudgets(user.uid, (budgetData) => {
        console.log('Received budgets data:', budgetData.length, 'budgets');
        setBudgets(budgetData);
      });
      unsubscribeFunctions.push(unsubscribeBudgets);

      // Subscribe to templates
      const unsubscribeTemplates = subscribeToTemplates(user.uid, (templateData) => {
        console.log('Received templates data:', templateData.length, 'templates');
        setTemplates(templateData);
      });
      unsubscribeFunctions.push(unsubscribeTemplates);

      // Subscribe to custom categories
      const unsubscribeCustomCategories = subscribeToCustomCategories(user.uid, (categoryData) => {
        console.log('Received custom categories data:', categoryData.length, 'categories');
        setCustomCategories(categoryData);
      });
      unsubscribeFunctions.push(unsubscribeCustomCategories);

      // Subscribe to public categories
      const unsubscribePublicCategories = subscribeToPublicCategories((categoryData) => {
        console.log('Received public categories data:', categoryData.length, 'public categories');
        setPublicCategories(categoryData);
      });
      unsubscribeFunctions.push(unsubscribePublicCategories);

      setLoading(false);
    } catch (error) {
      console.error('Error setting up Firebase subscriptions:', error);
      setLoading(false);
    }

    return () => {
      console.log('Cleaning up Firebase subscriptions');
      unsubscribeFunctions.forEach(unsubscribe => {
        try {
          unsubscribe();
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

  return {
    expenses,
    budgets,
    templates,
    customCategories,
    publicCategories,
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
  };
}