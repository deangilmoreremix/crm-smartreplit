/**
 * Pure helpers for the data-model API: validators, JSONB filter whitelist, cursor codec and
 * permission resolution. No I/O here so everything is unit-testable.
 */

export const FIELD_TYPES = [
  'text', 'number', 'currency', 'date', 'datetime', 'boolean', 'select', 'multi_select',
  'relation', 'email', 'phone', 'link', 'rating', 'rich_text', 'json',
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const STANDARD_OBJECTS = ['contacts', 'deals', 'tasks', 'companies'] as const;
export const ACTIONS = ['read', 'create', 'update', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

const OBJECT_NAME_RE = /^[a-z][a-zA-Z0-9]{0,62}$/;
const FIELD_NAME_RE = /^[a-z][a-zA-Z0-9_]{0,62}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT_TYPES: FieldType[] = ['select', 'multi_select'];

export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });
const str = (v: unknown, max = 200): string | null =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max ? v.trim() : null;

export interface ObjectInput {
  name_singular: string;
  name_plural: string;
  label_singular: string;
  label_plural: string;
  icon: string | null;
}

export function validateObjectInput(body: any, partial = false): Result<Partial<ObjectInput>> {
  const out: Partial<ObjectInput> = {};
  if (!body || typeof body !== 'object') return fail('Body must be an object');
  for (const k of ['name_singular', 'name_plural'] as const) {
    if (body[k] === undefined && partial) continue;
    if (typeof body[k] !== 'string' || !OBJECT_NAME_RE.test(body[k])) {
      return fail(`${k} must be camelCase letters/digits starting with a lowercase letter`);
    }
    out[k] = body[k];
  }
  for (const k of ['label_singular', 'label_plural'] as const) {
    if (body[k] === undefined && partial) continue;
    const v = str(body[k], 100);
    if (!v) return fail(`${k} is required (max 100 chars)`);
    out[k] = v;
  }
  if (body.icon !== undefined) {
    if (body.icon !== null && !str(body.icon, 50)) return fail('icon must be a short string');
    out.icon = body.icon === null ? null : str(body.icon, 50);
  }
  if (!partial && out.name_singular === out.name_plural) return fail('name_singular and name_plural must differ');
  if ((STANDARD_OBJECTS as readonly string[]).includes(out.name_plural ?? '')) {
    return fail('name_plural collides with a standard object');
  }
  return { ok: true, value: out };
}

export interface SelectOption { value: string; label: string; color?: string }

export function validateOptions(type: FieldType, options: unknown): Result<SelectOption[]> {
  if (options === undefined || options === null) options = [];
  if (!Array.isArray(options)) return fail('options must be an array');
  if (!SELECT_TYPES.includes(type)) {
    return options.length === 0 ? { ok: true, value: [] } : fail(`options are only allowed for ${SELECT_TYPES.join(', ')}`);
  }
  if (options.length > 200) return fail('too many options (max 200)');
  const seen = new Set<string>();
  const out: SelectOption[] = [];
  for (const o of options) {
    const value = str(o?.value, 100);
    const label = str(o?.label ?? o?.value, 100);
    if (!value || !label) return fail('each option needs a value and a label');
    if (seen.has(value)) return fail(`duplicate option value "${value}"`);
    seen.add(value);
    const opt: SelectOption = { value, label };
    if (o.color !== undefined) {
      if (typeof o.color !== 'string' || !/^[a-zA-Z0-9#]{1,20}$/.test(o.color)) return fail('invalid option color');
      opt.color = o.color;
    }
    out.push(opt);
  }
  return { ok: true, value: out };
}

export interface FieldInput {
  name: string;
  label: string;
  field_type: FieldType;
  options: SelectOption[];
  settings: Record<string, unknown>;
  is_required: boolean;
  position?: number;
}

export function validateFieldInput(body: any, partial = false): Result<Partial<FieldInput>> {
  if (!body || typeof body !== 'object') return fail('Body must be an object');
  const out: Partial<FieldInput> = {};
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== 'string' || !FIELD_NAME_RE.test(body.name)) {
      return fail('name must start with a lowercase letter and contain only letters, digits, underscore');
    }
    out.name = body.name;
  }
  if (!partial || body.label !== undefined) {
    const label = str(body.label, 100);
    if (!label) return fail('label is required (max 100 chars)');
    out.label = label;
  }
  let type: FieldType | undefined;
  if (!partial || body.field_type !== undefined) {
    if (!(FIELD_TYPES as readonly string[]).includes(body.field_type)) {
      return fail(`field_type must be one of ${FIELD_TYPES.join(', ')}`);
    }
    type = body.field_type as FieldType;
    out.field_type = type;
  }
  if (body.options !== undefined || (!partial && type)) {
    if (!type) return fail('field_type is required when changing options');
    const o = validateOptions(type, body.options);
    if (!o.ok) return o;
    out.options = o.value;
  }
  if (body.settings !== undefined) {
    if (!body.settings || typeof body.settings !== 'object' || Array.isArray(body.settings)) return fail('settings must be an object');
    if (JSON.stringify(body.settings).length > 4000) return fail('settings too large');
    if (type === 'relation' && body.settings.targetObjectId !== undefined && !isUuid(body.settings.targetObjectId)) {
      return fail('settings.targetObjectId must be a uuid');
    }
    out.settings = body.settings;
  } else if (!partial) out.settings = {};
  if (body.is_required !== undefined) {
    if (typeof body.is_required !== 'boolean') return fail('is_required must be boolean');
    out.is_required = body.is_required;
  } else if (!partial) out.is_required = false;
  if (body.position !== undefined) {
    if (!Number.isInteger(body.position) || body.position < 0 || body.position > 10000) return fail('position must be a non-negative integer');
    out.position = body.position;
  }
  return { ok: true, value: out };
}

