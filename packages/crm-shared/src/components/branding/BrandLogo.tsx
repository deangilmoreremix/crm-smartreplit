import React, { useState } from 'react';
import { type BrandConfig } from '../types';

export interface BrandLogoProps {
  config: BrandConfig;
  /** Pixel height of the logo. Width auto-scales. */
  height?: number;
  className?: string;
  /** When provided, overrides config.companyName for the text fallback. */
  alt?: string;
}

function getInitials(companyName: string): string {
  const words = companyName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Renders the brand logo image, falling back to the company initials when no
 * logoUrl is provided or the image fails to load.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  config,
  height = 40,
  className,
  alt,
}) => {
  const [errored, setErrored] = useState(false);
  const label = alt ?? config.companyName;
  const showImage = config.logoUrl && !errored;

  if (showImage) {
    return (
      <img
        src={config.logoUrl}
        alt={label}
        style={{ height }}
        className={className}
        onError={() => setErrored(true)}
      />
    );
  }

  return (
    <span
      style={{ height, minWidth: height, lineHeight: `${height}px` }}
      className={
        'inline-flex items-center justify-center rounded-md px-2 font-semibold text-white ' +
        (className ?? '')
      }
    >
      <span style={{ fontSize: Math.max(12, Math.round(height * 0.4)) }}>
        {getInitials(label)}
      </span>
    </span>
  );
};
