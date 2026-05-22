// useFederation Hook - Simplified access to federation features
import { useCallback } from 'react';
import { useFederation, useFederationRegistry, useFeatureFlags, useSharedState } from './FederationProvider';
import { RemoteApp, SharedState, FeatureFlags } from './types';
import { remoteRegistry } from './RemoteRegistry';

// Re-export the main hook and related hooks
export { useFederation, useFederationRegistry, useFeatureFlags, useSharedState };

/**
 * Get a specific app from the registry
 */
export function useRemoteApp(appId: string): RemoteApp | undefined {
  const registry = useFederationRegistry();
  return registry.getApp(appId);
}

/**
 * Get apps that have a specific capability
 */
export function useAppsByCapability(capability: Parameters<typeof remoteRegistry.getAppsByCapability>[0]) {
  const registry = useFederationRegistry();
  return registry.getAppsByCapability(capability);
}

/**
 * Check if current feature flags enable a feature
 */
export function useFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[feature];
}

/**
 * Get current shared state value for a specific key
 */
export function useSharedValue<K extends keyof SharedState>(key: K): SharedState[K] {
  const state = useSharedState();
  return state[key];
}

/**
 * Hook to update shared state
 */
export function useUpdateSharedState() {
  const { updateSharedState } = useFederation();
  return useCallback(updateSharedState, []);
}

/**
 * Hook to update feature flags
 */
export function useUpdateFeatureFlags() {
  const { updateFeatureFlags } = useFederation();
  return useCallback(updateFeatureFlags, []);
}