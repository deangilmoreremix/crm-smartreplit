// Whitelabel Federation - Sync whitelabel config across all federated apps
import { useCallback } from 'react';
import { WhitelabelConfig } from '../../types/whitelabel';
import { eventBus } from './EventBus';
import { useFederation } from './FederationProvider';

/**
 * Custom hook to sync whitelabel configuration across federated apps
 */
export function useWhitelabelFederation() {
  const { updateSharedState } = useFederation();

  const syncWhitelabelConfig = useCallback((config: WhitelabelConfig) => {
    eventBus.publish({
      type: 'whitelabel:config-updated',
      payload: { config },
      source: 'host'
    });

    updateSharedState((prev) => ({
      userPreferences: {
        ...prev.userPreferences,
        whitelabelConfig: config
      }
    }));
  }, [updateSharedState]);

  const onWhitelabelConfigUpdate = useCallback((handler: (config: WhitelabelConfig) => void) => {
    return eventBus.subscribe('whitelabel:config-updated', (event) => {
      handler(event.payload.config);
    });
  }, []);

  const broadcastTenantSwitch = useCallback((tenantId: string) => {
    eventBus.publish({
      type: 'whitelabel:tenant-changed',
      payload: { tenantId },
      source: 'host'
    });

    updateSharedState({ currentTenant: tenantId });
  }, [updateSharedState]);

  const onTenantChange = useCallback((handler: (tenantId: string) => void) => {
    return eventBus.subscribe('whitelabel:tenant-changed', (event) => {
      handler(event.payload.tenantId);
    });
  }, []);

  return {
    syncWhitelabelConfig,
    onWhitelabelConfigUpdate,
    broadcastTenantSwitch,
    onTenantChange
  };
}

/**
 * Hook to apply whitelabel theme to the document
 */
export function useWhitelabelTheme() {
  const applyTheme = (config: WhitelabelConfig) => {
    const root = document.documentElement;
    if (config.primaryColor) root.style.setProperty('--wl-primary-color', config.primaryColor);
    if (config.secondaryColor) root.style.setProperty('--wl-secondary-color', config.secondaryColor);
    if (config.accentColor) root.style.setProperty('--wl-accent-color', config.accentColor);
    document.title = config.companyName || 'SmartCRM';
  };

  return { applyTheme };
}

/**
 * Hook to get whitelabel config with fallback
 */
export function useWhitelabelWithFallback(defaultConfig: WhitelabelConfig) {
  const { sharedState } = useFederation();
  return sharedState.userPreferences?.whitelabelConfig || defaultConfig;
}
