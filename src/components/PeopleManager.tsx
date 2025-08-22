import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Edit2, Trash2, Share2, Download, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { 
  addPersonToFirestore, 
  updatePersonInFirestore, 
  deletePersonFromFirestore, 
  subscribeToCustomPeople,
  subscribeToPublicPeople,
  adoptPublicPerson
} from '@/lib/firebase';
import { Person, getAllPeople } from '@/lib/types';

const PERSON_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
];

const PERSON_ICONS = [
  '👤', '👨', '👩', '👧', '👦', '👴', '👵', '👨‍💼', '👩‍💼', '👨‍🎓', 
  '👩‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🔧', '👩‍🔧', '👨‍🍳', '👩‍🍳', '👨‍🎨', '👩‍🎨', '🧑‍💻'
];

const RELATIONSHIP_OPTIONS = [
  'Self', 'Family', 'Friend', 'Colleague', 'Partner', 'Child', 
  'Parent', 'Sibling', 'Relative', 'Neighbor', 'Acquaintance', 'Other'
];

interface PeopleManagerProps {
  user: User;
}

export const PeopleManager: React.FC<PeopleManagerProps> = ({ user }) => {
  const [customPeople, setCustomPeople] = useState<Person[]>([]);
  const [publicPeople, setPublicPeople] = useState<Person[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('my-people');

  const [formData, setFormData] = useState({
    name: '',
    color: PERSON_COLORS[0],
    icon: PERSON_ICONS[0],
    relationship: 'Friend',
    isPublic: false
  });

  // Load all people (default + custom)
  const allPeople = getAllPeople();

  useEffect(() => {
    if (!user) return;

    const unsubscribeCustom = subscribeToCustomPeople(user.uid, (people) => {
      setCustomPeople(people);
    });

    const unsubscribePublic = subscribeToPublicPeople((people) => {
      setPublicPeople(people);
    });

    return () => {
      unsubscribeCustom();
      unsubscribePublic();
    };
  }, [user]);

  const resetForm = () => {
    setFormData({
      name: '',
      color: PERSON_COLORS[0],
      icon: PERSON_ICONS[0],
      relationship: 'Friend',
      isPublic: false
    });
    setEditingPerson(null);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const personData = {
        name: formData.name.trim(),
        color: formData.color,
        icon: formData.icon,
        relationship: formData.relationship,
        userId: user.uid,
        isPublic: formData.isPublic,
        createdBy: user.displayName || user.email || 'Anonymous',
        createdAt: new Date().toISOString()
      };

      if (editingPerson) {
        await updatePersonInFirestore(user.uid, editingPerson.id, personData);
        setSuccess('Person updated successfully!');
      } else {
        await addPersonToFirestore(user.uid, personData);
        setSuccess('Person added successfully!');
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save person');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (person: Person) => {
    setEditingPerson(person);
    setFormData({
      name: person.name,
      color: person.color,
      icon: person.icon,
      relationship: person.relationship || 'Friend',
      isPublic: person.isPublic
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (person: Person) => {
    if (!user || !confirm(`Are you sure you want to delete "${person.name}"?`)) return;

    setLoading(true);
    setError(null);

    try {
      await deletePersonFromFirestore(user.uid, person.id);
      setSuccess('Person deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete person');
    } finally {
      setLoading(false);
    }
  };

  const handleAdoptPublicPerson = async (person: Person) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      await adoptPublicPerson(user.uid, person);
      setSuccess(`"${person.name}" has been added to your people!`);
    } catch (err: any) {
      setError(err.message || 'Failed to adopt person');
    } finally {
      setLoading(false);
    }
  };

  const isPersonAlreadyAdopted = (publicPerson: Person) => {
    return customPeople.some(person => 
      person.name.toLowerCase() === publicPerson.name.toLowerCase() &&
      person.relationship === publicPerson.relationship
    );
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Manage People</h2>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPerson ? 'Edit Person' : 'Add New Person'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Person Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., John, Mom, Best Friend..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="relationship">Relationship</Label>
                <Select 
                  value={formData.relationship} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((relationship) => (
                      <SelectItem key={relationship} value={relationship}>
                        {relationship}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Icon</Label>
                <div className="grid grid-cols-10 gap-2 mt-2">
                  {PERSON_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`p-2 text-lg rounded border transition-colors ${
                        formData.icon === icon ? 'bg-primary/10 border-primary' : 'bg-muted hover:bg-muted/80 border-border'
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {PERSON_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                />
                <Label htmlFor="isPublic" className="text-sm">
                  Share publicly for others to use
                </Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || !formData.name.trim()}>
                  {loading ? 'Saving...' : editingPerson ? 'Update' : 'Add'} Person
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-people">My People ({allPeople.length + customPeople.length})</TabsTrigger>
          <TabsTrigger value="public-people">Public Library ({publicPeople.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-people" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Default People */}
            {allPeople.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.icon}
                  </div>
                  <div>
                    <span className="font-medium">{person.name}</span>
                    {person.relationship && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {person.relationship}
                      </Badge>
                    )}
                    <div className="text-sm text-muted-foreground">Default person</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Custom People */}
            {customPeople.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.icon}
                  </div>
                  <div>
                    <span className="font-medium">{person.name}</span>
                    {person.relationship && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {person.relationship}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Custom person</span>
                      {person.isPublic ? (
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>Public</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <EyeOff className="h-3 w-3" />
                          <span>Private</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(person)}
                    disabled={loading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(person)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {allPeople.length === 0 && customPeople.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No people added yet</p>
                <p className="text-sm">Add your first person to start tracking expenses by person</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="public-people" className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {publicPeople.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 bg-card rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: person.color }}
                  >
                    {person.icon}
                  </div>
                  <div>
                    <span className="font-medium">{person.name}</span>
                    {person.relationship && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {person.relationship}
                      </Badge>
                    )}
                    <div className="text-sm text-gray-500">
                      Created by {person.createdBy}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdoptPublicPerson(person)}
                  disabled={loading || isPersonAlreadyAdopted(person)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isPersonAlreadyAdopted(person) ? 'Added' : 'Add'}
                </Button>
              </div>
            ))}

            {publicPeople.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No public people available</p>
                <p className="text-sm">Be the first to share a person publicly!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
