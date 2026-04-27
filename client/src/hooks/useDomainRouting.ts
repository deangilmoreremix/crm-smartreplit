import { useState, useEffect } from 'react';
import { DomainRouter } from '../utils/domainRouter';

export interface DomainRoutingState {
  currentDomain: string;
  currentTenantId: string;
  isLoading: boolean;
  error: string | null;
}

export const useDomainRouting = () => {
  const [state, setState] = useState<DomainRoutingState>({
    currentDomain: '',
    currentTenantId: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    try {
      const currentDomain = window.location.hostname;
      const tenantId = DomainRouter.getTenantFromDomain(currentDomain);

      setState({
        currentDomain,
        currentTenantId: tenantId,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        currentDomain: '',
        currentTenantId: '',
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown domain routing error',
      });
    }
  }, []);

  const switchToDomain = (domain: string) => {
    try {
      const tenantId = DomainRouter.getTenantFromDomain(domain);
      window.location.href = `${window.location.protocol}//${domain}${window.location.pathname}`;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to switch domain',
      }));
    }
  };

  const getAvailableDomains = () => {
    return [
      'app.smartcrm.vip',
      'pipeline.smartcrm.vip',
      'contacts.smartcrm.vip',
      'analytics.smartcrm.vip',
      'agency.smartcrm.vip',
      'calendar.smartcrm.vip',
      'research.smartcrm.vip',
      'white-label.smartcrm.vip',
    ];
  };

  return {
    ...state,
    switchToDomain,
    getAvailableDomains,
  };
};
