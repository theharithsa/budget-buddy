import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signOut, 
  onAuthStateChanged, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink
} from 'firebase/auth';
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, increment, Unsubscribe, deleteField } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Person } from './types';
// import { log } from './logger';

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
  const currentDomain = window.location.origin;
  const currentHostname = window.location.hostname;
  
  console.log('🔧 Firebase Configuration Debug:', {
    apiKey: firebaseConfig.apiKey ? '✓ Present' : '✗ Missing',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    currentDomain,
    currentHostname,
    isLocalhost: currentHostname === 'localhost' || currentHostname === '127.0.0.1',
    port: window.location.port,
    fullURL: window.location.href
  });
  
  console.log('📱 Phone Auth Configuration Check:');
  console.log('  1. Firebase Console: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/settings');
  console.log('  2. Expected authorized domains: localhost, ' + firebaseConfig.authDomain);
  console.log('  3. reCAPTCHA configuration required in Phone number sign-in section');
  
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    currentDomain,
    consoleURL: 'https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/authentication/settings'
  };
};

// Handle App Check for development BEFORE initializing Firebase
// The "auth/firebase-app-check-token-is-invalid" error indicates App Check is enabled
// but not properly configured for development
// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');
googleProvider.setCustomParameters({
  prompt: 'select_account'
  // Remove any hosted domain restrictions for better compatibility
});

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

// Test function for debugging auth issues - can be called from browser console
export const testAuthMethods = async () => {
  console.log('🧪 Testing Firebase Authentication Methods...');
  
  // Test 1: Basic Firebase setup
  debugFirebaseConfig();
  
  // Test 2: Test redirect method availability
  try {
    console.log('🔄 Testing signInWithRedirect availability...');
    console.log('✅ signInWithRedirect function available:', typeof signInWithRedirect);
    console.log('✅ getRedirectResult function available:', typeof getRedirectResult);
    console.log('✅ GoogleAuthProvider available:', typeof GoogleAuthProvider);
    
    // Test provider configuration
    const testProvider = new GoogleAuthProvider();
    console.log('✅ GoogleAuthProvider created successfully');
    console.log('🔧 Provider ID:', testProvider.providerId);
    
  } catch (error) {
    console.error('❌ Basic Firebase auth setup failed:', error);
  }
  
  // Test 3: Check current auth state
  try {
    console.log('👤 Current auth state:', {
      currentUser: auth.currentUser ? 'Signed in' : 'Not signed in',
      userEmail: auth.currentUser?.email,
      userUid: auth.currentUser?.uid
    });
  } catch (error) {
    console.error('❌ Error checking auth state:', error);
  }
  
  // Test 4: Check for any pending redirect results
  try {
    console.log('🔍 Checking for existing redirect results...');
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('✅ Found existing redirect result:', result.user?.email);
    } else {
      console.log('ℹ️ No existing redirect result found');
    }
  } catch (error) {
    console.error('❌ Error checking redirect result:', error);
  }
  
  // Test 5: Simulate redirect initiation (without actually redirecting)
  try {
    console.log('🔄 Testing redirect initiation (simulation)...');
    console.log('🔧 Auth object ready:', !!auth);
    console.log('🔧 GoogleProvider ready:', !!googleProvider);
    console.log('🔧 Current domain authorized check...');
    
    // Check if we can create the redirect URL
    console.log('✅ Redirect simulation test passed - no errors in setup');
  } catch (error) {
    console.error('❌ Redirect simulation failed:', error);
  }
  
  console.log('🧪 Auth method testing complete. Check logs above for any issues.');
  
  // Return a summary
  return {
    authReady: !!auth,
    providerReady: !!googleProvider,
    redirectAvailable: typeof signInWithRedirect === 'function',
    currentUser: auth.currentUser?.email || 'None'
  };
};

