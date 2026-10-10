/**
 * Server-side Supabase client for the workflows package.
 *
 * `events/emitter.ts` dynamically imports `../supabase` inside
 * `triggerWorkflowsForEvent`, but this module was missing, so the package
 * barrel (`index.ts` → `./events/emitter`) failed module resolution. Any
 * consumer importing the package's public API — including its public
 * `WorkflowTrigger` / `WorkflowAction` enums — hit a resolve error.
 *
 * The client is created from environment variables exactly like the server
 * app's own client; no credentials are hardcoded. It stays `null` when the
 * variables are absent so a browser/bundle-safe consumer is not broken.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceKey) {
  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Lazily-created service-role client. Accessing `supabase` throws when the
 * service-role configuration is missing instead of silently running
 * unauthenticated against a null client.
 */
export const supabase = client as unknown as NonNullable<SupabaseClient>;

export const isSupabaseConfigured = (): boolean => !!supabaseUrl && !!supabaseServiceKey;
