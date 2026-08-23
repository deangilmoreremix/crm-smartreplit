import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export interface ChartTheme {
  isDark: boolean;
  axis: string;
  grid: string;
  axisLine: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipLabel: string;
  tooltipText: string;
}

const LIGHT: Omit<ChartTheme, 'isDark'> = {
  axis: '#6B7280',
  grid: '#f0f0f0',
  axisLine: '#e0e0e0',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e5e7eb',
  tooltipLabel: '#374151',
  tooltipText: '#111827',
};

const DARK: Omit<ChartTheme, 'isDark'> = {
  axis: '#9CA3AF',
  grid: 'rgba(255,255,255,0.1)',
  axisLine: 'rgba(255,255,255,0.2)',
  tooltipBg: 'rgba(17, 24, 39, 0.9)',
  tooltipBorder: 'rgba(255, 255, 255, 0.1)',
  tooltipLabel: '#F3F4F6',
  tooltipText: '#F9FAFB',
};

function readDomDark(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Returns theme-aware colors for recharts. Prefers the app's `useTheme()`
 * context (`isDark`); falls back to the `dark` class on <html> when the
 * component is used outside the ThemeProvider.
 */
export function useChartTheme(): ChartTheme {
  let ctxDark: boolean | undefined;
  try {
    ctxDark = useTheme().isDark;
  } catch {
    ctxDark = undefined;
  }

  const [domDark, setDomDark] = useState<boolean>(readDomDark);

  useEffect(() => {
    if (ctxDark !== undefined) return;
    const observer = new MutationObserver(() => setDomDark(readDomDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [ctxDark]);

  const isDark = ctxDark ?? domDark;
  return { isDark, ...(isDark ? DARK : LIGHT) };
}

export const DEFAULT_SERIES_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
  '#84CC16',
];
