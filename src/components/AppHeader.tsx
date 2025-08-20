import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SignOut, User, Bug } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { logOut, debugFirebaseConfig, addExpenseToFirestore, checkFirebaseReady } from '@/lib/firebase';
import { toast } from 'sonner';

export function AppHeader() {
  const { user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const testFirebaseConnection = async () => {
    try {
      console.log('Testing Firebase connection...');
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

      console.log('Testing expense creation with:', testExpense);
      const result = await addExpenseToFirestore(user.uid, testExpense);
      console.log('Test expense created successfully:', result);
      toast.success('Firebase connection test successful!');
      
    } catch (error: any) {
      console.error('Firebase test failed:', error);
      toast.error(`Firebase test failed: ${error.message}`);
    }
  };

  if (!user) return null;

  const userInitials = user.displayName
    ? user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    : user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Finance Tracker</h1>
            <p className="text-sm text-muted-foreground">
              Track your expenses, manage budgets, and analyze spending patterns
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
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
                onClick={testFirebaseConnection}
                className="cursor-pointer"
              >
                <Bug weight="regular" className="mr-2 h-4 w-4" />
                Test Firebase
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="cursor-pointer"
              >
                <SignOut weight="regular" className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}