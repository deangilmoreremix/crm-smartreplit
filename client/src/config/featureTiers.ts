/**
 * Feature Tier Configuration
 * Defines which product tiers have access to which features
 */

export const featureTiers: Record<string, string[]> = {
  // Dashboard & Core
  dashboard: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  contacts: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  pipeline: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  calendar: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  tasks: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  
  // AI Features
  aiGoals: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  aiTools: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  aiAssistant: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  
  // Communication
  communications: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  videoEmail: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'ai_communication'],
  phoneSystem: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'ai_communication'],
  sms: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'ai_communication'],
  
  // Business Tools
  invoicing: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'ai_communication'],
  contentLibrary: ['super_admin', 'whitelabel', 'smartcrm_bundle'],
  formsSurveys: ['super_admin', 'whitelabel', 'smartcrm_bundle'],
  analytics: ['super_admin', 'whitelabel', 'smartcrm_bundle', 'smartcrm', 'sales_maximizer', 'ai_boost_unlimited', 'ai_communication'],
  
  // White Label
  whitelabel: ['super_admin', 'whitelabel'],
  
  // Admin
  admin: ['super_admin'],
};

export type FeatureKey = keyof typeof featureTiers;

/**
 * Check if a user's product tier has access to a feature
 */
export function hasFeatureAccess(productTier: string | null | undefined, featureKey: FeatureKey): boolean {
  // null tier = no access to any paid features
  if (!productTier) {
    return false;
  }

  // Special dev tier that has access to everything
  if (productTier === 'dev_all_access') {
    return true;
  }

  const allowedTiers = featureTiers[featureKey] || [];
  return allowedTiers.includes(productTier as any);
}

/**
 * Get human-readable feature name
 */
export function getFeatureName(featureKey: FeatureKey): string {
  const names: Record<FeatureKey, string> = {
    dashboard: 'Dashboard',
    contacts: 'Contacts',
    pipeline: 'Pipeline',
    calendar: 'Calendar',
    tasks: 'Tasks',
    aiGoals: 'AI Goals',
    aiTools: 'AI Tools',
    aiAssistant: 'AI Assistant',
    communications: 'Communications',
    videoEmail: 'Video Email',
    phoneSystem: 'Phone System',
    sms: 'SMS',
    invoicing: 'Invoicing',
    contentLibrary: 'Content Library',
    formsSurveys: 'Forms & Surveys',
    analytics: 'Analytics',
    whitelabel: 'White Label',
    admin: 'Admin Panel',
  };
  return names[featureKey] || featureKey;
}
