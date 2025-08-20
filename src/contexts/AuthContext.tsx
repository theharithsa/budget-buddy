import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, checkRedirectResult } from '@/lib/firebase';
// import { log } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // log.error('Auth', 'useAuth must be used within an AuthProvider');
    console.error('Auth: useAuth must be used within an AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // log.info('Auth', 'Initializing authentication context');
    console.log('Auth: Initializing authentication context');

    // Check for redirect result first
    checkRedirectResult()
      .then((redirectUser) => {
        if (isMounted && redirectUser) {
          // log.info('Auth', 'User authenticated via redirect', {
          //   userId: redirectUser.uid,
          //   email: redirectUser.email,
          //   provider: redirectUser.providerData[0]?.providerId
          // });
          console.log('Auth: User authenticated via redirect', redirectUser.uid);
          setUser(redirectUser);
          setLoading(false);
          // Set user context in logger
          // log.setUser(redirectUser.uid);
        }
      })
      .catch((error) => {
        // log.error('Auth', 'Redirect result error', { error: error.message }, error);
        console.error('Auth: Redirect result error', error);
      });

    // Set up auth state listener
    const unsubscribe = onAuthChange((user) => {
      if (isMounted) {
        if (user) {
          // log.info('Auth', 'User authentication state changed - signed in', {
          //   userId: user.uid,
          //   email: user.email,
          //   displayName: user.displayName,
          //   emailVerified: user.emailVerified,
          //   provider: user.providerData[0]?.providerId
          // });
          console.log('Auth: User signed in', user.uid);
          // Set user context in logger
          // log.setUser(user.uid);
        } else {
          // log.info('Auth', 'User authentication state changed - signed out');
          console.log('Auth: User signed out');
        }
        
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      // log.debug('Auth', 'Cleaning up authentication context');
      console.log('Auth: Cleaning up authentication context');
      unsubscribe();
    };
  }, []);

  const value = {
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};