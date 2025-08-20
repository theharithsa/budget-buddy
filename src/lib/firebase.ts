import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration - Replace with your Firebase project config
// To set up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing project
// 3. Enable Authentication with Google provider
// 4. Enable Firestore Database
// 5. Enable Storage
// 6. Add your domain to authorized domains in Authentication > Settings > Authorized domains
// 7. Copy your config from Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDrZD1uiFf6BCTBvMi0WDoAr0VJrEwXWL8",
  authDomain: "finbuddy-2025.firebaseapp.com",
  projectId: "finbuddy-2025",
  storageBucket: "finbuddy-2025.firebasestorage.app",
  messagingSenderId: "1080442347255",
  appId: "1:1080442347255:web:62813824efd5a9b12cfdf2",
  measurementId: "G-ESNPQSYLCB"
};

// Debug function to check Firebase configuration
export const debugFirebaseConfig = () => {
  console.log('Firebase Config:', {
    apiKey: firebaseConfig.apiKey ? '✓ Present' : '✗ Missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    currentDomain: window.location.origin,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  });
};

// Check if Firebase is properly initialized and user is authenticated
export const checkFirebaseReady = (user: any): boolean => {
  if (!auth) {
    console.error('Firebase auth not initialized');
    return false;
  }
  
  if (!db) {
    console.error('Firestore not initialized');
    return false;
  }
  
  if (!user) {
    console.error('User not authenticated');
    return false;
  }
  
  if (!user.uid) {
    console.error('User ID not available');
    return false;
  }
  
  console.log('Firebase ready check passed for user:', user.uid);
  return true;
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path where the file will be stored
 * @returns Promise that resolves to the download URL
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file. Please try again.');
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path - The storage path of the file to delete
 */
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    // Don't throw error for delete failures to avoid blocking other operations
  }
};

/**
 * Generate a unique file path for receipt storage
 * @param expenseId - The ID of the expense
 * @param fileName - The original file name
 * @returns A unique storage path
 */
export const generateReceiptPath = (expenseId: string, fileName: string): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  return `receipts/${expenseId}_${timestamp}.${extension}`;
};

/**
 * Validate file type and size for receipt uploads
 * @param file - The file to validate
 * @returns true if valid, throws error if invalid
 */
export const validateReceiptFile = (file: File): boolean => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and PDF files are allowed');
  }

  return true;
};

export { storage, auth, db };

// Authentication functions
export const signInWithGoogle = async (useRedirect: boolean = false): Promise<User> => {
  try {
    if (useRedirect) {
      // Use redirect method as fallback
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled by checkRedirectResult
      throw new Error('REDIRECT_IN_PROGRESS');
    } else {
      // Check if popup is blocked
      const testPopup = window.open('', '_blank', 'width=1,height=1');
      if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
        throw new Error('POPUP_BLOCKED');
      }
      testPopup.close();
      
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific Firebase auth errors
    if (error.message === 'POPUP_BLOCKED' || error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again, or use the redirect option.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in was cancelled. Please try again.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for authentication. Please contact support.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google sign-in is not enabled. Please contact support.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Another sign-in popup is already open.');
    } else if (error.message === 'REDIRECT_IN_PROGRESS') {
      throw error; // Re-throw to handle in component
    } else if (error.message?.includes('Popup blocked')) {
      throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
    } else {
      throw new Error(error.message || 'Failed to sign in with Google. Please try again.');
    }
  }
};

// Check for redirect result on app load
export const checkRedirectResult = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error: any) {
    console.error('Error checking redirect result:', error);
    throw new Error(error.message || 'Failed to complete sign in.');
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore data functions
export const addExpenseToFirestore = async (userId: string, expense: any): Promise<string> => {
  try {
    // Add detailed logging to debug the issue
    console.log('Adding expense to Firestore:', { userId, expense });
    
    if (!userId) {
      throw new Error('User ID is required to save expense');
    }
    
    // Check if Firebase is ready
    if (!checkFirebaseReady({ uid: userId })) {
      throw new Error('Firebase is not properly initialized');
    }
    
    // Ensure all required fields are present and handle undefined values
    const expenseData: any = {
      amount: Number(expense.amount),
      category: expense.category || '',
      description: expense.description || 'No description',
      date: expense.date || new Date().toISOString().split('T')[0],
      createdAt: expense.createdAt || new Date().toISOString(),
    };
    
    // Only include receiptUrl and receiptFileName if they have actual non-empty values
    if (expense.receiptUrl && expense.receiptUrl.trim() !== '') {
      expenseData.receiptUrl = expense.receiptUrl;
    }
    if (expense.receiptFileName && expense.receiptFileName.trim() !== '') {
      expenseData.receiptFileName = expense.receiptFileName;
    }
    
    console.log('Processed expense data:', expenseData);
    
    const docRef = await addDoc(collection(db, 'users', userId, 'expenses'), expenseData);
    console.log('Expense added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('Detailed error adding expense:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      userId,
      expense
    });
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please make sure you are signed in and try again.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service is temporarily unavailable. Please try again in a moment.');
    } else if (error.code === 'unauthenticated') {
      throw new Error('You must be signed in to add expenses.');
    } else if (error.message?.includes('User ID is required')) {
      throw new Error('Authentication error. Please sign out and sign in again.');
    } else if (error.message?.includes('Firebase is not properly initialized')) {
      throw new Error('Application initialization error. Please refresh the page and try again.');
    } else {
      throw new Error(error.message || 'Failed to save expense. Please try again.');
    }
  }
};

export const updateExpenseInFirestore = async (userId: string, expenseId: string, expense: any): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await updateDoc(docRef, expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw new Error('Failed to update expense. Please try again.');
  }
};

