import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useWhitelabel } from './WhitelabelContext';

interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  primary: string;
  secondary: string;
}

interface Theme {
  isDark: boolean;
  colors: ThemeColors;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => Promise<void>;
  setTheme: (isDark: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { config } = useWhitelabel();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (stored !== null) {
          setIsDark(JSON.parse(stored));
        } else {
          // Use system preference if no stored preference
          const systemTheme = Appearance.getColorScheme();
          setIsDark(systemTheme === 'dark');
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to system preference
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if user hasn't set a preference
      AsyncStorage.getItem(THEME_STORAGE_KEY).then(stored => {
        if (stored === null) {
          setIsDark(colorScheme === 'dark');
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newIsDark));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setTheme = async (newIsDark: boolean) => {
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(newIsDark));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Build theme object based on current mode and whitelabel config
  const theme: Theme = {
    isDark,
    colors: {
      background: isDark ? config.themes.dark.background : config.themes.light.background,
      surface: isDark ? config.themes.dark.surface : config.themes.light.surface,
      text: isDark ? config.themes.dark.text : config.themes.light.text,
      textSecondary: isDark ? config.themes.dark.textSecondary : config.themes.light.textSecondary,
      border: isDark ? config.themes.dark.border : config.themes.light.border,
      error: isDark ? config.themes.dark.error : config.themes.light.error,
      success: isDark ? config.themes.dark.success : config.themes.light.success,
      warning: isDark ? config.themes.dark.warning : config.themes.light.warning,
      primary: config.branding.primaryColor,
      secondary: config.branding.secondaryColor,
    },
  };

  if (loading) {
    return null; // Or a loading component
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};