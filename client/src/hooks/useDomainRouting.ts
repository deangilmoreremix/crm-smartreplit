import { useState, useEffect } from 'react';
import { DomainRouter, type HostResolution } from '../utils/domainRouter';
import type { WhitelabelConfig } from '../types/whitelabel';

export interface DomainRoutingState {
  currentDomain: string;
  /** 'own' for built-in SmartCRM hosts, 'custom' for a registered custom domain, 'unknown' otherwise. */
  hostKind: HostResolution['kind'] | null;
  /** Branding for the current custom domain, if any. */
  branding: Partial<WhitelabelConfig> | null;
  isLoading: boolean;
  error: string | null;
}

export const useDomainRouting = () => {
  const [state, setState] = useState<DomainRoutingState>({
    currentDomain: '',
    hostKind: null,
    branding: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    const host = window.location.hostname;
    DomainRouter.resolveHost(host)
      .then((resolution) => {
        if (cancelled) return;
        setState({
          currentDomain: resolution.host,
          hostKind: resolution.kind,
          branding: resolution.branding,
          isLoading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({
          currentDomain: host,
          hostKind: null,
          branding: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown domain routing error',
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const switchToDomain = (domain: string) => {
    const host = DomainRouter.normalizeHost(domain);
    window.location.href = `${window.location.protocol}//${host}${window.location.pathname}`;
  };

  const getAvailableDomains = () => DomainRouter.getOwnHosts();

  return {
    ...state,
    switchToDomain,
    getAvailableDomains,
  };
};
