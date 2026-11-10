import { supabase } from '../lib/supabase';
import type { WhitelabelConfig } from '../types/whitelabel';

/** Hosts served by the default SmartCRM deployment; these never need a branding lookup. */
const isOwnHost = (host: string): boolean =>
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
