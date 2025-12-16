import React from 'react';
import { useRole } from './RoleBasedAccess';
import { UpgradePrompt } from './UpgradePrompt';
import { hasFeatureAccess } from '../config/featureTiers';

interface AccessGateProps {
  children: React.ReactNode;
  feature?: string;
  fallback?: 'upgrade' | 'hidden' | 'custom';
  customFallback?: React.ReactNode;
  compact?: boolean;
}

/**
 * AccessGate - Conditionally renders content based on feature access
 *
 * @param feature - Feature key to check access for
 * @param fallback - What to show when access is denied ('upgrade', 'hidden', 'custom')
 * @param customFallback - Custom component to show when fallback='custom'
 * @param compact - Whether to use compact upgrade prompt
 */
export const AccessGate: React.FC<AccessGateProps> = ({
  children,
  feature,
  fallback = 'upgrade',
  customFallback,
  compact = false
}) => {
  const { user, canAccess } = useRole();

  // If no feature specified, show content
  if (!feature) {
    return <>{children}</>;
  }

  // Check access
  const hasAccess = canAccess(feature);

  // If access granted, show content
  if (hasAccess) {
    return <>{children}</>;
  }

  // Handle different fallback types
  switch (fallback) {
    case 'hidden':
      return null;

    case 'custom':
      return customFallback ? <>{customFallback}</> : null;

    case 'upgrade':
    default:
      // Determine required tier for the feature
      const requiredTier = getRequiredTierForFeature(feature);
      return (
        <UpgradePrompt
          feature={feature}
          currentTier={user?.productTier}
          requiredTier={requiredTier}
          featureName={getFeatureDisplayName(feature)}
          compact={compact}
        />
      );
  }
};

/**
 * Helper function to determine required tier for a feature
 */
function getRequiredTierForFeature(feature: string): string | undefined {
  // Import feature tiers configuration
  const { featureTiers } = require('../config/featureTiers');

  // Find the highest tier that includes this feature
  const tiers = Object.keys(featureTiers).reverse(); // Check highest first

  for (const tier of tiers) {
    if (featureTiers[tier as keyof typeof featureTiers].includes(feature)) {
      return tier;
    }
  }

  return 'smartcrm'; // Default fallback
}

/**
 * Helper function to get user-friendly feature name
 */
function getFeatureDisplayName(feature: string): string {
  const names: Record<string, string> = {
    'aiGoals': 'AI Goals',
    'aiTools': 'AI Tools',
    'aiAssistant': 'AI Assistant',
    'videoEmail': 'Video Email',
    'phoneSystem': 'Phone System',
    'invoicing': 'Invoicing',
    'contentLibrary': 'Content Library',
    'formsSurveys': 'Forms & Surveys',
    'whitelabel': 'White Label Features',
    'admin': 'Admin Panel'
  };

  return names[feature] || feature.replace(/([A-Z])/g, ' $1').trim();
}