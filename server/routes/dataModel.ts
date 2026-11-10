import { Router, Request, Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth } from './auth';
import {
  ACTIONS,
  STANDARD_OBJECTS,
  FieldDef,
  FieldPermRow,
  ObjectPermRow,
  canDo,
  clampLimit,
  decodeCursor,
  encodeCursor,
  fieldAllowed,
  isUuid,
  maskData,
  parseFilters,
  validateEmail,
  validateFieldInput,
  validateObjectInput,
  validateRecordData,
} from '../services/dataModel';

/**
 * Data model API. Uses the service-role client, so EVERY query is scoped here:
 * owner ids come from the verified JWT (req.userId) or from team_members rows, never from the client.
 */
const router = Router();
router.use(requireAuth({ checkEntitlement: false }));

const uid = (req: Request): string => (req as any).userId;
const isStandard = (s: unknown): s is (typeof STANDARD_OBJECTS)[number] =>
  (STANDARD_OBJECTS as readonly string[]).includes(s as string);

const handler =
  (fn: (req: Request, res: Response, db: NonNullable<typeof supabase>) => Promise<unknown>) =>
  async (req: Request, res: Response) => {
    if (!supabase) return res.status(503).json({ error: 'Database not configured' });
    try {
      await fn(req, res, supabase);
    } catch (e: any) {
      console.error('dataModel route error:', e?.message || e);
      if (!res.headersSent) res.status(500).json({ error: 'Internal error' });
    }
  };

const dbError = (res: Response, error: { message: string; code?: string }) => {
  if (error.code === '23505') return res.status(409).json({ error: 'Already exists' });
  if (error.code === '23503') return res.status(400).json({ error: 'Invalid reference' });
  console.error('dataModel db error:', error.message);
  return res.status(500).json({ error: 'Database error' });
};

type Db = NonNullable<typeof supabase>;

interface Access {
  /** owners visible to the caller, own id first */
  owners: string[];
  roleByOwner: Map<string, string | null>;
}

async function loadAccess(db: Db, userId: string): Promise<Access> {
  const { data } = await db
    .from('team_members')
    .select('owner_id, role_id')
    .eq('member_id', userId)
    .eq('status', 'active');
  const roleByOwner = new Map<string, string | null>();
  for (const r of data ?? []) roleByOwner.set(r.owner_id, r.role_id);
  return { owners: [userId, ...roleByOwner.keys()], roleByOwner };
}

/** null perms === owner (full access). */
async function loadPerms(db: Db, userId: string, ownerId: string, access: Access) {
  if (ownerId === userId) return { perms: null as ObjectPermRow[] | null, fperms: null as FieldPermRow[] | null };
  const roleId = access.roleByOwner.get(ownerId);
  if (!roleId) return { perms: [] as ObjectPermRow[], fperms: [] as FieldPermRow[] };
  const [p, f] = await Promise.all([
    db.from('role_object_permissions').select('object_type, can_read, can_create, can_update, can_delete').eq('role_id', roleId),
    db.from('role_field_permissions').select('object_type, field, can_read, can_write').eq('role_id', roleId),
  ]);
  return { perms: (p.data ?? []) as ObjectPermRow[], fperms: (f.data ?? []) as FieldPermRow[] };
}

async function findObject(db: Db, access: Access, ref: unknown) {
  if (typeof ref !== 'string' || !ref) return null;
  let q = db.from('object_metadata').select('*').in('user_id', access.owners);
  q = isUuid(ref) ? q.eq('id', ref) : q.eq('name_plural', ref);
  const { data } = await q;
  const rows = (data ?? []) as any[];
  return rows.find((r) => r.user_id === access.owners[0]) ?? rows[0] ?? null;
}

