import React from 'react';
import { type BrandConfig } from '../types';

export interface BrandFooterProps {
  config: BrandConfig;
  className?: string;
  /** Override the footer text; defaults to config.footerText. */
  footerText?: string;
  /** When true, show support email/phone links. Defaults to true. */
  showSupport?: boolean;
  /** Render the current year automatically. Defaults to true. */
  showYear?: boolean;
}

/**
 * Footer driven by brand config: company name, optional footer text, and
 * support contact (email/phone) pulled from the config.
 */
export const BrandFooter: React.FC<BrandFooterProps> = ({
  config,
  className,
  footerText,
  showSupport = true,
  showYear = true,
}) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`border-t border-gray-200 px-6 py-8 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 ${className ?? ''}`}
    >
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-center">
        <p className="font-semibold text-gray-700 dark:text-gray-200">
          {config.companyName}
        </p>

        {footerText ?? config.footerText ? (
          <p>{footerText ?? config.footerText}</p>
        ) : null}

        {showSupport && (config.supportEmail || config.supportPhone) && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            {config.supportEmail && (
              <a
                href={`mailto:${config.supportEmail}`}
                className="hover:underline"
                style={{ color: config.primaryColor }}
              >
                {config.supportEmail}
              </a>
            )}
            {config.supportPhone && (
              <a
                href={`tel:${config.supportPhone.replace(/\s+/g, '')}`}
                className="hover:underline"
                style={{ color: config.primaryColor }}
              >
                {config.supportPhone}
              </a>
            )}
          </div>
        )}

        {showYear && (
          <p className="text-xs text-gray-400">
            © {year} {config.companyName}. All rights reserved.
          </p>
        )}
      </div>
    </footer>
  );
};
