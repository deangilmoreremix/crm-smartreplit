// Federation Provider - React context for federation state
import React, { createContext, useContext, ReactNode, useRef, useCallback } from 'react';
import { RemoteApp, FeatureFlags, SharedState } from './types';
import { remoteRegistry, RemoteRegistry } from './RemoteRegistry';

interface FederationContextValue {
  registry: RemoteRegistry;
  featureFlags: FeatureFlags;
  sharedState: SharedState;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => void;
  updateSharedState: (state: Partial<SharedState> | ((prev: SharedState) => Partial<SharedState>)) => void;
  broadcastToRemotes: (type: string, payload?: any) => void;
}

const defaultFeatureFlags: FeatureFlags = {
  enableAI: true,
  enableScoring: true,
  enableForecasting: true,
  enableAutomation: true
};

const defaultSharedState: SharedState = {
  selectedContact: undefined,
  activeDeal: undefined,
  currentTenant: undefined,
  userPreferences: {
    theme: 'light',
    language: 'en',
    notifications: true
  },
  user: undefined,
  session: undefined,
  isAuthenticated: false
};

const FederationContext = createContext<FederationContextValue | null>(null);

interface FederationProviderProps {
  children: ReactNode;
  initialFeatureFlags?: Partial<FeatureFlags>;
  initialSharedState?: Partial<SharedState>;
}

export const FederationProvider: React.FC<FederationProviderProps> = ({
  children,
  initialFeatureFlags = {},
  initialSharedState = {}
}) => {
  const [featureFlags, setFeatureFlags] = React.useState<FeatureFlags>({
    ...defaultFeatureFlags,
    ...initialFeatureFlags
  });

  const [sharedState, setSharedState] = React.useState<SharedState>({
    ...defaultSharedState,
    ...initialSharedState
  });

  // Track iframe windows for broadcasting
  const iframeRefs = useRef<Set<Window>>(new Set());

  const updateFeatureFlags = React.useCallback((flags: Partial<FeatureFlags>) => {
    setFeatureFlags(prev => ({ ...prev, ...flags }));
  }, []);

  const updateSharedState = React.useCallback((state: Partial<SharedState> | ((prev: SharedState) => Partial<SharedState>)) => {
    setSharedState(prev => {
      const partial = typeof state === 'function' ? state(prev) : state;
      return { ...prev, ...partial };
    });
  }, []);

  // Register an iframe window to receive broadcasts
  const registerIframe = useCallback((iframeWindow: Window) => {
    iframeRefs.current.add(iframeWindow);
    return () => {
      iframeRefs.current.delete(iframeWindow);
    };
  }, []);

  // Broadcast a message to all registered remote iframes
  const broadcastToRemotes = useCallback((type: string, payload?: any) => {
    const message = { type, payload, source: 'host', timestamp: Date.now() };
    iframeRefs.current.forEach(iframeWin => {
      try {
        iframeWin.postMessage(message, '*');
      } catch {
        // Iframe may have been removed
      }
    });
  }, []);

  const value: FederationContextValue = {
    registry: remoteRegistry,
    featureFlags,
    sharedState,
    updateFeatureFlags,
    updateSharedState,
    broadcastToRemotes
  };

  return (
    <FederationContext.Provider value={value}>
      {children}
    </FederationContext.Provider>
  );
};

export function useFederation(): FederationContextValue {
  const context = useContext(FederationContext);
  if (!context) {
    throw new Error('useFederation must be used within FederationProvider');
  }
  return context;
}

export function useFederationRegistry(): RemoteRegistry {
  const { registry } = useFederation();
  return registry;
}

export function useFeatureFlags(): FeatureFlags {
  const { featureFlags } = useFederation();
  return featureFlags;
}

export function useSharedState(): SharedState {
  const { sharedState } = useFederation();
  return sharedState;
}
