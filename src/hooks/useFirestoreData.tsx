import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  subscribeToExpenses,
  subscribeToBudgets,
  subscribeToTemplates,
  subscribeToCustomCategories,
  subscribeToPublicCategories,
  subscribeToCustomPeople,
  subscribeToPublicPeople,
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
  addPersonToFirestore,
  updatePersonInFirestore,
  deletePersonFromFirestore,
  adoptPublicCategory,
  adoptPublicPerson,
  addBudgetTemplateToFirestore,
  updateBudgetTemplateInFirestore,
  deleteBudgetTemplateFromFirestore,
  adoptPublicBudgetTemplate,
} from '@/lib/firebase';
import { type Expense, type Budget, type RecurringTemplate, type CustomCategory, type BudgetTemplate, type Person } from '@/lib/types';

export function useFirestoreData() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [publicCategories, setPublicCategories] = useState<CustomCategory[]>([]);
  const [customPeople, setCustomPeople] = useState<Person[]>([]);
  const [publicPeople, setPublicPeople] = useState<Person[]>([]);
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
      setCustomPeople([]);
      setPublicPeople([]);
      setBudgetTemplates([]);
      setPublicBudgetTemplates([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribeFunctions: (() => void)[] = [];
    let timeoutId: NodeJS.Timeout;
    let isCleanedUp = false;

    // Add a delay to ensure Firebase auth is fully ready and permissions are set
    timeoutId = setTimeout(() => {
      if (isCleanedUp) return;

      try {
        // Subscribe to expenses
        const unsubscribeExpenses = subscribeToExpenses(user.uid, (expenseData) => {
          if (!isCleanedUp) {
            setExpenses(expenseData);
          }
        });
        if (unsubscribeExpenses) {
          unsubscribeFunctions.push(unsubscribeExpenses);
        }

        // Subscribe to budgets
        const unsubscribeBudgets = subscribeToBudgets(user.uid, (budgetData) => {
          if (!isCleanedUp) {
            setBudgets(budgetData);
          }
        });
        if (unsubscribeBudgets) {
          unsubscribeFunctions.push(unsubscribeBudgets);
        }

        // Subscribe to templates
        const unsubscribeTemplates = subscribeToTemplates(user.uid, (templateData) => {
          if (!isCleanedUp) {
            setTemplates(templateData);
          }
        });
        if (unsubscribeTemplates) {
          unsubscribeFunctions.push(unsubscribeTemplates);
        }

        // Subscribe to custom categories
        const unsubscribeCustomCategories = subscribeToCustomCategories(user.uid, (categoryData) => {
          if (!isCleanedUp) {
            setCustomCategories(categoryData);
          }
        });
        if (unsubscribeCustomCategories) {
          unsubscribeFunctions.push(unsubscribeCustomCategories);
        }

        // Subscribe to public categories
        const unsubscribePublicCategories = subscribeToPublicCategories((categoryData) => {
          if (!isCleanedUp) {
            setPublicCategories(categoryData);
          }
        });
        if (unsubscribePublicCategories) {
          unsubscribeFunctions.push(unsubscribePublicCategories);
        }

        // Subscribe to custom people
        const unsubscribeCustomPeople = subscribeToCustomPeople(user.uid, (peopleData) => {
          if (!isCleanedUp) {
            setCustomPeople(peopleData);
          }
        });
        if (unsubscribeCustomPeople) {
          unsubscribeFunctions.push(unsubscribeCustomPeople);
        }

        // Subscribe to public people
        const unsubscribePublicPeople = subscribeToPublicPeople((peopleData) => {
          if (!isCleanedUp) {
            setPublicPeople(peopleData);
          }
        });
        if (unsubscribePublicPeople) {
          unsubscribeFunctions.push(unsubscribePublicPeople);
        }

        // Subscribe to budget templates
        const unsubscribeBudgetTemplates = subscribeToBudgetTemplates(user.uid, (templateData) => {
          if (!isCleanedUp) {
            setBudgetTemplates(templateData);
          }
        });
        if (unsubscribeBudgetTemplates) {
          unsubscribeFunctions.push(unsubscribeBudgetTemplates);
        }

        // Subscribe to public budget templates
        const unsubscribePublicBudgetTemplates = subscribeToPublicBudgetTemplates((templateData) => {
          if (!isCleanedUp) {
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
      console.error('❌ addExpense: User not authenticated');
      throw new Error('User not authenticated');
    }
    
    console.log('🔐 USER DEBUG - addExpense user info:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
    
    console.log('💾 addExpense called with:', { 
      userId: user.uid, 
      expenseData,
      targetPath: `users/${user.uid}/expenses`
    });
    
    const expense = {
      ...expenseData,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const result = await addExpenseToFirestore(user.uid, expense);
      console.log('✅ addExpense successful - Document ID:', result);
      console.log('📍 Expense should be written to path:', `users/${user.uid}/expenses/${result}`);
      
      // VERIFICATION: Read back the expense to confirm it was written
      setTimeout(async () => {
        try {
          const docRef = doc(db, `users/${user.uid}/expenses`, result);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log('✅ VERIFICATION: Expense confirmed in Firestore:', docSnap.data());
          } else {
            console.error('❌ VERIFICATION: Expense NOT found in Firestore!');
          }
        } catch (verifyError) {
          console.error('❌ VERIFICATION ERROR:', verifyError);
        }
      }, 1000);
      
      return result;
    } catch (error) {
      console.error('❌ addExpense failed:', error);
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

  // Person operations
  const addPerson = async (personData: Omit<Person, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');
    
    const person = {
      ...personData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      createdBy: user.displayName || user.email || 'Anonymous'
    };
    
    await addPersonToFirestore(user.uid, person);
  };

  const updatePerson = async (personId: string, personData: Partial<Person>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    await updatePersonInFirestore(user.uid, personId, personData);
  };

  const deletePerson = async (personId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    await deletePersonFromFirestore(user.uid, personId);
    
    // Force refresh the people list since real-time subscription might not trigger
    try {
      const peopleSnapshot = await getDocs(query(
        collection(db, 'users', user.uid, 'customPeople'),
        orderBy('name', 'asc')
      ));
      const updatedPeople = peopleSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Person));
      setCustomPeople(updatedPeople);
    } catch (refreshError) {
      console.error('Failed to refresh people list:', refreshError);
    }
  };

  const adoptPerson = async (publicPerson: Person) => {
    if (!user) throw new Error('User not authenticated');
    await adoptPublicPerson(user.uid, publicPerson);
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
    customPeople,
    publicPeople,
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
    addPerson,
    updatePerson,
    deletePerson,
    adoptPerson,
    addBudgetTemplate,
    updateBudgetTemplate,
    deleteBudgetTemplate,
    adoptBudgetTemplate,
  };
}