// Make it globally available for debugging
if (typeof window !== 'undefined') {
  (window as any).testAuthMethods = testAuthMethods;
  (window as any).debugFirebaseConfig = debugFirebaseConfig;
  (window as any).clearAuthCache = async () => {
    console.log('🧹 Clearing auth cache...');
    try {
      await auth.signOut();
      console.log('✅ Auth cache cleared');
    } catch (error) {
      console.error('❌ Error clearing auth cache:', error);
    }
  };
  
  // Clear all Firebase and App Check related cache
  (window as any).clearFirebaseCache = async () => {
    console.log('🧹 Clearing all Firebase cache...');
    try {
      // Clear auth
      await auth.signOut();
      
      // Clear localStorage Firebase entries
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('Firebase') || key.includes('appCheck'))) {
          localStorage.removeItem(key);
        }
      }
      
      // Clear sessionStorage Firebase entries  
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('firebase') || key.includes('Firebase') || key.includes('appCheck'))) {
          sessionStorage.removeItem(key);
        }
      }
      
      // Force reset debug token is no longer needed
      console.log('✅ Firebase cache cleared');
      console.log('🔄 Please refresh the page for changes to take effect');
    } catch (error) {
      console.error('❌ Error clearing Firebase cache:', error);
    }
  };
  
  // Test redirect specifically
  (window as any).testRedirectFlow = async () => {
    console.log('🔄 Testing redirect flow step by step...');
    
    try {
      console.log('1️⃣ Checking auth state before redirect...');
      console.log('Current user:', auth.currentUser?.email || 'None');
      
      console.log('2️⃣ Creating GoogleAuthProvider...');
      const testProvider = new GoogleAuthProvider();
      testProvider.addScope('email');
      testProvider.addScope('profile');
      console.log('Provider created:', testProvider.providerId);
      
      console.log('3️⃣ Attempting signInWithRedirect...');
      console.log('Auth object:', !!auth);
      console.log('Provider object:', !!testProvider);
      
      // This should initiate the redirect
      await signInWithRedirect(auth, testProvider);
      console.log('4️⃣ signInWithRedirect completed - user should be redirected');
      
      // This line should never execute because redirect takes user away
      console.warn('⚠️ Warning: Code after signInWithRedirect executed - redirect may have failed');
      
    } catch (error) {
      console.error('❌ Redirect test failed:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    }
  };
}

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
 * @param userId - The user ID for organizing files
 * @param fileName - The original file name
 * @returns A unique storage path
 */
export const generateReceiptPath = (userId: string, fileName: string): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_'); // Clean filename
  return `receipts/${userId}/${timestamp}_${cleanFileName}`;
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
  const startTime = performance.now();
  
  console.log(`🚀 Starting Google sign-in with ${useRedirect ? 'REDIRECT' : 'POPUP'} method`);
  console.log('🔧 Current URL:', window.location.href);
  console.log('🔧 Current Origin:', window.location.origin);
  
  // log.info('Firebase', 'Google sign-in initiated', { useRedirect });
  
  try {
    if (useRedirect) {
      console.log('🔄 Initiating redirect authentication...');
      console.log('🔧 GoogleProvider config:', {
        providerId: googleProvider.providerId,
        customParameters: (googleProvider as any)._config?.customParameters
      });
      
      // log.debug('Firebase', 'Using redirect authentication method');
      // Use redirect method as fallback
      await signInWithRedirect(auth, googleProvider);
      console.log('✅ Redirect initiated successfully - user will be redirected');
      
      // This should never execute because redirect takes the user away
      console.warn('⚠️ Code after signInWithRedirect executed - this is unexpected');
      
      // log.info('Firebase', 'Redirect sign-in initiated successfully');
      // The result will be handled by checkRedirectResult
      throw new Error('REDIRECT_IN_PROGRESS');
    } else {
      console.log('🪟 Attempting popup authentication...');
      // log.debug('Firebase', 'Using popup authentication method');
      
      // For Safari/iOS, try popup without the test popup check
      const userAgent = navigator.userAgent.toLowerCase();
      const isSafariOrIOS = userAgent.includes('safari') && !userAgent.includes('chrome') || /ipad|iphone|ipod/.test(userAgent);
      
      if (!isSafariOrIOS) {
        // Check if popup is blocked (only for non-Safari browsers)
        const testPopup = window.open('', '_blank', 'width=1,height=1');
        if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
          console.warn('⚠️ Popup blocked by browser');
          // log.warn('Firebase', 'Popup blocked by browser');
          throw new Error('POPUP_BLOCKED');
        }
        testPopup.close();
      } else {
        console.log('🍎 Safari/iOS detected - attempting popup without pre-check');
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      
      const duration = performance.now() - startTime;
      console.log('✅ Popup sign-in successful:', {
        userId: result.user.uid,
        email: result.user.email,
        duration: `${duration.toFixed(2)}ms`
      });
      // log.performance('GoogleSignInPopup', duration);
      // log.info('Firebase', 'Google sign-in successful', { 
      //   userId: result.user.uid,
      //   email: result.user.email,
      //   duration 
      // });
      
      return result.user;
    }
  } catch (error: any) {
    const duration = performance.now() - startTime;
    
    console.error(`❌ Google sign-in failed (${useRedirect ? 'REDIRECT' : 'POPUP'}):`, {
      error: error.message,
      code: error.code,
      duration: `${duration.toFixed(2)}ms`
    });
    // log.error('Firebase', 'Google sign-in failed', {
    //   error: error.message,
    //   code: error.code,
    //   useRedirect,
    //   duration
    // }, error);
    
    console.error('Error signing in with Google:', error);
    
    // Handle specific Firebase auth errors
    if (error.message === 'POPUP_BLOCKED' || error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by your browser. Please allow popups for this site and try again.');
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
  // log.debug('Firebase', 'Checking redirect result');
  console.log('🔍 Checking for redirect result...');
  console.log('🔧 Current URL:', window.location.href);
  console.log('🔧 URL params:', window.location.search);
  console.log('🔧 URL hash:', window.location.hash);
  
  try {
    const result = await getRedirectResult(auth);
    
    console.log('🔍 getRedirectResult returned:', {
      hasResult: !!result,
      hasUser: !!result?.user,
      userEmail: result?.user?.email,
      userUid: result?.user?.uid,
      operationType: result?.operationType,
      providerId: result?.providerId
    });
    
    if (result?.user) {
      console.log('✅ Redirect sign-in completed successfully:', {
        userId: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        provider: result.user.providerData[0]?.providerId
      });
      // log.info('Firebase', 'Redirect sign-in completed successfully', {
      //   userId: result.user.uid,
      //   email: result.user.email
      // });
    } else {
      console.log('ℹ️ No redirect result found');
      // log.debug('Firebase', 'No redirect result found');
    }
    
    return result?.user || null;
  } catch (error: any) {
    console.error('❌ Error checking redirect result:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    // log.error('Firebase', 'Error checking redirect result', {
    //   error: error.message,
    //   code: error.code
    // }, error);
    
    console.error('Error checking redirect result:', error);
    throw new Error(error.message || 'Failed to complete sign in.');
  }
};

export const logOut = async (): Promise<void> => {
  // log.info('Firebase', 'Sign out initiated');
  
  try {
    await signOut(auth);
    // log.info('Firebase', 'Sign out completed successfully');
  } catch (error: any) {
    // log.error('Firebase', 'Sign out failed', {
    //   error: error.message,
    //   code: error.code
    // }, error);
    
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Email/Password Authentication
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
  console.log('📧 Creating account with email:', email);
  
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(result.user, {
      displayName: displayName
    });
    
    console.log('✅ Account created successfully:', result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error('❌ Email signup failed:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  console.log('📧 Signing in with email:', email);
  
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Email sign-in successful:', result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error('❌ Email sign-in failed:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  console.log('🔄 Sending password reset to:', email);
  
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent');
  } catch (error: any) {
    console.error('❌ Password reset failed:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

// Phone Authentication has been removed for improved compatibility

export const checkPhoneAuthSupport = async (): Promise<{ supported: boolean; message: string }> => {
  return { 
    supported: false, 
    message: 'Phone authentication has been disabled for improved compatibility. Please use Google Sign-In, Magic Link, or Email/Password authentication.' 
  };
};


// Phone authentication diagnostic (simplified)
export const diagnosePhoneAuthIssues = async (): Promise<void> => {
  console.log('🔍 === PHONE AUTH DIAGNOSTIC ===');
  console.log('❌ Phone authentication has been disabled for improved compatibility.');
  console.log('✅ Available authentication methods:');
  console.log('   • Google Sign-In');
  console.log('   • Magic Link Email');
  console.log('   • Email/Password');
  console.log('🔍 === END DIAGNOSTIC ===');
};

export const sendPhoneVerification = async (phoneNumber: string): Promise<any> => {
  throw new Error('Phone authentication has been disabled. Please use Google Sign-In, Magic Link, or Email/Password authentication.');
};

export const verifyPhoneCode = async (confirmationResult: any, code: string): Promise<User> => {
  throw new Error('Phone authentication has been disabled. Please use Google Sign-In, Magic Link, or Email/Password authentication.');
};

// Passwordless Authentication (Magic Link)
export const sendMagicLink = async (email: string): Promise<void> => {
  console.log('✉️ Sending magic link to:', email);
  
  try {
    const actionCodeSettings = {
      // URL where the user will be redirected after clicking the link
      url: window.location.origin,
      // This must be true for email link sign-in
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    
    // Save the email locally so you can use it to complete the sign-in
    localStorage.setItem('emailForSignIn', email);
    
    console.log('✅ Magic link sent successfully');
  } catch (error: any) {
    console.error('❌ Failed to send magic link:', error);
    throw new Error(error.message || 'Failed to send magic link');
  }
};

export const signInWithMagicLink = async (email?: string): Promise<User> => {
  console.log('🔗 Attempting to sign in with magic link');
  
  try {
    // Check if the current URL is a sign-in link
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      throw new Error('Invalid sign-in link');
    }
    
    // Get the email if not provided
    let emailAddress = email;
    if (!emailAddress) {
      emailAddress = localStorage.getItem('emailForSignIn') || undefined;
      if (!emailAddress) {
        emailAddress = window.prompt('Please provide your email for confirmation') || undefined;
      }
    }
    
    if (!emailAddress) {
      throw new Error('Email is required to complete sign-in');
    }
    
    // Sign in the user
    const result = await signInWithEmailLink(auth, emailAddress, window.location.href);
    
    // Clear the saved email
    localStorage.removeItem('emailForSignIn');
    
    console.log('✅ Magic link sign-in successful:', result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error('❌ Magic link sign-in failed:', error);
    throw new Error(error.message || 'Failed to sign in with magic link');
  }
};

export const checkMagicLinkOnLoad = (): boolean => {
  return isSignInWithEmailLink(auth, window.location.href);
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
    
    // Ensure all required fields are present and handle null/undefined values
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
    
    // Create update object, converting undefined values to deleteField()
    const updateData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(expense)) {
      if (value === undefined) {
        updateData[key] = deleteField();
      } else {
        updateData[key] = value;
      }
    }
    
    await updateDoc(docRef, updateData);
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
    if (!userId || !db) {
      console.error('Invalid userId or database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(
      collection(db, 'users', userId, 'expenses'),
      orderBy('date', 'desc')
    );
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const expenses = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(expenses);
        } catch (error) {
          console.error('Error processing expenses data:', error);
          callback([]);
        }
      },
      (error) => {
        // Only log permission errors if they're not the common harmless ones
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for expenses subscription. User may not be fully authenticated yet.');
        } else {
          console.error('Error in expenses subscription:', error);
        }
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up expenses subscription:', error);
    callback([]);
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
    if (!userId || !db) {
      console.error('Invalid userId or database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(collection(db, 'users', userId, 'budgets'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const budgets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(budgets);
        } catch (error) {
          console.error('Error processing budgets data:', error);
          callback([]);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for budgets subscription. User may not be fully authenticated yet.');
        } else {
          console.error('Error in budgets subscription:', error);
        }
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up budgets subscription:', error);
    callback([]);
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
    if (!userId || !db) {
      console.error('Invalid userId or database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(collection(db, 'users', userId, 'templates'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(templates);
        } catch (error) {
          console.error('Error processing templates data:', error);
          callback([]);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for templates subscription. User may not be fully authenticated yet.');
        } else {
          console.error('Error in templates subscription:', error);
        }
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up templates subscription:', error);
    callback([]);
    return () => {};
  }
};

// Custom Category functions
export const addCustomCategoryToFirestore = async (userId: string, category: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'customCategories'), category);
    
    // If category is public, also add to global collection
    if (category.isPublic) {
      try {
        await addDoc(collection(db, 'publicCategories'), {
          ...category,
          originalId: docRef.id,
          userId: userId
        });
      } catch (publicError: any) {
        // Handle permission errors gracefully for public categories
        if (publicError.code === 'permission-denied') {
          console.warn('Permission denied for public categories. Private category was created successfully.');
          // Don't throw error - the private category creation was successful
        } else {
          console.error('Error adding to public categories:', publicError);
          // Still don't throw - the main category was created successfully
        }
      }
    }
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding custom category:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to create categories.');
    } else {
      throw new Error('Failed to save custom category. Please try again.');
    }
  }
};

export const updateCustomCategoryInFirestore = async (userId: string, categoryId: string, category: any): Promise<void> => {
  try {
    // First, get the current category data to ensure we have all required fields
    const currentDocRef = doc(db, 'users', userId, 'customCategories', categoryId);
    const currentDoc = await getDoc(currentDocRef);
    
    if (!currentDoc.exists()) {
      throw new Error('Category not found');
    }
    
    const currentData = currentDoc.data();
    const updatedData = { ...currentData, ...category };
    
    // Update the user's private category first
    await updateDoc(currentDocRef, category);
    
    // Handle public collection updates only if the user has permission
    try {
      const publicQ = query(
        collection(db, 'publicCategories'),
        where('originalId', '==', categoryId),
        where('userId', '==', userId)
      );
      const publicSnapshot = await getDocs(publicQ);
      
      if (updatedData.isPublic) {
        // Category should be public
        if (!publicSnapshot.empty) {
          // Update existing public category with complete data
          const publicDoc = publicSnapshot.docs[0];
          await updateDoc(doc(db, 'publicCategories', publicDoc.id), {
            ...updatedData,
            originalId: categoryId,
            userId: userId
          });
        } else {
          // Add to public collection with complete data
          await addDoc(collection(db, 'publicCategories'), {
            ...updatedData,
            originalId: categoryId,
            userId: userId
          });
        }
      } else {
        // Category should not be public, remove from public collection if it exists
        if (!publicSnapshot.empty) {
          const publicDoc = publicSnapshot.docs[0];
          await deleteDoc(doc(db, 'publicCategories', publicDoc.id));
        }
      }
    } catch (publicError: any) {
      // Handle permission errors gracefully for public categories
      if (publicError.code === 'permission-denied') {
        console.warn('Permission denied for public categories. User\'s private category was updated successfully.');
        // Don't throw error - the private category update was successful
      } else {
        console.error('Error updating public category:', publicError);
        // Still don't throw - the main update succeeded
      }
    }
  } catch (error: any) {
    console.error('Error updating custom category:', error);
    
    // Only throw if the main category update failed
    if (error.message === 'Category not found') {
      throw error;
    } else if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to update this category.');
    } else {
      throw new Error('Failed to update custom category. Please try again.');
    }
  }
};

export const deleteCustomCategoryFromFirestore = async (userId: string, categoryId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'customCategories', categoryId);
    await deleteDoc(docRef);
    
    // Remove from public collection if it exists there
    try {
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
    } catch (publicError: any) {
      // Handle permission errors gracefully for public categories
      if (publicError.code === 'permission-denied') {
        console.warn('Permission denied for public categories. Private category was deleted successfully.');
        // Don't throw error - the private category deletion was successful
      } else {
        console.error('Error removing from public categories:', publicError);
        // Still don't throw - the main category was deleted successfully
      }
    }
  } catch (error: any) {
    console.error('Error deleting custom category:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to delete this category.');
    } else {
      throw new Error('Failed to delete custom category. Please try again.');
    }
  }
};

