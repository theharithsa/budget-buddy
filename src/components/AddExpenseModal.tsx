import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Repeat } from '@phosphor-icons/react';
import { DEFAULT_CATEGORIES, DEFAULT_RECURRING_TEMPLATES, type Expense, type RecurringTemplate, formatCurrency } from '@/lib/types';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export function AddExpenseModal({ onAddExpense }: AddExpenseModalProps) {
  const [templates] = useKV<RecurringTemplate[]>('recurring-templates', DEFAULT_RECURRING_TEMPLATES);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Get most commonly used templates (first 6)
  const popularTemplates = templates.slice(0, 6);

  const handleUseTemplate = (template: RecurringTemplate) => {
    setAmount(template.amount.toString());
    setCategory(template.category);
    setDescription(template.description);
    setShowTemplates(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    onAddExpense({
      amount: numAmount,
      category,
      description: description || 'No description',
      date,
    });

    // Reset form
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setOpen(false);
    setShowTemplates(false);
    
    toast.success('Expense added successfully');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus size={16} />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        {/* Quick Templates Section */}
        {!showTemplates && popularTemplates.length > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quick Templates</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTemplates(true)}
                >
                  <Repeat size={14} className="mr-1" />
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {popularTemplates.slice(0, 4).map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex flex-col items-start h-auto p-3 text-left"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="text-xs font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency(template.amount)}</div>
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* All Templates View */}
        {showTemplates && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">All Templates</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTemplates(false)}
                >
                  Back to Form
                </Button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-auto p-3"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.category}</div>
                    </div>
                    <div className="text-sm font-medium">{formatCurrency(template.amount)}</div>
                  </Button>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">">>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
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
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="What did you spend on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Expense
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}