import { createClient } from '@supabase/supabase-js';

// Server-side client used by the workflow engine (service role; never shipped to browsers).
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'missing-key';

export const supabase = createClient(url, key);