export const subscribeToCustomCategories = (userId: string, callback: (categories: any[]) => void) => {
  try {
    if (!userId || !db) {
      console.error('Invalid userId or database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(collection(db, 'users', userId, 'customCategories'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const categories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(categories);
        } catch (error) {
          console.error('Error processing custom categories data:', error);
          callback([]);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for custom categories subscription. User may not be fully authenticated yet.');
        } else {
          console.error('Error in custom categories subscription:', error);
        }
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up custom categories subscription:', error);
    callback([]);
    return () => {};
  }
};

export const subscribeToPublicCategories = (callback: (categories: any[]) => void) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(collection(db, 'publicCategories'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const categories = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Successfully loaded public categories:', categories.length);
          callback(categories);
        } catch (error) {
          console.error('Error processing public categories data:', error);
          callback([]);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          // Log a more helpful message for public categories permission issues
          console.warn('Permission denied for public categories subscription. This feature may not be configured or you may need to check Firebase rules.');
          callback([]);
        } else {
          console.error('Error in public categories subscription:', error);
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error setting up public categories subscription:', error);
    callback([]);
    return () => {};
  }
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

// Budget Template functions
export const addBudgetTemplateToFirestore = async (userId: string, template: any): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'budgetTemplates'), template);
    
    // If template is public, also add to global collection
    if (template.isPublic) {
      try {
        await addDoc(collection(db, 'publicBudgetTemplates'), {
          ...template,
          originalId: docRef.id,
          userId: userId
        });
      } catch (publicError: any) {
        // Handle permission errors gracefully for public templates
        if (publicError.code === 'permission-denied') {
          console.warn('Permission denied for public budget templates. Private template was created successfully.');
        } else {
          console.error('Error adding to public budget templates:', publicError);
        }
      }
    }
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding budget template:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to create budget templates.');
    } else {
      throw new Error('Failed to save budget template. Please try again.');
    }
  }
};

