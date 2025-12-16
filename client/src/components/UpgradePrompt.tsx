import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Crown, Zap, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { useRole } from './RoleBasedAccess';

interface UpgradePromptProps {
  feature: string;
  currentTier?: string | null;
  requiredTier?: string;
  featureName?: string;
  compact?: boolean;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  currentTier,
  requiredTier,
  featureName,
  compact = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useRole();

  const getTierDisplayName = (tier: string) => {
    const names: Record<string, string> = {
      'smartcrm': 'SmartCRM',
      'sales_maximizer': 'Sales Maximizer',
      'ai_boost_unlimited': 'AI Boost Unlimited',
      'ai_communication': 'AI Communication',
      'smartcrm_bundle': 'SmartCRM Bundle',
      'whitelabel': 'Whitelabel',
      'super_admin': 'Super Admin'
    };
    return names[tier] || tier;
  };

  const getTierFeatures = (tier: string) => {
    const features: Record<string, string[]> = {
      'smartcrm': ['Dashboard', 'Contacts', 'Pipeline', 'Calendar', 'Tasks'],
      'sales_maximizer': ['AI Goals', 'AI Tools', 'AI Assistant'],
      'ai_boost_unlimited': ['Unlimited AI credits', 'Advanced AI features'],
      'ai_communication': ['Video Email', 'SMS', 'VoIP', 'Invoicing'],
      'smartcrm_bundle': ['All CRM features', 'Communication tools'],
      'whitelabel': ['Custom branding', 'White-label features']
    };
    return features[tier] || [];
  };

  const handleUpgrade = () => {
    navigate('/upgrade', {
      state: {
        requiredFeature: feature,
        featureName: featureName || feature,
        currentTier,
        requiredTier
      }
    });
  };

  if (compact) {
    return (
      <div className={`p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Upgrade to access {featureName || feature}
              </p>
              <p className="text-xs text-blue-700">
                {requiredTier && `Requires ${getTierDisplayName(requiredTier)} plan`}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={handleUpgrade} className="bg-blue-600 hover:bg-blue-700">
            Upgrade
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Crown className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-xl text-blue-900">
          Unlock {featureName || feature}
        </CardTitle>
        <CardDescription className="text-blue-700">
          Upgrade your plan to access this premium feature
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current vs Required */}
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-2">
              Current Plan
            </Badge>
            <p className="font-medium text-gray-900">
              {currentTier ? getTierDisplayName(currentTier) : 'Free'}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400" />
          <div className="text-center">
            <Badge className="mb-2 bg-blue-600">
              Required Plan
            </Badge>
            <p className="font-medium text-blue-900">
              {requiredTier ? getTierDisplayName(requiredTier) : 'Premium'}
            </p>
          </div>
        </div>

        {/* Features included in upgrade */}
        {requiredTier && (
          <div className="bg-white/50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <Star className="h-4 w-4 mr-2" />
              What's included in {getTierDisplayName(requiredTier)}:
            </h4>
            <ul className="space-y-2">
              {getTierFeatures(requiredTier).map((featureItem, index) => (
                <li key={index} className="flex items-center text-sm text-blue-800">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                  {featureItem}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/upgrade')}
            className="flex-1"
            size="lg"
          >
            View All Plans
          </Button>
        </div>

        {/* Additional info */}
        <p className="text-xs text-center text-blue-600">
          Questions about pricing? <a href="mailto:support@smartcrm.vip" className="underline hover:no-underline">Contact support</a>
        </p>
      </CardContent>
    </Card>
  );
};