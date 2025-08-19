import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase configuration - Replace with your Firebase project config
// To set up Firebase:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing project
// 3. Enable Authentication with Google provider
// 4. Enable Firestore Database
// 5. Enable Storage
// 6. Copy your config from Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyB2G6oajY2Q_erWxHkagZRacB3qH9quT-M",
  authDomain: "vh-fin-buddy.firebaseapp.com",
  projectId: "vh-fin-buddy",
  storageBucket: "vh-fin-buddy.firebasestorage.app",
  messagingSenderId: "822131624735",
  appId: "1:822131624735:web:9c22081db0dcdf2dd8be2a",
  measurementId: "G-WYC7VV3QQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();

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
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw new Error('Failed to sign in with Google. Please try again.');
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
    const docRef = await addDoc(collection(db, 'users', userId, 'expenses'), expense);
    return docRef.id;
  } catch (error) {
    console.error('Error adding expense:', error);
    throw new Error('Failed to save expense. Please try again.');
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
  const q = query(
    collection(db, 'users', userId, 'expenses'),
    orderBy('date', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(expenses);
  });
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
  const q = query(collection(db, 'users', userId, 'budgets'));
  
  return onSnapshot(q, (querySnapshot) => {
    const budgets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(budgets);
  });
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
  const q = query(collection(db, 'users', userId, 'templates'));
  
  return onSnapshot(q, (querySnapshot) => {
    const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(templates);
  });
};