import { createClient } from '@supabase/supabase-js';

// Service-role client used by the workflow engine (imported by events/emitter.ts)
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);
