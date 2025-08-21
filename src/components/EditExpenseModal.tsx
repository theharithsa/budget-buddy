import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, Camera } from 'lucide-react';
import { type Expense, type CustomCategory, type Person, DEFAULT_CATEGORIES, getAllCategories, getAllPeople } from '@/lib/types';
import { toast } from 'sonner';

interface EditExpenseModalProps {
  expense: Expense;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (expenseId: string, expenseData: Partial<Expense>) => Promise<void>;
  customCategories?: CustomCategory[];
  customPeople?: Person[];
  publicPeople?: Person[];
}

export function EditExpenseModal({ 
  expense, 
  isOpen, 
  onClose, 
  onUpdate, 
  customCategories = [], 
  customPeople = [],
  publicPeople = []
}: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);
  const [selectedPeople, setSelectedPeople] = useState<string[]>(expense.peopleIds || []);
  
  const allCategories = getAllCategories(customCategories);
  const allPeople = getAllPeople([...customPeople, ...publicPeople]);

  // Reset form when expense changes
  useEffect(() => {
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date);
    setSelectedPeople(expense.peopleIds || []);
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const updateData: Partial<Expense> = {
        amount: numAmount,
        category,
        description: description.trim(),
        date,
        peopleIds: selectedPeople.length > 0 ? selectedPeople : undefined
      };

      await onUpdate(expense.id, updateData);
      toast.success('Expense updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setLoading(false);
    }
  };

  const handlePeopleToggle = (personId: string) => {
    setSelectedPeople(prev => 
      prev.includes(personId) 
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const selectedPeopleData = allPeople.filter(person => selectedPeople.includes(person.id!));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter expense description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="min-h-[80px]"
            />
          </div>

          {/* People Selection */}
          <div className="space-y-3">
            <Label>People (Optional)</Label>
            <p className="text-sm text-muted-foreground">
              Select people this expense was for:
            </p>
            
            {/* Selected People Display */}
            {selectedPeopleData.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                {selectedPeopleData.map((person) => (
                  <Badge 
                    key={person.id} 
                    variant="secondary"
                    className="flex items-center gap-1"
                    style={{ backgroundColor: `${person.color}20`, borderColor: person.color }}
                  >
                    <span>{person.icon}</span>
                    {person.name}
                    <button
                      type="button"
                      onClick={() => handlePeopleToggle(person.id!)}
                      className="ml-1 hover:bg-background/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* People Selection Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {allPeople.map((person) => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => handlePeopleToggle(person.id!)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${
                    selectedPeople.includes(person.id!) 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <span>{person.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{person.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{person.relationship}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Receipt Display */}
          {expense.receiptUrl && (
            <div className="space-y-2">
              <Label>Current Receipt</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {expense.receiptFileName || 'Receipt attached'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Note: Receipt cannot be changed during editing. Delete and re-add the expense to change receipt.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
