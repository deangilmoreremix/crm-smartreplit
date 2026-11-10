import { fetchBrandingForHost, isOwnHost } from '../services/whitelabelService';
import type { WhitelabelConfig } from '../types/whitelabel';

/** Built-in SmartCRM hosts. These are "own hosts": they never need a branding lookup. */
const OWN_HOSTS = [
  'app.smartcrm.vip',
  'pipeline.smartcrm.vip',
  'contacts.smartcrm.vip',
  'analytics.smartcrm.vip',
  'agency.smartcrm.vip',
  'calendar.smartcrm.vip',
  'research.smartcrm.vip',
  'white-label.smartcrm.vip',
  'localhost',
  '127.0.0.1',
] as const;

export type HostResolution =
  | { kind: 'own'; host: string; branding: null }
  /** A verified custom domain with saved branding. */
  | { kind: 'custom'; host: string; branding: Partial<WhitelabelConfig> }
  /** Not one of ours and no active custom domain is registered for it. */
  | { kind: 'unknown'; host: string; branding: null };

export class DomainRouter {
  /** Normalize a hostname (lower-case, no port, no trailing dot). */
  static normalizeHost(host: string): string {
    return host.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  }

  /** True for the built-in SmartCRM hosts (and any *.smartcrm.vip / *.netlify.app host). */
  static isOwnHost(host: string): boolean {
    return isOwnHost(this.normalizeHost(host));
  }

  /** The built-in hosts this deployment serves itself. */
  static getOwnHosts(): string[] {
    return [...OWN_HOSTS];
  }

  /**
   * Resolve a hostname: own host, custom domain (with branding from Supabase), or unknown.
   * There is no tenant-id fallback; an unknown host is reported as such.
   */
  static async resolveHost(host: string): Promise<HostResolution> {
    const normalized = this.normalizeHost(host);
    if (this.isOwnHost(normalized)) return { kind: 'own', host: normalized, branding: null };
    const branding = await fetchBrandingForHost(normalized);
    return branding
      ? { kind: 'custom', host: normalized, branding }
      : { kind: 'unknown', host: normalized, branding: null };
  }
}
