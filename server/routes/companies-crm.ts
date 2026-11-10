/**
 * CRM companies + record targets (distinct from companies.ts, which is tenant administration).
 *
 *   GET/POST        /api/crm/companies
 *   GET/PUT/DELETE  /api/crm/companies/:id
 *   GET/POST        /api/crm/companies/:id/contacts          (list / link { contactId })
 *   DELETE          /api/crm/companies/:id/contacts/:contactId
 *   GET             /api/crm/contacts/:contactId/company
 *   GET/POST        /api/crm/targets/:type/:recordId/notes   (list / link { noteId })
 *   DELETE          /api/crm/targets/:type/:recordId/notes/:noteId
 *   GET/POST        /api/crm/targets/:type/:recordId/tasks   (list / link { taskId })
 *   DELETE          /api/crm/targets/:type/:recordId/tasks/:taskId
 *
 * Notes and tasks themselves are created through /api/notes and /api/tasks and then linked here.
 * Data access uses the service-role client, so every query is explicitly scoped to the caller.
 */
import type { Express, Request, Response } from 'express';
import { requireAuth } from './auth';
import { supabase } from '../supabase';

const OBJECT_TYPES = ['contact', 'company', 'deal'] as const;
type ObjectType = (typeof OBJECT_TYPES)[number];

const guard = requireAuth({ checkEntitlement: false });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPANY_FIELDS = ['name', 'domain', 'industry', 'size', 'phone', 'address'] as const;

const uid = (req: Request): string => (req as any).userId;

function toApi(row: any) {
  return {
    id: row.id,
    name: row.name,
    domain: row.domain,
    industry: row.industry,
    size: row.size,
    phone: row.phone,
    address: row.address ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function contactToApi(row: any) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    status: row.status,
  };
}

function pickCompanyFields(body: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of COMPANY_FIELDS) {
    if (body && body[f] !== undefined) out[f] = body[f];
  }
  if (typeof out.name === 'string') out.name = out.name.trim();
  if (out.address !== undefined && (typeof out.address !== 'object' || out.address === null)) delete out.address;
  return out;
}

function fail(res: Response, status: number, error: string) {
  return res.status(status).json({ error });
}

