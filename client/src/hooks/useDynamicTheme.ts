import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ThemePreset,
  ThemePresetConfig,
  THEME_PRESETS,
  injectCSSVariables,
  removeCSSVariables,
  injectCustomCSS,
  removeCustomCSS,
  setFontFamily,
  getStoredFontFamily,
  getStoredCustomCSS,
  applyThemePreset,
  getStoredThemePreset,
  getBreakpoint,
  getBreakpointVariables,
  listenToBreakpointChanges,
  listenToSystemThemeChanges,
  initializeTheme,
} from '../services/themeService';

interface UseDynamicThemeReturn {
  preset: ThemePreset;
  setPreset: (preset: ThemePreset) => void;
  presets: ThemePresetConfig[];
  applyTheme: (variables: Record<string, string>, options?: { smooth?: boolean }) => void;
  setFontFamily: (fontFamily: string) => void;
  setCustomCSS: (css: string) => void;
  clearCustomCSS: () => void;
  breakpoint: ReturnType<typeof getBreakpoint>;
  fontFamily: string | null;
  customCSS: string | null;
  isSystemDark: boolean;
}

export const useDynamicTheme = (): UseDynamicThemeReturn => {
  const [preset, setPresetState] = useState<ThemePreset>(() => getStoredThemePreset());
  const [fontFamily, setFontFamilyState] = useState<string | null>(() => getStoredFontFamily());
  const [customCSS, setCustomCSSState] = useState<string | null>(() => getStoredCustomCSS());
  const [breakpoint, setBreakpoint] = useState<ReturnType<typeof getBreakpoint>>(() => getBreakpoint());
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    const unsubBreakpoint = listenToBreakpointChanges(() => {
      setBreakpoint(getBreakpoint());
      injectCSSVariables(getBreakpointVariables());
    });
    const unsubSystem = listenToSystemThemeChanges((theme) => {
      setIsSystemDark(theme === 'dark');
    });
    return () => {
      unsubBreakpoint();
      unsubSystem();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    try {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  const setPreset = useCallback((newPreset: ThemePreset) => {
    setPresetState(newPreset);
    applyThemePreset(newPreset, { smooth: true });
  }, []);

  const applyTheme = useCallback((variables: Record<string, string>, options?: { smooth?: boolean }) => {
    const smooth = options?.smooth ?? true;
    const root = document.documentElement;
    if (smooth) {
      root.style.setProperty('transition', 'background-color 300ms ease, color 300ms ease, border-color 300ms ease, box-shadow 300ms ease');
      setTimeout(() => {
        root.style.removeProperty('transition');
      }, 350);
    }
    injectCSSVariables(variables);
  }, []);

  const setFontFamilyWrapper = useCallback((newFontFamily: string) => {
    setFontFamilyState(newFontFamily);
    setFontFamily(newFontFamily);
  }, []);

  const setCustomCSSWrapper = useCallback((css: string) => {
    setCustomCSSState(css);
    injectCustomCSS(css);
    try {
      localStorage.setItem('theme_custom_css', css);
    } catch {
      // ignore
    }
  }, []);

  const clearCustomCSS = useCallback(() => {
    setCustomCSSState(null);
    removeCustomCSS();
    try {
      localStorage.removeItem('theme_custom_css');
    } catch {
      // ignore
    }
  }, []);

  const presets = useMemo(() => Object.values(THEME_PRESETS), []);

  return {
    preset,
    setPreset,
    presets,
    applyTheme,
    setFontFamily: setFontFamilyWrapper,
    setCustomCSS: setCustomCSSWrapper,
    clearCustomCSS,
    breakpoint,
    fontFamily,
    customCSS,
    isSystemDark,
  };
};
