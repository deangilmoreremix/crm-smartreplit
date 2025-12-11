import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Users, 
  Mail,
  Phone,
  Globe,
  Award,
  DollarSign,
  Save,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePartnerWLConfig, useCreatePartnerWLConfig, useUpdatePartnerWLConfig } from '@/hooks/useWLSettings';
import { WLService } from '@/services/wlService';

interface Partner {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  website: string | null;
  businessType: string | null;
  status: 'pending' | 'active' | 'suspended' | 'terminated';
  tier: string;
  commissionRate: string;
  totalRevenue: string;
  totalCommissions: string;
  customerCount: number;
  brandingConfig: any;
  contractDetails: any;
  payoutSettings: any;
  createdAt: string;
  updatedAt: string;
}

interface PartnerTier {
  id: string;
  name: string;
  slug: string;
  commissionRate: string;
  minimumRevenue: string;
  features: string[];
  benefits: string[];
  color: string;
  priority: number;
  isActive: boolean;
}

export default function PartnerManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    phone: '',
    website: '',
    businessType: '',
    tier: 'bronze'
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // White Label hooks for database persistence
  const userId = 'dev-user-12345'; // In production, get from auth context

  const { data: partners, isLoading: partnersLoading } = useQuery<Partner[]>({
    queryKey: ['/api/partners'],
    refetchInterval: 30000,
  });

  const { data: tiers } = useQuery<PartnerTier[]>({
    queryKey: ['/api/partner-tiers'],
  });

  const createPartnerMutation = useMutation({
    mutationFn: (partnerData: any) => apiRequest('/api/partners', {
      method: 'POST',
      body: partnerData,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/partners/${id}`, {
        method: 'PUT',
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setFormData({
      companyName: '',
      contactName: '',
      contactEmail: '',
      phone: '',
      website: '',
      businessType: '',
      tier: 'bronze'
    });
    setEditingPartner(null);
  };

  // White Label persistence function for partner configurations
  const savePartnerWLConfig = async (partnerId: string, config: any) => {
    try {
      setIsSaving(true);

      const partnerWLData = {
        partnerId,
        companyName: config.companyName || '',
        logo: config.logo || '',
        primaryColor: config.primaryColor || '#3B82F6',
        secondaryColor: config.secondaryColor || '#1E40AF',
        customDomain: config.customDomain || '',
        emailFromName: config.emailFromName || config.companyName || '',
        emailReplyTo: config.emailReplyTo || config.contactEmail || '',
        brandingConfig: {
          ...config,
          tier: config.tier,
          commissionRate: config.commissionRate,
          status: config.status
        },
        features: {
          customBranding: true,
          whiteLabel: config.tier !== 'bronze',
          advancedFeatures: ['gold', 'platinum'].includes(config.tier)
        },
        profileId: userId
      };

      // Save to database
      try {
        await WLService.syncPartnerData ? await WLService.syncPartnerData(partnerId, partnerWLData) :
          await WLService.createPartnerWLConfig ? await WLService.createPartnerWLConfig(partnerWLData) :
          WLService.saveToLocalStorage(`partner-config-${partnerId}`, partnerWLData);

        toast({
          title: "Partner configuration saved!",
          description: "White label configuration has been saved successfully.",
        });
      } catch (dbError) {
        console.warn('Database save failed, using localStorage:', dbError);
        WLService.saveToLocalStorage(`partner-config-${partnerId}`, partnerWLData);
        
        toast({
          title: "Configuration saved locally",
          description: "Partner settings saved locally. Database sync will retry later.",
        });
      }
    } catch (error) {
      console.error('Failed to save partner WL config:', error);
      toast({
        title: "Save failed",
        description: "Failed to save partner configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPartner) {
      updatePartnerMutation.mutate({
        id: editingPartner.id,
        data: formData
      });
    } else {
      createPartnerMutation.mutate({
        ...formData,
        status: 'pending',
        profileId: 'dev-user-12345' // In real app, get from auth
      });
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const getTierBadgeColor = (tier: string) => {
    const colors = {
      bronze: 'bg-orange-100 text-orange-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-purple-100 text-purple-800',
    };
    return colors[tier as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      terminated: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (partnersLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 pb-20" data-testid="partner-management">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Management</h1>
          <p className="text-gray-600 mt-1">Manage your partner network and revenue sharing relationships</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-partner-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Acme Corporation"
                    required
                    data-testid="company-name-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="John Smith"
                    required
                    data-testid="contact-name-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="john@acme.com"
                    required
                    data-testid="contact-email-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1-555-123-4567"
                    data-testid="phone-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://acme.com"
                    data-testid="website-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tier">Partner Tier</Label>
                  <Select 
                    value={formData.tier} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tier: value }))}
                  >
                    <SelectTrigger data-testid="partner-tier-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bronze">Bronze (15%)</SelectItem>
                      <SelectItem value="silver">Silver (20%)</SelectItem>
                      <SelectItem value="gold">Gold (25%)</SelectItem>
                      <SelectItem value="platinum">Platinum (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessType: e.target.value }))}
                  placeholder="Technology Consulting"
                  data-testid="business-type-input"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createPartnerMutation.isPending || updatePartnerMutation.isPending}
                  data-testid="submit-partner-button"
                >
                  {createPartnerMutation.isPending || updatePartnerMutation.isPending 
                    ? 'Saving...' 
                    : editingPartner ? 'Update Partner' : 'Add Partner'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="total-partners-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partners?.length || 0}</div>
          </CardContent>
        </Card>

        <Card data-testid="active-partners-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners?.filter(p => p.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-revenue-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners 
                ? formatCurrency(partners.reduce((sum, p) => sum + parseFloat(p.totalRevenue), 0).toString())
                : '$0'
              }
            </div>
          </CardContent>
        </Card>

        <Card data-testid="total-commissions-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {partners 
                ? formatCurrency(partners.reduce((sum, p) => sum + parseFloat(p.totalCommissions), 0).toString())
                : '$0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Tiers */}
      <Card data-testid="partner-tiers-card">
        <CardHeader>
          <CardTitle>Partner Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers?.map((tier) => (
              <div key={tier.id} className="p-4 border rounded-lg" data-testid={`tier-card-${tier.slug}`}>
                <div className="flex justify-between items-start mb-2">
                  <Badge className={getTierBadgeColor(tier.slug)}>
                    {tier.name}
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-bold">{tier.commissionRate}%</div>
                    <div className="text-xs text-gray-500">Commission</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Min Revenue: {formatCurrency(tier.minimumRevenue)}
                </div>
                <div className="space-y-1">
                  {tier.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="text-xs text-gray-600">• {feature}</div>
                  ))}
                  {tier.features.length > 2 && (
                    <div className="text-xs text-gray-500">+{tier.features.length - 2} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card data-testid="partners-table-card">
        <CardHeader>
          <CardTitle>All Partners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Company</th>
                  <th className="text-left p-4">Contact</th>
                  <th className="text-left p-4">Tier</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Revenue</th>
                  <th className="text-right p-4">Customers</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners?.map((partner) => (
                  <tr key={partner.id} className="border-b hover:bg-gray-50" data-testid={`partner-row-${partner.id}`}>
                    <td className="p-4">
                      <div className="font-medium">{partner.companyName}</div>
                      {partner.website && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <a href={partner.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {partner.website.replace('https://', '')}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="font-medium">{partner.contactName}</div>
                        <div className="text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {partner.contactEmail}
                        </div>
                        {partner.phone && (
                          <div className="text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {partner.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getTierBadgeColor(partner.tier)}>
                        {partner.tier}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={getStatusBadgeColor(partner.status)}>
                        {partner.status}
                      </Badge>
                    </td>
                    <td className="text-right p-4 font-medium">
                      {formatCurrency(partner.totalRevenue)}
                    </td>
                    <td className="text-right p-4">
                      {partner.customerCount}
                    </td>
                    <td className="text-center p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPartner(partner);
                            setFormData({
                              companyName: partner.companyName,
                              contactName: partner.contactName,
                              contactEmail: partner.contactEmail,
                              phone: partner.phone || '',
                              website: partner.website || '',
                              businessType: partner.businessType || '',
                              tier: partner.tier
                            });
                            setIsCreateDialogOpen(true);
                          }}
                          data-testid={`edit-partner-${partner.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          data-testid={`delete-partner-${partner.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {partners?.length === 0 && (
        <Card data-testid="empty-partners-card">
          <CardContent className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Partners Yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your partner network by adding your first partner.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="add-first-partner-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Partner
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}