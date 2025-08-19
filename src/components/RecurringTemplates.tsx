import { useState } from 'react';
import { useKV } from '@github/spark/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Receipt, Repeat, Trash2, Edit3, Clock } from '@phosphor-icons/react';
import { type RecurringTemplate, type Expense, DEFAULT_CATEGORIES, DEFAULT_RECURRING_TEMPLATES, formatCurrency } from '@/lib/types';
import { toast } from 'sonner';

interface RecurringTemplatesProps {
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export function RecurringTemplates({ onAddExpense }: RecurringTemplatesProps) {
  const [templates, setTemplates] = useKV<RecurringTemplate[]>('recurring-templates', DEFAULT_RECURRING_TEMPLATES);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    description: '',
    frequency: 'monthly' as const
  });

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      description: '',
      frequency: 'monthly'
    });
  };

  const handleCreateTemplate = () => {
    if (!formData.name || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTemplate: RecurringTemplate = {
      id: Date.now().toString(),
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description || formData.name,
      frequency: formData.frequency,
      isDefault: false,
      createdAt: new Date().toISOString()
    };

    setTemplates(currentTemplates => [...currentTemplates, newTemplate]);
    resetForm();
    setIsCreateDialogOpen(false);
    toast.success('Template created successfully');
  };

  const handleEditTemplate = (template: RecurringTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      amount: template.amount.toString(),
      category: template.category,
      description: template.description,
      frequency: template.frequency
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateTemplate = () => {
    if (!editingTemplate || !formData.name || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const updatedTemplate: RecurringTemplate = {
      ...editingTemplate,
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description || formData.name,
      frequency: formData.frequency
    };

    setTemplates(currentTemplates => 
      currentTemplates.map(t => t.id === editingTemplate.id ? updatedTemplate : t)
    );
    resetForm();
    setEditingTemplate(null);
    setIsCreateDialogOpen(false);
    toast.success('Template updated successfully');
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(currentTemplates => currentTemplates.filter(t => t.id !== id));
    toast.success('Template deleted');
  };

  const handleUseTemplate = (template: RecurringTemplate) => {
    const expenseData = {
      amount: template.amount,
      category: template.category,
      description: template.description,
      date: new Date().toISOString().split('T')[0] // Today's date
    };
    
    onAddExpense(expenseData);
    toast.success(`Added ${template.name} to expenses`);
  };

  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  const getFrequencyBadgeVariant = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 'secondary';
      case 'bi-weekly': return 'outline';
      case 'monthly': return 'default';
      case 'quarterly': return 'secondary';
      case 'yearly': return 'outline';
      default: return 'default';
    }
  };

  const customTemplates = templates.filter(t => !t.isDefault);
  const defaultTemplates = templates.filter(t => t.isDefault);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Recurring Templates</h2>
          <p className="text-muted-foreground">
            Quick templates for recurring bills and subscriptions
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  placeholder="e.g., Monthly Rent"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((category) => (
                      <SelectItem key={category.name} value={category.name}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Frequency</label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
                  className="flex-1"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Templates</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <Card key={template.id} className="relative group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getFrequencyBadgeVariant(template.frequency)}>
                          <Clock size={12} className="mr-1" />
                          {template.frequency}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(template.amount)}</div>
                      <div className="text-sm text-muted-foreground">{template.category}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {template.description}
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Receipt size={14} className="mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Default Templates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <h3 className="text-lg font-medium text-muted-foreground">Common Templates</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {defaultTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Repeat size={16} className="text-muted-foreground" />
                  {template.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-lg font-semibold">{formatCurrency(template.amount)}</div>
                    <div className="text-xs text-muted-foreground">{template.category}</div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleUseTemplate(template)}
                  >
                    <Plus size={12} className="mr-1" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Repeat size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create templates for recurring expenses like bills and subscriptions to log them quickly.
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Create Your First Template
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}