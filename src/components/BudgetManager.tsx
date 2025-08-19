import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, AlertTriangle, Wallet } from '@phosphor-icons/react';
import { DEFAULT_CATEGORIES, type Budget, formatCurrency } from '@/lib/types';
import { toast } from 'sonner';

interface BudgetManagerProps {
  budgets: Budget[];
  onUpdateBudgets: (budgets: Budget[]) => void;
}

export function BudgetManager({ budgets, onUpdateBudgets }: BudgetManagerProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');

  const handleAddBudget = (e: React.FormEvent) => {
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

    const existingBudgetIndex = budgets.findIndex(b => b.category === category);
    const newBudget: Budget = {
      category,
      limit: numLimit,
      spent: existingBudgetIndex >= 0 ? budgets[existingBudgetIndex].spent : 0,
    };

    let updatedBudgets;
    if (existingBudgetIndex >= 0) {
      updatedBudgets = budgets.map(b => b.category === category ? newBudget : b);
      toast.success('Budget updated successfully');
    } else {
      updatedBudgets = [...budgets, newBudget];
      toast.success('Budget added successfully');
    }

    onUpdateBudgets(updatedBudgets);
    setCategory('');
    setLimit('');
    setOpen(false);
  };

  const handleDeleteBudget = (category: string) => {
    const updatedBudgets = budgets.filter(b => b.category !== category);
    onUpdateBudgets(updatedBudgets);
    toast.success('Budget removed');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet size={24} className="text-primary" />
          <h2 className="text-2xl font-bold">Budget Overview</h2>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Set Budget
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
                    {DEFAULT_CATEGORIES.map((cat) => (
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
                <Button type="submit" className="flex-1">
                  Set Budget
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No budgets set</h3>
              <p className="text-muted-foreground mb-4">
                Set spending limits for your categories to better track your finances.
              </p>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus size={16} />
                Set Your First Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const category = DEFAULT_CATEGORIES.find(cat => cat.name === budget.category);
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
                        <AlertTriangle 
                          size={20} 
                          className={isOverBudget ? 'text-destructive' : 'text-yellow-500'} 
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.category)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove
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
    </div>
  );
}