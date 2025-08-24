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

    // Check for redirect result first
    checkRedirectResult()
      .then((redirectUser) => {
        if (isMounted) {
          if (redirectUser) {
            // log.info('Auth', 'User authenticated via redirect', {
            //   userId: redirectUser.uid,
            //   email: redirectUser.email,
            //   provider: redirectUser.providerData[0]?.providerId
            // });
            console.log('✅ Auth: User authenticated via redirect:', {
              userId: redirectUser.uid,
              email: redirectUser.email,
              displayName: redirectUser.displayName
            });
            setUser(redirectUser);
            setLoading(false);
            // Set user context in logger
            // log.setUser(redirectUser.uid);
          } else {
            // No redirect result found, proceeding with auth state listener
          }
        }
      })
      .catch((error) => {
        if (isMounted) {
          // log.error('Auth', 'Redirect result error', { error: error.message }, error);
          console.error('❌ Auth: Redirect result error:', error);
          console.error('❌ Auth: Error details:', {
            code: error.code,
            message: error.message
          });
        }
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
          // Set user context in logger
          // log.setUser(user.uid);
        } else {
          // log.info('Auth', 'User authentication state changed - signed out');
        }
        
        setUser(user);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      // log.debug('Auth', 'Cleaning up authentication context');
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