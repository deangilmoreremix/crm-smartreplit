import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { UserWLSettings, InsertUserWLSettings, TenantConfig, InsertTenantConfig, PartnerWLConfig, InsertPartnerWLConfig } from '@shared/schema';

// User White Label Settings Hook
export function useUserWLSettings(userId: string) {
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['/api/user/wl-settings', userId],
    queryFn: () => apiRequest(`/api/user/wl-settings/${userId}`),
    enabled: !!userId,
  });

  return { settings, isLoading, error };
}

// Create User WL Settings Hook
export function useCreateUserWLSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertUserWLSettings) => 
      apiRequest('/api/user/wl-settings', { method: 'POST', body: data }),
    onSuccess: (data, variables) => {
      // Invalidate and refetch user settings
      queryClient.invalidateQueries({ queryKey: ['/api/user/wl-settings', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/wl-settings'] });
    },
  });
}

// Update User WL Settings Hook
export function useUpdateUserWLSettings(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<UserWLSettings>) => 
      apiRequest(`/api/user/wl-settings/${userId}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      // Invalidate and refetch user settings
      queryClient.invalidateQueries({ queryKey: ['/api/user/wl-settings', userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/wl-settings'] });
    },
  });
}

// Tenant Configuration Hooks
export function useTenantConfig(tenantId: string) {
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['/api/tenant/config', tenantId],
    queryFn: () => apiRequest(`/api/tenant/config/${tenantId}`),
    enabled: !!tenantId,
  });

  return { config, isLoading, error };
}

export function useCreateTenantConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertTenantConfig) => 
      apiRequest('/api/tenant/config', { method: 'POST', body: data }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/config', variables.tenantId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/config'] });
    },
  });
}

export function useUpdateTenantConfig(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TenantConfig>) => 
      apiRequest(`/api/tenant/config/${tenantId}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/config', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenant/config'] });
    },
  });
}

// Partner White Label Configuration Hooks
export function usePartnerWLConfig(partnerId: string) {
  const { data: config, isLoading, error } = useQuery({
    queryKey: ['/api/partner/wl-config', partnerId],
    queryFn: () => apiRequest(`/api/partner/wl-config/${partnerId}`),
    enabled: !!partnerId,
  });

  return { config, isLoading, error };
}

export function useCreatePartnerWLConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InsertPartnerWLConfig) => 
      apiRequest('/api/partner/wl-config', { method: 'POST', body: data }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/wl-config', variables.partnerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/partner/wl-config'] });
    },
  });
}

export function useUpdatePartnerWLConfig(partnerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<PartnerWLConfig>) => 
      apiRequest(`/api/partner/wl-config/${partnerId}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partner/wl-config', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/partner/wl-config'] });
    },
  });
}

// White Label Packages Hook
export function useWhiteLabelPackages() {
  const { data: packages, isLoading, error } = useQuery({
    queryKey: ['/api/white-label-packages'],
    queryFn: () => apiRequest('/api/white-label-packages'),
  });

  return { packages, isLoading, error };
}

// White Label State Management Hook
export function useWLState() {
  const [currentSettings, setCurrentSettings] = useState<UserWLSettings | null>(null);
  const [currentConfig, setCurrentConfig] = useState<TenantConfig | null>(null);
  const [isModified, setIsModified] = useState(false);

  // Save settings to localStorage for persistence across sessions
  useEffect(() => {
    const savedSettings = localStorage.getItem('wl-settings');
    if (savedSettings) {
      try {
        setCurrentSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved WL settings:', error);
      }
    }
  }, []);

  const updateLocalSettings = (settings: Partial<UserWLSettings>) => {
    const updatedSettings = { ...currentSettings, ...settings } as UserWLSettings;
    setCurrentSettings(updatedSettings);
    setIsModified(true);
    localStorage.setItem('wl-settings', JSON.stringify(updatedSettings));
  };

  const updateLocalConfig = (config: Partial<TenantConfig>) => {
    const updatedConfig = { ...currentConfig, ...config } as TenantConfig;
    setCurrentConfig(updatedConfig);
    setIsModified(true);
    localStorage.setItem('wl-config', JSON.stringify(updatedConfig));
  };

  const resetModifications = () => {
    setIsModified(false);
  };

  return {
    currentSettings,
    currentConfig,
    isModified,
    updateLocalSettings,
    updateLocalConfig,
    resetModifications,
    setCurrentSettings,
    setCurrentConfig
  };
}