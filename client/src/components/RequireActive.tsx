import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, Clock } from 'lucide-react';

interface Entitlement {
  id: number;
  userId: string;
  status: string;
  productType: string | null;
  revokeAt: string | null;
  lastInvoiceStatus: string | null;
  delinquencyCount: number;
  planName: string | null;
  planAmount: string | null;
  currency: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RequireActiveProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export default function RequireActive({ children, fallbackPath = '/pricing' }: RequireActiveProps) {
  const [user, setUser] = useState<any>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get current user
    async function getCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }
    }
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function checkEntitlement() {
      try {
        const response = await fetch('/api/entitlements/check', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setEntitlement(data.entitlement);
        } else {
          setEntitlement(null);
        }
      } catch (error) {
        console.error('Error checking entitlement:', error);
        setEntitlement(null);
      } finally {
        setLoading(false);
      }
    }

    checkEntitlement();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is active
  const now = Date.now();
  const isActive = entitlement?.status === 'active' && 
    (!entitlement?.revokeAt || new Date(entitlement.revokeAt).getTime() > now);

  if (isActive) {
    return <>{children}</>;
  }

  // Show appropriate message based on entitlement status
  const getStatusMessage = () => {
    if (!entitlement) {
      return {
        title: 'No Active Subscription',
        description: 'You need an active subscription to access this feature.',
        icon: <CreditCard className="h-12 w-12 text-blue-500" />,
        action: 'Subscribe Now'
      };
    }

    switch (entitlement.status) {
      case 'past_due':
        return {
          title: 'Payment Required',
          description: 'Your subscription payment is past due. Please update your payment method to continue.',
          icon: <AlertTriangle className="h-12 w-12 text-yellow-500" />,
          action: 'Update Payment'
        };
      case 'canceled':
        return {
          title: 'Subscription Canceled',
          description: 'Your subscription has been canceled. Reactivate to continue using SmartCRM.',
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          action: 'Reactivate'
        };
      case 'inactive':
        return {
          title: 'Access Expired',
          description: 'Your subscription access has expired. Renew to continue using SmartCRM.',
          icon: <Clock className="h-12 w-12 text-gray-500" />,
          action: 'Renew Now'
        };
      case 'refunded':
        return {
          title: 'Subscription Refunded',
          description: 'Your subscription has been refunded and access revoked.',
          icon: <AlertTriangle className="h-12 w-12 text-red-500" />,
          action: 'Subscribe Again'
        };
      default:
        return {
          title: 'Access Restricted',
          description: 'You do not have access to this feature.',
          icon: <AlertTriangle className="h-12 w-12 text-gray-500" />,
          action: 'Get Access'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {statusInfo.icon}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {statusInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            {statusInfo.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {entitlement && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="font-medium">Plan:</span>
                <span>{entitlement.planName || entitlement.productType || 'Unknown'}</span>
                
                <span className="font-medium">Status:</span>
                <span className="capitalize">{entitlement.status}</span>
                
                {entitlement.revokeAt && (
                  <>
                    <span className="font-medium">Expires:</span>
                    <span>{new Date(entitlement.revokeAt).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <Button 
              onClick={() => window.location.href = fallbackPath}
              className="flex-1"
            >
              {statusInfo.action}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/support'}
              className="flex-1"
            >
              Get Help
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}