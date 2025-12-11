import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar,
  CreditCard, 
  Shield, 
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Users,
  Zap
} from 'lucide-react';

interface Entitlement {
  id: number;
  userId: string;
  status: string;
  productType: string | null;
  revokeAt: string | null;
  lastInvoiceStatus: string | null;
  delinquencyCount: number;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  zaxaaSubscriptionId: string | null;
  planName: string | null;
  planAmount: string | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateEntitlementForm {
  userId: string;
  productType: 'lifetime' | 'monthly' | 'yearly' | 'payment_plan';
  planName: string;
  planAmount: string;
  currency: string;
}

export default function EntitlementsPage() {
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState<CreateEntitlementForm>({
    userId: '',
    productType: 'monthly',
    planName: '',
    planAmount: '',
    currency: 'USD'
  });

  useEffect(() => {
    loadEntitlements();
  }, []);

  async function loadEntitlements() {
    try {
      const response = await fetch('/api/entitlements/list', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setEntitlements(data.entitlements || []);
      } else {
        throw new Error('Failed to load entitlements');
      }
    } catch (error) {
      console.error('Error loading entitlements:', error);
      toast({
        title: 'Error',
        description: 'Failed to load entitlements',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function createEntitlement() {
    if (!form.userId.trim() || !form.planName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'User ID and Plan Name are required',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/entitlements/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(form)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Entitlement created successfully'
        });
        
        setShowCreateForm(false);
        setForm({
          userId: '',
          productType: 'monthly',
          planName: '',
          planAmount: '',
          currency: 'USD'
        });
        
        await loadEntitlements();
      } else {
        throw new Error('Failed to create entitlement');
      }
    } catch (error) {
      console.error('Error creating entitlement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create entitlement',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default', icon: CheckCircle, label: 'Active' },
      past_due: { variant: 'secondary', icon: AlertTriangle, label: 'Past Due' },
      canceled: { variant: 'outline', icon: Clock, label: 'Canceled' },
      inactive: { variant: 'destructive', icon: Shield, label: 'Inactive' },
      refunded: { variant: 'destructive', icon: DollarSign, label: 'Refunded' },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getProductTypeBadge = (productType: string | null) => {
    if (!productType) return <Badge variant="outline">Unknown</Badge>;
    
    const typeConfig = {
      lifetime: { variant: 'default', icon: Zap, label: 'Lifetime' },
      yearly: { variant: 'secondary', icon: Calendar, label: 'Yearly' },
      monthly: { variant: 'outline', icon: Calendar, label: 'Monthly' },
      payment_plan: { variant: 'secondary', icon: CreditCard, label: 'Payment Plan' },
    } as const;

    const config = typeConfig[productType as keyof typeof typeConfig] || { variant: 'outline', icon: Shield, label: productType };
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entitlements Management</h1>
          <p className="text-gray-600">Manage user subscriptions and access control</p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Users className="h-4 w-4 mr-2" />
          Create Entitlement
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entitlements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entitlements.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {entitlements.filter(e => e.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Past Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {entitlements.filter(e => e.status === 'past_due').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lifetime Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {entitlements.filter(e => e.productType === 'lifetime').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader>
            <CardTitle>Create New Entitlement</CardTitle>
            <CardDescription>Grant access to a user for SmartCRM features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  placeholder="Enter Supabase user UUID"
                />
              </div>
              
              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select 
                  value={form.productType} 
                  onValueChange={(value: any) => setForm({ ...form, productType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="payment_plan">Payment Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  value={form.planName}
                  onChange={(e) => setForm({ ...form, planName: e.target.value })}
                  placeholder="e.g., SmartCRM Pro"
                />
              </div>
              
              <div>
                <Label htmlFor="planAmount">Plan Amount</Label>
                <Input
                  id="planAmount"
                  type="number"
                  step="0.01"
                  value={form.planAmount}
                  onChange={(e) => setForm({ ...form, planAmount: e.target.value })}
                  placeholder="29.99"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                onClick={createEntitlement}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Entitlement'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entitlements List */}
      <Card>
        <CardHeader>
          <CardTitle>User Entitlements</CardTitle>
          <CardDescription>
            {entitlements.length === 0 
              ? 'No entitlements found. Create one to get started.' 
              : `Showing ${entitlements.length} entitlement${entitlements.length === 1 ? '' : 's'}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entitlements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No entitlements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entitlements.map((entitlement) => (
                <div 
                  key={entitlement.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {entitlement.planName || 'Unnamed Plan'}
                      </p>
                      <p className="text-sm text-gray-600">
                        User: {entitlement.userId.substring(0, 8)}...
                      </p>
                      {entitlement.revokeAt && (
                        <p className="text-xs text-gray-500">
                          Expires: {new Date(entitlement.revokeAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(entitlement.status)}
                    {getProductTypeBadge(entitlement.productType)}
                    
                    {entitlement.planAmount && (
                      <Badge variant="outline">
                        ${entitlement.planAmount} {entitlement.currency}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}