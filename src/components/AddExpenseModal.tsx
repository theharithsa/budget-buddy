import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  RefreshCw as ArrowsClockwise,
  Upload,
  X,
  FileImage as File
} from 'lucide-react';
import { DEFAULT_CATEGORIES, DEFAULT_RECURRING_TEMPLATES, getAllCategories, getAllPeople, getAllApps, getAppsByCategory, type Expense, type RecurringTemplate, type CustomCategory, type Person, type AppOption, formatCurrency } from '@/lib/types';
import { uploadFile, generateReceiptPath, validateReceiptFile } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useComponentTracking, useMonitoredFirebase } from '@/hooks/useDynatraceMonitoring';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  customCategories?: CustomCategory[];
  customPeople?: Person[];
  publicPeople?: Person[];
  // Optional initial values for pre-filling from templates
  initialAmount?: string;
  initialCategory?: string;
  initialDescription?: string;
}

export function AddExpenseModal({
  isOpen = false,
  onClose,
  onAddExpense,
  customCategories = [],
  customPeople = [],
  publicPeople = [],
  initialAmount = '',
  initialCategory = '',
  initialDescription = ''
}: AddExpenseModalProps) {
  const { user } = useAuth();
  const { trackComponentEvent } = useComponentTracking('AddExpenseModal');
  const { trackOperation } = useMonitoredFirebase();

  const templates = DEFAULT_RECURRING_TEMPLATES;
  const [open, setOpen] = useState(isOpen);

  // Sync internal open state with external isOpen prop
  useEffect(() => {
    setOpen(isOpen);
    // When modal opens with initial values, update form state
    if (isOpen) {
      if (initialAmount) setAmount(initialAmount);
      if (initialCategory) setCategory(initialCategory);
      if (initialDescription) setDescription(initialDescription);
    }
  }, [isOpen, initialAmount, initialCategory, initialDescription]);

  // Handle open state changes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && onClose) {
      onClose();
    }
  };
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [app, setApp] = useState('Cash'); // Default to Cash
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions for people management
  const allPeople = getAllPeople([...customPeople, ...publicPeople]);

  const handlePeopleToggle = (personId: string) => {
    console.log('People toggle clicked for ID:', personId);
    setSelectedPeople(prev => {
      const newSelection = prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId];
      console.log('Previous selection:', prev);
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const selectedPeopleData = allPeople.filter(person => selectedPeople.includes(person.id!));

  // Get most commonly used templates (first 6)
  const popularTemplates = templates?.slice(0, 6) || [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateReceiptFile(file);
      setReceiptFile(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid file');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePerson = (personId: string) => {
    setSelectedPeople(prev => {
      const newSelection = prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId];
      return newSelection;
    });
  };

  const handleUseTemplate = (template: RecurringTemplate) => {
    setAmount(template.amount.toString());
    setCategory(template.category);
    setDescription(template.description);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      trackComponentEvent('Form Validation Failed', { field: 'amount', value: amount });
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      trackComponentEvent('Form Validation Failed', { field: 'category' });
      return;
    }

    console.log('Starting expense submission...');
    console.log('Selected people at submission:', selectedPeople);
    console.log('Selected people length:', selectedPeople.length);

    setIsUploading(true);

    trackComponentEvent('Expense Form Submission Started', {
      amount: numAmount,
      category,
      hasDescription: Boolean(description),
      hasReceipt: Boolean(receiptFile),
      peopleCount: selectedPeople.length,
      receiptFileSize: receiptFile?.size || 0,
      receiptFileType: receiptFile?.type || 'none'
    });

    try {
      let receiptUrl: string | undefined;
      let receiptFileName: string | undefined;

      // Upload receipt if one is selected
      if (receiptFile) {
        if (!user) {
          toast.error('User not authenticated');
          trackComponentEvent('Receipt Upload Failed', { reason: 'User not authenticated' });
          return;
        }

        trackOperation('upload', 'storage', true, { fileName: receiptFile.name, fileSize: receiptFile.size });
        const receiptPath = generateReceiptPath(user.uid, receiptFile.name);
        receiptUrl = await uploadFile(receiptFile, receiptPath);
        receiptFileName = receiptFile.name;

        trackComponentEvent('Receipt Upload Completed', {
          fileName: receiptFileName,
          fileSize: receiptFile.size,
          fileType: receiptFile.type
        });
      }

      const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
        amount: numAmount,
        category,
        description: description || 'No description',
        date,
        app: app || 'Cash', // Default to Cash if no app selected
        receiptUrl: receiptUrl || undefined,
        receiptFileName: receiptFileName || undefined,
        peopleIds: selectedPeople.length > 0 ? selectedPeople : undefined,
      };

      console.log('Complete expense data being submitted:', expenseData);

      await onAddExpense(expenseData);

      trackComponentEvent('Expense Form Submission Successful', {
        amount: numAmount,
        category,
        hasReceipt: Boolean(receiptUrl),
        peopleCount: selectedPeople.length
      });

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setApp('Cash'); // Reset to default Cash
      setSelectedPeople([]);
      setReceiptFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      handleOpenChange(false);
      setShowTemplates(false);

      toast.success('Expense added successfully');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to add expense');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <ArrowsClockwise className="w-4 h-4 mr-1" />
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
                {(templates || []).map((template) => (
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* App/Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="app">Platform/App</Label>
            <Select value={app} onValueChange={setApp}>
              <SelectTrigger id="app">
                <SelectValue placeholder="Select platform or app" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {/* Show all apps if no category selected, or filter by category */}
                {(category ? getAppsByCategory(category) : getAllApps()).map((appOption) => (
                  <SelectItem
                    key={appOption.name}
                    value={appOption.name}
                    className="flex items-center gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span>{appOption.icon}</span>
                      <span>{appOption.name}</span>
                      {appOption.category !== 'General' && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {appOption.category}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* People Selection */}
          <div className="space-y-3">
            <Label>People this expense is for (optional)</Label>

            {/* Selected People Display */}
            {selectedPeopleData.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPeopleData.map((person) => (
                  <Badge
                    key={person.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <span>{person.icon}</span>
                    {person.name}
                    <button
                      type="button"
                      onClick={() => handlePeopleToggle(person.id!)}
                      className="ml-1 hover:text-destructive"
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
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors ${selectedPeople.includes(person.id!)
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

            {allPeople.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No people added yet. Go to People Manager to add people.
              </p>
            )}
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

          {/* Receipt Upload Section */}
          <div className="space-y-2">
            <Label>Receipt (optional)</Label>
            {!receiptFile ? (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="receipt-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium">Click to upload receipt</span>
                      <p className="text-xs text-muted-foreground">PNG, JPG, WebP or PDF (max 5MB)</p>
                    </div>
                  </div>
                </Button>
              </div>
            ) : (
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{receiptFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}