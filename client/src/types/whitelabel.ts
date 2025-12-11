export interface WhitelabelButton {
  id: string;
  text: string;
  url: string;
  color?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  enabled: boolean;
}

export interface WhitelabelConfig {
  // Branding
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;

  // Landing page customizations
  heroTitle: string;
  heroSubtitle: string;
  ctaButtons: WhitelabelButton[];

  // Link redirects
  redirectMappings: Record<string, string>;

  // Feature toggles
  showPricing: boolean;
  showTestimonials: boolean;
  showFeatures: boolean;

  // Contact info
  supportEmail?: string;
  supportPhone?: string;

  // Analytics
  trackingId?: string;
}

export interface WhitelabelContextType {
  config: WhitelabelConfig;
  updateConfig: (updates: Partial<WhitelabelConfig>) => void;
  resetToDefault: () => void;
  loadFromUrl: (urlParams: URLSearchParams) => void;
  exportConfig: () => string;
  importConfig: (configJson: string) => void;
}

export const DEFAULT_WHITELABEL_CONFIG: WhitelabelConfig = {
  companyName: 'Smart CRM',
  primaryColor: '#3B82F6',
  secondaryColor: '#6366F1',
  heroTitle: 'Transform Your Sales Process with AI',
  heroSubtitle: 'Smart CRM combines powerful sales tools with advanced AI capabilities to streamline your workflow and boost your results.',
  ctaButtons: [
    {
      id: 'trial',
      text: 'Start Your Free Trial',
      url: '/dashboard',
      color: '#3B82F6',
      variant: 'primary',
      enabled: true
    },
    {
      id: 'demo',
      text: 'Go to Dashboard',
      url: '/dashboard',
      color: '#10B981',
      variant: 'secondary',
      enabled: true
    }
  ],
  redirectMappings: {},
  showPricing: true,
  showTestimonials: true,
  showFeatures: true
};