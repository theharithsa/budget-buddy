import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  signInWithGoogle, 
  debugFirebaseConfig,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  sendMagicLink,
  signInWithMagicLink,
  checkMagicLinkOnLoad
} from '@/lib/firebase';
import { 
  Wallet, 
  Info, 
  Bug, 
  ExternalLink as ArrowSquareOut, 
  Chrome as GoogleLogo,
  ExternalLink,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Link,
  Sparkles,
  Shield,
  Zap,
  AlertTriangle,
  Settings,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
// import { log } from '@/lib/logger';

// Helper function to detect Safari/iOS
const isSafariOrIOS = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome') && !userAgent.includes('chromium');
  const isIOS = /ipad|iphone|ipod/.test(userAgent);
  return isSafari || isIOS;
};

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('google');
  
  // Email/Password form state
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  
  // Reset form state
  const [resetEmail, setResetEmail] = useState('');
  
  // Magic link state
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Check for magic link on component mount
  useEffect(() => {
    const handleMagicLink = async () => {
      if (checkMagicLinkOnLoad()) {
        setIsLoading(true);
        try {
          await signInWithMagicLink();
          toast.success('Successfully signed in with magic link!');
        } catch (error: any) {
          console.error('Magic link sign-in error:', error);
          toast.error(error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    handleMagicLink();
  }, []);

  // Clean up reCAPTCHA when component unmounts or tab changes
  useEffect(() => {
    return () => {
      // Cleanup reCAPTCHA when component unmounts
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (error) {
          console.warn('Failed to cleanup reCAPTCHA:', error);
        }
      }
    };
  }, []);

  // Clean up reCAPTCHA when switching away from phone tab
  useEffect(() => {
    if (activeTab !== 'phone') {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (error) {
          console.warn('Failed to cleanup reCAPTCHA on tab change:', error);
        }
      }
    }
  }, [activeTab]);

  const handleEmailSignUp = async () => {
    if (!emailForm.email || !emailForm.password || !emailForm.displayName) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (emailForm.password !== emailForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (emailForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await signUpWithEmail(emailForm.email, emailForm.password, emailForm.displayName);
      toast.success(`Welcome ${emailForm.displayName}! Account created successfully.`);
    } catch (error: any) {
      console.error('Email signup error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!emailForm.email || !emailForm.password) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await signInWithEmail(emailForm.email, emailForm.password);
      toast.success(`Welcome back, ${user.displayName || user.email}!`);
    } catch (error: any) {
      console.error('Email signin error:', error);
      setError(error.message);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPassword(resetEmail);
      toast.success('Password reset email sent! Check your inbox.');
      setResetEmail('');
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSend = async () => {
    if (!magicLinkEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await sendMagicLink(magicLinkEmail);
      setMagicLinkSent(true);
      toast.success('Magic link sent! Check your email and click the link to sign in.');
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (useRedirect: boolean = false) => {
    const startTime = performance.now();
    setIsLoading(true);
    setError(null);
    
    console.log('🎯 LoginPage: Starting sign-in process', { useRedirect });
    
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
        console.log('🎯 LoginPage: Using redirect method, calling signInWithGoogle(true)...');
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
        // Don't show error for redirect, but provide user feedback
        if (useRedirect) {
          toast.info('Redirecting to Google for authentication...');
        }
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

  const openDocumentation = () => {
    try {
      // Open documentation in new tab
      window.open('/docs/index.html', '_blank');
      toast.success('Documentation opened in new tab');
    } catch (error) {
      console.error('Failed to open documentation:', error);
      toast.error('Failed to open documentation');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
              <Wallet size={48} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              FinBuddy
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Your smart financial companion for expense tracking and budget management
            </p>
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Secure Sign In
            </CardTitle>
            <p className="text-sm text-muted-foreground">Choose your preferred authentication method</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <Info className="w-4 h-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Authentication Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 h-12 bg-muted/30">
                <TabsTrigger 
                  value="google" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <GoogleLogo size={14} />
                  Google
                </TabsTrigger>
                <TabsTrigger 
                  value="magic" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Zap size={14} />
                  Magic
                </TabsTrigger>
                <TabsTrigger 
                  value="email" 
                  className="flex items-center gap-1 text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Mail size={14} />
                  Email
                </TabsTrigger>
              </TabsList>

              {/* Google Sign-In Tab */}
              <TabsContent value="google" className="space-y-4">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4" />
                    <span>Quick & secure with your Google account</span>
                  </div>
                  
                  <Button
                    onClick={() => handleGoogleSignIn(false)}
                    disabled={isLoading}
                    className="w-full h-12 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
                    size="lg"
                  >
                    <GoogleLogo size={20} className="mr-3" />
                    {isLoading ? 'Signing in...' : 'Continue with Google'}
                  </Button>

                  {showRedirectOption && (
                    <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                      <Info className="w-4 h-4" />
                      <AlertDescription className="text-sm">
                        <strong>Popup Blocked:</strong> Please allow popups for this site and try again.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              {/* Magic Link Tab */}
              <TabsContent value="magic" className="space-y-4">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Link className="w-4 h-4" />
                    <span>Password-free sign in via email link</span>
                  </div>
                  
                  {!magicLinkSent ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="magic-email" className="text-sm font-medium">Email Address</Label>
                        <Input
                          id="magic-email"
                          type="email"
                          placeholder="Enter your email"
                          value={magicLinkEmail}
                          onChange={(e) => setMagicLinkEmail(e.target.value)}
                          className="mt-1 h-11"
                        />
                      </div>
                      
                      <Button
                        onClick={handleMagicLinkSend}
                        disabled={isLoading}
                        className="w-full h-12 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0 shadow-lg"
                        size="lg"
                      >
                        <Zap size={20} className="mr-2" />
                        {isLoading ? 'Sending magic link...' : 'Send Magic Link'}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex justify-center">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Mail size={24} className="text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800">Magic link sent!</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Check your email and click the link to sign in securely.
                        </p>
                      </div>
                      <Button 
                        onClick={() => { setMagicLinkSent(false); setMagicLinkEmail(''); }}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Send to different email
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Email/Password Tab */}
              <TabsContent value="email" className="space-y-4">
                <Tabs defaultValue="signin" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2 h-10">
                    <TabsTrigger value="signin" className="flex items-center gap-2 text-sm">
                      <LogIn size={14} />
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="flex items-center gap-2 text-sm">
                      <UserPlus size={14} />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  {/* Email Sign In */}
                  <TabsContent value="signin" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={emailForm.email}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                        <div className="relative mt-1">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={emailForm.password}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleEmailSignIn}
                      disabled={isLoading}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {isLoading ? 'Signing in...' : 'Sign In with Email'}
                    </Button>

                    {/* Password Reset */}
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground text-center">Forgot your password?</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter email for reset"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="h-10"
                        />
                        <Button
                          onClick={handlePasswordReset}
                          disabled={isLoading}
                          variant="outline"
                          className="h-10 px-4"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Email Sign Up */}
                  <TabsContent value="signup" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                        <Input
                          id="signup-name"
                          placeholder="Enter your full name"
                          value={emailForm.displayName}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, displayName: e.target.value }))}
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="Enter your email"
                          value={emailForm.email}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1 h-11"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                        <div className="relative mt-1">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password (min 6 characters)"
                            value={emailForm.password}
                            onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                            className="h-11 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</Label>
                        <Input
                          id="signup-confirm"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={emailForm.confirmPassword}
                          onChange={(e) => setEmailForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="mt-1 h-11"
                        />
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleEmailSignUp}
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      size="lg"
                    >
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      By creating an account, you agree to our terms of service.
                    </p>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>

            {/* Debug Section */}
            {(error || showDebug) && (
              <div className="pt-4 border-t">
                <Button
                  onClick={handleDebug}
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center gap-2 text-xs"
                >
                  <Bug size={14} />
                  Debug Firebase Config
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={openDocumentation}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-xs h-8"
            >
              <BookOpen className="w-3 h-3" />
              Documentation
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>Your data is encrypted and securely stored</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>By signing in, you agree to our</span>
            <a 
              href="/docs/terms-and-conditions.html" 
              target="_blank"
              className="text-primary hover:underline"
            >
              Terms & Conditions
            </a>
            <span>and</span>
            <a 
              href="/docs/privacy-policy.html" 
              target="_blank"
              className="text-primary hover:underline"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
