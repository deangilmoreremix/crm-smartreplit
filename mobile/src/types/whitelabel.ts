// White Label Types for Mobile App

export interface WhitelabelButton {
  id: string;
  text: string;
  url: string;
  color?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  enabled: boolean;
}

export interface NavigationTab {
  name: string;
  icon: string;
  route: string;
}

export interface WhitelabelConfig {
  // App Identity
  app: {
    name: string;
    displayName: string;
    bundleId: string;
    packageName: string;
    version: string;
    buildNumber: string;
  };

  // Branding
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    logo?: string;
    icon?: string;
    splash?: string;
    favicon?: string;
  };

  // Typography
  typography: {
    fontFamily: string;
    headingFont: string;
    bodyFont: string;
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
      '4xl': number;
    };
  };

  // Navigation
  navigation: {
    tabs: NavigationTab[];
    headerStyle: 'gradient' | 'solid' | 'transparent';
    showTabLabels: boolean;
  };

  // Features
  features: {
    aiAssistant: boolean;
    analytics: boolean;
    notifications: boolean;
    offlineMode: boolean;
    multiLanguage: boolean;
    darkMode: boolean;
    biometrics: boolean;
    pushNotifications: boolean;
  };

  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };

  // Third-party Services
  services: {
    supabase: {
      url?: string;
      anonKey?: string;
    };
    analytics: {
      enabled: boolean;
      provider: string;
      apiKey?: string;
    };
    crashReporting: {
      enabled: boolean;
      provider: string;
      dsn?: string;
    };
  };

  // UI Components
  components: {
    buttons: {
      primary: {
        backgroundColor: string;
        textColor: string;
        borderRadius: number;
        height: number;
      };
      secondary: {
        backgroundColor: string;
        textColor: string;
        borderColor?: string;
        borderWidth?: number;
        borderRadius: number;
        height: number;
      };
    };
    cards: {
      backgroundColor: string;
      borderRadius: number;
      shadowColor: string;
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    inputs: {
      borderColor: string;
      borderRadius: number;
      height: number;
      paddingHorizontal: number;
    };
  };

  // Screens Configuration
  screens: {
    login: {
      showLogo: boolean;
      showTagline: boolean;
      tagline: string;
      backgroundImage?: string;
      showSocialLogin: boolean;
    };
    dashboard: {
      showWelcomeMessage: boolean;
      welcomeMessage: string;
      showQuickActions: boolean;
      quickActions: Array<{
        title: string;
        icon: string;
        route: string;
      }>;
    };
    onboarding: {
      steps: Array<{
        title: string;
        description: string;
        image?: string;
      }>;
    };
  };

  // Localization
  localization: {
    defaultLanguage: string;
    supportedLanguages: string[];
    rtlLanguages: string[];
  };

  // Theme Configuration
  themes: {
    light: {
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      error: string;
      success: string;
      warning: string;
    };
    dark: {
      background: string;
      surface: string;
      text: string;
      textSecondary: string;
      border: string;
      error: string;
      success: string;
      warning: string;
    };
  };

  // Build Configuration
  build: {
    development: {
      apiUrl: string;
      enableDevTools: boolean;
      enableLogging: boolean;
    };
    staging: {
      apiUrl: string;
      enableDevTools: boolean;
      enableLogging: boolean;
    };
    production: {
      apiUrl: string;
      enableDevTools: boolean;
      enableLogging: boolean;
    };
  };
}