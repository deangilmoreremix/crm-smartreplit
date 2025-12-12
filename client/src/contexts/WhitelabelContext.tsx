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
        const decoded = atob(configParam);
        const parsedConfig = JSON.parse(decoded);
        // Basic validation
        if (typeof parsedConfig === 'object' && parsedConfig !== null) {
          setConfig(prev => ({ ...prev, ...parsedConfig }));
        } else {
          console.error('Invalid whitelabel config structure from URL');
        }
      } catch (error) {
        console.error('Error parsing whitelabel config from URL:', error);
      }
    }

    // Load individual parameters with validation
    const companyName = urlParams.get('wl_company');
    const primaryColor = urlParams.get('wl_primary');
    const heroTitle = urlParams.get('wl_title');

    if (companyName || primaryColor || heroTitle) {
      const updates: Partial<WhitelabelConfig> = {};
      if (companyName && typeof companyName === 'string') {
        updates.companyName = companyName;
      }
      if (primaryColor && typeof primaryColor === 'string' && /^#[0-9A-F]{6}$/i.test(primaryColor)) {
        updates.primaryColor = primaryColor;
      }
      if (heroTitle && typeof heroTitle === 'string') {
        updates.heroTitle = heroTitle;
      }
      
      if (Object.keys(updates).length > 0) {
        setConfig(prev => ({ ...prev, ...updates }));
      }
    }
  }, []);

  const exportConfig = useCallback(() => {
    return btoa(JSON.stringify(config));
  }, [config]);

  const importConfig = useCallback((configJson: string) => {
    try {
      const parsed = JSON.parse(configJson);
      // Validate the parsed config structure
      if (typeof parsed === 'object' && parsed !== null) {
        // Basic validation for required fields
        const validatedConfig: Partial<WhitelabelConfig> = {};
        
        if (parsed.companyName && typeof parsed.companyName === 'string') {
          validatedConfig.companyName = parsed.companyName;
        }
        if (parsed.primaryColor && typeof parsed.primaryColor === 'string' && /^#[0-9A-F]{6}$/i.test(parsed.primaryColor)) {
          validatedConfig.primaryColor = parsed.primaryColor;
        }
        if (parsed.secondaryColor && typeof parsed.secondaryColor === 'string' && /^#[0-9A-F]{6}$/i.test(parsed.secondaryColor)) {
          validatedConfig.secondaryColor = parsed.secondaryColor;
        }
        if (parsed.heroTitle && typeof parsed.heroTitle === 'string') {
          validatedConfig.heroTitle = parsed.heroTitle;
        }
        if (parsed.heroSubtitle && typeof parsed.heroSubtitle === 'string') {
          validatedConfig.heroSubtitle = parsed.heroSubtitle;
        }
        if (Array.isArray(parsed.ctaButtons)) {
          validatedConfig.ctaButtons = parsed.ctaButtons.filter(button => 
            button && typeof button === 'object' && button.text && button.url
          );
        }
        
        setConfig(prev => ({ ...prev, ...validatedConfig }));
      } else {
        throw new Error('Configuration must be a valid object');
      }
    } catch (error) {
      console.error('Error importing whitelabel config:', error);
      throw new Error('Invalid configuration format: ' + (error instanceof Error ? error.message : 'Unknown error'));
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