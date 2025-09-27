import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  User, 
  CheckCircle,
  XCircle,
  Info,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/contexts/ProfileContext';
import { useFirestoreData } from '@/hooks/useFirestoreData';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface DataMigrationResult {
  expensesUpdated: number;
  budgetsUpdated: number;
  errors: string[];
  success: boolean;
}

export function DataMigrationTool() {
  const { user } = useAuth();
  const { profiles, activeProfile, isLoading } = useProfiles();
  const { expenses, budgets, loading: dataLoading } = useFirestoreData();
  
  const [migrationResult, setMigrationResult] = useState<DataMigrationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<{
    profilesCount: number;
    activeProfileName: string;
    expensesTotal: number;
    expensesWithProfile: number;
    expensesWithoutProfile: number;
    budgetsTotal: number;
    budgetsWithProfile: number;
    budgetsWithoutProfile: number;
  } | null>(null);

  // Run diagnostics
  useEffect(() => {
    if (!isLoading && !dataLoading && profiles.length > 0) {
      const expensesWithProfile = expenses.filter(e => e.profileId).length;
      const budgetsWithProfile = budgets.filter(b => b.profileId).length;
      
      setDiagnostics({
        profilesCount: profiles.length,
        activeProfileName: activeProfile?.name || 'None',
        expensesTotal: expenses.length,
        expensesWithProfile,
        expensesWithoutProfile: expenses.length - expensesWithProfile,
        budgetsTotal: budgets.length,
        budgetsWithProfile,
        budgetsWithoutProfile: budgets.length - budgetsWithProfile
      });
    }
  }, [profiles, expenses, budgets, activeProfile, isLoading, dataLoading]);

  const runDataMigration = async () => {
    if (!user || !activeProfile) {
      toast.error('No active profile found');
      return;
    }

    setIsRunning(true);
    const errors: string[] = [];
    let expensesUpdated = 0;
    let budgetsUpdated = 0;

    try {
      const batch = writeBatch(db);

      // Migrate expenses without profileId
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('userId', '==', user.uid)
      );
      
      const expensesSnapshot = await getDocs(expensesQuery);
      
      expensesSnapshot.docs.forEach((docSnapshot) => {
        const expense = docSnapshot.data();
        if (!expense.profileId) {
          batch.update(doc(db, 'expenses', docSnapshot.id), {
            profileId: activeProfile.id
          });
          expensesUpdated++;
        }
      });

      // Migrate budgets without profileId
      const budgetsQuery = query(
        collection(db, 'budgets'),
        where('userId', '==', user.uid)
      );
      
      const budgetsSnapshot = await getDocs(budgetsQuery);
      
      budgetsSnapshot.docs.forEach((docSnapshot) => {
        const budget = docSnapshot.data();
        if (!budget.profileId) {
          batch.update(doc(db, 'budgets', docSnapshot.id), {
            profileId: activeProfile.id
          });
          budgetsUpdated++;
        }
      });

      // Commit the batch
      if (expensesUpdated > 0 || budgetsUpdated > 0) {
        await batch.commit();
      }

      setMigrationResult({
        expensesUpdated,
        budgetsUpdated,
        errors,
        success: true
      });

      toast.success(`Migration completed! Updated ${expensesUpdated} expenses and ${budgetsUpdated} budgets`);

      // Refresh the page to reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Migration error:', error);
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      
      setMigrationResult({
        expensesUpdated,
        budgetsUpdated,
        errors,
        success: false
      });

      toast.error('Migration failed');
    } finally {
      setIsRunning(false);
    }
  };

  const refreshData = () => {
    window.location.reload();
  };

  const createDefaultProfile = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    setIsRunning(true);
    
    try {
      const defaultProfileData = {
        name: 'Personal',
        description: 'Personal expenses and budgets',
        color: 'oklch(0.6 0.2 260)',
        icon: '👤',
        userId: user.uid,
        isDefault: true,
        settings: {
          currency: 'USD',
          exportFormat: 'excel',
          autoBackup: true,
          notifications: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'profiles'), defaultProfileData);
      
      toast.success("Default 'Personal' profile created successfully!");
      console.log('Profile created with ID:', docRef.id);
      
      // Refresh the page to reload profile data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Failed to create default profile:', error);
      toast.error('Failed to create default profile. Please try again.');
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading || dataLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Data...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Profile System Diagnostics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Check the status of your profile data and fix any issues
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {diagnostics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Profiles</p>
                    <p className="text-2xl font-bold">{diagnostics.profilesCount}</p>
                  </div>
                  <User className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Active Profile</p>
                    <p className="text-lg font-semibold truncate">{diagnostics.activeProfileName}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold">{diagnostics.expensesTotal}</p>
                    <p className="text-xs text-muted-foreground">
                      {diagnostics.expensesWithProfile} with profile
                    </p>
                  </div>
                  <div className="text-right">
                    {diagnostics.expensesWithoutProfile > 0 ? (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Total Budgets</p>
                    <p className="text-2xl font-bold">{diagnostics.budgetsTotal}</p>
                    <p className="text-xs text-muted-foreground">
                      {diagnostics.budgetsWithProfile} with profile
                    </p>
                  </div>
                  <div className="text-right">
                    {diagnostics.budgetsWithoutProfile > 0 ? (
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Issues and Solutions */}
          <div className="space-y-4">
            {(diagnostics?.expensesWithoutProfile ?? 0) > 0 || (diagnostics?.budgetsWithoutProfile ?? 0) > 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Data Migration Needed:</strong> You have {diagnostics?.expensesWithoutProfile ?? 0} expenses and {diagnostics?.budgetsWithoutProfile ?? 0} budgets without profile assignments. 
                  These won't show in the dashboard until migrated.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>All data is properly configured!</strong> All your expenses and budgets are assigned to profiles.
                </AlertDescription>
              </Alert>
            )}

            {profiles.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>No profiles found:</strong> The system should automatically create a default "Personal" profile. 
                  Try refreshing or creating a profile manually.
                </AlertDescription>
              </Alert>
            )}

            {!activeProfile && profiles.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>No active profile:</strong> Please select a profile to view your data.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={runDataMigration}
              disabled={isRunning || !activeProfile || ((diagnostics?.expensesWithoutProfile ?? 0) === 0 && (diagnostics?.budgetsWithoutProfile ?? 0) === 0)}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Migrate Data to Active Profile
            </Button>

            <Button 
              onClick={createDefaultProfile}
              variant="secondary"
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Personal Profile
            </Button>

            <Button 
              onClick={refreshData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>

          {/* Migration Results */}
          {migrationResult && (
            <div className="mt-6">
              <Alert className={migrationResult.success ? "border-green-200" : "border-red-200"}>
                {migrationResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>{migrationResult.success ? 'Success!' : 'Failed!'}</strong>
                    </p>
                    <p>Expenses updated: {migrationResult.expensesUpdated}</p>
                    <p>Budgets updated: {migrationResult.budgetsUpdated}</p>
                    {migrationResult.errors.length > 0 && (
                      <div>
                        <p className="font-semibold">Errors:</p>
                        <ul className="list-disc list-inside">
                          {migrationResult.errors.map((error, index) => (
                            <li key={index} className="text-sm">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
