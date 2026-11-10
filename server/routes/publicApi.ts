/**
 * Public REST API (v1), authenticated with API keys:  Authorization: Bearer sk_live_...
 *   /api/v1/{contacts,deals,tasks,companies}   list / get / create / update / delete
 *   /api/v1/openapi.json                        OpenAPI 3.1 description (public)
 * Key management (session auth, same file): /api/public-api-keys  (create returns the secret ONCE).
 *
 * Security model: keys are stored as HMAC-SHA256(API_KEY_PEPPER, key) and compared in constant time;
 * the service-role client is used, but EVERY query is filtered by the key owner's user id; scopes are
 * read:<object> / write:<object>; 120 requests / minute / key (DB counter, in-memory fallback).
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Express, NextFunction, Request, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth } from './auth';
import { memoryRateLimit } from './automation';

export const KEY_PREFIX = 'sk_live_';
export const KEY_LOOKUP_LENGTH = 16; // "sk_live_" + 8 random chars, stored in api_keys.prefix
export const RATE_LIMIT_PER_MINUTE = 120;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_KEYS_PER_USER = 25;

type FieldKind = 'string' | 'number' | 'integer' | 'stringArray';

interface Resource {
  table: string;
  owner: string;
  singular: string;
  fields: Record<string, FieldKind>;
  required: string[];
  defaults?: Record<string, unknown>;
  canCreate: boolean;
  canDelete: boolean;
  hasUpdatedAt: boolean;
  hidden: string[];
}

export const RESOURCES: Record<string, Resource> = {
  contacts: {
    table: 'contacts', owner: 'profile_id', singular: 'contact',
    fields: {
      first_name: 'string', last_name: 'string', email: 'string', phone: 'string', company: 'string',
      position: 'string', address: 'string', city: 'string', state: 'string', zip_code: 'string',
      country: 'string', industry: 'string', source: 'string', notes: 'string', status: 'string', tags: 'stringArray',
    },
    required: ['first_name', 'last_name'], canCreate: true, canDelete: true, hasUpdatedAt: true,
    hidden: ['profile_id', 'tenant_id'],
  },
  deals: {
    table: 'deals', owner: 'profile_id', singular: 'deal',
    fields: {
      title: 'string', value: 'number', stage: 'string', probability: 'integer', description: 'string',
      status: 'string', contact_id: 'string', expected_close_date: 'string',
    },
    required: ['title'], defaults: { stage: 'lead' }, canCreate: true, canDelete: true, hasUpdatedAt: true,
    hidden: ['profile_id', 'tenant_id', 'idempotency_key'],
  },
  tasks: {
    table: 'tasks', owner: 'profile_id', singular: 'task',
    fields: {
      title: 'string', description: 'string', status: 'string', priority: 'string', due_date: 'string',
      contact_id: 'string', deal_id: 'string',
    },
    required: ['title'], canCreate: true, canDelete: true, hasUpdatedAt: true,
    hidden: ['profile_id', 'tenant_id'],
  },
  // `companies` is the tenant/organisation table (one per owner): readable and editable, but it
  // cannot be created or deleted through the API.
  companies: {
    table: 'companies', owner: 'owner_user_id', singular: 'company',
    fields: { name: 'string', domain: 'string', description: 'string', industry: 'string' },
    required: [], canCreate: false, canDelete: false, hasUpdatedAt: true,
    hidden: ['owner_user_id'],
  },
};

export const ALL_SCOPES = Object.keys(RESOURCES).flatMap((r) => [`read:${r}`, `write:${r}`]);

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------------
export function hashApiKey(key: string, pepper: string): string {
  return createHmac('sha256', pepper).update(key).digest('hex');
}

export function generateApiKey(): { key: string; prefix: string } {
  const key = `${KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
  return { key, prefix: key.slice(0, KEY_LOOKUP_LENGTH) };
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function scopeAllows(scopes: string[] | null | undefined, mode: 'read' | 'write', resource: string): boolean {
  return Array.isArray(scopes) && scopes.includes(`${mode}:${resource}`);
}

export const encodeCursor = (id: string | number): string => Buffer.from(JSON.stringify({ id })).toString('base64url');
export function decodeCursor(raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || raw.length > 200) return null;
  try {
    const { id } = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    const s = String(id);
    return /^[\w-]{1,64}$/.test(s) ? s : null;
  } catch {
    return null;
  }
}

/** Validates a create/update body against the resource's whitelist. Returns the clean row or errors. */
export function validateBody(
  resource: Resource,
  body: unknown,
  mode: 'create' | 'update'
): { ok: true; row: Record<string, unknown> } | { ok: false; errors: string[] } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, errors: ['Body must be a JSON object'] };
  const input = body as Record<string, unknown>;
  const errors: string[] = [];
  const row: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(input)) {
    const kind = resource.fields[k];
    if (!kind) {
      errors.push(`Unknown or read-only field "${k}"`);
      continue;
    }
    if (v === null) {
      if (resource.required.includes(k)) errors.push(`Field "${k}" cannot be null`);
      else row[k] = null;
      continue;
    }
    const okType =
      kind === 'string' ? typeof v === 'string' && v.length <= 10_000
      : kind === 'number' ? typeof v === 'number' && Number.isFinite(v)
      : kind === 'integer' ? Number.isInteger(v)
      : Array.isArray(v) && v.length <= 100 && v.every((x) => typeof x === 'string' && x.length <= 200);
    if (!okType) {
      errors.push(`Field "${k}" must be of type ${kind === 'stringArray' ? 'array of strings' : kind}`);
      continue;
    }
    row[k] = v;
  }
  if (mode === 'create') {
    for (const k of resource.required) {
      if (row[k] === undefined || row[k] === '') errors.push(`Field "${k}" is required`);
    }
  } else if (Object.keys(row).length === 0 && errors.length === 0) {
    errors.push('No updatable fields provided');
  }
  return errors.length ? { ok: false, errors } : { ok: true, row };
}

