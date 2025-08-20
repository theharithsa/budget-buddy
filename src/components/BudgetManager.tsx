import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusIcon, ExclamationTriangleIcon, WalletIcon, CalculatorIcon, TrashIcon, BookOpenIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { DEFAULT_CATEGORIES, getAllCategories, type Budget, type CustomCategory, type BudgetTemplate, formatCurrency } from '@/lib/types';
import { BudgetSetupWizard } from '@/components/BudgetSetupWizard';
import { BudgetCommunity } from '@/components/BudgetCommunity';
import { toast } from 'sonner';

interface BudgetManagerProps {
  budgets: Budget[];
  budgetTemplates?: BudgetTemplate[];
  publicBudgetTemplates?: BudgetTemplate[];
  onUpdateBudgets: (budgets: Budget[]) => void;
  onAddBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  onUpdateBudget: (budgetId: string, budget: Partial<Budget>) => Promise<void>;
  onDeleteBudget: (budgetId: string) => Promise<void>;
  onAddBudgetTemplate?: (template: Omit<BudgetTemplate, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onUpdateBudgetTemplate?: (templateId: string, template: Partial<BudgetTemplate>) => Promise<void>;
  onDeleteBudgetTemplate?: (templateId: string) => Promise<void>;
  onAdoptBudgetTemplate?: (template: BudgetTemplate) => Promise<void>;
  customCategories?: CustomCategory[];
}

export function BudgetManager({ 
  budgets, 
  budgetTemplates = [],
  publicBudgetTemplates = [],
  onUpdateBudgets, 
  onAddBudget, 
  onUpdateBudget, 
  onDeleteBudget,
  onAddBudgetTemplate,
  onUpdateBudgetTemplate,
  onDeleteBudgetTemplate,
  onAdoptBudgetTemplate,
  customCategories = [] 
}: BudgetManagerProps) {
  const [open, setOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyTemplate = async (template: BudgetTemplate) => {
    try {
      // Apply template budgets to current budgets
      for (const templateBudget of template.budgets) {
        const existingBudget = budgets.find(b => b.category === templateBudget.category);
        
        if (existingBudget) {
          await onUpdateBudget(existingBudget.id, { limit: templateBudget.limit });
        } else {
          await onAddBudget({
            category: templateBudget.category,
            limit: templateBudget.limit,
            spent: 0
          });
        }
      }
      
      toast.success(`Applied "${template.name}" template to your budgets`);
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast.error(error?.message || 'Failed to apply template');
    }
  };

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numLimit = parseFloat(limit);
    if (!numLimit || numLimit <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    setIsLoading(true);
    try {
      const existingBudget = budgets.find(b => b.category === category);
      
      if (existingBudget) {
        await onUpdateBudget(existingBudget.id, { limit: numLimit });
        toast.success('Budget updated successfully');
      } else {
        await onAddBudget({
          category,
          limit: numLimit,
          spent: 0,
        });
        toast.success('Budget added successfully');
      }

      setCategory('');
      setLimit('');
      setOpen(false);
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await onDeleteBudget(budgetId);
      toast.success('Budget removed');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to remove budget');
    }
  };

  const handleBudgetsCreate = async (newBudgets: Budget[]) => {
    try {
      for (const budget of newBudgets) {
        const { id, ...budgetData } = budget;
        await onAddBudget(budgetData);
      }
      toast.success(`Successfully created ${newBudgets.length} budgets!`);
    } catch (error) {
      console.error('Error creating budgets:', error);
      toast.error('Failed to create some budgets');
    }
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-accent';
  };

  const availableCategories = DEFAULT_CATEGORIES.filter(
    cat => !budgets.some(budget => budget.category === cat.name)
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="budgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <Wallet size={16} />
            My Budgets
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <BookOpenIcon className="w-4 h-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={24} weight="regular" className="text-primary" />
              <h2 className="text-2xl font-bold">Budget Overview</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setWizardOpen(true)} 
                className="gap-2"
                variant="outline"
              >
                <CalculatorIcon className="w-4 h-4" weight="regular" />
                Quick Setup
              </Button>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Budget
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Category Budget</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddBudget} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="budget-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllCategories(customCategories).map((cat) => (
                          <SelectItem key={cat.name} value={cat.name}>
                            <div className="flex items-center gap-2">
                              <span>{cat.icon}</span>
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="budget-limit">Monthly Limit</Label>
                    <Input
                      id="budget-limit"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      className="text-lg"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Set Budget'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {budgets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <WalletIcon className="w-12 h-12" weight="regular" className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
                  <p className="text-muted-foreground mb-4">
                    Set spending limits for your categories to better track your finances.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <BudgetSetupWizard 
                      existingBudgets={budgets}
                      onAddBudget={onAddBudget}
                    />
                    <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
                      <PlusIcon className="w-4 h-4" />
                      Manual Setup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {budgets.map((budget) => {
                const allCategories = getAllCategories(customCategories);
                const category = allCategories.find(cat => cat.name === budget.category);
                const percentage = Math.min((budget.spent / budget.limit) * 100, 100);
                const isOverBudget = budget.spent > budget.limit;
                const isNearLimit = percentage >= 80 && !isOverBudget;
                
                return (
                  <Card key={budget.category} className={isOverBudget ? 'border-destructive' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                            style={{ backgroundColor: category?.color || 'oklch(0.6 0.1 240)' }}
                          >
                            {category?.icon || '📝'}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{budget.category}</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(isOverBudget || isNearLimit) && (
                            <Warning 
                              size={20} 
                              weight="regular"
                              className={isOverBudget ? 'text-destructive' : 'text-yellow-500'} 
                            />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteBudget(budget.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Remove budget"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-sm">
                          <span className={isOverBudget ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                            {percentage.toFixed(1)}% used
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(budget.limit - budget.spent)} remaining
                          </span>
                        </div>
                        {isOverBudget && (
                          <p className="text-sm text-destructive font-medium">
                            Over budget by {formatCurrency(budget.spent - budget.limit)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <BudgetSetupWizard 
            open={wizardOpen}
            onOpenChange={setWizardOpen}
            onBudgetsCreate={handleBudgetsCreate}
            existingBudgets={budgets}
          />
        </TabsContent>

        <TabsContent value="templates">
          {onAddBudgetTemplate && onUpdateBudgetTemplate && onDeleteBudgetTemplate && onAdoptBudgetTemplate ? (
            <BudgetCommunity
              budgetTemplates={budgetTemplates}
              publicBudgetTemplates={publicBudgetTemplates}
              customCategories={customCategories}
              onAddTemplate={onAddBudgetTemplate}
              onUpdateTemplate={onUpdateBudgetTemplate}
              onDeleteTemplate={onDeleteBudgetTemplate}
              onAdoptTemplate={onAdoptBudgetTemplate}
              onApplyTemplate={handleApplyTemplate}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Budget Templates Not Available</h3>
                  <p className="text-muted-foreground">
                    Budget templates functionality is not configured for this session.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}