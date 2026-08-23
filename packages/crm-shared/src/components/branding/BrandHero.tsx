import React from 'react';
import { type BrandConfig } from '../types';
import { BrandLogo } from './BrandLogo';
import { BrandButton } from './BrandButton';

export interface BrandHeroProps {
  config: BrandConfig;
  logoHeight?: number;
  className?: string;
  /** Override the title; defaults to config.heroTitle. */
  title?: string;
  /** Override the subtitle; defaults to config.heroSubtitle. */
  subtitle?: string;
  /** Filter/override the CTA buttons rendered. */
  ctaButtons?: BrandConfig['ctaButtons'];
  showLogo?: boolean;
}

/**
 * Hero section driven by the brand config: company logo, hero title/subtitle,
 * and CTA buttons. Colors come from config.primaryColor/secondaryColor.
 */
export const BrandHero: React.FC<BrandHeroProps> = ({
  config,
  logoHeight = 56,
  className,
  title,
  subtitle,
  ctaButtons,
  showLogo = true,
}) => {
  const buttons = (ctaButtons ?? config.ctaButtons ?? []).filter((b) => b.enabled);

  return (
    <section
      className={`flex flex-col items-center gap-6 px-6 py-16 text-center ${className ?? ''}`}
      style={{
        backgroundImage: `linear-gradient(135deg, ${config.primaryColor}1A, ${config.secondaryColor}1A)`,
      }}
    >
      {showLogo && (
        <BrandLogo config={config} height={logoHeight} alt={config.companyName} />
      )}

      <h1
        className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl"
        style={{ color: config.primaryColor }}
      >
        {title ?? config.heroTitle ?? config.companyName}
      </h1>

      {subtitle ?? config.heroSubtitle ? (
        <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          {subtitle ?? config.heroSubtitle}
        </p>
      ) : null}

      {buttons.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {buttons.map((button) => (
            <BrandButton
              key={button.id}
              config={config}
              variant={button.variant ?? 'primary'}
              href={button.url}
              label={button.text}
            />
          ))}
        </div>
      )}
    </section>
  );
};
