import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings, Download, Trash2, Users, FileText } from 'lucide-react';
import { 
  Profile, 
  ProfileSettings, 
  DEFAULT_PROFILE_TEMPLATES, 
  exportToExcel,
  type Expense 
} from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { useComponentTracking, useMonitoredBusiness } from '@/hooks/useDynatraceMonitoring';
import { toast } from 'sonner';

interface ProfileManagerProps {
  profiles: Profile[];
  activeProfile: Profile | null;
  expenses: Expense[];
  onCreateProfile: (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateProfile: (profileId: string, updates: Partial<Profile>) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onSwitchProfile: (profileId: string) => void;
}

export function ProfileManager({
  profiles,
  activeProfile,
  expenses,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile,
  onSwitchProfile
}: ProfileManagerProps) {
  const { user } = useAuth();
  const { trackComponentEvent } = useComponentTracking('ProfileManager');
  const { trackProfileEvent, trackFinancialEvent, trackSystemEvent } = useMonitoredBusiness();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    color: string;
    icon: string;
    settings: ProfileSettings;
  }>({
    name: '',
    description: '',
    color: 'oklch(0.6 0.2 260)',
    icon: '👤',
    settings: {
      currency: 'USD',
      exportFormat: 'excel',
      autoBackup: true,
      notifications: true
    }
  });

  const handleCreateProfile = async () => {
    if (!user || !formData.name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    try {
      // Track profile creation start
      trackComponentEvent('Profile Creation Started', {
        profileName: formData.name,
        hasSettings: true
      });

      await onCreateProfile({
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon,
        userId: user.uid,
        isDefault: false,
        settings: formData.settings
      });

      // Track successful creation
      trackProfileEvent('Created', formData.name, {
        currency: formData.settings.currency,
        exportFormat: formData.settings.exportFormat,
        autoBackup: formData.settings.autoBackup,
        notifications: formData.settings.notifications
      });

      // Track system event
      trackSystemEvent('Profile Created', {
        profileName: formData.name,
        totalProfiles: profiles.length + 1
      });

      toast.success(`Profile "${formData.name}" created successfully`);
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      // Track failed creation
      trackProfileEvent('Creation Failed', formData.name, {
        error: error.message
      });
      
      toast.error(`Failed to create profile: ${error.message}`);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile || !formData.name.trim()) return;

    try {
      // Track profile update start
      trackComponentEvent('Profile Update Started', {
        profileId: editingProfile.id,
        profileName: formData.name
      });

      await onUpdateProfile(editingProfile.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon,
        settings: formData.settings,
        updatedAt: new Date().toISOString()
      });

      // Track successful update
      trackProfileEvent('Updated', formData.name, {
        profileId: editingProfile.id,
        changes: {
          nameChanged: editingProfile.name !== formData.name,
          descriptionChanged: editingProfile.description !== formData.description,
          settingsChanged: JSON.stringify(editingProfile.settings) !== JSON.stringify(formData.settings)
        }
      });

      toast.success(`Profile "${formData.name}" updated successfully`);
      setEditingProfile(null);
      resetForm();
    } catch (error: any) {
      // Track failed update
      trackProfileEvent('Update Failed', formData.name, {
        profileId: editingProfile.id,
        error: error.message
      });
      
      toast.error(`Failed to update profile: ${error.message}`);
    }
  };

  const handleDeleteProfile = async (profile: Profile) => {
    if (profile.isDefault) {
      toast.error('Cannot delete the default profile');
      return;
    }

    const profileExpenses = expenses.filter(exp => exp.profileId === profile.id);
    const expenseCount = profileExpenses.length;

    if (confirm(`Are you sure you want to delete the profile "${profile.name}"? This will affect ${expenseCount} expense(s). This action cannot be undone.`)) {
      try {
        // Track profile deletion start
        trackComponentEvent('Profile Deletion Started', {
          profileId: profile.id,
          profileName: profile.name,
          expenseCount
        });

        await onDeleteProfile(profile.id);

        // Track successful deletion
        trackProfileEvent('Deleted', profile.name, {
          profileId: profile.id,
          expenseCount,
          wasDefault: profile.isDefault
        });

        // Track system event
        trackSystemEvent('Profile Deleted', {
          profileName: profile.name,
          expenseCount,
          totalProfiles: profiles.length - 1
        });

        toast.success(`Profile "${profile.name}" deleted successfully`);
      } catch (error: any) {
        // Track failed deletion
        trackProfileEvent('Deletion Failed', profile.name, {
          profileId: profile.id,
          error: error.message
        });
        
        toast.error(`Failed to delete profile: ${error.message}`);
      }
    }
  };