export function registerCompaniesCrmRoutes(app: Express): void {
  const db = (res: Response) => {
    if (!supabase) {
      fail(res, 503, 'Database is not configured');
      return null;
    }
    return supabase;
  };

  const ownsCompany = async (client: NonNullable<typeof supabase>, userId: string, id: string) => {
    if (!UUID.test(id)) return false;
    const { data } = await client.from('crm_companies').select('id').eq('id', id).eq('user_id', userId).maybeSingle();
    return !!data;
  };

  // ---------------------------------------------------------------- companies
  app.get('/api/crm/companies', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    try {
      let query = client.from('crm_companies').select('*').eq('user_id', uid(req)).order('name');
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      if (search) query = query.ilike('name', `%${search.replace(/[%_,()]/g, ' ')}%`);
      const { data, error } = await query;
      if (error) throw error;
      const rows = data ?? [];
      const counts = new Map<string, number>();
      if (rows.length) {
        const { data: linked } = await client
          .from('contacts')
          .select('company_id')
          .eq('profile_id', uid(req))
          .in('company_id', rows.map((r: any) => r.id));
        for (const c of linked ?? []) counts.set((c as any).company_id, (counts.get((c as any).company_id) ?? 0) + 1);
      }
      res.json(rows.map((r: any) => ({ ...toApi(r), contactCount: counts.get(r.id) ?? 0 })));
    } catch (e) {
      console.error('Error listing companies:', e);
      fail(res, 500, 'Failed to fetch companies');
    }
  });

  app.post('/api/crm/companies', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    const fields = pickCompanyFields(req.body);
    if (!fields.name) return fail(res, 400, 'name is required');
    try {
      const { data, error } = await client
        .from('crm_companies')
        .insert({ ...fields, user_id: uid(req) })
        .select()
        .single();
      if (error) throw error;
      res.status(201).json(toApi(data));
    } catch (e) {
      console.error('Error creating company:', e);
      fail(res, 500, 'Failed to create company');
    }
  });

  app.get('/api/crm/companies/:id', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    if (!UUID.test(req.params.id)) return fail(res, 404, 'Company not found');
    try {
      const { data, error } = await client
        .from('crm_companies')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', uid(req))
        .maybeSingle();
      if (error) throw error;
      if (!data) return fail(res, 404, 'Company not found');
      res.json(toApi(data));
    } catch (e) {
      console.error('Error fetching company:', e);
      fail(res, 500, 'Failed to fetch company');
    }
  });

  app.put('/api/crm/companies/:id', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    if (!UUID.test(req.params.id)) return fail(res, 404, 'Company not found');
    const fields = pickCompanyFields(req.body);
    if ('name' in fields && !fields.name) return fail(res, 400, 'name cannot be empty');
    try {
      const { data, error } = await client
        .from('crm_companies')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .eq('user_id', uid(req))
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) return fail(res, 404, 'Company not found');
      res.json(toApi(data));
    } catch (e) {
      console.error('Error updating company:', e);
      fail(res, 500, 'Failed to update company');
    }
  });

  app.delete('/api/crm/companies/:id', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    if (!UUID.test(req.params.id)) return fail(res, 404, 'Company not found');
    try {
      const { data, error } = await client
        .from('crm_companies')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', uid(req))
        .select('id');
      if (error) throw error;
      if (!data?.length) return fail(res, 404, 'Company not found');
      // contacts.company_id is ON DELETE SET NULL; remove dangling targets too.
      await client.from('note_targets').delete().eq('user_id', uid(req)).eq('object_type', 'company').eq('record_id', req.params.id);
      await client.from('task_targets').delete().eq('user_id', uid(req)).eq('object_type', 'company').eq('record_id', req.params.id);
      res.json({ success: true });
    } catch (e) {
      console.error('Error deleting company:', e);
      fail(res, 500, 'Failed to delete company');
    }
  });

  // ---------------------------------------------------------- contact <-> company
  app.get('/api/crm/companies/:id/contacts', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    try {
      if (!(await ownsCompany(client, uid(req), req.params.id))) return fail(res, 404, 'Company not found');
      const { data, error } = await client
        .from('contacts')
        .select('id, first_name, last_name, email, phone, company, status')
        .eq('company_id', req.params.id)
        .eq('profile_id', uid(req));
      if (error) throw error;
      res.json((data ?? []).map(contactToApi));
    } catch (e) {
      console.error('Error fetching company contacts:', e);
      fail(res, 500, 'Failed to fetch contacts');
    }
  });

  app.post('/api/crm/companies/:id/contacts', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    const contactId = Number(req.body?.contactId);
    if (!Number.isInteger(contactId)) return fail(res, 400, 'contactId is required');
    try {
      if (!(await ownsCompany(client, uid(req), req.params.id))) return fail(res, 404, 'Company not found');
      const { data, error } = await client
        .from('contacts')
        .update({ company_id: req.params.id })
        .eq('id', contactId)
        .eq('profile_id', uid(req))
        .select('id');
      if (error) throw error;
      if (!data?.length) return fail(res, 404, 'Contact not found');
      res.json({ success: true });
    } catch (e) {
      console.error('Error linking contact:', e);
      fail(res, 500, 'Failed to link contact');
    }
  });

  app.delete('/api/crm/companies/:id/contacts/:contactId', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    const contactId = Number(req.params.contactId);
    if (!Number.isInteger(contactId)) return fail(res, 400, 'Invalid contact id');
    try {
      const { error } = await client
        .from('contacts')
        .update({ company_id: null })
        .eq('id', contactId)
        .eq('company_id', req.params.id)
        .eq('profile_id', uid(req));
      if (error) throw error;
      res.json({ success: true });
    } catch (e) {
      console.error('Error unlinking contact:', e);
      fail(res, 500, 'Failed to unlink contact');
    }
  });

  app.get('/api/crm/contacts/:contactId/company', guard, async (req, res) => {
    const client = db(res);
    if (!client) return;
    const contactId = Number(req.params.contactId);
    if (!Number.isInteger(contactId)) return fail(res, 400, 'Invalid contact id');
    try {
      const { data: contact, error } = await client
        .from('contacts')
        .select('company_id')
        .eq('id', contactId)
        .eq('profile_id', uid(req))
        .maybeSingle();
      if (error) throw error;
      if (!contact?.company_id) return res.json(null);
      const { data: company } = await client
        .from('crm_companies')
        .select('*')
        .eq('id', contact.company_id)
        .eq('user_id', uid(req))
        .maybeSingle();
      res.json(company ? toApi(company) : null);
    } catch (e) {
      console.error('Error fetching contact company:', e);
      fail(res, 500, 'Failed to fetch company');
    }
  });

  // ------------------------------------------------------------------ targets
  const targetParams = (req: Request, res: Response): { type: ObjectType; recordId: string } | null => {
    const type = req.params.type as ObjectType;
    if (!OBJECT_TYPES.includes(type)) {
      fail(res, 400, `type must be one of ${OBJECT_TYPES.join(', ')}`);
      return null;
    }
    const recordId = req.params.recordId;
    if (!recordId || recordId.length > 64) {
      fail(res, 400, 'Invalid record id');
      return null;
    }
    return { type, recordId };
  };

  app.get('/api/crm/targets/:type/:recordId/notes', guard, async (req, res) => {
    const client = db(res);
    const t = targetParams(req, res);
    if (!client || !t) return;
    try {
      const { data: links, error } = await client
        .from('note_targets')
        .select('note_id')
        .eq('user_id', uid(req))
        .eq('object_type', t.type)
        .eq('record_id', t.recordId);
      if (error) throw error;
      const ids = (links ?? []).map((l: any) => l.note_id);
      if (!ids.length) return res.json([]);
      const { data: notes, error: nErr } = await client
        .from('notes')
        .select('*')
        .in('id', ids)
        .eq('profile_id', uid(req))
        .order('created_at', { ascending: false });
      if (nErr) throw nErr;
      res.json(
        (notes ?? []).map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          createdAt: n.created_at,
          updatedAt: n.updated_at,
        }))
      );
    } catch (e) {
      console.error('Error fetching target notes:', e);
      fail(res, 500, 'Failed to fetch notes');
    }
  });

  app.post('/api/crm/targets/:type/:recordId/notes', guard, async (req, res) => {
    const client = db(res);
    const t = targetParams(req, res);
    if (!client || !t) return;
    const noteId = req.body?.noteId;
    if (typeof noteId !== 'string' || !UUID.test(noteId)) return fail(res, 400, 'noteId is required');
    try {
      const { data: note } = await client.from('notes').select('id').eq('id', noteId).eq('profile_id', uid(req)).maybeSingle();
      if (!note) return fail(res, 404, 'Note not found');
      const { error } = await client
        .from('note_targets')
        .upsert(
          { user_id: uid(req), note_id: noteId, object_type: t.type, record_id: t.recordId },
          { onConflict: 'note_id,object_type,record_id' }
        );
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (e) {
      console.error('Error linking note:', e);
      fail(res, 500, 'Failed to link note');
    }
  });

  app.delete('/api/crm/targets/:type/:recordId/notes/:noteId', guard, async (req, res) => {
    const client = db(res);
    const t = targetParams(req, res);
    if (!client || !t) return;
    try {
      const { error } = await client
        .from('note_targets')
        .delete()
        .eq('user_id', uid(req))
        .eq('note_id', req.params.noteId)
        .eq('object_type', t.type)
        .eq('record_id', t.recordId);
      if (error) throw error;
      res.json({ success: true });
    } catch (e) {
      console.error('Error unlinking note:', e);
      fail(res, 500, 'Failed to unlink note');
    }
  });

  app.get('/api/crm/targets/:type/:recordId/tasks', guard, async (req, res) => {
    const client = db(res);
    const t = targetParams(req, res);
    if (!client || !t) return;
    try {
      const { data: links, error } = await client
        .from('task_targets')
        .select('task_id')
        .eq('user_id', uid(req))
        .eq('object_type', t.type)
        .eq('record_id', t.recordId);
      if (error) throw error;
      const ids = (links ?? []).map((l: any) => l.task_id);
      if (!ids.length) return res.json([]);
      const { data: tasks, error: tErr } = await client
        .from('tasks')
        .select('*')
        .in('id', ids)
        .eq('profile_id', uid(req))
        .order('created_at', { ascending: false });
      if (tErr) throw tErr;
      res.json(
        (tasks ?? []).map((k: any) => ({
          id: k.id,
          title: k.title,
          description: k.description,
          status: k.status,
          priority: k.priority,
          dueDate: k.due_date,
          createdAt: k.created_at,
        }))
      );
    } catch (e) {
      console.error('Error fetching target tasks:', e);
      fail(res, 500, 'Failed to fetch tasks');
    }
  });

  app.post('/api/crm/targets/:type/:recordId/tasks', guard, async (req, res) => {
    const client = db(res);
    const t = targetParams(req, res);
    if (!client || !t) return;
    const taskId = Number(req.body?.taskId);
    if (!Number.isInteger(taskId)) return fail(res, 400, 'taskId is required');
    try {
      const { data: task } = await client.from('tasks').select('id').eq('id', taskId).eq('profile_id', uid(req)).maybeSingle();
      if (!task) return fail(res, 404, 'Task not found');
      const { error } = await client
        .from('task_targets')
        .upsert(
          { user_id: uid(req), task_id: taskId, object_type: t.type, record_id: t.recordId },
          { onConflict: 'task_id,object_type,record_id' }
        );
      if (error) throw error;
      res.status(201).json({ success: true });
    } catch (e) {
      console.error('Error linking task:', e);
      fail(res, 500, 'Failed to link task');
    }
  });

  app.delete('/api/crm/targets/:type/:recordId/tasks/:taskId', guard, async (req, res) => {
    const client = db(res);
    const t = targetParams(req, res);
    if (!client || !t) return;
    const taskId = Number(req.params.taskId);
    if (!Number.isInteger(taskId)) return fail(res, 400, 'Invalid task id');
    try {
      const { error } = await client
        .from('task_targets')
        .delete()
        .eq('user_id', uid(req))
        .eq('task_id', taskId)
        .eq('object_type', t.type)
        .eq('record_id', t.recordId);
      if (error) throw error;
      res.json({ success: true });
    } catch (e) {
      console.error('Error unlinking task:', e);
      fail(res, 500, 'Failed to unlink task');
    }
  });
}
