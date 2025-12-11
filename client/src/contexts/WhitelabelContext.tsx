import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WhitelabelConfig, WhitelabelContextType, DEFAULT_WHITELABEL_CONFIG } from '../types/whitelabel';

const WhitelabelContext = createContext<WhitelabelContextType | undefined>(undefined);

const STORAGE_KEY = 'whitelabel_config';

export const useWhitelabel = () => {
  const context = useContext(WhitelabelContext);
  if (!context) {
    throw new Error('useWhitelabel must be used within a WhitelabelProvider');
  }
  return context;
};

export const WhitelabelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WhitelabelConfig>(() => {
    // Load from localStorage or use defaults
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_WHITELABEL_CONFIG, ...parsed };
      }
    } catch (error) {
      console.error('Error loading whitelabel config:', error);
    }
    return DEFAULT_WHITELABEL_CONFIG;
  });

  // Load from URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      loadFromUrl(urlParams);
    }
  }, []);

  // Save to localStorage whenever config changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving whitelabel config:', error);
    }
  }, [config]);

  const updateConfig = useCallback((updates: Partial<WhitelabelConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetToDefault = useCallback(() => {
    setConfig(DEFAULT_WHITELABEL_CONFIG);
  }, []);

  const loadFromUrl = useCallback((urlParams: URLSearchParams) => {
    const configParam = urlParams.get('wl_config');
    if (configParam) {
      try {
        const decodedConfig = JSON.parse(atob(configParam));
        setConfig(prev => ({ ...prev, ...decodedConfig }));
      } catch (error) {
        console.error('Error parsing whitelabel config from URL:', error);
      }
    }

    // Load individual parameters
    const companyName = urlParams.get('wl_company');
    const primaryColor = urlParams.get('wl_primary');
    const heroTitle = urlParams.get('wl_title');

    if (companyName || primaryColor || heroTitle) {
      setConfig(prev => ({
        ...prev,
        ...(companyName && { companyName }),
        ...(primaryColor && { primaryColor }),
        ...(heroTitle && { heroTitle })
      }));
    }
  }, []);

  const exportConfig = useCallback(() => {
    return btoa(JSON.stringify(config));
  }, [config]);

  const importConfig = useCallback((configJson: string) => {
    try {
      const parsed = JSON.parse(configJson);
      setConfig(prev => ({ ...prev, ...parsed }));
    } catch (error) {
      console.error('Error importing whitelabel config:', error);
      throw new Error('Invalid configuration format');
    }
  }, []);

  // Apply CSS custom properties for dynamic theming
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--wl-primary-color', config.primaryColor);
    root.style.setProperty('--wl-secondary-color', config.secondaryColor);
  }, [config.primaryColor, config.secondaryColor]);

  const value: WhitelabelContextType = {
    config,
    updateConfig,
    resetToDefault,
    loadFromUrl,
    exportConfig,
    importConfig
  };

  return (
    <WhitelabelContext.Provider value={value}>
      {children}
    </WhitelabelContext.Provider>
  );
};