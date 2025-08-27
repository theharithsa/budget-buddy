import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogOut as SignOut, User, Bug, Download, RefreshCw, UserCheck, Menu, Home, Receipt, Wallet, TrendingUp as TrendUp, RefreshCw as ArrowsClockwise, Palette as Swatches, Lightbulb, Users, ArrowLeft, BookOpen, FileText, BarChart3, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logOut, debugFirebaseConfig, addExpenseToFirestore, checkFirebaseReady, auth } from '@/lib/firebase';
import { getVersionSubtitle, getNavigationVersion, APP_DISPLAY_NAME } from '@/lib/version';
import { toast } from 'sonner';
import { pwaManager } from '@/lib/pwa';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  hasBeta?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    description: 'Overview and charts'
  },
  {
    id: 'expenses',
    label: 'Expenses',
    icon: Receipt,
    description: 'Track and manage expenses'
  },
  {
    id: 'budgets',
    label: 'Budgets',
    icon: Wallet,
    description: 'Set and monitor budgets'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: ArrowsClockwise,
    description: 'Recurring transactions'
  },
  {
    id: 'categories',
    label: 'Categories',
    icon: Swatches,
    description: 'Organize spending categories'
  },
  {
    id: 'people',
    label: 'People',
    icon: Users,
    description: 'Manage people and relationships'
  },
  {
    id: 'explorer',
    label: 'Metrics Explorer',
    icon: BarChart3,
    description: 'Analyze spending with interactive charts',
    hasBeta: true
  },
  {
    id: 'ai-chat',
    label: 'KautilyaAI Co-Pilot',
    icon: MessageSquare,
    description: 'Chat with KautilyaAI assistant',
    hasBeta: true
  }
];

export function AppHeader({ activeTab, onTabChange }: AppHeaderProps) {
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
      setMobileMenuOpen(false); // Close mobile menu after selection
    }
  };

  const getPageTitle = (tab: string) => {
    const item = navigationItems.find(item => item.id === tab);
    return item?.label || 'FinBuddy';
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logOut();
      toast.success('Successfully signed out');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to sign out');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleInstallApp = async () => {
    try {
      const success = await pwaManager.promptInstall();
      if (!success) {
        // Open installation guide in new tab
        window.open('/install-guide.html', '_blank');
        toast.info('Installation guide opened in new tab');
      } else {
        toast.success('App installation started!');
      }
    } catch (error) {
      console.error('Install error:', error);
      // Open installation guide in new tab
      window.open('/install-guide.html', '_blank');
      toast.info('Installation guide opened in new tab');
    }
  };

  const handleClearCache = async () => {
    try {
      // Clear localStorage (this will also reset PWA install prompt state)
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear service worker caches if available
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      toast.success('Cache cleared successfully! PWA install prompt will show again on next login if applicable. Refreshing page...');
      
      // Wait a moment for the toast to show, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Slightly longer to read the message
      
    } catch (error) {
      console.error('Clear cache error:', error);
      toast.error('Failed to clear cache completely, but localStorage/sessionStorage cleared');
      
      // Still refresh even if cache clearing fails
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const testFirebaseConnection = async () => {
    try {
      debugFirebaseConfig();
      
      if (!user) {
        toast.error('User not authenticated');
        return;
      }

      // Check if Firebase is ready
      if (!checkFirebaseReady(user)) {
        toast.error('Firebase not properly initialized');
        return;
      }

      // Test adding a simple expense
      const testExpense = {
        amount: 1,
        category: 'Food',
        description: 'Test expense',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      const result = await addExpenseToFirestore(user.uid, testExpense);
      toast.success('Firebase connection test successful!');
      
    } catch (error: any) {
      console.error('Firebase test failed:', error);
      toast.error(`Firebase test failed: ${error.message}`);
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setAvatarError(false); // Reset avatar error state
        toast.success('User profile refreshed!');
      }
    } catch (error: any) {
      console.error('Failed to refresh user profile:', error);
      toast.error('Failed to refresh profile');
    }
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

  const openReleaseNotes = () => {
    try {
      // Open release notes in new tab
      window.open('/docs/release-notes.html', '_blank');
      toast.success('Release notes opened in new tab');
    } catch (error) {
      console.error('Failed to open release notes:', error);
      toast.error('Failed to open release notes');
    }
  };

  if (!user) return null;

  const userInitials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Back Button for non-dashboard pages */}
            {activeTab !== 'dashboard' && (
              <div className="lg:hidden">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => onTabChange?.('dashboard')}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="sr-only">Back to dashboard</span>
                </Button>
              </div>
            )}
            
            {/* Mobile Navigation Menu - Only show on dashboard */}
            {activeTab === 'dashboard' && (
              <div className="lg:hidden">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-2">
                      <Menu className="w-5 h-5" />
                      <span className="sr-only">Open navigation menu</span>
                    </Button>
                  </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <SheetHeader className="p-6 border-b border-border">
                      <SheetTitle className="text-lg font-semibold text-foreground text-left">
                        {APP_DISPLAY_NAME}
                      </SheetTitle>
                      <p className="text-sm text-muted-foreground mt-1 text-left">{getNavigationVersion().subtitle}</p>
                    </SheetHeader>

                    {/* Navigation Items */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-2">
                        {navigationItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = activeTab === item.id;
                          
                          return (
                            <Button
                              key={item.id}
                              variant={isActive ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start gap-4 h-14 text-left",
                                isActive && "bg-primary/10 text-primary border-primary/20"
                              )}
                              onClick={() => handleTabChange(item.id)}
                            >
                              <Icon className="w-6 h-6 flex-shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.label}</span>
                                  {item.hasBeta && (
                                    <Badge 
                                      variant="secondary" 
                                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-[10px] px-1.5 py-0.5 font-semibold"
                                    >
                                      BETA
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                      <p className="text-xs text-muted-foreground text-center">
                        Tap any item to navigate
                      </p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            )}

            <div>
              <h1 className="text-2xl font-bold">
                {activeTab === 'dashboard' ? APP_DISPLAY_NAME : getPageTitle(activeTab!)}
              </h1>
              <p className="text-sm text-muted-foreground">
                {getVersionSubtitle(activeTab === 'dashboard' ? 'dashboard' : 'other')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  {!avatarError && user.photoURL ? (
                    <AvatarImage 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'}
                      onError={() => {
                        setAvatarError(true);
                      }}
                      onLoad={() => {
                        setAvatarError(false);
                      }}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.displayName && (
                    <p className="font-medium">{user.displayName}</p>
                  )}
                  {user.email && (
                    <p className="w-[200px] truncate text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={openDocumentation}
                className="cursor-pointer"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={openReleaseNotes}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Release Notes
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={testFirebaseConnection}
                className="cursor-pointer"
              >
                <Bug className="mr-2 h-4 w-4" />
                Test Firebase
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={refreshUserProfile}
                className="cursor-pointer"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Refresh Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleInstallApp}
                className="cursor-pointer"
              >
                <Download className="mr-2 h-4 w-4" />
                Install App
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleClearCache}
                className="cursor-pointer"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Cache & Refresh
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  const debugInfo = {
                    isAuthenticated: !!user,
                    uid: user?.uid,
                    email: user?.email,
                    displayName: user?.displayName,
                    currentUrl: window.location.href,
                    timestamp: new Date().toISOString()
                  };
                  console.log('🔍 DEBUG USER INFO:', debugInfo);
                  toast.success('User info logged to console');
                }}
                className="cursor-pointer"
              >
                <Bug className="mr-2 h-4 w-4" />
                Debug User Info
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer"
              >
                <SignOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}