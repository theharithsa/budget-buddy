import { useFirestoreData } from './useFirestoreData.tsx';
import { useProfiles } from '@/contexts/ProfileContext';
import { useMemo, useCallback } from 'react';
import { type Expense, type Budget, filterExpensesByProfile } from '@/lib/types';
import { dynatraceMonitor } from '@/lib/dynatrace-monitor';

/**
 * Hook that provides profile-aware filtering of firestore data
 * Returns only data for the currently active profile
 */
export function useProfileData() {
  // Get all firestore data (unfiltered)
  const firestoreData = useFirestoreData();
  
  // Get profile context
  const { activeProfile, profiles } = useProfiles();

  // Filter expenses and budgets by active profile
  const profileExpenses = useMemo(() => {
    if (!activeProfile || !firestoreData.expenses) return [];
    return filterExpensesByProfile(firestoreData.expenses, activeProfile.id);
  }, [firestoreData.expenses, activeProfile?.id]);

  const profileBudgets = useMemo(() => {
    if (!activeProfile || !firestoreData.budgets) return [];
    return firestoreData.budgets.filter(budget => budget.profileId === activeProfile.id);
  }, [firestoreData.budgets, activeProfile?.id]);

  // Enhanced add expense function that includes profileId and monitoring
  const addExpense = useCallback(async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'profileId'>) => {
    if (!activeProfile) {
      throw new Error('No active profile selected');
    }

    try {
      // Track expense creation with monitoring
      return await dynatraceMonitor.trackXhrAction(
        'ProfileData.AddExpense',
        'POST',
        `/profile/${activeProfile.id}/expenses`,
        async () => {
          const expenseWithProfile = {
            ...expenseData,
            profileId: activeProfile.id
          };

          const result = await firestoreData.addExpense(expenseWithProfile);

          // Send BizEvent for profile-aware expense creation
          dynatraceMonitor.sendBizEvent('Profile Expense Added', {
            'event.name': 'Profile Expense Added',
            profileId: activeProfile.id,
            profileName: activeProfile.name,
            amount: expenseData.amount,
            category: expenseData.category,
            timestamp: new Date().toISOString()
          });

          return result;
        }
      );

    } catch (error) {
      // Track failed expense creation
      dynatraceMonitor.sendBizEvent('Profile Expense Add Failed', {
        'event.name': 'Profile Expense Add Failed',
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        amount: expenseData.amount,
        category: expenseData.category,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }, [activeProfile, firestoreData.addExpense]);

  // Enhanced add budget function that includes profileId and monitoring
  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id' | 'createdAt' | 'profileId'>) => {
    if (!activeProfile) {
      throw new Error('No active profile selected');
    }

    try {
      // Track budget creation with monitoring
      return await dynatraceMonitor.trackXhrAction(
        'ProfileData.AddBudget',
        'POST',
        `/profile/${activeProfile.id}/budgets`,
        async () => {
          const budgetWithProfile = {
            ...budgetData,
            profileId: activeProfile.id
          };

          const result = await firestoreData.addBudget(budgetWithProfile);

          // Send BizEvent for profile-aware budget creation
          dynatraceMonitor.sendBizEvent('Profile Budget Added', {
            'event.name': 'Profile Budget Added',
            profileId: activeProfile.id,
            profileName: activeProfile.name,
            category: budgetData.category,
            limit: budgetData.limit,
            timestamp: new Date().toISOString()
          });

          return result;
        }
      );

    } catch (error) {
      // Track failed budget creation
      dynatraceMonitor.sendBizEvent('Profile Budget Add Failed', {
        'event.name': 'Profile Budget Add Failed',
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        category: budgetData.category,
        limit: budgetData.limit,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }, [activeProfile, firestoreData.addBudget]);

  // Return filtered data along with profile-aware CRUD operations
  return {
    // Filtered data for current profile
    expenses: profileExpenses,
    budgets: profileBudgets,
    
    // Unfiltered data (for cross-profile analytics)
    allExpenses: firestoreData.expenses,
    allBudgets: firestoreData.budgets,
    
    // Profile-aware operations
    addExpense,
    updateExpense: firestoreData.updateExpense,
    deleteExpense: firestoreData.deleteExpense,
    addBudget,
    updateBudget: firestoreData.updateBudget,
    deleteBudget: firestoreData.deleteBudget,
    
    // Pass through non-profile-specific data and operations
    templates: firestoreData.templates,
    customCategories: firestoreData.customCategories,
    publicCategories: firestoreData.publicCategories,
    customPeople: firestoreData.customPeople,
    publicPeople: firestoreData.publicPeople,
    budgetTemplates: firestoreData.budgetTemplates,
    publicBudgetTemplates: firestoreData.publicBudgetTemplates,
    
    addTemplate: firestoreData.addTemplate,
    deleteTemplate: firestoreData.deleteTemplate,
    addCustomCategory: firestoreData.addCustomCategory,
    updateCustomCategory: firestoreData.updateCustomCategory,
    deleteCustomCategory: firestoreData.deleteCustomCategory,
    addPerson: firestoreData.addPerson,
    updatePerson: firestoreData.updatePerson,
    deletePerson: firestoreData.deletePerson,
    adoptCategory: firestoreData.adoptCategory,
    adoptPerson: firestoreData.adoptPerson,
    addBudgetTemplate: firestoreData.addBudgetTemplate,
    updateBudgetTemplate: firestoreData.updateBudgetTemplate,
    deleteBudgetTemplate: firestoreData.deleteBudgetTemplate,
    adoptBudgetTemplate: firestoreData.adoptBudgetTemplate,
    
    // Profile context
    activeProfile,
    profiles,
    
    // Loading state
    loading: firestoreData.loading
  };
}