  const handleExportProfile = async (profile: Profile) => {
    const profileExpenses = expenses.filter(exp => exp.profileId === profile.id);
    
    if (profileExpenses.length === 0) {
      toast.info(`No expenses found for profile "${profile.name}"`);
      return;
    }

    try {
      // Track export start
      trackComponentEvent('Profile Export Started', {
        profileName: profile.name,
        expenseCount: profileExpenses.length,
        totalAmount: profileExpenses.reduce((sum, exp) => sum + exp.amount, 0)
      });

      await exportToExcel(profileExpenses, profile.name);
      
      // Track successful export
      trackProfileEvent('Exported', profile.name, {
        expenseCount: profileExpenses.length,
        totalAmount: profileExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        exportFormat: profile.settings.exportFormat
      });

      // Track financial event for export
      trackFinancialEvent(
        'Data Export', 
        profileExpenses.reduce((sum, exp) => sum + exp.amount, 0),
        'Export'
      );

      toast.success(`Exported ${profileExpenses.length} expenses from "${profile.name}"`);
    } catch (error: any) {
      // Track failed export
      trackProfileEvent('Export Failed', profile.name, {
        error: error.message,
        expenseCount: profileExpenses.length
      });
      
      toast.error(`Failed to export profile: ${error.message}`);
    }
  };

  const handleSwitchProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      const previousProfile = activeProfile?.name;
      
      // Track profile switch
      trackComponentEvent('Profile Switched', {
        profileName: profile.name,
        profileId: profile.id,
        previousProfile
      });

      trackProfileEvent('Switched To', profile.name, {
        profileId: profile.id,
        previousProfile,
        switchMethod: 'ProfileManager'
      });

      onSwitchProfile(profileId);
      toast.success(`Switched to "${profile.name}" profile`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'oklch(0.6 0.2 260)',
      icon: '👤',
      settings: {
        currency: 'USD',
        exportFormat: 'excel',
        autoBackup: true,
        notifications: true
      }
    });
  };

  const useTemplate = (template: any) => {
    // Track template usage
    trackComponentEvent('Template Used', {
      templateName: template.name,
      templateType: template.type || 'default'
    });

    setFormData({
      name: template.name,
      description: template.description,
      color: template.color,
      icon: template.icon,
      settings: template.settings
    });
  };

  // Set form data when editing
  useEffect(() => {
    if (editingProfile) {
      setFormData({
        name: editingProfile.name,
        description: editingProfile.description,
        color: editingProfile.color,
        icon: editingProfile.icon,
        settings: editingProfile.settings
      });
    }
  }, [editingProfile]);

  return (
    <div className="space-y-6">
      {/* Active Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{activeProfile?.icon}</span>
                Active Profile: {activeProfile?.name}
                {activeProfile?.isDefault && <Badge variant="secondary">Default</Badge>}
              </CardTitle>
              <p className="text-muted-foreground mt-1">{activeProfile?.description}</p>
            </div>
            <div className="flex gap-2">
              {activeProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportProfile(activeProfile)}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeProfile && setEditingProfile(activeProfile)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Currency:</span> {activeProfile?.settings.currency}
            </div>
            <div>
              <span className="font-medium">Export Format:</span> {activeProfile?.settings.exportFormat.toUpperCase()}
            </div>
            <div>
              <span className="font-medium">Auto Backup:</span> {activeProfile?.settings.autoBackup ? 'Yes' : 'No'}
            </div>
            <div>
              <span className="font-medium">Expenses:</span> {expenses.filter(e => e.profileId === activeProfile?.id).length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Switcher */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Switch Profile</span>
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Quick Templates */}
                  <div>
                    <Label className="text-base font-medium">Quick Templates</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                      {DEFAULT_PROFILE_TEMPLATES.map((template, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => useTemplate(template)}
                          className="h-auto p-3 flex flex-col gap-1"
                        >
                          <span className="text-xl">{template.icon}</span>
                          <span className="text-xs">{template.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Profile Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Work, Personal, Travel"
                      />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon</Label>
                      <Input
                        id="icon"
                        value={formData.icon}
                        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="🏢"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this profile is for..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={formData.settings.currency}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, currency: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="exportFormat">Export Format</Label>
                      <Select
                        value={formData.settings.exportFormat}
                        onValueChange={(value: ProfileSettings['exportFormat']) => setFormData(prev => ({
                          ...prev,
                          settings: { ...prev.settings, exportFormat: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateProfile}>
                      Create Profile
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((profile) => {
              const profileExpenses = expenses.filter(e => e.profileId === profile.id);
              const totalAmount = profileExpenses.reduce((sum, exp) => sum + exp.amount, 0);
              const isActive = activeProfile?.id === profile.id;

              return (
                <Card 
                  key={profile.id} 
                  className={`cursor-pointer transition-all ${
                    isActive ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => !isActive && handleSwitchProfile(profile.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{profile.icon}</span>
                        <div>
                          <h3 className="font-semibold">{profile.name}</h3>
                          {profile.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
                        </div>
                      </div>
                      {!profile.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProfile(profile);
                          }}
                          className="h-8 w-8 p-0 hover:bg-destructive/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{profile.description}</p>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Expenses:</span>
                        <span className="font-medium">{profileExpenses.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {isActive && (
                      <Badge className="w-full mt-3 justify-center">
                        Active Profile
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Settings Modal */}
      <Dialog open={!!editingProfile} onOpenChange={() => setEditingProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Profile Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingProfile(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
