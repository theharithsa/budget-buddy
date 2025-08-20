import { useState, useEffect, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  RefreshCw as ArrowsClockwise, 
  Upload, 
  X, 
  FileImage as File 
} from 'lucide-react';
import { DEFAULT_CATEGORIES, DEFAULT_RECURRING_TEMPLATES, getAllCategories, type Expense, type RecurringTemplate, type CustomCategory, formatCurrency } from '@/lib/types';
import { uploadFile, generateReceiptPath, validateReceiptFile } from '@/lib/firebase';
import { toast } from 'sonner';

interface AddExpenseModalProps {
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  customCategories?: CustomCategory[];
}

export function AddExpenseModal({ onAddExpense, customCategories = [] }: AddExpenseModalProps) {
  const [templates] = useKV<RecurringTemplate[]>('recurring-templates', DEFAULT_RECURRING_TEMPLATES);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get most commonly used templates (first 6)
  const popularTemplates = templates.slice(0, 6);

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
      return;
    }
    
    if (!category) {
      toast.error('Please select a category');
      return;
    }

    console.log('Starting expense submission...');
    console.log('Form data:', { amount: numAmount, category, description, date });

    setIsUploading(true);

    try {
      let receiptUrl: string | undefined;
      let receiptFileName: string | undefined;

      // Upload receipt if one is selected
      if (receiptFile) {
        console.log('Uploading receipt file...');
        const expenseId = Date.now().toString();
        const receiptPath = generateReceiptPath(expenseId, receiptFile.name);
        receiptUrl = await uploadFile(receiptFile, receiptPath);
        receiptFileName = receiptFile.name;
        console.log('Receipt uploaded successfully:', receiptUrl);
      }

      const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
        amount: numAmount,
        category,
        description: description || 'No description',
        date,
        receiptUrl: receiptUrl || null,
        receiptFileName: receiptFileName || null,
      };

      console.log('Calling onAddExpense with:', expenseData);
      await onAddExpense(expenseData);

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setOpen(false);
      setShowTemplates(false);
      
      toast.success('Expense added successfully');
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      toast.error(error?.message || 'Failed to add expense');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
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