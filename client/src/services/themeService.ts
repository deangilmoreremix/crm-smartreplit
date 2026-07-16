import { useEffect, useRef, useState } from 'react';

export type ThemePreset = 'light' | 'dark' | 'high-contrast' | 'system';

export interface ThemePresetConfig {
  name: string;
  variables: Record<string, string>;
  className?: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemePresetConfig> = {
  light: {
    name: 'Light',
    variables: {
      '--wl-background': '#ffffff',
      '--wl-foreground': '#0f172a',
      '--wl-card': '#f8fafc',
      '--wl-card-foreground': '#0f172a',
      '--wl-primary': '#3b82f6',
      '--wl-primary-foreground': '#ffffff',
      '--wl-secondary': '#f1f5f9',
      '--wl-secondary-foreground': '#0f172a',
      '--wl-accent': '#e2e8f0',
      '--wl-accent-foreground': '#0f172a',
      '--wl-muted': '#f1f5f9',
      '--wl-muted-foreground': '#64748b',
      '--wl-border': '#e2e8f0',
      '--wl-input': '#e2e8f0',
      '--wl-ring': '#3b82f6',
    },
  },
  dark: {
    name: 'Dark',
    variables: {
      '--wl-background': '#0f172a',
      '--wl-foreground': '#f8fafc',
      '--wl-card': '#1e293b',
      '--wl-card-foreground': '#f8fafc',
      '--wl-primary': '#60a5fa',
      '--wl-primary-foreground': '#0f172a',
      '--wl-secondary': '#334155',
      '--wl-secondary-foreground': '#f8fafc',
      '--wl-accent': '#334155',
      '--wl-accent-foreground': '#f8fafc',
      '--wl-muted': '#334155',
      '--wl-muted-foreground': '#94a3b8',
      '--wl-border': '#334155',
      '--wl-input': '#334155',
      '--wl-ring': '#60a5fa',
    },
  },
  'high-contrast': {
    name: 'High Contrast',
    variables: {
      '--wl-background': '#000000',
      '--wl-foreground': '#ffffff',
      '--wl-card': '#000000',
      '--wl-card-foreground': '#ffffff',
      '--wl-primary': '#ffff00',
      '--wl-primary-foreground': '#000000',
      '--wl-secondary': '#1a1a1a',
      '--wl-secondary-foreground': '#ffffff',
      '--wl-accent': '#1a1a1a',
      '--wl-accent-foreground': '#ffffff',
      '--wl-muted': '#1a1a1a',
      '--wl-muted-foreground': '#ffffff',
      '--wl-border': '#ffffff',
      '--wl-input': '#ffffff',
      '--wl-ring': '#ffff00',
    },
  },
  system: {
    name: 'System',
    variables: {},
  },
};

const STORAGE_KEY = 'theme_preset';
const FONT_STORAGE_KEY = 'theme_font_family';
const CUSTOM_CSS_STORAGE_KEY = 'theme_custom_css';

export const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const getSystemContrast = (): 'normal' | 'high' => {
  if (typeof window === 'undefined') return 'normal';
  return window.matchMedia('(prefers-contrast: more)').matches ? 'high' : 'normal';
};

export const getBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
  if (typeof window === 'undefined') return 'md';
  const width = window.innerWidth;
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
};

export const getBreakpointVariables = (): Record<string, string> => {
  const bp = getBreakpoint();
  return {
    '--wl-breakpoint': bp,
    '--wl-breakpoint-xs': bp === 'xs' ? '1' : '0',
    '--wl-breakpoint-sm': bp === 'sm' ? '1' : '0',
    '--wl-breakpoint-md': bp === 'md' ? '1' : '0',
    '--wl-breakpoint-lg': bp === 'lg' ? '1' : '0',
    '--wl-breakpoint-xl': bp === 'xl' ? '1' : '0',
    '--wl-breakpoint-2xl': bp === '2xl' ? '1' : '0',
  };
};

export const injectCSSVariables = (variables: Record<string, string>): void => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export const removeCSSVariables = (variables: Record<string, string>): void => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  Object.keys(variables).forEach((key) => {
    root.style.removeProperty(key);
  });
};

export const injectCustomCSS = (css: string): void => {
  if (typeof window === 'undefined') return;
  let styleEl = document.getElementById('dynamic-theme-css') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-css';
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css;
};

export const removeCustomCSS = (): void => {
  if (typeof window === 'undefined') return;
  const styleEl = document.getElementById('dynamic-theme-css');
  if (styleEl) {
    styleEl.remove();
  }
};

export const setFontFamily = (fontFamily: string): void => {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty('--wl-font-family', fontFamily);
  try {
    localStorage.setItem(FONT_STORAGE_KEY, fontFamily);
  } catch {
    // Storage full or unavailable
  }
};

export const getStoredFontFamily = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(FONT_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const getStoredCustomCSS = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CUSTOM_CSS_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const applyThemePreset = (preset: ThemePreset, options: { smooth?: boolean } = {}): void => {
  const { smooth = true } = options;
  const root = document.documentElement;

  if (smooth) {
    root.style.setProperty('transition', 'background-color 300ms ease, color 300ms ease, border-color 300ms ease, box-shadow 300ms ease');
    setTimeout(() => {
      root.style.removeProperty('transition');
    }, 350);
  }

  if (preset === 'system') {
    const systemTheme = getSystemTheme();
    const contrast = getSystemContrast();
    const resolvedPreset = contrast === 'high' ? 'high-contrast' : systemTheme;
    const config = THEME_PRESETS[resolvedPreset];
    injectCSSVariables(config.variables);
    if (resolvedPreset === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  } else {
    const config = THEME_PRESETS[preset];
    injectCSSVariables(config.variables);
    if (preset === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  injectCSSVariables(getBreakpointVariables());

  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    // Storage full or unavailable
  }
};

export const getStoredThemePreset = (): ThemePreset => {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in THEME_PRESETS) {
      return stored as ThemePreset;
    }
  } catch {
    // Storage unavailable
  }
  return 'light';
};

export const initializeTheme = (): void => {
  const preset = getStoredThemePreset();
  applyThemePreset(preset, { smooth: false });

  const storedFont = getStoredFontFamily();
  if (storedFont) {
    setFontFamily(storedFont);
  }

  const storedCSS = getStoredCustomCSS();
  if (storedCSS) {
    injectCustomCSS(storedCSS);
  }
};

export const listenToBreakpointChanges = (callback: () => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  let timeoutId: ReturnType<typeof setTimeout>;
  const handler = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(callback, 150);
  };
  window.addEventListener('resize', handler);
  return () => {
    clearTimeout(timeoutId);
    window.removeEventListener('resize', handler);
  };
};

export const listenToSystemThemeChanges = (callback: (theme: 'light' | 'dark') => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  try {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  } catch {
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }
};
