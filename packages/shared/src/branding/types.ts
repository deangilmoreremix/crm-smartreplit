export interface BrandingConfig {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  logo?: string;
  darkMode?: boolean;
  faviconUrl?: string;
  fontFamily?: string;
}

export interface TenantBranding {
  tenantId: string;
  branding: BrandingConfig;
  customDomain?: string;
  subdomain?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelSettings {
  enabled: boolean;
  allowCustomLogo: boolean;
  allowCustomColors: boolean;
  allowCustomDomain: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  companyName: 'SmartCRM',
  primaryColor: '#3B82F6',
  secondaryColor: '#6366F1',
  logo: undefined,
  darkMode: false,
};

export const DEFAULT_WHITE_LABEL_SETTINGS: WhiteLabelSettings = {
  enabled: true,
  allowCustomLogo: true,
  allowCustomColors: true,
  allowCustomDomain: true,
  maxFileSize: 5242880,
  allowedFileTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
};
