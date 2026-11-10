// Verify ownership of a white-label custom domain via DNS (DNS-over-HTTPS lookup only).
// POST { domain_id: string } with the caller's Supabase JWT.
//  - The caller's JWT is used to read the row (RLS: tenant_id = auth.uid()), so only the
//    owner can trigger a check.
//  - The result is written with the service role, scoped to that one row, because owners
//    deliberately have no UPDATE policy (they must not be able to self-mark verified).
// SSL is NOT handled here: Netlify provisions the certificate once the owner adds the
// domain in Netlify, so ssl_status stays 'pending'.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const DOH_URL = 'https://cloudflare-dns.com/dns-query';
const TYPE_CODES: Record<string, number> = { TXT: 16, CNAME: 5 };

/** Returns record values (TXT quotes stripped, CNAME trailing dot stripped, lower-cased for CNAME). */
async function dnsLookup(name: string, type: 'TXT' | 'CNAME'): Promise<string[]> {
  const res = await fetch(`${DOH_URL}?name=${encodeURIComponent(name)}&type=${type}`, {
    headers: { accept: 'application/dns-json' },
  });
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  const body = (await res.json()) as { Answer?: { type: number; data: string }[] };
  return (body.Answer ?? [])
    .filter((a) => a.type === TYPE_CODES[type])
    .map((a) =>
      type === 'TXT'
        ? a.data.replace(/^"|"$/g, '').replace(/"\s+"/g, '')
        : a.data.replace(/\.$/, '').toLowerCase()
    );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'missing_authorization' }, 401);

  let domainId: string | undefined;
  try {
    domainId = (await req.json())?.domain_id;
  } catch {
    /* handled below */
  }
  if (!domainId || typeof domainId !== 'string') return json({ error: 'domain_id_required' }, 400);

  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: 'unauthorized' }, 401);

  // RLS: returns the row only if the caller owns it
  const { data: row, error: rowErr } = await userClient
    .from('domains')
    .select('id, tenant_id, domain, verification_token, verification_method')
    .eq('id', domainId)
    .maybeSingle();
  if (rowErr) return json({ error: rowErr.message }, 500);
  if (!row) return json({ error: 'not_found' }, 404);

  let verified = false;
  let errorMessage: string | null = null;
  try {
    if (row.verification_method === 'cname') {
      const target = Deno.env.get('NETLIFY_CNAME_TARGET')?.toLowerCase().replace(/\.$/, '');
      if (!target) {
        errorMessage = 'CNAME verification is not configured on the server.';
      } else {
        const values = await dnsLookup(row.domain, 'CNAME');
        verified = values.includes(target);
        if (!verified) errorMessage = `CNAME for ${row.domain} does not point to ${target} (found: ${values.join(', ') || 'none'}).`;
      }
    } else if (row.verification_method === 'txt') {
      const values = await dnsLookup(`_smartcrm-verify.${row.domain}`, 'TXT');
      verified = values.includes(row.verification_token);
      if (!verified) errorMessage = `TXT record _smartcrm-verify.${row.domain} not found or does not match yet. DNS changes can take a while to propagate.`;
    } else {
      errorMessage = `Verification method "${row.verification_method}" is not supported.`;
    }
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'DNS lookup failed';
  }

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date().toISOString();
  const patch = verified
    ? { dns_verified: true, status: 'active', last_checked_at: now, error_message: null, updated_at: now }
    : { dns_verified: false, status: 'pending', last_checked_at: now, error_message: errorMessage, updated_at: now };

  const { data: updated, error: updErr } = await admin
    .from('domains')
    .update(patch)
    .eq('id', row.id)
    .eq('tenant_id', userData.user.id)
    .select()
    .single();
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ verified, domain: updated });
});
