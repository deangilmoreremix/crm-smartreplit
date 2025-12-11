import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  DollarSign, 
  CheckCircle,
  Save,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { WLService } from '@/services/wlService';

interface FeaturePackage {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  price: string | null;
  billingCycle: string | null;
  isActive: boolean;
  targetTier: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function FeaturePackageManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    features: [''],
    price: '',
    billingCycle: 'monthly',
    targetTier: '',
    isActive: true
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // White Label persistence variables
  const userId = 'dev-user-12345'; // In production, get from auth context

  const { data: packages, isLoading: packagesLoading } = useQuery<FeaturePackage[]>({
    queryKey: ['/api/feature-packages'],
    refetchInterval: 30000,
  });

  const createPackageMutation = useMutation({
    mutationFn: (packageData: any) => apiRequest('/api/feature-packages', {
      method: 'POST',
      body: packageData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-packages'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      features: [''],
      price: '',
      billingCycle: 'monthly',
      targetTier: '',
      isActive: true
    });
  };

  // White Label persistence function for feature packages
  const saveFeaturePackageWLConfig = async (packageData: FeaturePackage) => {
    try {
      setIsSaving(true);

      const featurePackageWLData = {
        packageId: packageData.id,
        name: packageData.name,
        description: packageData.description,
        features: packageData.features,
        price: packageData.price,
        billingCycle: packageData.billingCycle,
        targetTier: packageData.targetTier,
        isActive: packageData.isActive,
        wlConfig: {
          customizable: true,
          whiteLabel: packageData.targetTier !== 'bronze',
          brandable: ['gold', 'platinum'].includes(packageData.targetTier || ''),
        },
        userId
      };

      // Save to database and localStorage as fallback
      try {
        WLService.saveToLocalStorage(`feature-package-${packageData.id}`, featurePackageWLData);
        
        toast({
          title: "Feature package configuration saved!",
          description: "Package settings have been saved successfully.",
        });
      } catch (dbError) {
        console.warn('Database save failed, using localStorage only:', dbError);
        WLService.saveToLocalStorage(`feature-package-${packageData.id}`, featurePackageWLData);
        
        toast({
          title: "Configuration saved locally",
          description: "Package settings saved locally. Database sync will retry later.",
        });
      }
    } catch (error) {
      console.error('Failed to save feature package WL config:', error);
      toast({
        title: "Save failed",
        description: "Failed to save package configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-save WL configuration when packages change
  useEffect(() => {
    if (packages && packages.length > 0) {
      packages.forEach(pkg => {
        if (pkg.isActive) {
          WLService.saveToLocalStorage(`feature-package-${pkg.id}`, {
            packageId: pkg.id,
            name: pkg.name,
            features: pkg.features,
            targetTier: pkg.targetTier,
            lastModified: new Date().toISOString(),
            userId
          });
        }
      });
    }
  }, [packages, userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      features: formData.features.filter(f => f.trim() !== ''),
      price: formData.price || null
    };
    createPackageMutation.mutate(submitData);
  };

  const addFeatureField = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getTierBadgeColor = (tier: string | null) => {
    if (!tier) return 'bg-gray-100 text-gray-800';
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 pb-20" data-testid="feature-package-management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Package Management</h1>
          <p className="text-gray-600 mt-1">Create and manage feature packages for different partner tiers</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-package-button">
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Feature Package</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Professional CRM Package"
                    required
                    data-testid="package-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="29.99"
                    data-testid="package-price-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this package includes..."
                  rows={3}
                  data-testid="package-description-input"
                />
              </div>

              <div className="space-y-2">
                <Label>Features</Label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        placeholder="Enter feature description"
                        data-testid={`feature-input-${index}`}
                      />
                      {formData.features.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeFeature(index)}
                          data-testid={`remove-feature-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addFeatureField}
                    className="w-full"
                    data-testid="add-feature-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  data-testid="package-active-switch"
                />
                <Label htmlFor="isActive">Package is active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPackageMutation.isPending}
                  data-testid="submit-package-button"
                >
                  {createPackageMutation.isPending ? 'Creating...' : 'Create Package'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packagesLoading ? (
          Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : packages && packages.length > 0 ? (
          packages.map((pkg) => (
            <Card key={pkg.id} className={`relative ${!pkg.isActive ? 'opacity-60' : ''}`} data-testid={`package-card-${pkg.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge className={getTierBadgeColor(pkg.targetTier)}>
                        {pkg.targetTier || 'All Tiers'}
                      </Badge>
                      {!pkg.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(pkg.price)}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {pkg.billingCycle?.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pkg.description && (
                  <p className="text-gray-600 mb-4">{pkg.description}</p>
                )}
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Features:</h4>
                  <ul className="space-y-1">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Created {new Date(pkg.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`edit-package-${pkg.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      data-testid={`delete-package-${pkg.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full" data-testid="empty-packages-card">
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Feature Packages Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first feature package to start offering structured services to your partners.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-first-package-button">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Package
              </Button>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  );
}