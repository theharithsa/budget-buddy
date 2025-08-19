import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToExpenses,
  subscribeToBudgets,
  subscribeToTemplates,
  addExpenseToFirestore,
  updateExpenseInFirestore,
  deleteExpenseFromFirestore,
  addBudgetToFirestore,
  updateBudgetInFirestore,
  deleteBudgetFromFirestore,
  addTemplateToFirestore,
  deleteTemplateFromFirestore,
} from '@/lib/firebase';
import { type Expense, type Budget, type RecurringTemplate } from '@/lib/types';

export function useFirestoreData() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setBudgets([]);
      setTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to expenses
    const unsubscribeExpenses = subscribeToExpenses(user.uid, (expenseData) => {
      setExpenses(expenseData);
    });

    // Subscribe to budgets
    const unsubscribeBudgets = subscribeToBudgets(user.uid, (budgetData) => {
      setBudgets(budgetData);
    });

    // Subscribe to templates
    const unsubscribeTemplates = subscribeToTemplates(user.uid, (templateData) => {
      setTemplates(templateData);
    });

    setLoading(false);

    return () => {
      unsubscribeExpenses();
      unsubscribeBudgets();
      unsubscribeTemplates();
    };
  }, [user]);

  // Expense operations
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const expense = {
      ...expenseData,
      createdAt: new Date().toISOString(),
    };
    
    await addExpenseToFirestore(user.uid, expense);
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

  return {
    expenses,
    budgets,
    templates,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    addBudget,
    updateBudget,
    deleteBudget,
    addTemplate,
    deleteTemplate,
  };
}