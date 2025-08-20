import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signInWithGoogle, debugFirebaseConfig } from '@/lib/firebase';
import { 
  Wallet, 
  Info, 
  Bug, 
  ExternalLink as ArrowSquareOut, 
  Chrome as GoogleLogo 
} from 'lucide-react';
import { toast } from 'sonner';
// import { log } from '@/lib/logger';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  const handleGoogleSignIn = async (useRedirect: boolean = false) => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);
    
    // log.info('Login', 'Google sign-in attempt started', { 
    //   useRedirect,
    //   userAgent: navigator.userAgent,
    //   timestamp: new Date().toISOString()
    // });

    // log.userAction('Sign In Attempt', {
    //   provider: 'Google',
    //   method: useRedirect ? 'redirect' : 'popup'
    // });
    
    try {
      if (useRedirect) {
        // log.debug('Login', 'Using redirect method for Google sign-in');
        await signInWithGoogle(true);
        // log.info('Login', 'Redirect sign-in initiated successfully');
        // Redirect is in progress, no need to handle result here
      } else {
        // log.debug('Login', 'Using popup method for Google sign-in');
        await signInWithGoogle(false);
        
        const duration = performance.now() - startTime;
        // log.performance('GoogleSignIn', duration, { method: 'popup' });
        // log.info('Login', 'Popup sign-in completed successfully', { duration });
        
        toast.success('Successfully signed in!');
      }
    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMessage = error.message || 'Failed to sign in. Please try again.';
      
      // log.error('Login', 'Google sign-in failed', {
      //   error: errorMessage,
      //   useRedirect,
      //   duration,
      //   errorCode: error.code,
      //   stack: error.stack
      // }, error);
      
      console.error('Sign in error:', error);
      
      if (error.message === 'REDIRECT_IN_PROGRESS') {
        // log.debug('Login', 'Redirect in progress, not showing error');
        // Don't show error for redirect
        return;
      }
      
      setError(errorMessage);
      
      // Show redirect option if popup failed
      if (error.message?.includes('Popup') || error.message?.includes('popup')) {
        // log.warn('Login', 'Popup blocked, suggesting redirect method');
        setShowRedirectOption(true);
      }
      
      toast.error(errorMessage);
    } finally {
      if (!useRedirect) {
        setIsLoading(false);
      }
    }
  };

  const handleDebug = () => {
    // log.userAction('Debug Firebase Config');
    // log.info('Login', 'Debug mode activated');
    
    debugFirebaseConfig();
    setShowDebug(true);
    toast.info('Debug information logged to console. Check browser developer tools.');
    
    // log.debug('Login', 'Firebase debug information displayed');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Wallet size={48} className="text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Finance Tracker</h1>
          <p className="text-muted-foreground mt-2">
            Track your expenses, manage budgets, and analyze spending patterns
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In to Continue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <Info className="w-4 h-4" />
                <AlertDescription className="text-sm">
                  {error}
                  {error.includes('Popup') && (
                    <div className="mt-2 text-xs">
                      <strong>To fix this:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Look for a popup blocker icon in your browser's address bar</li>
                        <li>Click it and allow popups for this site</li>
                        <li>Try signing in again, or use the redirect option below</li>
                      </ol>
                    </div>
                  )}
                  {error.includes('unauthorized-domain') && (
                    <div className="mt-2 text-xs">
                      <strong>Domain Authorization Issue:</strong>
                      <p className="mt-1">This domain needs to be added to Firebase Authentication settings.</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={() => handleGoogleSignIn(false)}
              disabled={isLoading}
              className="w-full flex items-center gap-3"
              size="lg"
            >
              <GoogleLogo size={20} />
              {isLoading ? 'Signing in...' : 'Continue with Google'}
            </Button>

            {showRedirectOption && (
              <Button
                onClick={() => handleGoogleSignIn(true)}
                disabled={isLoading}
                variant="outline"
                className="w-full flex items-center gap-3"
                size="lg"
              >
                <ArrowSquareOut size={20} />
                {isLoading ? 'Redirecting...' : 'Sign in with Redirect'}
              </Button>
            )}

            {(error || showDebug) && (
              <Button
                onClick={handleDebug}
                variant="outline"
                size="sm"
                className="w-full flex items-center gap-2"
              >
                <Bug size={16} />
                Debug Firebase Config
              </Button>
            )}
            
            <div className="text-center text-sm text-muted-foreground">
              <p>Your data is securely stored and only accessible to you.</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}