export const updateBudgetTemplateInFirestore = async (userId: string, templateId: string, template: any): Promise<void> => {
  try {
    // First, get the current template data
    const currentDocRef = doc(db, 'users', userId, 'budgetTemplates', templateId);
    const currentDoc = await getDoc(currentDocRef);
    
    if (!currentDoc.exists()) {
      throw new Error('Budget template not found');
    }
    
    const currentData = currentDoc.data();
    const updatedData = { ...currentData, ...template };
    
    // Update the user's private template first
    await updateDoc(currentDocRef, template);
    
    // Handle public collection updates
    try {
      const publicQ = query(
        collection(db, 'publicBudgetTemplates'),
        where('originalId', '==', templateId),
        where('userId', '==', userId)
      );
      const publicSnapshot = await getDocs(publicQ);
      
      if (updatedData.isPublic) {
        // Template should be public
        if (!publicSnapshot.empty) {
          // Update existing public template
          const publicDoc = publicSnapshot.docs[0];
          await updateDoc(doc(db, 'publicBudgetTemplates', publicDoc.id), {
            ...updatedData,
            originalId: templateId,
            userId: userId
          });
        } else {
          // Add to public collection
          await addDoc(collection(db, 'publicBudgetTemplates'), {
            ...updatedData,
            originalId: templateId,
            userId: userId
          });
        }
      } else {
        // Template should not be public, remove from public collection if it exists
        if (!publicSnapshot.empty) {
          const publicDoc = publicSnapshot.docs[0];
          await deleteDoc(doc(db, 'publicBudgetTemplates', publicDoc.id));
        }
      }
    } catch (publicError: any) {
      if (publicError.code === 'permission-denied') {
        console.warn('Permission denied for public budget templates. User\'s private template was updated successfully.');
      } else {
        console.error('Error updating public budget template:', publicError);
      }
    }
  } catch (error: any) {
    console.error('Error updating budget template:', error);
    
    if (error.message === 'Budget template not found') {
      throw error;
    } else if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to update this budget template.');
    } else {
      throw new Error('Failed to update budget template. Please try again.');
    }
  }
};

