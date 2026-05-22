// useCrossAppCommunication Hook - Easy cross-app data access
import { useCallback } from 'react';
import { eventBus } from './EventBus';
import { useFederationRegistry } from './FederationProvider';
import { RemoteApp } from './types';

interface CrossAppRequest {
  appId: string;
  action: string;
  data?: any;
}

interface CrossAppData {
  [appId: string]: any[];
}

/**
 * Hook for making cross-app requests
 */
export function useCrossAppCommunication() {
  const registry = useFederationRegistry();

  /**
   * Request data from another app
   */
  const requestData = useCallback(async <T = any>(
    appId: string,
    action: string,
    data?: any
  ): Promise<T> => {
    if (!registry.hasApp(appId)) {
      throw new Error(`App not found: ${appId}`);
    }
    return eventBus.request<T>(appId, action, data);
  }, [registry]);

  /**
   * Broadcast data to all apps
   */
  const broadcastData = useCallback((
    type: string,
    payload: any,
    source?: string
  ) => {
    eventBus.publish({
      type: `broadcast:${type}`,
      payload,
      source: source || 'host'
    });
  }, []);

  /**
   * Subscribe to broadcasts from specific app
   */
  const subscribeToBroadcasts = useCallback((
    appId: string,
    handler: (payload: any) => void
  ) => {
    return eventBus.subscribe(`broadcast:${appId}`, (event) => {
      handler(event.payload);
    });
  }, []);

  /**
   * Get apps that can fulfill a request based on capability
   */
  const getAppsByCapability = useCallback((
    capability: Parameters<typeof registry.getAppsByCapability>[0]
  ): RemoteApp[] => {
    return registry.getAppsByCapability(capability);
  }, [registry]);

  return {
    requestData,
    broadcastData,
    subscribeToBroadcasts,
    getAppsByCapability
  };
}

/**
 * Hook to request contact data from contacts app
 */
export function useContactData() {
  const { requestData } = useCrossAppCommunication();
  
  const getContact = useCallback((contactId: string) => {
    return requestData('contacts', 'getContact', { id: contactId });
  }, [requestData]);

  const getContacts = useCallback((filters?: any) => {
    return requestData('contacts', 'listContacts', { filters });
  }, [requestData]);

  return { getContact, getContacts };
}

/**
 * Hook to request deal data from pipeline app
 */
export function useDealData() {
  const { requestData } = useCrossAppCommunication();
  
  const getDeal = useCallback((dealId: string) => {
    return requestData('pipeline', 'getDeal', { id: dealId });
  }, [requestData]);

  const getDeals = useCallback((filters?: any) => {
    return requestData('pipeline', 'listDeals', { filters });
  }, [requestData]);

  return { getDeal, getDeals };
}

/**
 * Hook to share contact selection across apps
 */
export function useSharedContactSelection() {
  const { broadcastData, subscribeToBroadcasts } = useCrossAppCommunication();
  const { updateSharedState } = useFederation();

  const selectContact = useCallback((contact: any) => {
    updateSharedState({ selectedContact: contact });
    broadcastData('contact-selected', contact);
  }, [broadcastData, updateSharedState]);

  const onContactSelected = useCallback((handler: (contact: any) => void) => {
    return subscribeToBroadcasts('contact-selected', handler);
  }, [subscribeToBroadcasts]);

  return { selectContact, onContactSelected };
}

/**
 * Hook to share deal selection across apps
 */
export function useSharedDealSelection() {
  const { broadcastData, subscribeToBroadcasts } = useCrossAppCommunication();
  const { updateSharedState } = useFederation();

  const selectDeal = useCallback((deal: any) => {
    updateSharedState({ activeDeal: deal });
    broadcastData('deal-selected', deal);
  }, [broadcastData, updateSharedState]);

  const onDealSelected = useCallback((handler: (deal: any) => void) => {
    return subscribeToBroadcasts('deal-selected', handler);
  }, [subscribeToBroadcasts]);

  return { selectDeal, onDealSelected };
}