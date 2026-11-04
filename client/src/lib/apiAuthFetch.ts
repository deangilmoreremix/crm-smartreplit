import { supabase } from './supabase';

/**
 * Attach the signed-in user's Supabase access token to same-origin /api/* requests
 * that don't already carry an Authorization header. The Express API (server/routes/auth.ts
 * requireAuth) verifies this token; most client services call fetch('/api/...') without it.
 */
export function installApiAuthFetch(): void {
  if (typeof window === 'undefined' || !supabase) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      window.location.href
    );
    const isApiCall = url.origin === window.location.origin && url.pathname.startsWith('/api/');
    if (!isApiCall) return originalFetch(input, init);

    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    return originalFetch(input, { ...init, headers });
  };
}