export const deleteExpenseFromFirestore = async (userId: string, expenseId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw new Error('Failed to delete expense. Please try again.');
  }
};

export const getExpensesFromFirestore = async (userId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'expenses'),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting expenses:', error);
    throw new Error('Failed to load expenses. Please try again.');
  }
};

export const subscribeToExpenses = (userId: string, callback: (expenses: any[]) => void) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'expenses'),
      orderBy('date', 'desc')
    );
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(expenses);
      },
      (error) => {
        console.error('Error in expenses subscription:', error);
        // Return empty array on error to prevent crashes
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up expenses subscription:', error);
    // Return a no-op unsubscribe function
    return () => {};
  }
};

export const addBudgetToFirestore = async (userId: string, budget: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'budgets'), budget);
    return docRef.id;
  } catch (error) {
    console.error('Error adding budget:', error);
    throw new Error('Failed to save budget. Please try again.');
  }
};

export const updateBudgetInFirestore = async (userId: string, budgetId: string, budget: any): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    await updateDoc(docRef, budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    throw new Error('Failed to update budget. Please try again.');
  }
};

export const deleteBudgetFromFirestore = async (userId: string, budgetId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'budgets', budgetId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw new Error('Failed to delete budget. Please try again.');
  }
};

export const subscribeToBudgets = (userId: string, callback: (budgets: any[]) => void) => {
  try {
    const q = query(collection(db, 'users', userId, 'budgets'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const budgets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(budgets);
      },
      (error) => {
        console.error('Error in budgets subscription:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up budgets subscription:', error);
    return () => {};
  }
};

export const addTemplateToFirestore = async (userId: string, template: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'templates'), template);
    return docRef.id;
  } catch (error) {
    console.error('Error adding template:', error);
    throw new Error('Failed to save template. Please try again.');
  }
};

export const deleteTemplateFromFirestore = async (userId: string, templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'templates', templateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw new Error('Failed to delete template. Please try again.');
  }
};

export const subscribeToTemplates = (userId: string, callback: (templates: any[]) => void) => {
  try {
    const q = query(collection(db, 'users', userId, 'templates'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(templates);
      },
      (error) => {
        console.error('Error in templates subscription:', error);
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up templates subscription:', error);
    return () => {};
  }
};

// Custom Category functions
export const addCustomCategoryToFirestore = async (userId: string, category: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'customCategories'), category);
    
    // If category is public, also add to global collection
    if (category.isPublic) {
      await addDoc(collection(db, 'publicCategories'), {
        ...category,
        originalId: docRef.id,
        userId: userId
      });
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding custom category:', error);
    throw new Error('Failed to save custom category. Please try again.');
  }
};

export const updateCustomCategoryInFirestore = async (userId: string, categoryId: string, category: any): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'customCategories', categoryId);
    await updateDoc(docRef, category);
    
    // Update in public collection if it exists there
    if (category.isPublic) {
      const publicQ = query(
        collection(db, 'publicCategories'),
        where('originalId', '==', categoryId),
        where('userId', '==', userId)
      );
      const publicSnapshot = await getDocs(publicQ);
      
      if (!publicSnapshot.empty) {
        const publicDoc = publicSnapshot.docs[0];
        await updateDoc(doc(db, 'publicCategories', publicDoc.id), category);
      } else {
        // Add to public collection if not exists
        await addDoc(collection(db, 'publicCategories'), {
          ...category,
          originalId: categoryId,
          userId: userId
        });
      }
    } else {
      // Remove from public collection if no longer public
      const publicQ = query(
        collection(db, 'publicCategories'),
        where('originalId', '==', categoryId),
        where('userId', '==', userId)
      );
      const publicSnapshot = await getDocs(publicQ);
      
      if (!publicSnapshot.empty) {
        const publicDoc = publicSnapshot.docs[0];
        await deleteDoc(doc(db, 'publicCategories', publicDoc.id));
      }
    }
  } catch (error) {
    console.error('Error updating custom category:', error);
    throw new Error('Failed to update custom category. Please try again.');
  }
};

export const deleteCustomCategoryFromFirestore = async (userId: string, categoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'customCategories', categoryId);
    await deleteDoc(docRef);
    
    // Remove from public collection if it exists there
    const publicQ = query(
      collection(db, 'publicCategories'),
      where('originalId', '==', categoryId),
      where('userId', '==', userId)
    );
    const publicSnapshot = await getDocs(publicQ);
    
    if (!publicSnapshot.empty) {
      const publicDoc = publicSnapshot.docs[0];
      await deleteDoc(doc(db, 'publicCategories', publicDoc.id));
    }
  } catch (error) {
    console.error('Error deleting custom category:', error);
    throw new Error('Failed to delete custom category. Please try again.');
  }
};

export const subscribeToCustomCategories = (userId: string, callback: (categories: any[]) => void) => {
  const q = query(collection(db, 'users', userId, 'customCategories'));
  
  return onSnapshot(q, (querySnapshot) => {
    const categories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(categories);
  });
};

export const subscribeToPublicCategories = (callback: (categories: any[]) => void) => {
  const q = query(collection(db, 'publicCategories'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const categories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(categories);
  });
};

export const adoptPublicCategory = async (userId: string, publicCategory: any): Promise<string> => {
  try {
    // Add to user's custom categories
    const categoryData = {
      name: publicCategory.name,
      color: publicCategory.color,
      icon: publicCategory.icon,
      isPublic: false, // User's copy is private by default
      createdAt: new Date().toISOString(),
      createdBy: `Adopted from ${publicCategory.createdBy}`
    };
    
    const docRef = await addDoc(collection(db, 'users', userId, 'customCategories'), categoryData);
    return docRef.id;
  } catch (error) {
    console.error('Error adopting public category:', error);
    throw new Error('Failed to adopt category. Please try again.');
  }
};