// ---------------------------------------------------------------- objects
router.get('/objects', handler(async (req, res, db) => {
  const userId = uid(req);
  const access = await loadAccess(db, userId);
  const { data, error } = await db.from('object_metadata').select('*').in('user_id', access.owners).order('created_at');
  if (error) return dbError(res, error);
  const visible: any[] = [];
  for (const o of data ?? []) {
    if (o.user_id === userId) { visible.push(o); continue; }
    const { perms } = await loadPerms(db, userId, o.user_id, access);
    if (canDo(perms, o.id, 'read')) visible.push(o);
  }
  res.json({ objects: visible, standardObjects: STANDARD_OBJECTS });
}));

router.post('/objects', handler(async (req, res, db) => {
  const v = validateObjectInput(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { data, error } = await db.from('object_metadata').insert({ ...v.value, user_id: uid(req), is_system: false }).select().single();
  if (error) return dbError(res, error);
  res.status(201).json({ object: data });
}));

router.put('/objects/:id', handler(async (req, res, db) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const v = validateObjectInput(req.body, true);
  if (!v.ok) return res.status(400).json({ error: v.error });
  if (Object.keys(v.value).length === 0) return res.status(400).json({ error: 'Nothing to update' });
  const { data, error } = await db.from('object_metadata').update(v.value).eq('id', req.params.id).eq('user_id', uid(req)).select().maybeSingle();
  if (error) return dbError(res, error);
  if (!data) return res.status(404).json({ error: 'Object not found' });
  res.json({ object: data });
}));

router.delete('/objects/:id', handler(async (req, res, db) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const { data, error } = await db.from('object_metadata').delete().eq('id', req.params.id).eq('user_id', uid(req)).eq('is_system', false).select('id');
  if (error) return dbError(res, error);
  if (!data?.length) return res.status(404).json({ error: 'Object not found' });
  res.json({ deleted: true });
}));

// ---------------------------------------------------------------- fields
// Custom objects -> field_metadata. Standard objects (contacts/deals/tasks/companies) -> custom_field_definitions.
const toStdField = (r: any) => ({
  id: r.id, object_id: r.object_type, name: r.key, label: r.label, field_type: r.field_type,
  options: r.options ?? [], settings: {}, is_required: r.is_required, position: r.position, is_system: false,
});

router.get('/fields', handler(async (req, res, db) => {
  const userId = uid(req);
  const ref = req.query.object;
  if (isStandard(ref)) {
    const { data, error } = await db.from('custom_field_definitions').select('*').eq('user_id', userId).eq('object_type', ref).order('position');
    if (error) return dbError(res, error);
    return res.json({ fields: (data ?? []).map(toStdField) });
  }
  const access = await loadAccess(db, userId);
  const obj = await findObject(db, access, ref);
  if (!obj) return res.status(404).json({ error: 'Object not found' });
  const { perms, fperms } = await loadPerms(db, userId, obj.user_id, access);
  if (!canDo(perms, obj.id, 'read')) return res.status(403).json({ error: 'Forbidden' });
  const { data, error } = await db.from('field_metadata').select('*').eq('object_id', obj.id).eq('user_id', obj.user_id).order('position');
  if (error) return dbError(res, error);
  res.json({ fields: (data ?? []).filter((f) => fieldAllowed(fperms, obj.id, f.name, 'read')) });
}));

router.post('/fields', handler(async (req, res, db) => {
  const userId = uid(req);
  const v = validateFieldInput(req.body);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const f = v.value;
  const ref = req.body.object;
  if (isStandard(ref)) {
    const { count } = await db.from('custom_field_definitions').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('object_type', ref);
    const { data, error } = await db.from('custom_field_definitions').insert({
      user_id: userId, object_type: ref, key: f.name, label: f.label, field_type: f.field_type,
      options: f.options, is_required: f.is_required, position: f.position ?? count ?? 0,
    }).select().single();
    if (error) return dbError(res, error);
    return res.status(201).json({ field: toStdField(data) });
  }
  const obj = isUuid(ref) ? (await db.from('object_metadata').select('id').eq('id', ref).eq('user_id', userId).maybeSingle()).data : null;
  if (!obj) return res.status(404).json({ error: 'Object not found' });
  const { count } = await db.from('field_metadata').select('id', { count: 'exact', head: true }).eq('object_id', obj.id);
  const { data, error } = await db.from('field_metadata').insert({ ...f, object_id: obj.id, user_id: userId, position: f.position ?? count ?? 0 }).select().single();
  if (error) return dbError(res, error);
  res.status(201).json({ field: data });
}));