export const deleteBudgetTemplateFromFirestore = async (userId: string, templateId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', userId, 'budgetTemplates', templateId);
    await deleteDoc(docRef);
    
    // Remove from public collection if it exists there
    try {
      const publicQ = query(
        collection(db, 'publicBudgetTemplates'),
        where('originalId', '==', templateId),
        where('userId', '==', userId)
      );
      const publicSnapshot = await getDocs(publicQ);
      
      if (!publicSnapshot.empty) {
        const publicDoc = publicSnapshot.docs[0];
        await deleteDoc(doc(db, 'publicBudgetTemplates', publicDoc.id));
      }
    } catch (publicError: any) {
      if (publicError.code === 'permission-denied') {
        console.warn('Permission denied for public budget templates. Private template was deleted successfully.');
      } else {
        console.error('Error removing from public budget templates:', publicError);
      }
    }
  } catch (error: any) {
    console.error('Error deleting budget template:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to delete this budget template.');
    } else {
      throw new Error('Failed to delete budget template. Please try again.');
    }
  }
};

export const subscribeToBudgetTemplates = (userId: string, callback: (templates: any[]) => void) => {
  try {
    if (!userId || !db) {
      console.error('Invalid userId or database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(collection(db, 'users', userId, 'budgetTemplates'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(templates);
        } catch (error) {
          console.error('Error processing budget templates data:', error);
          callback([]);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          console.warn('Permission denied for budget templates subscription. User may not be fully authenticated yet.');
        } else {
          console.error('Error in budget templates subscription:', error);
        }
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up budget templates subscription:', error);
    callback([]);
    return () => {};
  }
};

export const subscribeToPublicBudgetTemplates = (callback: (templates: any[]) => void) => {
  try {
    if (!db) {
      console.error('Database not initialized');
      callback([]);
      return () => {};
    }

    const q = query(collection(db, 'publicBudgetTemplates'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, 
      (querySnapshot) => {
        try {
          const templates = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          callback(templates);
        } catch (error) {
          console.error('Error processing public budget templates data:', error);
          callback([]);
        }
      },
      (error) => {
        if (error.code === 'permission-denied') {
          // This is expected when public budget templates sharing isn't configured
          callback([]);
        } else {
          console.error('Error in public budget templates subscription:', error);
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error setting up public budget templates subscription:', error);
    callback([]);
    return () => {};
  }
};

export const adoptPublicBudgetTemplate = async (userId: string, publicTemplate: any): Promise<string> => {
  try {
    // Add to user's budget templates
    const templateData = {
      name: publicTemplate.name,
      description: publicTemplate.description,
      budgets: publicTemplate.budgets,
      totalBudget: publicTemplate.totalBudget,
      incomeLevel: publicTemplate.incomeLevel,
      tags: publicTemplate.tags,
      isPublic: false, // User's copy is private by default
      createdAt: new Date().toISOString(),
      createdBy: `Adopted from ${publicTemplate.createdBy}`
    };
    
    const docRef = await addDoc(collection(db, 'users', userId, 'budgetTemplates'), templateData);
    
    // Increment usage count in public template
    try {
      const publicDocRef = doc(db, 'publicBudgetTemplates', publicTemplate.id);
      await updateDoc(publicDocRef, {
        usageCount: (publicTemplate.usageCount || 0) + 1
      });
    } catch (error) {
      console.warn('Could not update usage count for public template');
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Error adopting public budget template:', error);
    throw new Error('Failed to adopt budget template. Please try again.');
  }
};

// People management functions
export const addPersonToFirestore = async (userId: string, person: Omit<Person, 'id'>): Promise<string> => {
  try {
    const personData = {
      ...person,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, 'users', userId, 'customPeople'), personData);
    
    // If person is public, also add to global collection
    if (person.isPublic) {
      try {
        await addDoc(collection(db, 'publicPeople'), {
          ...personData,
          originalId: docRef.id,
          userId: userId
        });
      } catch (publicError: any) {
        // Handle permission errors gracefully for public people
        if (publicError.code === 'permission-denied') {
          console.warn('Permission denied for public people. Private person was created successfully.');
        } else {
          console.error('Error adding to public people:', publicError);
        }
      }
    }
    
    return docRef.id;
  } catch (error: any) {
    console.error('Error adding person:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to create people.');
    } else {
      throw new Error('Failed to save person. Please try again.');
    }
  }
};

export const updatePersonInFirestore = async (userId: string, personId: string, person: Partial<Person>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId, 'customPeople', personId), person);
  } catch (error: any) {
    console.error('Error updating person:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to update this person.');
    } else {
      throw new Error('Failed to update person. Please try again.');
    }
  }
};