// ---------------------------------------------------------------------------
// Record data validation
// ---------------------------------------------------------------------------
export interface FieldDef {
  name: string;
  field_type: FieldType;
  options?: SelectOption[];
  is_required?: boolean;
}

function validateValue(f: FieldDef, v: unknown): string | null {
  if (v === null) return null;
  switch (f.field_type) {
    case 'text': case 'rich_text': case 'phone':
      return typeof v === 'string' && v.length <= 20000 ? null : 'must be a string';
    case 'email':
      return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'must be an email';
    case 'link':
      return typeof v === 'string' && /^https?:\/\//i.test(v) && v.length <= 2000 ? null : 'must be an http(s) URL';
    case 'number': case 'currency':
      return typeof v === 'number' && Number.isFinite(v) ? null : 'must be a number';
    case 'rating':
      return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 5 ? null : 'must be an integer 0-5';
    case 'boolean':
      return typeof v === 'boolean' ? null : 'must be boolean';
    case 'date': case 'datetime':
      return typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? null : 'must be an ISO date string';
    case 'select':
      return typeof v === 'string' && (f.options ?? []).some((o) => o.value === v) ? null : 'must be one of the options';
    case 'multi_select':
      return Array.isArray(v) && v.every((x) => typeof x === 'string' && (f.options ?? []).some((o) => o.value === x))
        ? null : 'must be an array of options';
    case 'relation':
      return isUuid(v) || (Array.isArray(v) && v.every(isUuid)) ? null : 'must be a record id or array of ids';
    case 'json':
      return JSON.stringify(v).length <= 50000 ? null : 'too large';
    default:
      return 'unsupported field type';
  }
}

/** Unknown keys are rejected so `data` stays aligned with field_metadata. */
export function validateRecordData(fields: FieldDef[], data: unknown, partial: boolean): Result<Record<string, unknown>> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return fail('data must be an object');
  const byName = new Map(fields.map((f) => [f.name, f]));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const f = byName.get(k);
    if (!f) return fail(`unknown field "${k}"`);
    const err = validateValue(f, v);
    if (err) return fail(`${k} ${err}`);
    out[k] = v;
  }
  if (!partial) {
    for (const f of fields) {
      if (f.is_required && (out[f.name] === undefined || out[f.name] === null || out[f.name] === '')) {
        return fail(`${f.name} is required`);
      }
    }
  }
  return { ok: true, value: out };
}

// ---------------------------------------------------------------------------
// Filter whitelist -> PostgREST clauses (parameterised by supabase-js, never string-built SQL)
// ---------------------------------------------------------------------------
export const FILTER_OPS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'is_null', 'not_null'] as const;
export type FilterOp = (typeof FILTER_OPS)[number];
export const MAX_FILTERS = 10;
const NUMERIC_TYPES: FieldType[] = ['number', 'currency', 'rating'];
const ORDERED_TYPES: FieldType[] = [...NUMERIC_TYPES, 'date', 'datetime'];

