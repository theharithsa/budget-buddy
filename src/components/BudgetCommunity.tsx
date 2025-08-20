import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Globe, User, Edit3, Trash2, Download, Search, Tag, TrendingUp, Wallet } from '@phosphor-icons/react';
import { type BudgetTemplate, type Budget, type CustomCategory, formatCurrency, getAllCategories } from '@/lib/types';
import { toast } from 'sonner';

interface BudgetCommunityProps {
  budgetTemplates: BudgetTemplate[];
  publicBudgetTemplates: BudgetTemplate[];
  customCategories: CustomCategory[];
  onAddTemplate: (template: Omit<BudgetTemplate, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onUpdateTemplate: (templateId: string, template: Partial<BudgetTemplate>) => Promise<void>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
  onAdoptTemplate: (template: BudgetTemplate) => Promise<void>;
  onApplyTemplate: (template: BudgetTemplate) => Promise<void>;
}

const INCOME_LEVELS = [
  { value: 'low', label: 'Low Income (₹20,000 - ₹50,000)', range: '₹20K - ₹50K' },
  { value: 'medium', label: 'Medium Income (₹50,000 - ₹1,00,000)', range: '₹50K - ₹1L' },
  { value: 'high', label: 'High Income (₹1,00,000+)', range: '₹1L+' },
  { value: 'custom', label: 'Custom Budget', range: 'Custom' }
];

const COMMON_TAGS = ['Family', 'Single', 'Student', 'Retirement', 'Savings-Focused', 'Investment-Heavy', 'Emergency Fund'];

export function BudgetCommunity({
  budgetTemplates,
  publicBudgetTemplates,
  customCategories,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onAdoptTemplate,
  onApplyTemplate
}: BudgetCommunityProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BudgetTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [incomeFilter, setIncomeFilter] = useState('all');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    incomeLevel: 'medium' as BudgetTemplate['incomeLevel'],
    isPublic: false,
    tags: [] as string[],
    budgets: [] as Array<{ category: string; limit: number; percentage?: number }>,
    totalBudget: 0
  });

  const allCategories = getAllCategories(customCategories);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      incomeLevel: 'medium',
      isPublic: false,
      tags: [],
      budgets: [],
      totalBudget: 0
    });
  };

  const addBudgetRow = () => {
    setFormData(prev => ({
      ...prev,
      budgets: [...prev.budgets, { category: '', limit: 0 }]
    }));
  };

  const updateBudgetRow = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      budgets: prev.budgets.map((budget, i) => 
        i === index ? { ...budget, [field]: value } : budget
      )
    }));
  };

  const removeBudgetRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      budgets: prev.budgets.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalBudget = () => {
    const total = formData.budgets.reduce((sum, budget) => sum + (budget.limit || 0), 0);
    setFormData(prev => ({ ...prev, totalBudget: total }));
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (formData.budgets.length === 0) {
      toast.error('Please add at least one budget category');
      return;
    }

    const validBudgets = formData.budgets.filter(b => b.category && b.limit > 0);
    if (validBudgets.length === 0) {
      toast.error('Please set valid categories and amounts');
      return;
    }

    setIsLoading(true);
    try {
      await onAddTemplate({
        name: formData.name.trim(),
        description: formData.description.trim(),
        budgets: validBudgets,
        totalBudget: validBudgets.reduce((sum, b) => sum + b.limit, 0),
        incomeLevel: formData.incomeLevel,
        isPublic: formData.isPublic,
        tags: formData.tags,
        usageCount: 0
      });

      resetForm();
      setIsCreateDialogOpen(false);
      toast.success('Budget template created successfully');
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error?.message || 'Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTemplate = (template: BudgetTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      incomeLevel: template.incomeLevel,
      isPublic: template.isPublic,
      tags: template.tags,
      budgets: [...template.budgets],
      totalBudget: template.totalBudget
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !formData.name.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    const validBudgets = formData.budgets.filter(b => b.category && b.limit > 0);
    if (validBudgets.length === 0) {
      toast.error('Please set valid categories and amounts');
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateTemplate(editingTemplate.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        budgets: validBudgets,
        totalBudget: validBudgets.reduce((sum, b) => sum + b.limit, 0),
        incomeLevel: formData.incomeLevel,
        isPublic: formData.isPublic,
        tags: formData.tags
      });

      resetForm();
      setEditingTemplate(null);
      setIsCreateDialogOpen(false);
      toast.success('Budget template updated successfully');
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error(error?.message || 'Failed to update template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await onDeleteTemplate(templateId);
      toast.success('Budget template deleted');
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error(error?.message || 'Failed to delete template');
    }
  };

  const handleAdoptTemplate = async (template: BudgetTemplate) => {
    try {
      await onAdoptTemplate(template);
      toast.success(`Added "${template.name}" to your templates`);
    } catch (error: any) {
      console.error('Error adopting template:', error);
      toast.error(error?.message || 'Failed to adopt template');
    }
  };

  const handleApplyTemplate = async (template: BudgetTemplate) => {
    try {
      await onApplyTemplate(template);
      toast.success(`Applied "${template.name}" to your budgets`);
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast.error(error?.message || 'Failed to apply template');
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingTemplate(null);
      resetForm();
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Filter public templates
  const filteredPublicTemplates = useMemo(() => {
    const ownTemplateNames = budgetTemplates.map(t => t.name.toLowerCase());
    
    return publicBudgetTemplates.filter(template => 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ownTemplateNames.includes(template.name.toLowerCase()) &&
      (incomeFilter === 'all' || template.incomeLevel === incomeFilter)
    );
  }, [publicBudgetTemplates, budgetTemplates, searchTerm, incomeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Budget Templates</h2>
          <p className="text-muted-foreground">
            Create budget templates and share them with the community
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} weight="regular" className="mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Budget Template' : 'Create Budget Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  placeholder="e.g., Family Budget for ₹80,000/month"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe this budget template and who it's best for..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Income Level *</label>
                <Select value={formData.incomeLevel} onValueChange={(value: BudgetTemplate['incomeLevel']) => setFormData(prev => ({ ...prev, incomeLevel: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INCOME_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COMMON_TAGS.map((tag) => (
                    <Button
                      key={tag}
                      size="sm"
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Budget Categories *</label>
                  <Button size="sm" onClick={addBudgetRow}>
                    <Plus size={14} className="mr-1" />
                    Add Category
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {formData.budgets.map((budget, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Select
                        value={budget.category}
                        onValueChange={(value) => updateBudgetRow(index, 'category', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((category) => (
                            <SelectItem key={category.name} value={category.name}>
                              <div className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={budget.limit || ''}
                        onChange={(e) => updateBudgetRow(index, 'limit', parseFloat(e.target.value) || 0)}
                        className="w-32"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBudgetRow(index)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {formData.budgets.length > 0 && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Total Budget:</span>
                    <span className="text-lg font-semibold">
                      {formatCurrency(formData.budgets.reduce((sum, b) => sum + (b.limit || 0), 0))}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Share with community</label>
                  <p className="text-xs text-muted-foreground">Allow others to use this template</p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
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

      <Tabs defaultValue="my-templates" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-templates" className="flex items-center gap-2">
            <User size={16} />
            My Templates
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Globe size={16} />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-templates" className="space-y-4">
          {budgetTemplates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {budgetTemplates.map((template) => (
                <Card key={template.id} className="group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {INCOME_LEVELS.find(l => l.value === template.incomeLevel)?.range}
                          </Badge>
                          {template.isPublic && (
                            <Badge variant="outline">
                              <Globe size={12} weight="regular" className="mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit3 size={16} weight="regular" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 size={16} weight="regular" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Total Budget:</span>
                        <span className="font-semibold">{formatCurrency(template.totalBudget)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {template.budgets.length} categories
                      </div>
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Wallet size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No budget templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create reusable budget templates to quickly set up budgets for different scenarios.
                  </p>
                  <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus size={16} weight="regular" className="mr-2" />
                        Create Your First Template
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} weight="regular" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={incomeFilter} onValueChange={setIncomeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by income level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Income Levels</SelectItem>
                {INCOME_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredPublicTemplates.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPublicTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <p className="text-xs text-muted-foreground">by {template.createdBy}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {INCOME_LEVELS.find(l => l.value === template.incomeLevel)?.range}
                          </Badge>
                          {template.usageCount && template.usageCount > 0 && (
                            <Badge variant="secondary">
                              <TrendingUp size={12} className="mr-1" />
                              {template.usageCount} uses
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Total Budget:</span>
                        <span className="font-semibold">{formatCurrency(template.totalBudget)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {template.budgets.length} categories
                      </div>
                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleAdoptTemplate(template)}
                        >
                          <Download size={14} weight="regular" className="mr-1" />
                          Add to My Templates
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleApplyTemplate(template)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Globe size={48} className="mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm || incomeFilter !== 'all' ? 'No matching templates found' : 'No community templates available'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || incomeFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Be the first to share a budget template with the community!'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}