import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Calendar, Tag } from '@phosphor-icons/react';
import { type Expense, DEFAULT_CATEGORIES, formatCurrency, formatDate } from '@/lib/types';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: (id: string) => void;
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const category = DEFAULT_CATEGORIES.find(cat => cat.name === expense.category);
  
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
            size="sm"
            onClick={() => onDelete(expense.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Tag size={14} />
            {expense.category}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(expense.date)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}