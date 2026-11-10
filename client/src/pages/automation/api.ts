/** Small JSON fetch helper (window.fetch already carries the Supabase token for /api/*). */
export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = typeof body.error === 'string' ? body.error : body.error?.message;
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const errMsg = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleString() : '-');