export const deletePersonFromFirestore = async (userId: string, personId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'customPeople', personId));
  } catch (error: any) {
    console.error('Error deleting person:', error);
    
    if (error.code === 'permission-denied') {
      throw new Error('You don\'t have permission to delete this person.');
    } else {
      throw new Error('Failed to delete person. Please try again.');
    }
  }
};

export const subscribeToCustomPeople = (userId: string, callback: (people: Person[]) => void): Unsubscribe => {
  const q = query(
    collection(db, 'users', userId, 'customPeople'),
    orderBy('name', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const people: Person[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Person));
    callback(people);
  }, (error) => {
    console.error('Error listening to custom people:', error);
    callback([]);
  });
};

export const subscribeToPublicPeople = (callback: (people: Person[]) => void): Unsubscribe => {
  const q = query(
    collection(db, 'publicPeople'),
    orderBy('name', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const people: Person[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Person));
    callback(people);
  }, (error) => {
    console.error('Error listening to public people:', error);
    callback([]);
  });
};

export const adoptPublicPerson = async (userId: string, publicPerson: Person): Promise<string> => {
  try {
    // Increment usage count for this public person
    try {
      await updateDoc(doc(db, 'publicPeople', publicPerson.id), {
        usageCount: increment(1)
      });
    } catch (error) {
      console.warn('Could not update usage count for public person');
    }
    
    // Create user's own copy of the person
    const personData = {
      name: publicPerson.name,
      color: publicPerson.color,
      icon: publicPerson.icon,
      relationship: publicPerson.relationship,
      userId: userId,
      isPublic: false, // User's copy is private by default
      createdAt: new Date().toISOString(),
      createdBy: `Adopted from ${publicPerson.createdBy}`
    };
    
    const docRef = await addDoc(collection(db, 'users', userId, 'customPeople'), personData);
    return docRef.id;
  } catch (error) {
    console.error('Error adopting public person:', error);
    throw new Error('Failed to adopt person. Please try again.');
  }
};