router.post('/fields/reorder', handler(async (req, res, db) => {
  const userId = uid(req);
  const { object: ref, ids } = req.body ?? {};
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every(isUuid)) return res.status(400).json({ error: 'ids must be an array of uuids' });
  const table = isStandard(ref) ? 'custom_field_definitions' : 'field_metadata';
  const scope = isStandard(ref) ? { col: 'object_type', val: ref } : { col: 'object_id', val: ref };
  if (!isStandard(ref) && !isUuid(ref)) return res.status(400).json({ error: 'Invalid object' });
  for (let i = 0; i < ids.length; i++) {
    const { error } = await db.from(table).update({ position: i }).eq('id', ids[i]).eq('user_id', userId).eq(scope.col, scope.val);
    if (error) return dbError(res, error);
  }
  res.json({ reordered: ids.length });
}));

router.put('/fields/:id', handler(async (req, res, db) => {
  const userId = uid(req);
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const std = req.body?.object && isStandard(req.body.object);
  const existing = std
    ? (await db.from('custom_field_definitions').select('field_type').eq('id', req.params.id).eq('user_id', userId).maybeSingle()).data
    : (await db.from('field_metadata').select('field_type, is_system').eq('id', req.params.id).eq('user_id', userId).maybeSingle()).data;
  if (!existing) return res.status(404).json({ error: 'Field not found' });
  if ((existing as any).is_system) return res.status(403).json({ error: 'System fields cannot be edited' });
  // Field type and name are immutable (stored values depend on them).
  const body = { ...req.body, field_type: (existing as any).field_type };
  delete body.name;
  const v = validateFieldInput(body, true);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const { field_type: _ft, ...changes } = v.value;
  if (Object.keys(changes).length === 0) return res.status(400).json({ error: 'Nothing to update' });
  if (std) {
    const { settings: _s, ...rest } = changes as any;
    const { data, error } = await db.from('custom_field_definitions').update(rest).eq('id', req.params.id).eq('user_id', userId).select().single();
    if (error) return dbError(res, error);
    return res.json({ field: toStdField(data) });
  }
  const { data, error } = await db.from('field_metadata').update(changes).eq('id', req.params.id).eq('user_id', userId).select().single();
  if (error) return dbError(res, error);
  res.json({ field: data });
}));

router.delete('/fields/:id', handler(async (req, res, db) => {
  const userId = uid(req);
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const table = isStandard(req.query.object) ? 'custom_field_definitions' : 'field_metadata';
  let q = db.from(table).delete().eq('id', req.params.id).eq('user_id', userId);
  if (table === 'field_metadata') q = q.eq('is_system', false);
  const { data, error } = await q.select('id');
  if (error) return dbError(res, error);
  if (!data?.length) return res.status(404).json({ error: 'Field not found' });
  res.json({ deleted: true });
}));

// ---------------------------------------------------------------- records
async function recordContext(req: Request, res: Response, db: Db, ref: unknown, action: (typeof ACTIONS)[number]) {
  const userId = uid(req);
  const access = await loadAccess(db, userId);
  const obj = await findObject(db, access, ref);
  if (!obj) { res.status(404).json({ error: 'Object not found' }); return null; }
  const { perms, fperms } = await loadPerms(db, userId, obj.user_id, access);
  if (!canDo(perms, obj.id, action)) { res.status(403).json({ error: 'Forbidden' }); return null; }
  const { data: fields } = await db.from('field_metadata').select('name, field_type, options, is_required').eq('object_id', obj.id).eq('user_id', obj.user_id);
  return { userId, obj, ownerId: obj.user_id as string, perms, fperms, fields: (fields ?? []) as FieldDef[] };
}

