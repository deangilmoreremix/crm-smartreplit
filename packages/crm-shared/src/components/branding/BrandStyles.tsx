import React from 'react';
import { type BrandConfig } from '../types';

/**
 * Map a BrandConfig to CSS custom properties. The returned object can be
 * spread onto a `style` prop to apply brand colors and font to a subtree.
 */
function brandCssVars(config: BrandConfig): React.CSSProperties {
  const vars: Record<string, string> = {
    '--wl-primary-color': config.primaryColor,
    '--wl-secondary-color': config.secondaryColor,
  };

  if (config.fontFamily) {
    vars['--wl-font-family'] = config.fontFamily;
  }

  return vars as React.CSSProperties;
}

/**
 * Imperatively applies a BrandConfig as CSS custom properties (and optional
 * font-family) onto a DOM element. Defaults to `document.documentElement`
 * when no target is supplied, so brand tokens become globally available.
 *
 * Note: customCss is intentionally NOT injected here — it is only rendered by
 * the <BrandStyles> component inside a scoped <style> element.
 */
export function applyBrandStyles(config: BrandConfig, target?: HTMLElement): void {
  const el = target ?? (typeof document !== 'undefined' ? document.documentElement : undefined);
  if (!el) return;

  el.style.setProperty('--wl-primary-color', config.primaryColor);
  el.style.setProperty('--wl-secondary-color', config.secondaryColor);

  if (config.fontFamily) {
    el.style.setProperty('--wl-font-family', config.fontFamily);
    el.style.fontFamily = 'var(--wl-font-family)';
  }
}

export interface BrandStylesProps {
  config: BrandConfig;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Wrapper component that applies the brand config to a scoped subtree via
 * CSS custom properties and renders children inside it. When `config.customCss`
 * is provided it is injected as a raw <style> child — React escapes the string
 * content safely (no dangerouslySetInnerHTML / untrusted interpolation).
 */
export const BrandStyles: React.FC<BrandStylesProps> = ({ config, children, className }) => {
  const style = brandCssVars(config);

  return (
    <div className={className} style={style}>
      {config.customCss ? <style>{config.customCss}</style> : null}
      {children}
    </div>
  );
};
