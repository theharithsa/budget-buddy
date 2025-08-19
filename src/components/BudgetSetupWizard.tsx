import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, Target, Sparkle, Calculator } from '@phosphor-icons/react';
import { DEFAULT_MONTHLY_BUDGETS, DEFAULT_CATEGORIES, type Budget, formatCurrency } from '@/lib/types';
import { toast } from 'sonner';

interface BudgetSetupWizardProps {
  existingBudgets: Budget[];
  onAddBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
}

export function BudgetSetupWizard({ existingBudgets, onAddBudget }: BudgetSetupWizardProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBudgets, setSelectedBudgets] = useState<{[key: string]: number}>({});
  const [totalIncome, setTotalIncome] = useState('');

  // Filter out categories that already have budgets
  const availableBudgets = DEFAULT_MONTHLY_BUDGETS.filter(
    budget => !existingBudgets.some(existing => existing.category === budget.category)
  );

  const handleIncomeChange = (income: string) => {
    setTotalIncome(income);
    
    if (income && parseFloat(income) > 0) {
      // Auto-calculate suggested budgets based on 50/30/20 rule adapted for Indian households
      const monthlyIncome = parseFloat(income);
      const suggestions = {
        'Food & Dining': Math.round(monthlyIncome * 0.25), // 25% for food
        'Bills & Utilities': Math.round(monthlyIncome * 0.20), // 20% for bills
        'Transportation': Math.round(monthlyIncome * 0.10), // 10% for transport
        'Shopping': Math.round(monthlyIncome * 0.10), // 10% for shopping
        'Entertainment': Math.round(monthlyIncome * 0.05), // 5% for entertainment
        'Healthcare': Math.round(monthlyIncome * 0.05), // 5% for healthcare
        'Education': Math.round(monthlyIncome * 0.10), // 10% for education
        'Other': Math.round(monthlyIncome * 0.05) // 5% for miscellaneous
      };

      // Update selected budgets with suggestions
      const newSelected: {[key: string]: number} = {};
      availableBudgets.forEach(budget => {
        if (suggestions[budget.category as keyof typeof suggestions]) {
          newSelected[budget.category] = suggestions[budget.category as keyof typeof suggestions];
        } else {
          newSelected[budget.category] = budget.limit;
        }
      });
      setSelectedBudgets(newSelected);
    }
  };

  const handleBudgetToggle = (category: string, defaultAmount: number) => {
    setSelectedBudgets(prev => {
      const newSelected = { ...prev };
      if (newSelected[category]) {
        delete newSelected[category];
      } else {
        newSelected[category] = defaultAmount;
      }
      return newSelected;
    });
  };

  const handleBudgetAmountChange = (category: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedBudgets(prev => ({
      ...prev,
      [category]: numAmount
    }));
  };

  const handleSetupBudgets = async () => {
    if (Object.keys(selectedBudgets).length === 0) {
      toast.error('Please select at least one budget category');
      return;
    }

    setIsLoading(true);
    try {
      // Add all selected budgets
      for (const [category, limit] of Object.entries(selectedBudgets)) {
        await onAddBudget({
          category,
          limit,
          spent: 0
        });
      }

      toast.success(`${Object.keys(selectedBudgets).length} budgets set up successfully!`);
      setOpen(false);
      setSelectedBudgets({});
      setTotalIncome('');
    } catch (error) {
      console.error('Error setting up budgets:', error);
      toast.error('Failed to set up budgets');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSelectedBudget = Object.values(selectedBudgets).reduce((sum, amount) => sum + amount, 0);
  const incomeNumber = parseFloat(totalIncome) || 0;
  const remainingIncome = incomeNumber - totalSelectedBudget;

  if (availableBudgets.length === 0) {
    return null; // Don't show wizard if all budgets are already set
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkle size={16} />
          Quick Budget Setup
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="text-primary" />
            Set Up Monthly Budgets
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Quickly set up budgets for multiple categories based on your monthly income
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Income Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator size={16} />
                Monthly Income (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="monthly-income">
                  Enter your monthly income for smart budget suggestions
                </Label>
                <Input
                  id="monthly-income"
                  type="number"
                  placeholder="Enter monthly income..."
                  value={totalIncome}
                  onChange={(e) => handleIncomeChange(e.target.value)}
                  className="text-lg"
                />
                {incomeNumber > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Budgeted: {formatCurrency(totalSelectedBudget)}
                    </span>
                    <span className={remainingIncome >= 0 ? 'text-accent' : 'text-destructive'}>
                      Remaining: {formatCurrency(remainingIncome)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Categories */}
          <div className="space-y-4">
            <h3 className="font-medium">Select Budget Categories</h3>
            <div className="grid gap-3">
              {availableBudgets.map((budget) => {
                const category = DEFAULT_CATEGORIES.find(cat => cat.name === budget.category);
                const isSelected = selectedBudgets[budget.category] !== undefined;
                const selectedAmount = selectedBudgets[budget.category] || budget.limit;

                return (
                  <Card 
                    key={budget.category} 
                    className={`cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-muted-foreground'
                    }`}
                    onClick={() => handleBudgetToggle(budget.category, budget.limit)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle size={20} className="text-primary" />}
                            <div 
                              className="w-8 h-8 rounded flex items-center justify-center text-sm"
                              style={{ backgroundColor: category?.color || 'oklch(0.6 0.1 240)' }}
                            >
                              {category?.icon || '📝'}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium">{budget.category}</h4>
                            <p className="text-sm text-muted-foreground">
                              Suggested: {formatCurrency(budget.limit)}
                            </p>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Input
                              type="number"
                              value={selectedAmount}
                              onChange={(e) => handleBudgetAmountChange(budget.category, e.target.value)}
                              className="w-24 text-right"
                              placeholder="0"
                            />
                            <Badge variant="secondary">Selected</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {Object.keys(selectedBudgets).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Budget Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Categories selected:</span>
                    <span className="font-medium">{Object.keys(selectedBudgets).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total monthly budget:</span>
                    <span className="font-medium">{formatCurrency(totalSelectedBudget)}</span>
                  </div>
                  {incomeNumber > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>Monthly income:</span>
                        <span className="font-medium">{formatCurrency(incomeNumber)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Savings/Other:</span>
                        <span className={`font-medium ${remainingIncome >= 0 ? 'text-accent' : 'text-destructive'}`}>
                          {formatCurrency(remainingIncome)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSetupBudgets}
              className="flex-1"
              disabled={isLoading || Object.keys(selectedBudgets).length === 0}
            >
              {isLoading ? 'Setting up...' : `Set up ${Object.keys(selectedBudgets).length} Budgets`}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}