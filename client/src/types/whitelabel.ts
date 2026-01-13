export interface WhitelabelButton {
  id: string;
  text: string;
  url: string;
  color?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  enabled: boolean;
}

export interface DashboardSectionConfig {
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
  customColor?: string;
}

export interface NavigationItemConfig {
  id: string;
  label: string;
  icon?: string;
  enabled: boolean;
  customUrl?: string;
}

export interface EmailTemplateConfig {
  type: 'welcome' | 'notification' | 'report' | 'invoice';
  subject: string;
  headerColor: string;
  footerText: string;
  signature: string;
  enabled: boolean;
}

export interface CustomKPIConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
}

export interface OnboardingStepConfig {
  id: string;
  title: string;
  description: string;
  content: string;
  enabled: boolean;
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration: number;
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

  // NEW: Dashboard customization
  dashboardSections: Record<string, DashboardSectionConfig>;
  customKPIs: CustomKPIConfig[];

  // NEW: Navigation customization
  navigationItems: NavigationItemConfig[];
  customMenuItems: NavigationItemConfig[];

  // NEW: Email customization
  emailTemplates: EmailTemplateConfig[];

  // NEW: Onboarding customization
  onboardingSteps: OnboardingStepConfig[];

  // NEW: Notification customization
  notifications: NotificationConfig[];

  // NEW: Feature management
  featureOverrides: Record<string, boolean>;

  // NEW: Advanced branding
  faviconUrl?: string;
  customCss?: string;
  fontFamily?: string;
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
  showFeatures: true,

  // NEW: Dashboard customization defaults
  dashboardSections: {},
  customKPIs: [],

  // NEW: Navigation customization defaults
  navigationItems: [],
  customMenuItems: [],

  // NEW: Email customization defaults
  emailTemplates: [],

  // NEW: Onboarding customization defaults
  onboardingSteps: [],

  // NEW: Notification customization defaults
  notifications: [],

  // NEW: Feature management defaults
  featureOverrides: {},

  // NEW: Advanced branding defaults
  faviconUrl: undefined,
  customCss: undefined,
  fontFamily: undefined
};