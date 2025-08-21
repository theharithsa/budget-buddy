import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2 as Trash, Calendar, Tag, Receipt, Eye, Users, Edit } from 'lucide-react';
import { type Expense, type Person, DEFAULT_CATEGORIES, getAllPeople, formatCurrency, formatDate } from '@/lib/types';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
  onEdit?: () => void;
  customPeople?: Person[];
}

export function ExpenseCard({ expense, onDelete, onEdit, customPeople = [] }: ExpenseCardProps) {
  const category = DEFAULT_CATEGORIES.find(cat => cat.name === expense.category);
  const allPeople = getAllPeople(customPeople);
  
  // Get people associated with this expense
  const associatedPeople = expense.peopleIds 
    ? allPeople.filter(person => expense.peopleIds?.includes(person.id!))
    : [];
  
  const ReceiptViewer = () => {
    if (!expense.receiptUrl) return null;

    const isPDF = expense.receiptFileName?.toLowerCase().endsWith('.pdf');

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
            <Eye className="w-4 h-4 mr-1" />
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
    <Card className="expense-animation h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
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
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-primary/10"
                onClick={onEdit}
                aria-label="Edit expense"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={() => onDelete(expense.id)}
              aria-label="Delete expense"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-grow flex flex-col justify-between">
        <div className="space-y-3">
          {/* People Section */}
          {associatedPeople.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>For:</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {associatedPeople.map((person) => (
                  <Badge 
                    key={person.id} 
                    variant="secondary" 
                    className="text-xs flex items-center gap-1"
                  >
                    <span 
                      className="w-3 h-3 rounded-full flex items-center justify-center text-[10px]"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.icon}
                    </span>
                    {person.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Existing info section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {expense.category}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(expense.date)}
              </div>
              {expense.receiptUrl && (
                <div className="flex items-center gap-1">
                  <Receipt className="w-4 h-4" />
                  Receipt
                </div>
              )}
            </div>
            {expense.receiptUrl && <ReceiptViewer />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}