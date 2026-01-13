import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WhitelabelConfig, WhitelabelContextType, DEFAULT_WHITELABEL_CONFIG } from '../types/whitelabel';

const WhitelabelContext = createContext<WhitelabelContextType | undefined>(undefined);

const STORAGE_KEY = 'whitelabel_config';

export const useWhitelabel = () => {
  const context = useContext(WhitelabelContext);
  if (!context) {
    // Return a fallback context with default config and no-op functions
    return {
      config: DEFAULT_WHITELABEL_CONFIG,
      updateConfig: () => {},
      resetToDefault: () => {},
      loadFromUrl: () => {},
      exportConfig: () => btoa(JSON.stringify(DEFAULT_WHITELABEL_CONFIG)),
      importConfig: () => {}
    };
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
      const configString = JSON.stringify(config);
      // Check size limit (5KB for localStorage)
      if (configString.length > 5120) {
        console.warn('Whitelabel config too large for localStorage, skipping save');
        return;
      }
      localStorage.setItem(STORAGE_KEY, configString);
    } catch (error) {
      console.error('Error saving whitelabel config:', error);
      // Could show user notification here if needed
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
      if (companyName && typeof companyName === 'string' && companyName.length <= 100) {
        updates.companyName = companyName;
      }
      if (primaryColor && typeof primaryColor === 'string' && /^#[0-9A-F]{6}$/i.test(primaryColor)) {
        updates.primaryColor = primaryColor;
      }
      if (heroTitle && typeof heroTitle === 'string' && heroTitle.length <= 200) {
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

  const importConfig = useCallback((configString: string) => {
    try {
      // Size limit check (10KB)
      if (configString.length > 10240) {
        throw new Error('Configuration too large');
      }

      let jsonString: string;
      // Try to decode as base64 first, fallback to plain JSON
      try {
        jsonString = atob(configString);
        // Validate it's valid JSON after decoding
        JSON.parse(jsonString);
      } catch {
        // If base64 decoding fails, treat as plain JSON
        jsonString = configString;
      }
      const parsed = JSON.parse(jsonString);
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
        if (parsed.logoUrl && typeof parsed.logoUrl === 'string') {
          try {
            const url = new URL(parsed.logoUrl);
            if (url.protocol === 'https:') {
              validatedConfig.logoUrl = parsed.logoUrl;
            }
          } catch {
            // Invalid URL, skip
          }
        }
        if (Array.isArray(parsed.ctaButtons)) {
          validatedConfig.ctaButtons = parsed.ctaButtons.filter((button: any) =>
            button && typeof button === 'object' && button.text && button.url
          );
        }

        // NEW: Validate dashboard sections
        if (parsed.dashboardSections && typeof parsed.dashboardSections === 'object') {
          validatedConfig.dashboardSections = {};
          for (const [key, section] of Object.entries(parsed.dashboardSections)) {
            if (section && typeof section === 'object' && 'title' in section && 'description' in section) {
              const sec = section as any;
              validatedConfig.dashboardSections[key] = {
                title: String(sec.title).substring(0, 100),
                description: String(sec.description).substring(0, 200),
                icon: String(sec.icon || 'Settings'),
                enabled: Boolean(sec.enabled !== false),
                customColor: sec.customColor && /^#[0-9A-F]{6}$/i.test(sec.customColor) ? sec.customColor : undefined
              };
            }
          }
        }

        // NEW: Validate custom KPIs
        if (Array.isArray(parsed.customKPIs)) {
          validatedConfig.customKPIs = parsed.customKPIs.filter((kpi: any) =>
            kpi && typeof kpi === 'object' && kpi.label && kpi.description
          ).map((kpi: any) => ({
            id: String(kpi.id || `kpi_${Date.now()}`),
            label: String(kpi.label).substring(0, 50),
            description: String(kpi.description).substring(0, 100),
            icon: String(kpi.icon || 'BarChart3'),
            color: kpi.color && /^#[0-9A-F]{6}$/i.test(kpi.color) ? kpi.color : '#3B82F6',
            enabled: Boolean(kpi.enabled !== false)
          }));
        }

        // NEW: Validate navigation items
        if (Array.isArray(parsed.navigationItems)) {
          validatedConfig.navigationItems = parsed.navigationItems.filter((item: any) =>
            item && typeof item === 'object' && item.label
          ).map((item: any) => ({
            id: String(item.id || `nav_${Date.now()}`),
            label: String(item.label).substring(0, 50),
            icon: item.icon ? String(item.icon) : undefined,
            enabled: Boolean(item.enabled !== false),
            customUrl: item.customUrl && typeof item.customUrl === 'string' ? item.customUrl : undefined
          }));
        }

        // NEW: Validate email templates
        if (Array.isArray(parsed.emailTemplates)) {
          validatedConfig.emailTemplates = parsed.emailTemplates.filter((template: any) =>
            template && typeof template === 'object' && template.subject
          ).map((template: any) => ({
            type: ['welcome', 'notification', 'report', 'invoice'].includes(template.type) ? template.type : 'notification',
            subject: String(template.subject).substring(0, 100),
            headerColor: template.headerColor && /^#[0-9A-F]{6}$/i.test(template.headerColor) ? template.headerColor : '#3B82F6',
            footerText: String(template.footerText || '').substring(0, 500),
            signature: String(template.signature || '').substring(0, 200),
            enabled: Boolean(template.enabled !== false)
          }));
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