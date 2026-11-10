import { useCallback, useEffect, useState } from 'react';

const BASE = '/api/data-model';

/** Fetch helper; the global installApiAuthFetch wrapper adds the Supabase bearer token. */
export async function dmApi<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body as T;
}

const send = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const STANDARD_OBJECTS = ['contacts', 'deals', 'tasks', 'companies'] as const;

export const FIELD_TYPES = [
  'text', 'number', 'currency', 'date', 'datetime', 'boolean', 'select', 'multi_select',
  'relation', 'email', 'phone', 'link', 'rating', 'rich_text', 'json',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface SelectOption { value: string; label: string; color?: string }
export interface ObjectMeta {
  id: string; user_id: string; name_singular: string; name_plural: string;
  label_singular: string; label_plural: string; icon: string | null; is_system: boolean;
}
export interface FieldMeta {
  id: string; object_id: string; name: string; label: string; field_type: FieldType;
  options: SelectOption[]; settings: Record<string, unknown>; is_required: boolean; position: number; is_system: boolean;
}
export interface DataRecord { id: string; object_id: string; data: Record<string, unknown>; created_at: string; updated_at: string }
export interface ObjectPerm { object_type: string; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }
export interface FieldPerm { object_type: string; field: string; can_read: boolean; can_write: boolean }
export interface Role {
  id: string; name: string; description: string | null; is_default: boolean;
  objectPermissions: ObjectPerm[]; fieldPermissions: FieldPerm[];
}
export interface TeamMember {
  id: string; member_id: string | null; email: string | null; role_id: string | null;
  status: 'invited' | 'active' | 'disabled'; roles?: { name: string } | null;
}

function useLoad<T>(loader: () => Promise<T>, initial: T, enabled = true) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await loader()); } catch (e: any) { setError(e.message); }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader]);
  useEffect(() => { if (enabled) void refresh(); else setLoading(false); }, [refresh, enabled]);
  return { data, loading, error, refresh, setData };
}

export function useObjects() {
  const loader = useCallback(async () => (await dmApi<{ objects: ObjectMeta[] }>('/objects')).objects, []);
  const { data, ...rest } = useLoad<ObjectMeta[]>(loader, []);
  const create = async (input: Omit<ObjectMeta, 'id' | 'user_id' | 'is_system'>) => {
    await dmApi('/objects', send('POST', input));
    await rest.refresh();
  };
  const update = async (id: string, input: Partial<ObjectMeta>) => {
    await dmApi(`/objects/${id}`, send('PUT', input));
    await rest.refresh();
  };
  const remove = async (id: string) => {
    await dmApi(`/objects/${id}`, send('DELETE'));
    await rest.refresh();
  };
  return { objects: data, ...rest, create, update, remove };
}

/** `objectRef` is an object id / name_plural, or a standard object name (contacts, ...). */
export function useFields(objectRef: string | undefined) {
  const loader = useCallback(
    async () => (await dmApi<{ fields: FieldMeta[] }>(`/fields?object=${encodeURIComponent(objectRef!)}`)).fields,
    [objectRef]
  );
  const { data, setData, ...rest } = useLoad<FieldMeta[]>(loader, [], !!objectRef);
  const create = async (input: Partial<FieldMeta>) => {
    await dmApi('/fields', send('POST', { ...input, object: objectRef }));
    await rest.refresh();
  };
  const update = async (id: string, input: Partial<FieldMeta>) => {
    await dmApi(`/fields/${id}`, send('PUT', { ...input, object: objectRef }));
    await rest.refresh();
  };
  const remove = async (id: string) => {
    await dmApi(`/fields/${id}?object=${encodeURIComponent(objectRef!)}`, send('DELETE'));
    await rest.refresh();
  };
  const reorder = async (ids: string[]) => {
    setData((prev) => ids.map((id) => prev.find((f) => f.id === id)!).filter(Boolean));
    try { await dmApi('/fields/reorder', send('POST', { object: objectRef, ids })); } catch { await rest.refresh(); }
  };
  return { fields: data, ...rest, create, update, remove, reorder };
}

export interface RecordFilter { field: string; op: string; value?: unknown }

export function useRecords(objectRef: string | undefined, filters: RecordFilter[] = [], q = '') {
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!objectRef);
  const [error, setError] = useState<string | null>(null);
  const filterKey = JSON.stringify(filters);

  const fetchPage = useCallback(async (after: string | null) => {
    const p = new URLSearchParams({ object: objectRef!, limit: '50' });
    if (filters.length) p.set('filter', filterKey);
    if (q) p.set('q', q);
    if (after) p.set('cursor', after);
    return dmApi<{ records: DataRecord[]; nextCursor: string | null }>(`/records?${p}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectRef, filterKey, q]);

  const refresh = useCallback(async () => {
    if (!objectRef) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetchPage(null);
      setRecords(r.records);
      setCursor(r.nextCursor);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  }, [objectRef, fetchPage]);

  useEffect(() => { void refresh(); }, [refresh]);

  const loadMore = async () => {
    if (!cursor) return;
    try {
      const r = await fetchPage(cursor);
      setRecords((prev) => [...prev, ...r.records]);
      setCursor(r.nextCursor);
    } catch (e: any) { setError(e.message); }
  };
  const create = async (data: Record<string, unknown>) => {
    await dmApi('/records', send('POST', { object: objectRef, data }));
    await refresh();
  };
  const update = async (id: string, data: Record<string, unknown>) => {
    await dmApi(`/records/${id}`, send('PUT', { data }));
    await refresh();
  };
  const remove = async (id: string) => {
    await dmApi(`/records/${id}`, send('DELETE'));
    await refresh();
  };
  return { records, loading, error, hasMore: !!cursor, loadMore, refresh, create, update, remove };
}

export function useRoles() {
  const loader = useCallback(async () => (await dmApi<{ roles: Role[] }>('/roles')).roles, []);
  const { data, ...rest } = useLoad<Role[]>(loader, []);
  const create = async (input: Partial<Role>) => { await dmApi('/roles', send('POST', input)); await rest.refresh(); };
  const update = async (id: string, input: Partial<Role>) => { await dmApi(`/roles/${id}`, send('PUT', input)); await rest.refresh(); };
  const remove = async (id: string) => { await dmApi(`/roles/${id}`, send('DELETE')); await rest.refresh(); };
  return { roles: data, ...rest, create, update, remove };
}

export function useTeam() {
  const loader = useCallback(async () => (await dmApi<{ members: TeamMember[] }>('/team')).members, []);
  const { data, ...rest } = useLoad<TeamMember[]>(loader, []);
  const invite = async (email: string, roleId: string | null) => {
    await dmApi('/team/invite', send('POST', { email, roleId }));
    await rest.refresh();
  };
  const update = async (id: string, input: { roleId?: string | null; status?: 'active' | 'disabled' }) => {
    await dmApi(`/team/${id}`, send('PUT', input));
    await rest.refresh();
  };
  const remove = async (id: string) => { await dmApi(`/team/${id}`, send('DELETE')); await rest.refresh(); };
  return { members: data, ...rest, invite, update, remove };
}
