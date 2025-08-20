import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Lightbulb, 
  Calculator, 
  Target 
} from 'lucide-react';
import { type Budget, DEFAULT_CATEGORIES, formatCurrency } from '@/lib/types';

interface BudgetSuggestion {
  category: string;
  percentage: number;
  amount: number;
  description: string;
  priority: 'essential' | 'important' | 'optional';
}

interface BudgetSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBudgetsCreate: (budgets: Budget[]) => void;
  existingBudgets: Budget[];
}

const BUDGET_GUIDELINES = {
  // Essential expenses (50-60% of income)
  'Food & Dining': { percentage: 12, priority: 'essential' as const, description: 'Groceries and dining out' },
  'Housing': { percentage: 25, priority: 'essential' as const, description: 'Rent, utilities, maintenance' },
  'Transportation': { percentage: 15, priority: 'essential' as const, description: 'Fuel, public transport, maintenance' },
  'Healthcare': { percentage: 5, priority: 'essential' as const, description: 'Medical expenses, insurance' },
  
  // Important expenses (20-30% of income)
  'Savings': { percentage: 20, priority: 'important' as const, description: 'Emergency fund, retirement' },
  'Insurance': { percentage: 5, priority: 'important' as const, description: 'Life, health, vehicle insurance' },
  'Education': { percentage: 5, priority: 'important' as const, description: 'Courses, books, training' },
  
  // Optional expenses (10-30% of income)
  'Entertainment': { percentage: 8, priority: 'optional' as const, description: 'Movies, games, hobbies' },
  'Shopping': { percentage: 10, priority: 'optional' as const, description: 'Clothes, electronics, misc' },
  'Travel': { percentage: 5, priority: 'optional' as const, description: 'Vacations, weekend trips' },
  'Personal Care': { percentage: 3, priority: 'optional' as const, description: 'Grooming, wellness' },
  'Other': { percentage: 2, priority: 'optional' as const, description: 'Miscellaneous expenses' },
};

