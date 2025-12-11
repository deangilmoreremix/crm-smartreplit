import React, { useState } from 'react';
import { useFeatures, useCreateFeature, useUpdateFeature, useDeleteFeature, useTierFeatures, useSetTierFeatures, type Feature } from '../hooks/useFeatures';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Settings, Plus, Trash2, Edit, Shield, Zap, Users, Briefcase, Lock } from 'lucide-react';

const CATEGORIES = [
  { value: 'core_crm', label: 'Core CRM', icon: Briefcase },
  { value: 'communication', label: 'Communication', icon: Users },
  { value: 'ai_features', label: 'AI Features', icon: Zap },
  { value: 'business_tools', label: 'Business Tools', icon: Settings },
  { value: 'advanced', label: 'Advanced', icon: Shield },
  { value: 'admin', label: 'Admin', icon: Lock },
];

const PRODUCT_TIERS = [
  { value: 'smartcrm', label: 'SmartCRM (Base)' },
  { value: 'sales_maximizer', label: 'Sales Maximizer' },
  { value: 'ai_boost_unlimited', label: 'AI Boost Unlimited' },
];

export default function FeatureManagement() {
  const { data: features = [], isLoading } = useFeatures();
  const createFeature = useCreateFeature();
  const updateFeature = useUpdateFeature();
  const deleteFeature = useDeleteFeature();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState({
    featureKey: '',
    name: '',
    description: '',
    category: 'core_crm',
    isEnabled: true,
  });

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const handleCreateFeature = async () => {
    try {
      await createFeature.mutateAsync(formData);
      toast({
        title: 'Success',
        description: 'Feature created successfully',
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create feature',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFeature = async () => {
    if (!editingFeature) return;
    
    try {
      await updateFeature.mutateAsync({
        id: editingFeature.id,
        ...formData,
      });
      toast({
        title: 'Success',
        description: 'Feature updated successfully',
      });
      setEditingFeature(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFeature = async (id: number) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    
    try {
      await deleteFeature.mutateAsync(id);
      toast({
        title: 'Success',
        description: 'Feature deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete feature',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeature = async (feature: Feature) => {
    try {
      await updateFeature.mutateAsync({
        id: feature.id,
        isEnabled: !feature.isEnabled,
      });
      toast({
        title: 'Success',
        description: `Feature ${!feature.isEnabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle feature',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      featureKey: '',
      name: '',
      description: '',
      category: 'core_crm',
      isEnabled: true,
    });
  };

  const startEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      featureKey: feature.featureKey,
      name: feature.name,
      description: feature.description || '',
      category: feature.category,
      isEnabled: feature.isEnabled,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feature Management</h1>
            <p className="text-gray-600 mt-2">Manage features and access control</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-feature">
                <Plus className="h-4 w-4 mr-2" />
                Create Feature
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="dialog-create-feature">
              <DialogHeader>
                <DialogTitle>Create New Feature</DialogTitle>
                <DialogDescription>
                  Add a new feature to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="featureKey">Feature Key</Label>
                  <Input
                    id="featureKey"
                    data-testid="input-feature-key"
                    placeholder="e.g., dashboard_access"
                    value={formData.featureKey}
                    onChange={(e) => setFormData({ ...formData, featureKey: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Feature Name</Label>
                  <Input
                    id="name"
                    data-testid="input-feature-name"
                    placeholder="e.g., Dashboard Access"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="input-feature-description"
                    placeholder="Describe the feature..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger data-testid="select-feature-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isEnabled"
                    data-testid="switch-feature-enabled"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                  />
                  <Label htmlFor="isEnabled">Enabled</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button onClick={handleCreateFeature} data-testid="button-save-feature">
                  Create Feature
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingFeature} onOpenChange={(open) => !open && setEditingFeature(null)}>
            <DialogContent data-testid="dialog-edit-feature">
              <DialogHeader>
                <DialogTitle>Edit Feature</DialogTitle>
                <DialogDescription>
                  Update feature details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="edit-featureKey">Feature Key</Label>
                  <Input
                    id="edit-featureKey"
                    data-testid="input-edit-feature-key"
                    value={formData.featureKey}
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name">Feature Name</Label>
                  <Input
                    id="edit-name"
                    data-testid="input-edit-feature-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    data-testid="input-edit-feature-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger data-testid="select-edit-feature-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-isEnabled"
                    data-testid="switch-edit-feature-enabled"
                    checked={formData.isEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, isEnabled: checked })}
                  />
                  <Label htmlFor="edit-isEnabled">Enabled</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingFeature(null)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button onClick={handleUpdateFeature} data-testid="button-update-feature">
                  Update Feature
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-features">All Features</TabsTrigger>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <TabsTrigger key={cat.value} value={cat.value} data-testid={`tab-${cat.value}`}>
                  <Icon className="h-4 w-4 mr-2" />
                  {cat.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">Loading features...</div>
                </CardContent>
              </Card>
            ) : filteredFeatures.length === 0 ? (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center text-gray-500">No features found</div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredFeatures.map((feature) => {
                  const category = CATEGORIES.find(c => c.value === feature.category);
                  const Icon = category?.icon || Settings;
                  
                  return (
                    <Card key={feature.id} data-testid={`card-feature-${feature.id}`}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${feature.isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Icon className={`h-5 w-5 ${feature.isEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{feature.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {feature.featureKey}
                              </code>
                              <Badge variant={feature.isEnabled ? 'default' : 'secondary'}>
                                {feature.isEnabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            data-testid={`switch-toggle-${feature.id}`}
                            checked={feature.isEnabled}
                            onCheckedChange={() => handleToggleFeature(feature)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-edit-${feature.id}`}
                            onClick={() => startEdit(feature)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-delete-${feature.id}`}
                            onClick={() => handleDeleteFeature(feature.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </CardHeader>
                      {feature.description && (
                        <CardContent>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Product Tier Templates</CardTitle>
            <CardDescription>
              Configure which features are included in each product tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TierFeatureConfig features={features} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TierFeatureConfig({ features }: { features: Feature[] }) {
  const [selectedTier, setSelectedTier] = useState('smartcrm');
  const { data: tierFeatures = [], isLoading } = useTierFeatures(selectedTier);
  const setTierFeatures = useSetTierFeatures();
  const { toast } = useToast();

  const tierFeatureIds = new Set(tierFeatures.map(tf => tf.featureId));

  const handleToggleTierFeature = async (featureId: number) => {
    const newFeatureIds = tierFeatureIds.has(featureId)
      ? Array.from(tierFeatureIds).filter(id => id !== featureId)
      : [...Array.from(tierFeatureIds), featureId];

    try {
      await setTierFeatures.mutateAsync({
        tier: selectedTier,
        featureIds: newFeatureIds,
      });
      toast({
        title: 'Success',
        description: 'Tier features updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update tier features',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <Select value={selectedTier} onValueChange={setSelectedTier}>
        <SelectTrigger data-testid="select-product-tier">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRODUCT_TIERS.map((tier) => (
            <SelectItem key={tier.value} value={tier.value}>
              {tier.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">Loading tier features...</div>
      ) : (
        <div className="grid gap-2">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              data-testid={`tier-feature-${feature.id}`}
            >
              <div>
                <div className="font-medium">{feature.name}</div>
                <div className="text-sm text-gray-500">{feature.featureKey}</div>
              </div>
              <Switch
                data-testid={`switch-tier-feature-${feature.id}`}
                checked={tierFeatureIds.has(feature.id)}
                onCheckedChange={() => handleToggleTierFeature(feature.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
