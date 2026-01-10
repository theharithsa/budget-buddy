import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Receipt,
  RefreshCw as ArrowsClockwise,
  Trash2 as Trash,
  Pencil,
  Clock,
  Search,
  Check
} from 'lucide-react';
import { type RecurringTemplate, type Expense, type CustomCategory, type Person, DEFAULT_CATEGORIES, getAllCategories, DEFAULT_RECURRING_TEMPLATES, formatCurrency } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToTemplates } from '@/lib/firebase';
import { toast } from 'sonner';
import { AddExpenseModal } from '@/components/AddExpenseModal';

interface RecurringTemplatesProps {
  onAddExpense: (expenseData: Omit<Expense, 'id' | 'createdAt'>) => Promise<void>;
  onAddTemplate: (template: Omit<RecurringTemplate, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  customCategories?: CustomCategory[];
  customPeople?: Person[];
  publicPeople?: Person[];
}

export function RecurringTemplates({ onAddExpense, onAddTemplate, onDeleteTemplate, customCategories = [], customPeople = [], publicPeople = [] }: RecurringTemplatesProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<RecurringTemplate[]>(DEFAULT_RECURRING_TEMPLATES);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for AddExpenseModal with pre-filled template values
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedTemplateForExpense, setSelectedTemplateForExpense] = useState<RecurringTemplate | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Custom amounts for default templates (stored in localStorage)
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('finbuddy-template-custom-amounts');
    return saved ? JSON.parse(saved) : {};
  });

  // State for inline editing
  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingAmountValue, setEditingAmountValue] = useState('');

  // Save custom amounts to localStorage
  useEffect(() => {
    localStorage.setItem('finbuddy-template-custom-amounts', JSON.stringify(customAmounts));
  }, [customAmounts]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: '',
    description: '',
    frequency: 'monthly' as const
  });

  // Subscribe to user templates from Firebase
  useEffect(() => {
    if (!user) {
      setTemplates(DEFAULT_RECURRING_TEMPLATES);
      return;
    }

    const unsubscribe = subscribeToTemplates(user.uid, (userTemplates) => {
      // Combine default templates with user templates
      setTemplates([...DEFAULT_RECURRING_TEMPLATES, ...userTemplates]);
    });

    return unsubscribe;
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: '',
      description: '',
      frequency: 'monthly'
    });
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await onAddTemplate({
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || formData.name,
        frequency: formData.frequency,
        isDefault: false,
      });

      resetForm();
      setIsCreateDialogOpen(false);
      toast.success('Template created successfully');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template: RecurringTemplate) => {
    if (template.isDefault) {
      toast.error('Cannot edit default templates');
      return;
    }

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

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // For updates, we delete the old and create new (since we don't have update function)
      await onDeleteTemplate(editingTemplate.id);
      await onAddTemplate({
        name: formData.name,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || formData.name,
        frequency: formData.frequency,
        isDefault: false,
      });

      resetForm();
      setEditingTemplate(null);
      setIsCreateDialogOpen(false);
      toast.success('Template updated successfully');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isDefault) {
      toast.error('Cannot delete default templates');
      return;
    }

    try {
      await onDeleteTemplate(id);
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleUseTemplate = (template: RecurringTemplate) => {
    // Open AddExpenseModal with template values pre-filled (use custom amount if set)
    const amount = getTemplateAmount(template);
    setSelectedTemplateForExpense({ ...template, amount });
    setShowAddExpenseModal(true);
  };

  const handleAddExpenseModalClose = () => {
    setShowAddExpenseModal(false);
    setSelectedTemplateForExpense(null);
  };

  // Get the effective amount for a template (custom or default)
  const getTemplateAmount = (template: RecurringTemplate): number => {
    return customAmounts[template.id] ?? template.amount;
  };

  // Start inline editing of amount
  const startEditingAmount = (template: RecurringTemplate) => {
    setEditingAmountId(template.id);
    setEditingAmountValue(getTemplateAmount(template).toString());
  };

  // Save the custom amount
  const saveCustomAmount = (templateId: string) => {
    const newAmount = parseFloat(editingAmountValue);
    if (!isNaN(newAmount) && newAmount > 0) {
      setCustomAmounts(prev => ({ ...prev, [templateId]: newAmount }));
      toast.success('Template amount updated');
    }
    setEditingAmountId(null);
    setEditingAmountValue('');
  };

  // Reset to default amount
  const resetToDefaultAmount = (templateId: string) => {
    setCustomAmounts(prev => {
      const updated = { ...prev };
      delete updated[templateId];
      return updated;
    });
    toast.success('Reset to default amount');
  };

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
      resetForm();
    }
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

  // Filter templates based on search term
  const filteredDefaultTemplates = defaultTemplates.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    {getAllCategories(customCategories).map((category) => (
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
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                </Button>
                <Button variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Tips */}
      <Card className="bg-accent/10 shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <div className="text-accent">💡</div>
            <div className="space-y-1">
              <h4 className="font-medium text-sm">Smart Bill Management</h4>
              <p className="text-xs text-muted-foreground">
                Use templates to quickly log recurring expenses like rent, utilities, and subscriptions.
                Click any template below to instantly add it to your expenses with today's date.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Templates */}
      {customTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Templates</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map((template) => (
              <Card key={template.id} className="relative group shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getFrequencyBadgeVariant(template.frequency)}>
                          <Clock className="w-3 h-3 mr-1" />
                          {template.frequency}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!template.isDefault && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            onClick={() => handleEditTemplate(template)}
                            aria-label="Edit template"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            onClick={() => handleDeleteTemplate(template.id)}
                            aria-label="Delete template"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </>
                      )}
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
                      <Receipt className="w-4 h-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Default Templates - Table View with Search */}
      <div className="space-y-4">
        {/* Header with title and search */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Common Bill Templates</h3>
            <p className="text-sm text-muted-foreground">Total {filteredDefaultTemplates.length} templates</p>
          </div>

          {/* Search Bar */}
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-muted/50 border-0"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-4">Template Name</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-center">Frequency</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {filteredDefaultTemplates.length > 0 ? (
              filteredDefaultTemplates.map((template) => (
                <div
                  key={template.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-muted/30 transition-colors"
                >
                  {/* Template Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${template.frequency === 'yearly' ? 'bg-purple-100 dark:bg-purple-900/30' :
                        template.frequency === 'quarterly' ? 'bg-orange-100 dark:bg-orange-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                      {template.category === 'Food & Dining' ? '🍽️' :
                        template.category === 'Transportation' ? '🚗' :
                          template.category === 'Entertainment' ? '🎬' :
                            template.category === 'Healthcare' ? '🏥' :
                              template.category === 'Education' ? '📚' :
                                template.category === 'Bills & Utilities' ? '⚡' : '📝'}
                    </div>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">{template.description.slice(0, 30)}...</div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {template.category}
                  </div>

                  {/* Amount - Editable */}
                  <div className="col-span-2 text-right">
                    {editingAmountId === template.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          value={editingAmountValue}
                          onChange={(e) => setEditingAmountValue(e.target.value)}
                          className="w-24 h-8 text-right text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveCustomAmount(template.id);
                            if (e.key === 'Escape') setEditingAmountId(null);
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => saveCustomAmount(template.id)}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={`font-semibold cursor-pointer hover:text-primary transition-colors ${customAmounts[template.id] ? 'text-primary' : ''
                          }`}
                        onClick={() => startEditingAmount(template)}
                        title="Click to customize amount"
                      >
                        {formatCurrency(getTemplateAmount(template))}
                      </span>
                    )}
                  </div>

                  {/* Frequency Badge */}
                  <div className="col-span-2 text-center">
                    <Badge
                      variant="secondary"
                      className={`${template.frequency === 'yearly' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                          template.frequency === 'quarterly' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                    >
                      {template.frequency}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {customAmounts[template.id] && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => resetToDefaultAmount(template.id)}
                        title={`Reset to default: ${formatCurrency(template.amount)}`}
                      >
                        <ArrowsClockwise className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => startEditingAmount(template)}
                      title="Edit amount"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">No templates found</p>
                <p className="text-sm">No templates match "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ArrowsClockwise className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
              <p className="text-muted-foreground mb-4">
                Create templates for recurring expenses like bills and subscriptions to log them quickly.
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Template
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AddExpenseModal for editing template values before adding */}
      <AddExpenseModal
        isOpen={showAddExpenseModal}
        onClose={handleAddExpenseModalClose}
        onAddExpense={onAddExpense}
        customCategories={customCategories}
        customPeople={customPeople}
        publicPeople={publicPeople}
        initialAmount={selectedTemplateForExpense?.amount.toString() || ''}
        initialCategory={selectedTemplateForExpense?.category || ''}
        initialDescription={selectedTemplateForExpense?.description || ''}
      />
    </div>
  );
}