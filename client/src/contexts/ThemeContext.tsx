import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void; 
  isThemeChanging: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window === 'undefined') {
      return false;
    }

    // TEMPORARY FIX: Force light mode startup - clear any existing dark mode in localStorage
    localStorage.removeItem('theme');
    localStorage.removeItem('darkMode');
    localStorage.setItem('theme', 'light');
    localStorage.setItem('darkMode', 'false');

    // Always start in light mode
    return false;
  });

  // Add a state to track theme transitions
  const [isThemeChanging, setIsThemeChanging] = useState(false);

  // Broadcast theme changes to iframes for white label apps
  const broadcastThemeToIframes = useCallback((theme: string) => {
    // Send message to all iframes
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage({
          type: 'WL_THEME_CHANGE',
          theme: theme
        }, '*');
      } catch (error) {
        // Ignore cross-origin errors
      }
    });

    // Also dispatch a custom event for any listening components
    window.dispatchEvent(new CustomEvent('wl-theme-change', {
      detail: { theme }
    }));
  }, []);

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    
    // Apply theme classes to both documentElement and body for maximum compatibility
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
    
    // Save to localStorage with both keys for compatibility
    localStorage.setItem('theme', theme);
    localStorage.setItem('darkMode', isDark.toString());
    
    // Broadcast to iframes
    broadcastThemeToIframes(theme);
    
    // Update meta theme-color for mobile browsers
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    
    themeColorMeta.setAttribute(
      'content', 
      isDark ? '#0f172a' : '#ffffff'
    );
  }, [isDark, broadcastThemeToIframes]);

  // Helper to handle theme transition state
  const handleThemeChange = useCallback(() => {
    setIsThemeChanging(true);
    setIsDark(prev => !prev);
    
    // Reset the transition state after animation completes
    setTimeout(() => setIsThemeChanging(false), 300);
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, isThemeChanging }}>
      {children}
    </ThemeContext.Provider>
  );
};