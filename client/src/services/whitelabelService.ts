import { supabase } from '../lib/supabase';
import type { WhitelabelConfig } from '../types/whitelabel';

/** Hosts served by the default SmartCRM deployment; these never need a branding lookup. */
export const isOwnHost = (host: string): boolean =>
  host === 'localhost' ||
  host === '127.0.0.1' ||
  host.endsWith('.smartcrm.vip') ||
  host.endsWith('.netlify.app');

/** Branding for a custom domain (public; anon-callable RPC, returns branding JSON only). */
export const fetchBrandingForHost = async (
  host: string
): Promise<Partial<WhitelabelConfig> | null> => {
  const normalized = host.toLowerCase();
  if (isOwnHost(normalized)) return null;
  const { data, error } = await supabase.rpc('get_branding_for_host', { p_host: normalized });
  if (error) {
    console.warn('[whitelabelService] host lookup failed:', error.message);
    return null;
  }
  return data && typeof data === 'object' ? (data as Partial<WhitelabelConfig>) : null;
};

const currentUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
};

/** The signed-in user's saved branding, or null if none / not signed in. */
export const fetchOwnBranding = async (): Promise<Partial<WhitelabelConfig> | null> => {
  const ownerId = await currentUserId();
  if (!ownerId) return null;
  const { data, error } = await supabase
    .from('whitelabel_branding')
    .select('config')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) {
    console.warn('[whitelabelService] load failed:', error.message);
    return null;
  }
  return (data?.config as Partial<WhitelabelConfig>) ?? null;
};

/** Upsert the signed-in user's branding. Returns false if not signed in or on error. */
export const saveOwnBranding = async (config: WhitelabelConfig): Promise<boolean> => {
  const ownerId = await currentUserId();
  if (!ownerId) return false;
  const { error } = await supabase
    .from('whitelabel_branding')
    .upsert({ owner_id: ownerId, config }, { onConflict: 'owner_id' });
  if (error) {
    console.warn('[whitelabelService] save failed:', error.message);
    return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// Custom domains (RLS: owner-only; creation via request_domain RPC; verification
// via the verify-domain Edge Function)
// ---------------------------------------------------------------------------

export interface DomainRow {
  id: string;
  tenant_id: string;
  domain: string;
  status: 'pending' | 'verifying' | 'active' | 'failed' | 'suspended';
  dns_verified: boolean;
  ssl_status: 'pending' | 'provisioning' | 'active' | 'expired' | 'failed';
  verification_token: string;
  verification_method: 'txt' | 'cname' | 'http';
  last_checked_at: string | null;
  error_message: string | null;
  created_at: string;
}

export const listDomains = async (): Promise<DomainRow[]> => {
  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as DomainRow[];
};

export const DOMAIN_ERRORS: Record<string, string> = {
  invalid_hostname: 'That is not a valid hostname (example: crm.yourcompany.com).',
  reserved_hostname: 'smartcrm.vip and netlify.app hosts cannot be used as custom domains.',
  domain_already_registered: 'That domain is already registered.',
  domain_limit_reached: 'You have reached the maximum number of domains.',
  not_authenticated: 'Please sign in again.',
};

/** Add a pending domain; throws Error with a user-readable message. */
export const requestDomain = async (domain: string): Promise<DomainRow> => {
  const { data, error } = await supabase.rpc('request_domain', { p_domain: domain });
  if (error) {
    const key = Object.keys(DOMAIN_ERRORS).find((k) => error.message.includes(k));
    throw new Error(key ? DOMAIN_ERRORS[key] : error.message);
  }
  return data as DomainRow;
};

export const removeDomain = async (id: string): Promise<void> => {
  const { error } = await supabase.from('domains').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

/** Ask the verify-domain Edge Function to check DNS; returns the updated row. */
export const verifyDomain = async (
  id: string
): Promise<{ verified: boolean; domain: DomainRow }> => {
  const { data, error } = await supabase.functions.invoke('verify-domain', {
    body: { domain_id: id },
  });
  if (error) throw new Error(error.message);
  return data as { verified: boolean; domain: DomainRow };
};

// ---------------------------------------------------------------------------
// Branding history
// ---------------------------------------------------------------------------

export interface BrandingVersion {
  id: string;
  config: Partial<WhitelabelConfig>;
  created_at: string;
}

export const listBrandingHistory = async (limit = 20): Promise<BrandingVersion[]> => {
  const { data, error } = await supabase
    .from('whitelabel_settings_history')
    .select('id, config, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as BrandingVersion[];
};
