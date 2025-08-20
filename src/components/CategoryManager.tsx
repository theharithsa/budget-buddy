import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Palette as Swatches, 
  Globe, 
  User, 
  Pencil, 
  Trash, 
  Download, 
  Search as MagnifyingGlass 
} from 'lucide-react';
import { type CustomCategory, DEFAULT_CATEGORIES } from '@/lib/types';
import { toast } from 'sonner';

interface CategoryManagerProps {
  customCategories: CustomCategory[];
  publicCategories: CustomCategory[];
  onAddCategory: (category: Omit<CustomCategory, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  onUpdateCategory: (categoryId: string, category: Partial<CustomCategory>) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
  onAdoptCategory: (category: CustomCategory) => Promise<void>;
}

// Predefined color palette
const COLOR_PALETTE = [
  'oklch(0.65 0.2 40)',   // Orange
  'oklch(0.6 0.25 220)',  // Blue
  'oklch(0.7 0.2 300)',   // Purple
  'oklch(0.65 0.25 330)', // Pink
  'oklch(0.5 0.15 20)',   // Red
  'oklch(0.6 0.2 140)',   // Green
  'oklch(0.55 0.2 260)',  // Indigo
  'oklch(0.65 0.2 180)',  // Cyan
  'oklch(0.6 0.1 240)',   // Gray
  'oklch(0.7 0.25 60)',   // Yellow
  'oklch(0.55 0.2 120)',  // Lime
  'oklch(0.6 0.2 350)',   // Rose
];

// Common emoji categories for quick selection
const EMOJI_CATEGORIES = [
  { name: 'Food & Drink', emojis: ['🍽️', '🍕', '🍔', '🍜', '🍱', '🥗', '🍰', '☕', '🍺', '🥤'] },
  { name: 'Transportation', emojis: ['🚗', '🚌', '🚊', '🚲', '🛵', '✈️', '🚂', '🚕', '⛽', '🚁'] },
  { name: 'Shopping', emojis: ['🛍️', '👔', '👕', '👗', '👠', '💄', '📱', '💻', '🎮', '📚'] },
  { name: 'Home & Bills', emojis: ['🏠', '⚡', '💡', '🔧', '🚿', '📺', '📞', '💳', '📊', '📋'] },
  { name: 'Health & Fitness', emojis: ['🏥', '💊', '🏋️', '🧘', '🦷', '👓', '💉', '🩺', '🏃', '🚴'] },
  { name: 'Entertainment', emojis: ['🎬', '🎮', '🎵', '🎭', '🎨', '📖', '🎪', '🎯', '🎲', '🎸'] },
  { name: 'Education', emojis: ['📚', '🎓', '✏️', '🖊️', '📝', '💻', '🔬', '🌐', '📐', '🧮'] },
  { name: 'Travel', emojis: ['✈️', '🏖️', '🗺️', '🧳', '🏨', '📷', '🎒', '🚢', '🏔️', '🌴'] },
  { name: 'Finance', emojis: ['💰', '💳', '🏦', '💸', '📊', '💎', '🪙', '💵', '📈', '💴'] },
  { name: 'Other', emojis: ['📝', '⭐', '🔍', '🎯', '💡', '⚙️', '📌', '🔔', '❓', '✨'] },
];

export function CategoryManager({
  customCategories,
  publicCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAdoptCategory
}: CategoryManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: COLOR_PALETTE[0],
    icon: '📝',
    isPublic: false
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: COLOR_PALETTE[0],
      icon: '📝',
      isPublic: false
    });
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    // Check if category already exists
    const allCategories = [
      ...DEFAULT_CATEGORIES.map(cat => cat.name),
      ...customCategories.map(cat => cat.name)
    ];
    
    if (allCategories.includes(formData.name)) {
      toast.error('Category already exists');
      return;
    }

    setIsLoading(true);
    try {
      await onAddCategory({
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon,
        isPublic: formData.isPublic,
        createdBy: 'You'
      });

      resetForm();
      setIsCreateDialogOpen(false);
      toast.success('Category created successfully');
    } catch (error: any) {
      console.error('Error creating category:', error);
      const errorMessage = error?.message || 'Failed to create category';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category: CustomCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
      icon: category.icon,
      isPublic: category.isPublic
    });
    setIsCreateDialogOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    // Check if category name already exists (excluding current category)
    const allCategories = [
      ...DEFAULT_CATEGORIES.map(cat => cat.name),
      ...customCategories.filter(cat => cat.id !== editingCategory.id).map(cat => cat.name)
    ];
    
    if (allCategories.includes(formData.name) && formData.name !== editingCategory.name) {
      toast.error('Category already exists');
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateCategory(editingCategory.id, {
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon,
        isPublic: formData.isPublic
      });

      resetForm();
      setEditingCategory(null);
      setIsCreateDialogOpen(false);
      toast.success('Category updated successfully');
    } catch (error: any) {
      console.error('Error updating category:', error);
      const errorMessage = error?.message || 'Failed to update category';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await onDeleteCategory(categoryId);
      toast.success('Category deleted');
    } catch (error: any) {
      console.error('Error deleting category:', error);
      const errorMessage = error?.message || 'Failed to delete category';
      toast.error(errorMessage);
    }
  };

  const handleAdoptCategory = async (category: CustomCategory) => {
    try {
      await onAdoptCategory(category);
      toast.success(`Added "${category.name}" to your categories`);
    } catch (error: any) {
      console.error('Error adopting category:', error);
      const errorMessage = error?.message || 'Failed to adopt category';
      toast.error(errorMessage);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setEditingCategory(null);
      resetForm();
    }
  };

  // Filter public categories based on search and exclude already owned
  const filteredPublicCategories = useMemo(() => {
    const ownCategoryNames = customCategories.map(cat => cat.name.toLowerCase());
    const defaultCategoryNames = DEFAULT_CATEGORIES.map(cat => cat.name.toLowerCase());
    
    return publicCategories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !ownCategoryNames.includes(category.name.toLowerCase()) &&
      !defaultCategoryNames.includes(category.name.toLowerCase())
    );
  }, [publicCategories, customCategories, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Category Manager</h2>
          <p className="text-muted-foreground">
            Create custom categories and share them with the community
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Create Custom Category'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category Name *</label>
                <Input
                  placeholder="e.g., Pet Care"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Icon *</label>
                <div className="space-y-3">
                  <Input
                    placeholder="🐾"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="text-center text-lg"
                  />
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {EMOJI_CATEGORIES.map((category) => (
                      <div key={category.name}>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{category.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {category.emojis.map((emoji) => (
                            <Button
                              key={emoji}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => setFormData(prev => ({ ...prev, icon: emoji }))}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Color *</label>
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {COLOR_PALETTE.map((color) => (
                    <Button
                      key={color}
                      size="sm"
                      variant="outline"
                      className="h-10 w-full p-0 border-2"
                      style={{ 
                        backgroundColor: color,
                        borderColor: formData.color === color ? '#000' : 'transparent'
                      }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Share with community</label>
                  <p className="text-xs text-muted-foreground">Allow others to use this category</p>
                </div>
                <Switch
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  className="flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Create Category')}
                </Button>
                <Button variant="outline" onClick={() => handleDialogClose(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="my-categories" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="my-categories" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            My Categories
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-categories" className="space-y-4">
          {/* Default Categories */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Default Categories</h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {DEFAULT_CATEGORIES.map((category) => (
                <Card key={category.name} className="border-muted">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <CardTitle className="text-sm">{category.name}</CardTitle>
                      <Badge variant="secondary" className="ml-auto text-xs">Default</Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Categories */}
          {customCategories.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Your Custom Categories</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {customCategories.map((category) => (
                    <Card key={category.id} className="relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-sm">{category.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {category.isPublic && (
                                <Badge variant="outline" className="text-xs">
                                  <Globe className="w-3 h-3 mr-1" />
                                  Public
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                              onClick={() => handleEditCategory(category)}
                              aria-label="Edit category"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                              onClick={() => handleDeleteCategory(category.id)}
                              aria-label="Delete category"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {customCategories.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Swatches className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No custom categories yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create custom categories to better organize your expenses beyond the defaults.
                  </p>
                  <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Category
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="community" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search community categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredPublicCategories.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPublicCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">{category.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">by {category.createdBy}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleAdoptCategory(category)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Add to My Categories
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm ? 'No matching categories found' : 'No community categories available'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Try adjusting your search term or browse all categories.'
                      : 'Be the first to share a category with the community!'
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