import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrashSimple, Calendar, Tag as TagIcon, Receipt, Eye } from '@phosphor-icons/react';
import { type Expense, DEFAULT_CATEGORIES, formatCurrency, formatDate } from '@/lib/types';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const category = DEFAULT_CATEGORIES.find(cat => cat.name === expense.category);
  
  const ReceiptViewer = () => {
    if (!expense.receiptUrl) return null;

    const isPDF = expense.receiptFileName?.toLowerCase().endsWith('.pdf');

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
            <Eye size={16} weight="regular" className="mr-1" />
            View Receipt
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Receipt - {expense.receiptFileName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {isPDF ? (
              <iframe
                src={expense.receiptUrl}
                className="w-full h-96 border rounded"
                title="Receipt PDF"
              />
            ) : (
              <img
                src={expense.receiptUrl}
                alt="Receipt"
                className="max-w-full max-h-96 object-contain rounded"
              />
            )}
          </div>
          <div className="flex justify-center pt-4">
            <Button asChild>
              <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                Open in New Tab
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  return (
    <Card className="expense-animation">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
              style={{ backgroundColor: category?.color || 'oklch(0.6 0.1 240)' }}
            >
              {category?.icon || '📝'}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">
                {formatCurrency(expense.amount)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{expense.description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
            onClick={() => onDelete(expense.id)}
            aria-label="Delete expense"
          >
            <TrashSimple size={16} weight="regular" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <TagIcon size={16} weight="regular" />
              {expense.category}
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={16} weight="regular" />
              {formatDate(expense.date)}
            </div>
            {expense.receiptUrl && (
              <div className="flex items-center gap-1">
                <Receipt size={16} weight="regular" />
                Receipt
              </div>
            )}
          </div>
          {expense.receiptUrl && <ReceiptViewer />}
        </div>
      </CardContent>
    </Card>
  );
}