/** Rejects writes touching fields the caller may not write. */
const writableOrError = (ctx: { fperms: FieldPermRow[] | null; obj: any }, data: Record<string, unknown>) =>
  Object.keys(data).find((k) => !fieldAllowed(ctx.fperms, ctx.obj.id, k, 'write'));

router.get('/records', handler(async (req, res, db) => {
  const ctx = await recordContext(req, res, db, req.query.object, 'read');
  if (!ctx) return;
  const filters = parseFilters(req.query.filter, ctx.fields);
  if (!filters.ok) return res.status(400).json({ error: filters.error });
  const limit = clampLimit(req.query.limit);
  let q: any = db.from('records').select('*').eq('object_id', ctx.obj.id).eq('user_id', ctx.ownerId).is('deleted_at', null);
  for (const c of filters.value) {
    q = c.operator === 'not.is' ? q.not(c.column, 'is', null) : q.filter(c.column, c.operator, c.value);
  }
  if (typeof req.query.q === 'string' && req.query.q.trim()) {
    q = q.ilike('search_text', `%${req.query.q.trim().toLowerCase().slice(0, 100).replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  }
  if (req.query.cursor !== undefined) {
    const cur = decodeCursor(req.query.cursor);
    if (!cur) return res.status(400).json({ error: 'Invalid cursor' });
    q = q.or(`created_at.lt.${cur.created_at},and(created_at.eq.${cur.created_at},id.lt.${cur.id})`);
  }
  const { data, error } = await q.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(limit + 1);
  if (error) return dbError(res, error);
  const rows = (data ?? []) as any[];
  const page = rows.slice(0, limit).map((r) => ({ ...r, data: maskData(ctx.fperms, ctx.obj.id, r.data) }));
  res.json({ records: page, nextCursor: rows.length > limit ? encodeCursor(rows[limit - 1]) : null });
}));

router.post('/records', handler(async (req, res, db) => {
  const ctx = await recordContext(req, res, db, req.body?.object, 'create');
  if (!ctx) return;
  const v = validateRecordData(ctx.fields, req.body?.data ?? {}, false);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const denied = writableOrError(ctx, v.value);
  if (denied) return res.status(403).json({ error: `No write permission on field ${denied}` });
  const { data, error } = await db.from('records').insert({ object_id: ctx.obj.id, user_id: ctx.ownerId, data: v.value }).select().single();
  if (error) return dbError(res, error);
  res.status(201).json({ record: { ...data, data: maskData(ctx.fperms, ctx.obj.id, data.data) } });
}));

async function loadRecord(db: Db, access: Access, id: string) {
  const { data } = await db.from('records').select('*').eq('id', id).in('user_id', access.owners).is('deleted_at', null).maybeSingle();
  return data as any;
}

router.put('/records/:id', handler(async (req, res, db) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const access = await loadAccess(db, uid(req));
  const rec = await loadRecord(db, access, req.params.id);
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  const ctx = await recordContext(req, res, db, rec.object_id, 'update');
  if (!ctx) return;
  const v = validateRecordData(ctx.fields, req.body?.data ?? {}, true);
  if (!v.ok) return res.status(400).json({ error: v.error });
  const denied = writableOrError(ctx, v.value);
  if (denied) return res.status(403).json({ error: `No write permission on field ${denied}` });
  const merged = { ...rec.data, ...v.value };
  for (const [k, val] of Object.entries(merged)) if (val === null) delete merged[k];
  const { data, error } = await db.from('records').update({ data: merged }).eq('id', rec.id).eq('user_id', ctx.ownerId).select().single();
  if (error) return dbError(res, error);
  res.json({ record: { ...data, data: maskData(ctx.fperms, ctx.obj.id, data.data) } });
}));

router.delete('/records/:id', handler(async (req, res, db) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const access = await loadAccess(db, uid(req));
  const rec = await loadRecord(db, access, req.params.id);
  if (!rec) return res.status(404).json({ error: 'Record not found' });
  const ctx = await recordContext(req, res, db, rec.object_id, 'delete');
  if (!ctx) return;
  const { error } = await db.from('records').update({ deleted_at: new Date().toISOString() }).eq('id', rec.id).eq('user_id', ctx.ownerId);
  if (error) return dbError(res, error);
  res.json({ deleted: true });
}));

// ---------------------------------------------------------------- custom values on standard objects
router.get('/custom-values/:objectType/:recordId', handler(async (req, res, db) => {
  if (!isStandard(req.params.objectType)) return res.status(400).json({ error: 'Unknown object type' });
  const { data, error } = await db.from('custom_field_values').select('field_id, value')
    .eq('user_id', uid(req)).eq('object_type', req.params.objectType).eq('record_id', req.params.recordId);
  if (error) return dbError(res, error);
  res.json({ values: data ?? [] });
}));

router.put('/custom-values/:objectType/:recordId', handler(async (req, res, db) => {
  const userId = uid(req);
  const { objectType, recordId } = req.params;
  if (!isStandard(objectType)) return res.status(400).json({ error: 'Unknown object type' });
  if (!/^[0-9a-zA-Z-]{1,64}$/.test(recordId)) return res.status(400).json({ error: 'Invalid record id' });
  const values = req.body?.values;
  if (!values || typeof values !== 'object' || Array.isArray(values)) return res.status(400).json({ error: 'values must be an object keyed by field key' });
  // The record must belong to the caller (legacy tables key ownership on profile_id).
  const owned = await db.from(objectType).select('id').eq('id', recordId).eq('profile_id', userId).maybeSingle();
  if (owned.error || !owned.data) return res.status(404).json({ error: 'Record not found' });
  const { data: defs, error: defErr } = await db.from('custom_field_definitions').select('id, key, field_type, options').eq('user_id', userId).eq('object_type', objectType);
  if (defErr) return dbError(res, defErr);
  const byKey = new Map((defs ?? []).map((d: any) => [d.key, d]));
  const rows: any[] = [];
  const fieldDefs: FieldDef[] = (defs ?? []).map((d: any) => ({ name: d.key, field_type: d.field_type, options: d.options }));
  const v = validateRecordData(fieldDefs, values, true);
  if (!v.ok) return res.status(400).json({ error: v.error });
  for (const [k, val] of Object.entries(v.value)) {
    rows.push({ user_id: userId, object_type: objectType, record_id: recordId, field_id: (byKey.get(k) as any).id, value: val });
  }
  if (rows.length) {
    const { error } = await db.from('custom_field_values').upsert(rows, { onConflict: 'object_type,record_id,field_id' });
    if (error) return dbError(res, error);
  }
  res.json({ updated: rows.length });
}));

// ---------------------------------------------------------------- roles (owner-managed)
const roleName = (v: unknown) => (typeof v === 'string' && v.trim() && v.length <= 100 ? v.trim() : null);

router.get('/roles', handler(async (req, res, db) => {
  const userId = uid(req);
  const { data: roles, error } = await db.from('roles').select('*').eq('owner_id', userId).order('created_at');
  if (error) return dbError(res, error);
  const ids = (roles ?? []).map((r) => r.id);
  const [p, f] = ids.length
    ? await Promise.all([
        db.from('role_object_permissions').select('*').in('role_id', ids),
        db.from('role_field_permissions').select('*').in('role_id', ids),
      ])
    : [{ data: [] }, { data: [] }];
  res.json({
    roles: (roles ?? []).map((r) => ({
      ...r,
      objectPermissions: (p.data ?? []).filter((x: any) => x.role_id === r.id),
      fieldPermissions: (f.data ?? []).filter((x: any) => x.role_id === r.id),
    })),
  });
}));

/** Validates and normalises the permission arrays; object types must be standard objects or the owner's object ids. */
async function parsePermissions(db: Db, userId: string, body: any) {
  const { data: objs } = await db.from('object_metadata').select('id').eq('user_id', userId);
  const allowed = new Set<string>([...STANDARD_OBJECTS, ...(objs ?? []).map((o: any) => o.id)]);
  const bool = (v: unknown) => v === true;
  const op = Array.isArray(body.objectPermissions) ? body.objectPermissions : [];
  const fp = Array.isArray(body.fieldPermissions) ? body.fieldPermissions : [];
  if (op.length > 200 || fp.length > 2000) return { error: 'Too many permission rows' };
  const objectPermissions: Omit<ObjectPermRow, never>[] = [];
  for (const p of op) {
    if (!allowed.has(p?.object_type)) return { error: `Unknown object_type ${String(p?.object_type)}` };
    objectPermissions.push({ object_type: p.object_type, can_read: bool(p.can_read), can_create: bool(p.can_create), can_update: bool(p.can_update), can_delete: bool(p.can_delete) });
  }
  const fieldPermissions: FieldPermRow[] = [];
  for (const p of fp) {
    if (!allowed.has(p?.object_type) || typeof p?.field !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/.test(p.field)) return { error: 'Invalid field permission' };
    fieldPermissions.push({ object_type: p.object_type, field: p.field, can_read: p.can_read !== false, can_write: p.can_write !== false && p.can_read !== false });
  }
  return { objectPermissions, fieldPermissions };
}

async function savePermissions(db: Db, roleId: string, perms: { objectPermissions: ObjectPermRow[]; fieldPermissions: FieldPermRow[] }) {
  await db.from('role_object_permissions').delete().eq('role_id', roleId);
  await db.from('role_field_permissions').delete().eq('role_id', roleId);
  if (perms.objectPermissions.length) await db.from('role_object_permissions').insert(perms.objectPermissions.map((p) => ({ ...p, role_id: roleId })));
  if (perms.fieldPermissions.length) await db.from('role_field_permissions').insert(perms.fieldPermissions.map((p) => ({ ...p, role_id: roleId })));
}

router.post('/roles', handler(async (req, res, db) => {
  const userId = uid(req);
  const name = roleName(req.body?.name);
  if (!name) return res.status(400).json({ error: 'name is required' });
  const perms = await parsePermissions(db, userId, req.body);
  if ('error' in perms) return res.status(400).json({ error: perms.error });
  const { data, error } = await db.from('roles').insert({
    owner_id: userId, name, description: typeof req.body.description === 'string' ? req.body.description.slice(0, 500) : null,
    is_default: req.body.is_default === true,
  }).select().single();
  if (error) return dbError(res, error);
  await savePermissions(db, data.id, perms as any);
  res.status(201).json({ role: data });
}));

router.put('/roles/:id', handler(async (req, res, db) => {
  const userId = uid(req);
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const update: Record<string, unknown> = {};
  if (req.body?.name !== undefined) { const n = roleName(req.body.name); if (!n) return res.status(400).json({ error: 'Invalid name' }); update.name = n; }
  if (req.body?.description !== undefined) update.description = typeof req.body.description === 'string' ? req.body.description.slice(0, 500) : null;
  if (req.body?.is_default !== undefined) update.is_default = req.body.is_default === true;
  const { data: role, error } = Object.keys(update).length
    ? await db.from('roles').update(update).eq('id', req.params.id).eq('owner_id', userId).select().maybeSingle()
    : await db.from('roles').select().eq('id', req.params.id).eq('owner_id', userId).maybeSingle();
  if (error) return dbError(res, error);
  if (!role) return res.status(404).json({ error: 'Role not found' });
  if (req.body?.objectPermissions !== undefined || req.body?.fieldPermissions !== undefined) {
    const perms = await parsePermissions(db, userId, req.body);
    if ('error' in perms) return res.status(400).json({ error: perms.error });
    await savePermissions(db, role.id, perms as any);
  }
  res.json({ role });
}));

router.delete('/roles/:id', handler(async (req, res, db) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const { data, error } = await db.from('roles').delete().eq('id', req.params.id).eq('owner_id', uid(req)).select('id');
  if (error) return dbError(res, error);
  if (!data?.length) return res.status(404).json({ error: 'Role not found' });
  res.json({ deleted: true });
}));

// ---------------------------------------------------------------- team (owner-managed)
const MEMBER_STATUSES = ['active', 'disabled'];

async function ownRole(db: Db, userId: string, roleId: unknown) {
  if (roleId === undefined || roleId === null) return { ok: true as const, roleId: null };
  if (!isUuid(roleId)) return { ok: false as const };
  const { data } = await db.from('roles').select('id').eq('id', roleId).eq('owner_id', userId).maybeSingle();
  return data ? { ok: true as const, roleId } : { ok: false as const };
}

router.get('/team', handler(async (req, res, db) => {
  const { data, error } = await db.from('team_members').select('*, roles(name)').eq('owner_id', uid(req)).order('created_at');
  if (error) return dbError(res, error);
  res.json({ members: data ?? [] });
}));

router.post('/team/invite', handler(async (req, res, db) => {
  const userId = uid(req);
  const email = validateEmail(req.body?.email);
  if (!email) return res.status(400).json({ error: 'Valid email is required' });
  const role = await ownRole(db, userId, req.body?.roleId);
  if (!role.ok) return res.status(400).json({ error: 'Invalid role' });

  // Same mechanism as supabase/functions/invite-user (auth.admin invite), called with the service client.
  let memberId: string | null = null;
  const invited = await db.auth.admin.inviteUserByEmail(email);
  if (invited.error) {
    // Already registered: look the user up so they can be added to the team directly.
    const list = await db.auth.admin.listUsers({ perPage: 1000 });
    memberId = list.data?.users?.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
    if (!memberId) return res.status(400).json({ error: 'Could not invite this email' });
  } else {
    memberId = invited.data.user?.id ?? null;
  }
  if (memberId === userId) return res.status(400).json({ error: 'You cannot invite yourself' });
  const { data, error } = await db.from('team_members').upsert(
    { owner_id: userId, member_id: memberId, email, role_id: role.roleId, status: 'active' },
    { onConflict: 'owner_id,email' }
  ).select().single();
  if (error) return dbError(res, error);
  res.status(201).json({ member: data });
}));

router.put('/team/:id', handler(async (req, res, db) => {
  const userId = uid(req);
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const update: Record<string, unknown> = {};
  if (req.body?.roleId !== undefined) {
    const role = await ownRole(db, userId, req.body.roleId);
    if (!role.ok) return res.status(400).json({ error: 'Invalid role' });
    update.role_id = role.roleId;
  }
  if (req.body?.status !== undefined) {
    if (!MEMBER_STATUSES.includes(req.body.status)) return res.status(400).json({ error: 'Invalid status' });
    update.status = req.body.status;
  }
  if (!Object.keys(update).length) return res.status(400).json({ error: 'Nothing to update' });
  const { data, error } = await db.from('team_members').update(update).eq('id', req.params.id).eq('owner_id', userId).select().maybeSingle();
  if (error) return dbError(res, error);
  if (!data) return res.status(404).json({ error: 'Member not found' });
  res.json({ member: data });
}));

router.delete('/team/:id', handler(async (req, res, db) => {
  if (!isUuid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const { data, error } = await db.from('team_members').delete().eq('id', req.params.id).eq('owner_id', uid(req)).select('id');
  if (error) return dbError(res, error);
  if (!data?.length) return res.status(404).json({ error: 'Member not found' });
  res.json({ deleted: true });
}));

export function registerDataModelRoutes(app: any): void {
  app.use('/api/data-model', router);
}

export default router;
