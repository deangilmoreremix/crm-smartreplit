/**
 * Brand configuration accepted by the white-label branding components.
 *
 * This is a self-contained, dependency-light subset of the client
 * `WhitelabelConfig` type (`client/src/types/whitelabel.ts`). It is
 * structurally compatible: any `WhitelabelConfig` value can be passed
 * directly to these components because every field here exists on the
 * client type. We keep a local copy to avoid a cross-boundary import
 * from the `client` app into this shared package.
 */

export interface WhitelabelButton {
  id: string;
  text: string;
  url: string;
  color?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: string;
  enabled: boolean;
}

export interface BrandConfig {
  companyName: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaButtons?: WhitelabelButton[];
  supportEmail?: string;
  supportPhone?: string;
  footerText?: string;
  faviconUrl?: string;
  customCss?: string;
  fontFamily?: string;
}

export type BrandButtonVariant = 'primary' | 'secondary' | 'outline';

/**
 * `WhitelabelConfig` (from the client) is accepted everywhere a `BrandConfig`
 * is expected. This type alias documents that intent and lets consumers
 * annotate values without importing the client type directly.
 */
export type { BrandConfig as WhitelabelConfigCompatible };