const stripHidden = (resource: Resource, row: Record<string, unknown>) => {
  const out = { ...row };
  for (const h of resource.hidden) delete out[h];
  return out;
};

function apiError(res: Response, status: number, code: string, message: string, details?: unknown) {
  return res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

// ---------------------------------------------------------------------------
// OpenAPI 3.1
// ---------------------------------------------------------------------------
const OPENAPI_TYPES: Record<FieldKind, object> = {
  string: { type: ['string', 'null'] },
  number: { type: ['number', 'null'] },
  integer: { type: ['integer', 'null'] },
  stringArray: { type: ['array', 'null'], items: { type: 'string' } },
};

export function buildOpenApi(serverUrl = '/api/v1') {
  const paths: Record<string, any> = {};
  const schemas: Record<string, any> = {
    Error: {
      type: 'object',
      required: ['error'],
      properties: {
        error: {
          type: 'object',
          required: ['code', 'message'],
          properties: { code: { type: 'string' }, message: { type: 'string' }, details: {} },
        },
      },
    },
  };
  const errorResponses = {
    '401': { $ref: '#/components/responses/Unauthorized' },
    '403': { $ref: '#/components/responses/Forbidden' },
    '429': { $ref: '#/components/responses/RateLimited' },
  };

  for (const [name, r] of Object.entries(RESOURCES)) {
    const schemaName = r.singular[0].toUpperCase() + r.singular.slice(1);
    const props = Object.fromEntries(Object.entries(r.fields).map(([k, kind]) => [k, OPENAPI_TYPES[kind]]));
    schemas[schemaName] = {
      type: 'object',
      properties: { id: { type: ['string', 'integer'], readOnly: true }, ...props, created_at: { type: 'string', readOnly: true }, updated_at: { type: 'string', readOnly: true } },
    };
    schemas[`${schemaName}Input`] = { type: 'object', additionalProperties: false, required: r.required, properties: props };
    const security = [{ bearerAuth: [] }];
    const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
    const one = { description: schemaName, content: { 'application/json': { schema: { type: 'object', properties: { data: { $ref: `#/components/schemas/${schemaName}` } } } } } };
    const body = { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}Input` } } } };

    paths[`/${name}`] = {
      get: {
        operationId: `list_${name}`, summary: `List ${name}`, tags: [name], security,
        description: `Requires scope read:${name}. Cursor pagination, ordered by id.`,
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE } },
          { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'next_cursor from the previous page' },
        ],
        responses: {
          '200': { description: 'A page of results', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: `#/components/schemas/${schemaName}` } }, has_more: { type: 'boolean' }, next_cursor: { type: ['string', 'null'] } } } } } },
          ...errorResponses,
        },
      },
      ...(r.canCreate
        ? { post: { operationId: `create_${r.singular}`, summary: `Create a ${r.singular}`, tags: [name], security, description: `Requires scope write:${name}.`, requestBody: body, responses: { '201': one, '400': { $ref: '#/components/responses/ValidationError' }, ...errorResponses } } }
        : {}),
    };
    paths[`/${name}/{id}`] = {
      get: { operationId: `get_${r.singular}`, summary: `Get a ${r.singular}`, tags: [name], security, description: `Requires scope read:${name}.`, parameters: [idParam], responses: { '200': one, '404': { $ref: '#/components/responses/NotFound' }, ...errorResponses } },
      patch: { operationId: `update_${r.singular}`, summary: `Update a ${r.singular}`, tags: [name], security, description: `Requires scope write:${name}. PUT is accepted as an alias.`, parameters: [idParam], requestBody: body, responses: { '200': one, '400': { $ref: '#/components/responses/ValidationError' }, '404': { $ref: '#/components/responses/NotFound' }, ...errorResponses } },
      ...(r.canDelete
        ? { delete: { operationId: `delete_${r.singular}`, summary: `Delete a ${r.singular}`, tags: [name], security, description: `Requires scope write:${name}.`, parameters: [idParam], responses: { '204': { description: 'Deleted' }, '404': { $ref: '#/components/responses/NotFound' }, '409': { description: 'Record is referenced by other records', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }, ...errorResponses } } }
        : {}),
    };
  }

  const err = (description: string) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } });
  return {
    openapi: '3.1.0',
    info: {
      title: 'SmartCRM Public API',
      version: '1.0.0',
      description: `Authenticate with \`Authorization: Bearer sk_live_...\`. Create keys under Settings > API keys. Limit: ${RATE_LIMIT_PER_MINUTE} requests per minute per key (X-RateLimit-* headers). Errors use { "error": { "code", "message" } }.`,
    },
    servers: [{ url: serverUrl }],
    security: [{ bearerAuth: [] }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', description: 'API key, format sk_live_...' } },
      schemas,
      responses: {
        Unauthorized: err('Missing, invalid or revoked API key'),
        Forbidden: err('The key lacks the required scope'),
        NotFound: err('Record not found'),
        ValidationError: err('Invalid request body'),
        RateLimited: err('Rate limit exceeded; see Retry-After'),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Auth middleware
// ---------------------------------------------------------------------------
interface ApiKeyContext {
  id: string;
  userId: string;
  scopes: string[];
}

async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const m = /^Bearer\s+(sk_live_[A-Za-z0-9_-]{20,128})$/.exec(req.headers.authorization || '');
    if (!m) return apiError(res, 401, 'invalid_api_key', 'Provide a valid API key as "Authorization: Bearer sk_live_..."');
    const pepper = process.env.API_KEY_PEPPER;
    if (!pepper || !supabase) return apiError(res, 503, 'not_configured', 'The public API is not configured');

    const key = m[1];
    const { data: candidates, error } = await supabase
      .from('api_keys')
      .select('id, user_id, key_hash, scopes, last_used_at')
      .eq('prefix', key.slice(0, KEY_LOOKUP_LENGTH))
      .is('revoked_at', null)
      .limit(5);
    if (error) throw new Error(error.message);

    const hash = hashApiKey(key, pepper);
    let match: any = null;
    for (const c of candidates || []) {
      if (safeEqualHex(String(c.key_hash), hash)) match = c; // no early exit: constant work per candidate
    }
    if (!match) return apiError(res, 401, 'invalid_api_key', 'Invalid, revoked or unknown API key');

    // Rate limit: shared DB counter, falling back to a per-instance counter if the DB call fails.
    const windowMs = Math.floor(Date.now() / 60_000) * 60_000;
    let used: number;
    const { data: count, error: rpcError } = await supabase.rpc('bump_api_key_usage', {
      p_key_id: match.id,
      p_window: new Date(windowMs).toISOString(),
    });
    if (rpcError || typeof count !== 'number') {
      console.warn('api key usage counter unavailable:', rpcError?.message);
      used = memoryRateLimit(`key:${match.id}`, RATE_LIMIT_PER_MINUTE) ? 1 : RATE_LIMIT_PER_MINUTE + 1;
    } else {
      used = count;
    }
    res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT_PER_MINUTE));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_PER_MINUTE - used)));
    if (used > RATE_LIMIT_PER_MINUTE) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((windowMs + 60_000 - Date.now()) / 1000))));
      return apiError(res, 429, 'rate_limited', `Rate limit of ${RATE_LIMIT_PER_MINUTE} requests per minute exceeded`);
    }

    // Throttled last_used_at touch (at most once a minute per key); failures are irrelevant.
    if (!match.last_used_at || Date.now() - new Date(match.last_used_at).getTime() > 60_000) {
      Promise.resolve(supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', match.id)).catch(() => undefined);
    }

    (req as any).apiKey = { id: match.id, userId: match.user_id, scopes: match.scopes || [] } as ApiKeyContext;
    next();
  } catch (e: any) {
    console.error('API key auth failed:', e?.message || e);
    apiError(res, 500, 'internal_error', 'Internal server error');
  }
}

