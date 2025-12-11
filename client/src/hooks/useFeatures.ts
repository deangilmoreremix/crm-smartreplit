import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export interface Feature {
  id: number;
  featureKey: string;
  name: string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  dependsOn: string[] | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveFeature {
  featureId: number;
  overrideId?: number;
  featureKey: string;
  name: string | null;
  description: string | null;
  category: string | null;
  enabled: boolean;
  source: 'tier' | 'override';
  expiresAt?: string | null;
  grantedBy?: string | null;
  grantedAt?: string | null;
}

export interface UserFeatureOverride {
  id: number;
  profileId: string;
  featureId: number;
  enabled: boolean;
  expiresAt: string | null;
  grantedBy: string | null;
  grantedAt: string | null;
  featureKey: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
}

export interface TierFeature {
  id: number;
  productTier: string;
  includedByDefault: boolean | null;
  featureId: number | null;
  featureKey: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  isEnabled: boolean | null;
}

// Get all features (admin only)
export function useFeatures(filters?: { category?: string; isEnabled?: boolean }) {
  return useQuery<Feature[]>({
    queryKey: ['/api/admin/features', filters],
    enabled: true,
  });
}

// Get single feature (admin only)
export function useFeature(id: number) {
  return useQuery<Feature>({
    queryKey: ['/api/admin/features', id],
    enabled: !!id,
  });
}

// Create feature (admin only)
export function useCreateFeature() {
  return useMutation({
    mutationFn: async (data: Partial<Feature>) => {
      return await apiRequest('/api/admin/features', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/features'] });
    },
  });
}

// Update feature (admin only)
export function useUpdateFeature() {
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Feature> & { id: number }) => {
      return await apiRequest(`/api/admin/features/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/features'] });
    },
  });
}

// Delete feature (admin only)
export function useDeleteFeature() {
  return useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/features/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/features'] });
    },
  });
}

// Get tier features (admin only)
export function useTierFeatures(tier: string) {
  return useQuery<TierFeature[]>({
    queryKey: ['/api/admin/tier-features', tier],
    enabled: !!tier,
  });
}

// Set tier features (admin only)
export function useSetTierFeatures() {
  return useMutation({
    mutationFn: async ({ tier, featureIds }: { tier: string; featureIds: number[] }) => {
      return await apiRequest(`/api/admin/tier-features/${tier}`, {
        method: 'POST',
        body: JSON.stringify({ featureIds }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tier-features', variables.tier] });
    },
  });
}

// Get user feature overrides (admin only)
export function useUserFeatures(userId: string) {
  return useQuery<UserFeatureOverride[]>({
    queryKey: ['/api/admin/users', userId, 'features'],
    enabled: !!userId,
  });
}

// Get effective features for a user (admin only)
export function useEffectiveFeatures(userId: string) {
  return useQuery<EffectiveFeature[]>({
    queryKey: ['/api/admin/users', userId, 'features', 'effective'],
    enabled: !!userId,
  });
}

// Set user feature override (admin only)
export function useSetUserFeature() {
  return useMutation({
    mutationFn: async ({ 
      userId, 
      featureId, 
      enabled, 
      expiresAt 
    }: { 
      userId: string; 
      featureId: number; 
      enabled: boolean; 
      expiresAt?: string; 
    }) => {
      return await apiRequest(`/api/admin/users/${userId}/features`, {
        method: 'POST',
        body: JSON.stringify({ featureId, enabled, expiresAt }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'features'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'features', 'effective'] });
    },
  });
}

// Remove user feature override (admin only)
export function useRemoveUserFeature() {
  return useMutation({
    mutationFn: async ({ userId, featureId }: { userId: string; featureId: number }) => {
      return await apiRequest(`/api/admin/users/${userId}/features/${featureId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'features'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'features', 'effective'] });
    },
  });
}

// Check if current user has access to a feature
export function useFeatureAccess(featureKey: string) {
  return useQuery<{ hasAccess: boolean; feature: EffectiveFeature | null }>({
    queryKey: ['/api/features/check', featureKey],
    enabled: !!featureKey,
  });
}

// Get feature usage analytics (admin only)
export function useFeatureUsage(filters?: { userId?: string; featureId?: number }) {
  return useQuery({
    queryKey: ['/api/admin/features/usage', filters],
    enabled: true,
  });
}
