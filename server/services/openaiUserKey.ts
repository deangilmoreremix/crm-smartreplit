/**
 * Canonical per-user OpenAI key lookup. Reads the `user_api_keys_openai` view
 * (user_id, api_key, model) defined in supabase/migrations/20261113300000_user_api_keys_unify.sql,
 * which covers both shapes of public.user_api_keys.
 */
import { pool } from '../db';

export async function getUserOpenAIKey(
  userId: string
): Promise<{ apiKey: string; model: string | null } | null> {
  if (!pool || !userId) return null;
  const { rows } = await pool.query(
    'select api_key, model from user_api_keys_openai where user_id = $1 limit 1',
    [userId]
  );
  const row = rows[0];
  return row?.api_key ? { apiKey: row.api_key as string, model: (row.model as string) || null } : null;
}