const needScope = (mode: 'read' | 'write', resource: string) => (req: Request, res: Response, next: NextFunction) => {
  const key = (req as any).apiKey as ApiKeyContext;
  if (!scopeAllows(key.scopes, mode, resource)) {
    return apiError(res, 403, 'insufficient_scope', `This API key needs the "${mode}:${resource}" scope`);
  }
  next();
};

const ID_PATTERN = /^[\w-]{1,64}$/;

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
export function registerPublicApiRoutes(app: Express): void {
  const sb = () => {
    if (!supabase) throw new Error('Database is not configured');
    return supabase;
  };
  const handle = (fn: (req: Request, res: Response, key: ApiKeyContext) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      await fn(req, res, (req as any).apiKey);
    } catch (e: any) {
      console.error(`${req.method} ${req.path} failed:`, e?.message || e);
      apiError(res, 500, 'internal_error', 'Internal server error');
    }
  };

  app.get('/api/v1/openapi.json', (_req, res) => {
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.json(buildOpenApi());
  });

  for (const [name, r] of Object.entries(RESOURCES)) {
    const base = `/api/v1/${name}`;

    app.get(base, authenticateApiKey, needScope('read', name), handle(async (req, res, key) => {
      const requested = req.query.limit === undefined ? DEFAULT_PAGE_SIZE : Number(req.query.limit);
      if (!Number.isInteger(requested) || requested < 1 || requested > MAX_PAGE_SIZE) {
        return apiError(res, 400, 'invalid_parameter', `limit must be an integer between 1 and ${MAX_PAGE_SIZE}`);
      }
      let cursor: string | null = null;
      if (req.query.cursor !== undefined) {
        cursor = decodeCursor(req.query.cursor);
        if (!cursor) return apiError(res, 400, 'invalid_parameter', 'cursor is invalid');
      }
      let q = sb().from(r.table).select('*').eq(r.owner, key.userId).order('id', { ascending: true }).limit(requested + 1);
      if (cursor) q = q.gt('id', cursor);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const rows = data || [];
      const hasMore = rows.length > requested;
      const page = rows.slice(0, requested);
      res.json({
        data: page.map((row: any) => stripHidden(r, row)),
        has_more: hasMore,
        next_cursor: hasMore ? encodeCursor((page[page.length - 1] as any).id) : null,
      });
    }));

    app.get(`${base}/:id`, authenticateApiKey, needScope('read', name), handle(async (req, res, key) => {
      if (!ID_PATTERN.test(req.params.id)) return apiError(res, 404, 'not_found', `${r.singular} not found`);
      const { data, error } = await sb().from(r.table).select('*').eq('id', req.params.id).eq(r.owner, key.userId).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return apiError(res, 404, 'not_found', `${r.singular} not found`);
      res.json({ data: stripHidden(r, data as any) });
    }));

    app.post(base, authenticateApiKey, needScope('write', name), handle(async (req, res, key) => {
      if (!r.canCreate) return apiError(res, 405, 'method_not_allowed', `${name} cannot be created through the API`);
      const v = validateBody(r, req.body, 'create');
      if (!v.ok) return apiError(res, 400, 'validation_error', 'Invalid request body', v.errors);
      const { data, error } = await sb()
        .from(r.table)
        .insert({ ...(r.defaults || {}), ...v.row, [r.owner]: key.userId })
        .select('*')
        .single();
      if (error) {
        if (error.code === '23503') return apiError(res, 400, 'validation_error', 'A referenced record does not exist');
        throw new Error(error.message);
      }
      res.status(201).json({ data: stripHidden(r, data as any) });
    }));

    const update = handle(async (req, res, key) => {
      if (!ID_PATTERN.test(req.params.id)) return apiError(res, 404, 'not_found', `${r.singular} not found`);
      const v = validateBody(r, req.body, 'update');
      if (!v.ok) return apiError(res, 400, 'validation_error', 'Invalid request body', v.errors);
      const patch = r.hasUpdatedAt ? { ...v.row, updated_at: new Date().toISOString() } : v.row;
      const { data, error } = await sb().from(r.table).update(patch).eq('id', req.params.id).eq(r.owner, key.userId).select('*').maybeSingle();
      if (error) {
        if (error.code === '23503') return apiError(res, 400, 'validation_error', 'A referenced record does not exist');
        throw new Error(error.message);
      }
      if (!data) return apiError(res, 404, 'not_found', `${r.singular} not found`);
      res.json({ data: stripHidden(r, data as any) });
    });
    app.patch(`${base}/:id`, authenticateApiKey, needScope('write', name), update);
    app.put(`${base}/:id`, authenticateApiKey, needScope('write', name), update);

    app.delete(`${base}/:id`, authenticateApiKey, needScope('write', name), handle(async (req, res, key) => {
      if (!r.canDelete) return apiError(res, 405, 'method_not_allowed', `${name} cannot be deleted through the API`);
      if (!ID_PATTERN.test(req.params.id)) return apiError(res, 404, 'not_found', `${r.singular} not found`);
      const { data, error } = await sb().from(r.table).delete().eq('id', req.params.id).eq(r.owner, key.userId).select('id');
      if (error) {
        if (error.code === '23503') return apiError(res, 409, 'conflict', `${r.singular} is referenced by other records`);
        throw new Error(error.message);
      }
      if (!data || data.length === 0) return apiError(res, 404, 'not_found', `${r.singular} not found`);
      res.status(204).send();
    }));
  }

  // Unknown /api/v1 paths get the same JSON error shape.
  app.use('/api/v1', (_req, res) => apiError(res, 404, 'not_found', 'Unknown endpoint'));

  // --------------------------- key management (session auth) ---------------------------
  const auth = requireAuth({ checkEntitlement: false });
  const KEY_COLUMNS = 'id, name, prefix, scopes, last_used_at, revoked_at, created_at';
  const manage = (fn: (req: Request, res: Response, userId: string) => Promise<unknown>) => async (req: Request, res: Response) => {
    try {
      await fn(req, res, (req as any).userId);
    } catch (e: any) {
      console.error(`${req.method} ${req.path} failed:`, e?.message || e);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  app.get('/api/public-api-keys', auth, manage(async (req, res, userId) => {
    const { data, error } = await sb().from('api_keys').select(KEY_COLUMNS).eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    res.json({ keys: data || [], scopes: ALL_SCOPES });
  }));

  app.post('/api/public-api-keys', auth, manage(async (req, res, userId) => {
    if (!process.env.API_KEY_PEPPER) return res.status(503).json({ error: 'API keys are not configured (API_KEY_PEPPER)' });
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const scopes = req.body?.scopes;
    if (!name || name.length > 80) return res.status(400).json({ error: 'name is required (max 80 characters)' });
    if (!Array.isArray(scopes) || scopes.length === 0 || scopes.some((s) => !ALL_SCOPES.includes(s))) {
      return res.status(400).json({ error: `scopes must be a non-empty subset of: ${ALL_SCOPES.join(', ')}` });
    }
    const { count } = await sb().from('api_keys').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('revoked_at', null);
    if ((count ?? 0) >= MAX_KEYS_PER_USER) return res.status(400).json({ error: `At most ${MAX_KEYS_PER_USER} active keys` });

    const { key, prefix } = generateApiKey();
    const { data, error } = await sb()
      .from('api_keys')
      .insert({ user_id: userId, name, key_hash: hashApiKey(key, process.env.API_KEY_PEPPER), prefix, scopes: Array.from(new Set(scopes)) })
      .select(KEY_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    res.status(201).json({ key: data, secret: key }); // the only time the secret is returned
  }));

  app.delete('/api/public-api-keys/:id', auth, manage(async (req, res, userId) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return res.status(400).json({ error: 'Invalid key id' });
    const { data, error } = await sb()
      .from('api_keys')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .is('revoked_at', null)
      .select('id');
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return res.status(404).json({ error: 'Key not found' });
    res.status(204).send();
  }));
}

export default registerPublicApiRoutes;
