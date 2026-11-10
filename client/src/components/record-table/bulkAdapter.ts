import type { BulkAdapter, BulkEditField, BulkResult, SelectOption } from './types';

type FetchLike = (url: string, init?: RequestInit) => Promise<{ ok: boolean; status: number; json(): Promise<any> }>;

/** Runs `fn` for each row (bounded concurrency), collecting per-row errors instead of aborting. */
export async function runPerRow<T>(
  rows: T[],
  getId: (row: T) => string,
  fn: (row: T) => Promise<unknown>,
  concurrency = 5
): Promise<BulkResult> {
  const result: BulkResult = { succeeded: 0, errors: [] };
  for (let i = 0; i < rows.length; i += concurrency) {
    const batch = rows.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(fn));
    settled.forEach((s, idx) => {
      if (s.status === 'fulfilled') result.succeeded++;
      else
        result.errors.push({
          id: getId(batch[idx]),
          message: s.reason instanceof Error ? s.reason.message : String(s.reason),
        });
    });
  }
  return result;
}

const isBlank = (v: unknown) => v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

/** Fields of `duplicate` that fill blanks on `primary` (the primary's own values always win). */
export function fillEmptyFields(
  primary: Record<string, unknown>,
  duplicate: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (isBlank(primary[k]) && !isBlank(duplicate[k])) out[k] = duplicate[k];
  return out;
}

export interface RestAdapterOptions {
  basePath: string;
  editFields?: BulkEditField[];
  tagsField?: string;
  ownerField?: string;
  loadOwnerOptions?: () => Promise<SelectOption[]>;
  /** Enables merge via POST `mergePath` { primaryId, duplicateId, mergedFields }. */
  merge?: { path: string; fillKeys: string[] };
  fetchImpl?: FetchLike;
}

export function createRestAdapter<T extends { id: number | string }>(opts: RestAdapterOptions): BulkAdapter<T> {
  const f: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init) as unknown as ReturnType<FetchLike>);
  const send = async (url: string, method: string, body?: unknown) => {
    const res = await f(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    } as RequestInit);
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return res;
  };
  const id = (r: T) => String(r.id);
  const put = (rows: T[], patch: (r: T) => Record<string, unknown>) =>
    runPerRow(rows, id, (r) => send(`${opts.basePath}/${r.id}`, 'PUT', patch(r)));

  const adapter: BulkAdapter<T> = {
    editFields: opts.editFields,
    updateMany: (rows, patch) => put(rows, () => patch),
    deleteMany: (rows) => runPerRow(rows, id, (r) => send(`${opts.basePath}/${r.id}`, 'DELETE')),
  };
  const tagsField = opts.tagsField;
  if (tagsField) {
    adapter.addTag = (rows, tag) =>
      put(rows, (r) => {
        const current = ((r as Record<string, unknown>)[tagsField] as string[] | null | undefined) ?? [];
        return { [tagsField]: current.includes(tag) ? current : [...current, tag] };
      });
  }
  const ownerField = opts.ownerField;
  if (ownerField) {
    adapter.assignOwner = (rows, ownerId) => put(rows, () => ({ [ownerField]: ownerId }));
    adapter.loadOwnerOptions = opts.loadOwnerOptions;
  }
  const merge = opts.merge;
  if (merge) {
    adapter.merge = async (primary, duplicate) => {
      await send(merge.path, 'POST', {
        primaryId: primary.id,
        duplicateId: duplicate.id,
        mergedFields: fillEmptyFields(
          primary as Record<string, unknown>,
          duplicate as Record<string, unknown>,
          merge.fillKeys
        ),
      });
    };
  }
  return adapter;
}
