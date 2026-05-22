import React, { createContext, useContext, useEffect, useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo?: string;
    companyName: string;
  };
  features: {
    aiTools: boolean;
    advancedAnalytics: boolean;
    customIntegrations: boolean;
    userLimit: number;
    storageLimit: number;
  };
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
}

interface TenantContextType {
  tenant: Tenant | null;
  isLoading: boolean;
  hasFeature: (feature: keyof Tenant['features']) => boolean;
  applyBranding: () => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

/**
 * Names that originate from the Module Federation remote registry and must
 * never be propagated as a tenant's visual branding via CSS variables.
 */
const BLOCKED_BRAND_NAMES = ['AI Agency Suite', 'bytealign', 'ByteAlign'];

const isBlocked = (name: string | undefined) => {
  if (!name) return false;
  return BLOCKED_BRAND_NAMES.some(
    (b) => name.trim().toLowerCase().replace(/\s+/g, '') === b.toLowerCase().replace(/\s+/g, '')
  );
};

/**
 * Sanitise a branding object so that rogue MF-remote registry names cannot
 * leak into CSS custom properties or the document title.
 */
const sanitiseBranding = (branding: Tenant['branding']): Tenant['branding'] => {
  if (isBlocked(branding.companyName)) {
    console.warn(
      `[TenantProvider] Blocked blocked brand name "${branding.companyName}" from tenant branding. ` +
        `The "AI Agency Suite" brand is exclusive to the Agency MFE remote; ` +
        `reverting to SmartCRM defaults for tenant-level branding.`
    );
    return {
      ...branding,
      companyName: 'SmartCRM',
    };
  }
  return branding;
};

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  const fetchTenantInfo = async () => {
    try {
      setIsLoading(true);

      // Extract tenant ID from various sources
      const tenantId = getTenantIdFromEnvironment();

      if (tenantId) {
        const response = await fetch('/api/tenant/info', {
          headers: {
            'X-Tenant-ID': tenantId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTenant(data.tenant);

          // Apply branding immediately after fetching
          if (data.tenant) {
            applyTenantBranding(data.tenant);
          }
        } else {
          // Silently handle non-200 responses without logging errors
          // This prevents console spam during development
          console.debug('Tenant info not available:', response.status);
        }
      }
    } catch (error) {
      // Only log significant errors, not network failures during development
      console.debug(
        'Tenant info fetch skipped:',
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getTenantIdFromEnvironment = (): string | null => {
    // Method 1: From subdomain
    const hostname = window.location.hostname;
    const subdomain = hostname.split('.')[0];

    if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
      return subdomain;
    }

    // Method 2: From URL params (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const tenantParam = urlParams.get('tenant');
    if (tenantParam) {
      return tenantParam;
    }

    // Method 3: From localStorage (for development)
    const storedTenant = localStorage.getItem('tenantId');
    if (storedTenant) {
      return storedTenant;
    }

    return null;
  };

  const hasFeature = (feature: keyof Tenant['features']): boolean => {
    if (!tenant) return false;
    return Boolean(tenant.features[feature]);
  };

  const applyTenantBranding = (tenantData: Tenant) => {
    // CRITICAL: sanitise tenant branding before applying it globally.
    // "AI Agency Suite" originates from the remote registry name in RemoteRegistry.ts
    // and must never appear as CSS branding on the SmartCRM landing page.
    const safeBranding = sanitiseBranding(tenantData.branding);
    const root = document.documentElement;

    // Apply custom CSS variables for branding
    root.style.setProperty('--primary-color', safeBranding.primaryColor);
    root.style.setProperty('--secondary-color', safeBranding.secondaryColor);

    // Update document title using sanitized brand name
    document.title = `${safeBranding.companyName} - Smart CRM`;

    // Update favicon if custom logo exists
    if (safeBranding.logo) {
      updateFavicon(safeBranding.logo);
    }
  };

  const updateFavicon = (logoUrl: string) => {
    const link =
      (document.querySelector("link[rel*='icon']") as HTMLLinkElement) ||
      document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = logoUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
  };

  const applyBranding = () => {
    if (tenant) {
      applyTenantBranding(tenant);
    }
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        isLoading,
        hasFeature,
        applyBranding,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
