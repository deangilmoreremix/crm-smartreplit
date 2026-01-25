// White Label Configuration for SmartCRM Mobile App
// This file contains all customizable branding and configuration options

module.exports = {
  // App Identity
  app: {
    name: 'SmartCRM',
    displayName: 'Smart CRM',
    bundleId: 'com.smartcrm.mobile',
    packageName: 'com.smartcrm.mobile',
    version: '1.0.0',
    buildNumber: '1'
  },

  // Branding
  branding: {
    primaryColor: '#3B82F6',
    secondaryColor: '#6366F1',
    accentColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    logo: './assets/logo.png',
    icon: './assets/icon.png',
    splash: './assets/splash.png',
    favicon: './assets/favicon.png'
  },

  // Typography
  typography: {
    fontFamily: 'System',
    headingFont: 'System',
    bodyFont: 'System',
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36
    }
  },

  // Navigation
  navigation: {
    tabs: [
      { name: 'Dashboard', icon: 'home', route: 'Dashboard' },
      { name: 'Contacts', icon: 'users', route: 'Contacts' },
      { name: 'Deals', icon: 'dollar-sign', route: 'Deals' },
      { name: 'Settings', icon: 'settings', route: 'Settings' }
    ],
    headerStyle: 'gradient', // 'solid', 'gradient', 'transparent'
    showTabLabels: true
  },

  // Features
  features: {
    aiAssistant: true,
    analytics: true,
    notifications: true,
    offlineMode: true,
    multiLanguage: true,
    darkMode: true,
    biometrics: true,
    pushNotifications: true
  },

  // API Configuration
  api: {
    baseUrl: 'https://api.smartcrm.com',
    timeout: 30000,
    retryAttempts: 3
  },

  // Third-party Services
  services: {
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL,
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    },
    analytics: {
      enabled: true,
      provider: 'firebase', // 'firebase', 'segment', 'mixpanel'
      apiKey: process.env.EXPO_PUBLIC_ANALYTICS_KEY
    },
    crashReporting: {
      enabled: true,
      provider: 'sentry',
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN
    }
  },

  // UI Components
  components: {
    buttons: {
      primary: {
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        borderRadius: 8,
        height: 48
      },
      secondary: {
        backgroundColor: 'transparent',
        textColor: '#3B82F6',
        borderColor: '#3B82F6',
        borderWidth: 1,
        borderRadius: 8,
        height: 48
      }
    },
    cards: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2
    },
    inputs: {
      borderColor: '#D1D5DB',
      borderRadius: 8,
      height: 48,
      paddingHorizontal: 16
    }
  },

  // Screens Configuration
  screens: {
    login: {
      showLogo: true,
      showTagline: true,
      tagline: 'Transform Your Sales Process with AI',
      backgroundImage: './assets/login-bg.png',
      showSocialLogin: true
    },
    dashboard: {
      showWelcomeMessage: true,
      welcomeMessage: 'Welcome back!',
      showQuickActions: true,
      quickActions: [
        { title: 'Add Contact', icon: 'user-plus', route: 'AddContact' },
        { title: 'Create Deal', icon: 'plus-circle', route: 'CreateDeal' },
        { title: 'View Reports', icon: 'bar-chart', route: 'Reports' }
      ]
    },
    onboarding: {
      steps: [
        {
          title: 'Welcome',
          description: 'Get started with SmartCRM',
          image: './assets/onboarding-1.png'
        },
        {
          title: 'Connect Your Data',
          description: 'Import your contacts and deals',
          image: './assets/onboarding-2.png'
        },
        {
          title: 'Start Selling',
          description: 'Begin your AI-powered sales journey',
          image: './assets/onboarding-3.png'
        }
      ]
    }
  },

  // Localization
  localization: {
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
    rtlLanguages: ['ar', 'he']
  },

  // Theme Configuration
  themes: {
    light: {
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      error: '#EF4444',
      success: '#10B981',
      warning: '#F59E0B'
    },
    dark: {
      background: '#111827',
      surface: '#1F2937',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      border: '#374151',
      error: '#F87171',
      success: '#34D399',
      warning: '#FBBF24'
    }
  },

  // Build Configuration
  build: {
    development: {
      apiUrl: 'http://localhost:5000',
      enableDevTools: true,
      enableLogging: true
    },
    staging: {
      apiUrl: 'https://staging-api.smartcrm.com',
      enableDevTools: false,
      enableLogging: true
    },
    production: {
      apiUrl: 'https://api.smartcrm.com',
      enableDevTools: false,
      enableLogging: false
    }
  }
};