export function BudgetSetupWizard({ open, onOpenChange, onBudgetsCreate, existingBudgets }: BudgetSetupWizardProps) {
  const [step, setStep] = useState(1);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [budgetType, setBudgetType] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>({});

  const generateSuggestions = (income: number, type: 'conservative' | 'balanced' | 'aggressive') => {
    const multipliers = {
      conservative: { essential: 1.2, important: 1.1, optional: 0.7 },
      balanced: { essential: 1.0, important: 1.0, optional: 1.0 },
      aggressive: { essential: 0.8, important: 0.9, optional: 1.3 }
    };

    const multiplier = multipliers[type];
    
    return Object.entries(BUDGET_GUIDELINES).map(([category, guideline]) => ({
      category,
      percentage: guideline.percentage * multiplier[guideline.priority],
      amount: Math.round((income * guideline.percentage * multiplier[guideline.priority]) / 100),
      description: guideline.description,
      priority: guideline.priority
    }));
  };

  const handleIncomeSubmit = () => {
    const income = parseFloat(monthlyIncome);
    if (income > 0) {
      const newSuggestions = generateSuggestions(income, budgetType);
      setSuggestions(newSuggestions);
      
      // Initialize custom amounts with suggestions
      const amounts: Record<string, number> = {};
      newSuggestions.forEach(suggestion => {
        amounts[suggestion.category] = suggestion.amount;
      });
      setCustomAmounts(amounts);
      
      setStep(2);
    }
  };

  const handleCustomAmountChange = (category: string, amount: string) => {
    const numAmount = parseInt(amount) || 0;
    setCustomAmounts(prev => ({
      ...prev,
      [category]: numAmount
    }));
  };

  const handleCreateBudgets = () => {
    const newBudgets: Budget[] = Object.entries(customAmounts)
      .filter(([_, amount]) => amount > 0)
      .map(([category, amount]) => ({
        id: `budget-${Date.now()}-${category}`,
        category,
        limit: amount,
        spent: 0,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM format
        createdAt: new Date().toISOString()
      }));

    onBudgetsCreate(newBudgets);
    onOpenChange(false);
    
    // Reset wizard state
    setStep(1);
    setMonthlyIncome('');
    setBudgetType('balanced');
    setSuggestions([]);
    setCustomAmounts({});
  };

  const totalBudget = Object.values(customAmounts).reduce((sum, amount) => sum + amount, 0);
  const income = parseFloat(monthlyIncome) || 0;
  const budgetUtilization = income > 0 ? (totalBudget / income) * 100 : 0;

  const getPriorityColor = (priority: 'essential' | 'important' | 'optional') => {
    switch (priority) {
      case 'essential': return 'bg-red-100 text-red-800 border-red-200';
      case 'important': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'optional': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getProgressColor = () => {
    if (budgetUtilization <= 80) return 'bg-green-500';
    if (budgetUtilization <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator size={20} />
            Quick Budget Setup Wizard
          </DialogTitle>
          <DialogDescription>
            Set up your monthly budgets with AI-powered suggestions based on your income and spending style.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="income" className="text-base font-medium">
                  What's your monthly income? (₹)
                </Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="Enter your monthly income in INR"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="text-lg mt-2"
                />
              </div>

              <div>
                <Label className="text-base font-medium mb-3 block">
                  Choose your budgeting style:
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card 
                    className={`cursor-pointer transition-all ${budgetType === 'conservative' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setBudgetType('conservative')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">🛡️ Conservative</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        Higher allocation to essentials and savings. Lower entertainment spending.
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${budgetType === 'balanced' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setBudgetType('balanced')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">⚖️ Balanced</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        Recommended 50/30/20 rule. Balanced approach to all categories.
                      </p>
                    </CardContent>
                  </Card>

                  <Card 
                    className={`cursor-pointer transition-all ${budgetType === 'aggressive' ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setBudgetType('aggressive')}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">🚀 Aggressive</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        Lower essentials, higher discretionary spending and entertainment.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleIncomeSubmit}
                disabled={!monthlyIncome || parseFloat(monthlyIncome) <= 0}
                className="flex items-center gap-2"
              >
                Generate Suggestions
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Customize Your Budget</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust the suggested amounts to fit your needs
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total Budget</div>
                <div className="text-lg font-semibold">{formatCurrency(totalBudget)}</div>
                <div className="text-xs text-muted-foreground">
                  {budgetUtilization.toFixed(1)}% of income
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget utilization</span>
                <span className={budgetUtilization > 100 ? 'text-destructive font-medium' : ''}>
                  {budgetUtilization.toFixed(1)}%
                </span>
              </div>
              <Progress value={Math.min(budgetUtilization, 100)} className="h-2" />
              {budgetUtilization > 100 && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <Lightbulb size={14} />
                  <span>Budget exceeds income. Consider reducing some categories.</span>
                </div>
              )}
            </div>

            <div className="grid gap-4">
              {['essential', 'important', 'optional'].map(priority => {
                const prioritySuggestions = suggestions.filter(s => s.priority === priority);
                if (prioritySuggestions.length === 0) return null;

                return (
                  <div key={priority}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={getPriorityColor(priority as any)}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {priority === 'essential' && 'Must-have expenses'}
                        {priority === 'important' && 'Should-have expenses'}
                        {priority === 'optional' && 'Nice-to-have expenses'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {prioritySuggestions.map(suggestion => {
                        const categoryIcon = DEFAULT_CATEGORIES.find(c => c.name === suggestion.category)?.icon || '💰';
                        
                        return (
                          <Card key={suggestion.category} className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{categoryIcon}</span>
                                <div>
                                  <div className="font-medium text-sm">{suggestion.category}</div>
                                  <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {suggestion.percentage.toFixed(1)}%
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">₹</span>
                              <Input
                                type="number"
                                value={customAmounts[suggestion.category] || 0}
                                onChange={(e) => handleCustomAmountChange(suggestion.category, e.target.value)}
                                className="h-8 text-sm"
                                placeholder="0"
                              />
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="text-right text-sm">
                  <div className="text-muted-foreground">Creating {Object.values(customAmounts).filter(a => a > 0).length} budgets</div>
                  <div className="font-medium">Total: {formatCurrency(totalBudget)}</div>
                </div>
                <Button 
                  onClick={handleCreateBudgets}
                  className="flex items-center gap-2"
                  disabled={totalBudget === 0}
                >
                  <Target size={16} />
                  Create Budgets
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}