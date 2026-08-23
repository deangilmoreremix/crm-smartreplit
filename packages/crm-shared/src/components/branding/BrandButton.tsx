import React from 'react';
import { type BrandConfig, type BrandButtonVariant } from '../types';

export interface BrandButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  config: BrandConfig;
  /** Override the variant; defaults to 'primary'. */
  variant?: BrandButtonVariant;
  /** Optional explicit label; otherwise derived from children. */
  label?: string;
  /** Target URL; if omitted the button renders as a non-link button. */
  href?: string;
  fullWidth?: boolean;
}

function variantStyles(variant: BrandButtonVariant, config: BrandConfig): React.CSSProperties {
  const primary = config.primaryColor;
  const secondary = config.secondaryColor;

  switch (variant) {
    case 'secondary':
      return {
        backgroundImage: `linear-gradient(135deg, ${secondary}, ${primary})`,
        color: '#ffffff',
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        color: primary,
        borderColor: primary,
      };
    case 'primary':
    default:
      return {
        backgroundImage: `linear-gradient(135deg, ${primary}, ${secondary})`,
        color: '#ffffff',
        borderColor: 'transparent',
      };
  }
}

/**
 * Brand-aware button. Styling is driven by the config's primary/secondary
 * colors via an inline gradient. Renders as an anchor when `href` is set,
 * otherwise a <button>.
 */
export const BrandButton: React.FC<BrandButtonProps> = ({
  config,
  variant = 'primary',
  label,
  href,
  fullWidth,
  className,
  children,
  style,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  const widthClass = fullWidth ? 'w-full' : '';
  const mergedStyle: React.CSSProperties = {
    ...variantStyles(variant, config),
    ...style,
  };

  const content = children ?? label;

  if (href) {
    return (
      <a
        href={href}
        className={`${base} ${widthClass} ${className ?? ''}`}
        style={mergedStyle}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`${base} ${widthClass} ${className ?? ''}`}
      style={mergedStyle}
      role="button"
      {...props}
    >
      {content}
    </button>
  );
};
