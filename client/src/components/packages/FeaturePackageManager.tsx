import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Edit,
  Trash2,
  Package,
  DollarSign,
  CheckCircle,
  Save,
  Loader2,
  Power,
  PowerOff,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface FeaturePackage {
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

interface FeaturePackageManagerProps {
  onPackageCreated?: (pkg: FeaturePackage) => void;
  onPackageUpdated?: (pkg: FeaturePackage) => void;
  onPackageDeleted?: (id: string) => void;
}

const PREDEFINED_FEATURES = [
  { value: 'core_crm', label: 'Core CRM' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'ai_tools', label: 'AI Tools' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'business_intelligence', label: 'Business Intelligence' },
  { value: 'ai_contact_enrichment', label: 'AI Contact Enrichment' },
  { value: 'ai_lead_scoring', label: 'AI Lead Scoring' },
  { value: 'communication_hub', label: 'Communication Hub' },
  { value: 'appointments', label: 'Appointments' },
  { value: 'video_email', label: 'Video Email' },
  { value: 'text_messages', label: 'Text Messages' },
  { value: 'phone_system', label: 'Phone System' },
  { value: 'invoicing', label: 'Invoicing' },
  { value: 'lead_automation', label: 'Lead Automation' },
  { value: 'white_label', label: 'White Label' },
  { value: 'white_label_customization', label: 'White Label Customization' },
  { value: 'revenue_sharing', label: 'Revenue Sharing' },
  { value: 'partner_dashboard', label: 'Partner Dashboard' },
  { value: 'admin_panel', label: 'Admin Panel' },
  { value: 'feature_management', label: 'Feature Management' },
  { value: 'user_management', label: 'User Management' },
] as const;

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'one_time', label: 'One Time' },
] as const;

const TARGET_TIERS = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'all', label: 'All Tiers' },
] as const;

const emptyFormData = {
  name: '',
  description: '',
  features: [] as string[],
  price: '',
  billingCycle: 'monthly' as string,
  targetTier: '',
  isActive: true,
};

export default function FeaturePackageManager({
  onPackageCreated,
  onPackageUpdated,
  onPackageDeleted,
}: FeaturePackageManagerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<FeaturePackage | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyFormData);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: packages, isLoading, error } = useQuery<FeaturePackage[]>({
    queryKey: ['/api/feature-packages'],
    refetchInterval: 30000,
  });

  const createMutation = useMutation({
    mutationFn: (packageData: Omit<FeaturePackage, 'id' | 'createdAt' | 'updatedAt'>) =>
      apiRequest<FeaturePackage>('/api/feature-packages', {
        method: 'POST',
        body: packageData,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-packages'] });
      setIsDialogOpen(false);
      resetForm();
      onPackageCreated?.(data);
      toast({
        title: 'Package created',
        description: `${data.name} has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create package. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeaturePackage> }) =>
      apiRequest<FeaturePackage>(`/api/feature-packages/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-packages'] });
      setIsDialogOpen(false);
      resetForm();
      onPackageUpdated?.(data);
      toast({
        title: 'Package updated',
        description: `${data.name} has been updated successfully.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update package. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/feature-packages/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-packages'] });
      setDeleteConfirmId(null);
      onPackageDeleted?.(id);
      toast({
        title: 'Package deleted',
        description: 'The feature package has been deleted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete package. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest<FeaturePackage>(`/api/feature-packages/${id}`, {
        method: 'PATCH',
        body: { isActive },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/feature-packages'] });
      toast({
        title: data.isActive ? 'Package activated' : 'Package deactivated',
        description: `${data.name} is now ${data.isActive ? 'active' : 'inactive'}.`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update package status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData(emptyFormData);
    setEditingPackage(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (pkg: FeaturePackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      features: pkg.features.length > 0 ? pkg.features : [],
      price: pkg.price || '',
      billingCycle: pkg.billingCycle || 'monthly',
      targetTier: pkg.targetTier || '',
      isActive: pkg.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      name: formData.name,
      description: formData.description || null,
      features: formData.features,
      price: formData.price || null,
      billingCycle: formData.billingCycle,
      targetTier: formData.targetTier || null,
      isActive: formData.isActive,
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const toggleFeature = (featureValue: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(featureValue)
        ? prev.features.filter((f) => f !== featureValue)
        : [...prev.features, featureValue],
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
    const colors: Record<string, string> = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
      all: 'bg-blue-100 text-blue-800',
    };
    return colors[tier] || 'bg-gray-100 text-gray-800';
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to load packages</h3>
              <p className="text-gray-600 mb-4">
                There was an error fetching feature packages. Please try again later.
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/feature-packages'] })}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 pb-20" data-testid="feature-package-management">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feature Package Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage feature packages for different partner tiers
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-package-button" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Create Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPackage ? 'Edit Feature Package' : 'Create New Feature Package'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
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
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="29.99"
                      data-testid="package-price-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Billing Cycle</Label>
                    <Select
                      value={formData.billingCycle}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, billingCycle: value }))
                      }
                    >
                      <SelectTrigger data-testid="billing-cycle-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLES.map((cycle) => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetTier">Target Tier</Label>
                    <Select
                      value={formData.targetTier}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, targetTier: value }))
                      }
                    >
                      <SelectTrigger data-testid="target-tier-select">
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_TIERS.map((tier) => (
                          <SelectItem key={tier.value} value={tier.value}>
                            {tier.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe what this package includes..."
                    rows={3}
                    data-testid="package-description-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Features</Label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_FEATURES.map((feature) => {
                      const isSelected = formData.features.includes(feature.value);
                      return (
                        <button
                          key={feature.value}
                          type="button"
                          onClick={() => toggleFeature(feature.value)}
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          data-testid={`feature-toggle-${feature.value}`}
                        >
                          {isSelected && <CheckCircle className="mr-1 h-3 w-3" />}
                          {feature.label}
                        </button>
                      );
                    })}
                  </div>
                  {formData.features.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {formData.features.length} feature{formData.features.length === 1 ? '' : 's'} selected
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                    data-testid="package-active-switch"
                  />
                  <Label htmlFor="isActive">Package is active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-package-button"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingPackage ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {editingPackage ? 'Update Package' : 'Create Package'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
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
            ))}
          </div>
        )}

        {/* Packages Grid */}
        {!isLoading && packages && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative ${!pkg.isActive ? 'opacity-60' : ''}`}
                data-testid={`package-card-${pkg.id}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getTierBadgeColor(pkg.targetTier)}>
                          {pkg.targetTier || 'All Tiers'}
                        </Badge>
                        {!pkg.isActive && <Badge variant="secondary">Inactive</Badge>}
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
                  {pkg.description && <p className="text-gray-600 mb-4">{pkg.description}</p>}

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {pkg.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Created {new Date(pkg.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActiveMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                        disabled={toggleActiveMutation.isPending}
                        data-testid={`toggle-package-${pkg.id}`}
                        title={pkg.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {pkg.isActive ? (
                          <PowerOff className="h-3 w-3" />
                        ) : (
                          <Power className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(pkg)}
                        data-testid={`edit-package-${pkg.id}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => setDeleteConfirmId(pkg.id)}
                        data-testid={`delete-package-${pkg.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!packages || packages.length === 0) && (
          <Card className="col-span-full" data-testid="empty-packages-card">
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Feature Packages Yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first feature package to start offering structured services to your
                partners.
              </p>
              <Button onClick={openCreateDialog} data-testid="create-first-package-button">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Package
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Feature Package</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this feature package? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                data-testid="confirm-delete-package"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