export interface FilterClause {
  /** PostgREST column expression, e.g. data->>name */
  column: string;
  /** supabase-js operator: eq neq gt gte lt lte ilike is */
  operator: string;
  value: unknown;
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

export function parseFilters(raw: unknown, fields: FieldDef[]): Result<FilterClause[]> {
  if (raw === undefined || raw === null || raw === '') return { ok: true, value: [] };
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    if (raw.length > 5000) return fail('filter too large');
    try { parsed = JSON.parse(raw); } catch { return fail('filter must be valid JSON'); }
  }
  if (!Array.isArray(parsed)) return fail('filter must be an array');
  if (parsed.length > MAX_FILTERS) return fail(`at most ${MAX_FILTERS} filters`);
  const byName = new Map(fields.map((f) => [f.name, f]));
  const out: FilterClause[] = [];
  for (const item of parsed) {
    const f = typeof item?.field === 'string' ? byName.get(item.field) : undefined;
    if (!f) return fail(`filter on unknown field "${String(item?.field)}"`);
    const op = item.op as FilterOp;
    if (!(FILTER_OPS as readonly string[]).includes(op)) return fail(`unsupported operator "${String(op)}"`);
    if (op === 'is_null') { out.push({ column: `data->>${f.name}`, operator: 'is', value: null }); continue; }
    if (op === 'not_null') { out.push({ column: `data->>${f.name}`, operator: 'not.is', value: null }); continue; }
    const v = item.value;
    if (op === 'contains') {
      if (typeof v !== 'string' || v.length === 0 || v.length > 200) return fail('contains needs a non-empty string');
      if (['json', 'boolean', 'rating', 'number', 'currency'].includes(f.field_type)) return fail(`contains not supported on ${f.field_type}`);
      out.push({ column: `data->>${f.name}`, operator: 'ilike', value: `%${escapeLike(v)}%` });
      continue;
    }
    if (['gt', 'gte', 'lt', 'lte'].includes(op) && !ORDERED_TYPES.includes(f.field_type)) {
      return fail(`${op} not supported on ${f.field_type}`);
    }
    if (NUMERIC_TYPES.includes(f.field_type)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) return fail(`${f.name} filter value must be a number`);
      out.push({ column: `data->${f.name}`, operator: op, value: v });
    } else if (f.field_type === 'boolean') {
      if (typeof v !== 'boolean' || !['eq', 'neq'].includes(op)) return fail(`${f.name} supports eq/neq with a boolean`);
      out.push({ column: `data->>${f.name}`, operator: op, value: String(v) });
    } else {
      if (typeof v !== 'string' || v.length > 500) return fail(`${f.name} filter value must be a string`);
      out.push({ column: `data->>${f.name}`, operator: op, value: v });
    }
  }
  return { ok: true, value: out };
}

// ---------------------------------------------------------------------------
// Cursor (keyset on created_at desc, id desc)
// ---------------------------------------------------------------------------
export function encodeCursor(row: { created_at: string; id: string }): string {
  return Buffer.from(JSON.stringify({ c: row.created_at, i: row.id })).toString('base64url');
}

export function decodeCursor(cursor: unknown): { created_at: string; id: string } | null {
  if (typeof cursor !== 'string' || cursor.length === 0 || cursor.length > 200) return null;
  try {
    const o = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (typeof o.c !== 'string' || Number.isNaN(Date.parse(o.c)) || !/^[0-9T:.+\-Z ]{10,40}$/.test(o.c)) return null;
    if (!isUuid(o.i)) return null;
    return { created_at: o.c, id: o.i };
  } catch {
    return null;
  }
}

export function clampLimit(raw: unknown, def = 50, max = 200): number {
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 1) return def;
  return Math.min(n, max);
}

// ---------------------------------------------------------------------------
// Permission resolution (mirrors has_object_perm / has_field_perm in SQL)
// ---------------------------------------------------------------------------
export interface ObjectPermRow { object_type: string; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }
export interface FieldPermRow { object_type: string; field: string; can_read: boolean; can_write: boolean }

export function validateActionBool(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

/** perms === null means the caller is the owner (full access). */
export function canDo(perms: ObjectPermRow[] | null, objectType: string, action: Action): boolean {
  if (perms === null) return true;
  const row = perms.find((p) => p.object_type === objectType);
  if (!row) return false;
  return { read: row.can_read, create: row.can_create, update: row.can_update, delete: row.can_delete }[action];
}

export function fieldAllowed(fperms: FieldPermRow[] | null, objectType: string, field: string, action: 'read' | 'write'): boolean {
  if (fperms === null) return true;
  const row = fperms.find((p) => p.object_type === objectType && p.field === field);
  if (!row) return true; // default allow, same as has_field_perm
  return action === 'read' ? row.can_read : row.can_write;
}

export function maskData(fperms: FieldPermRow[] | null, objectType: string, data: Record<string, unknown>): Record<string, unknown> {
  if (fperms === null) return data;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data ?? {})) if (fieldAllowed(fperms, objectType, k, 'read')) out[k] = v;
  return out;
}

export function validateEmail(v: unknown): string | null {
  return typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v.trim().toLowerCase() : null;
}
