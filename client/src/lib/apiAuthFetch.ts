import { supabase } from './supabase';

/**
 * The API (Netlify Function) is stateless: it verifies the Supabase access token sent in
 * the Authorization header. Rather than touching ~100 fetch call sites, wrap window.fetch
 * once so same-origin /api/* and /.netlify/functions/* requests carry the signed-in user's
 * token (unless the caller already set an Authorization header).
 */
const isApiUrl = (url: string): boolean => {
  try {
    const u = new URL(url, window.location.origin);
    return (
      u.origin === window.location.origin &&
      (u.pathname.startsWith('/api/') || u.pathname.startsWith('/.netlify/functions/'))
    );
  } catch {
    return false;
  }
};

let installed = false;

export function installApiAuthFetch(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (isApiUrl(url)) {
        const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
            return originalFetch(input, { ...init, headers });
          }
        }
      }
    } catch {
      // fall through to the plain request
    }
    return originalFetch(input, init);
  };
}
