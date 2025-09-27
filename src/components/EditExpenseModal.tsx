import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, Camera, Eye, Trash2 } from 'lucide-react';
import { type Expense, type CustomCategory, type Person, DEFAULT_CATEGORIES, getAllCategories, getAllPeople, getAllApps, getAppsByCategory, type AppOption } from '@/lib/types';
import { uploadFile, generateReceiptPath, validateReceiptFile, deleteFile } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [description, setDescription] = useState(expense.description);
  const [date, setDate] = useState(expense.date);
  const [app, setApp] = useState(expense.app || 'Cash'); // Default to Cash if not set
  const [selectedPeople, setSelectedPeople] = useState<string[]>(expense.peopleIds || []);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState<string | undefined>(expense.receiptUrl);
  const [currentReceiptFileName, setCurrentReceiptFileName] = useState<string | undefined>(expense.receiptFileName);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const allCategories = getAllCategories(customCategories);
  const allPeople = getAllPeople([...customPeople, ...publicPeople]);

  // Reset form when expense changes
  useEffect(() => {
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date);
    setApp(expense.app || 'Cash'); // Reset app field when expense changes
    setSelectedPeople(expense.peopleIds || []);
    setCurrentReceiptUrl(expense.receiptUrl);
    setCurrentReceiptFileName(expense.receiptFileName);
    setReceiptFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [expense]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateReceiptFile(file);
      setReceiptFile(file);
      toast.success('Receipt selected successfully');
    } catch (error: any) {
      toast.error(error.message);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setCurrentReceiptUrl(undefined);
    setCurrentReceiptFileName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Receipt removed');
  };

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
    setIsUploading(true);

    try {
      let newReceiptUrl: string | undefined = currentReceiptUrl;
      let newReceiptFileName: string | undefined = currentReceiptFileName;
      let shouldRemoveReceipt = false;

      // Handle receipt upload if a new file is selected
      if (receiptFile) {
        if (!user) {
          toast.error('User not authenticated');
          return;
        }

        console.log('Uploading new receipt file...');
        const receiptPath = generateReceiptPath(user.uid, receiptFile.name);
        newReceiptUrl = await uploadFile(receiptFile, receiptPath);
        newReceiptFileName = receiptFile.name;
        console.log('New receipt uploaded successfully:', newReceiptUrl);

        // Delete old receipt if it exists
        if (expense.receiptUrl && expense.receiptUrl !== newReceiptUrl) {
          try {
            // Extract path from old receipt URL for deletion
            const oldPath = expense.receiptUrl.split('/').pop()?.split('?')[0];
            if (oldPath) {
              await deleteFile(`receipts/${user.uid}/${oldPath}`);
              console.log('Old receipt deleted successfully');
            }
          } catch (deleteError) {
            console.warn('Failed to delete old receipt:', deleteError);
            // Don't block the update if old file deletion fails
          }
        }
      }

      // Handle receipt removal (if currentReceiptUrl is undefined and there was an original receipt)
      if (!currentReceiptUrl && !receiptFile && expense.receiptUrl) {
        if (user) {
          try {
            const oldPath = expense.receiptUrl.split('/').pop()?.split('?')[0];
            if (oldPath) {
              await deleteFile(`receipts/${user.uid}/${oldPath}`);
              console.log('Receipt deleted successfully');
            }
          } catch (deleteError) {
            console.warn('Failed to delete receipt:', deleteError);
          }
        }
        newReceiptUrl = undefined;
        newReceiptFileName = undefined;
        shouldRemoveReceipt = true;
      }

      const updateData: Partial<Expense> = {
        amount: numAmount,
        category,
        description: description.trim(),
        date,
        app: app || 'Cash', // Include app field in update
        // Only include fields that have actual values or need to be removed
        ...(selectedPeople.length > 0 && { peopleIds: selectedPeople }),
        ...(newReceiptUrl !== undefined && { receiptUrl: newReceiptUrl }),
        ...(newReceiptFileName !== undefined && { receiptFileName: newReceiptFileName })
      };

      // Add special marker for field removal
      if (shouldRemoveReceipt) {
        (updateData as any)._removeReceipt = true;
      }

      await onUpdate(expense.id, updateData);
      toast.success('Expense updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    } finally {
      setLoading(false);
      setIsUploading(false);
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

  const ReceiptViewer = ({ receiptUrl, receiptFileName }: { receiptUrl: string; receiptFileName?: string }) => {
    const isPDF = receiptFileName?.toLowerCase().endsWith('.pdf');

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/40">
            <Eye className="w-4 h-4 mr-2" />
            View Receipt
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Receipt - {receiptFileName || 'Receipt'}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {isPDF ? (
              <iframe
                src={receiptUrl}
                className="w-full h-96 border rounded"
                title="Receipt PDF"
              />
            ) : (
              <img
                src={receiptUrl}
                alt="Receipt"
                className="max-w-full max-h-96 object-contain rounded"
              />
            )}
          </div>
          <div className="flex justify-center pt-4">
            <Button asChild>
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                Open in New Tab
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

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

          {/* Receipt Management */}
          <div className="space-y-3">
            <Label>Receipt (Optional)</Label>
            
            {/* Current Receipt or New Receipt Display */}
            {(currentReceiptUrl || receiptFile) ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground flex-1">
                    {receiptFile ? receiptFile.name : (currentReceiptFileName || 'Receipt attached')}
                    {receiptFile && <span className="text-primary ml-1">(New file selected)</span>}
                  </span>
                  <div className="flex gap-2">
                    {currentReceiptUrl && !receiptFile && (
                      <ReceiptViewer receiptUrl={currentReceiptUrl} receiptFileName={currentReceiptFileName} />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveReceipt}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Upload new receipt option */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-file-edit"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="text-primary border-primary/20 hover:bg-primary/5"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {receiptFile ? 'Change Receipt' : 'Replace Receipt'}
                  </Button>
                </div>
                
                {receiptFile && (
                  <p className="text-xs text-muted-foreground">
                    New receipt will be uploaded when you save the expense.
                  </p>
                )}
              </div>
            ) : (
              /* No Receipt - Upload Option */
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="receipt-file-edit"
                />
                <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-3">
                  Add a receipt for this expense
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-primary border-primary/20 hover:bg-primary/5"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Receipt
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports JPG, PNG, WebP, PDF (max 5MB)
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isUploading}
              className="flex-1"
            >
              {loading || isUploading ? (isUploading ? 'Uploading...' : 'Updating...') : 'Update Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
