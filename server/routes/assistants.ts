/**
 * Assistants routes (OpenAI Responses API).
 * assistant = saved config, thread = chain of responses, messages = history.
 * Uses the service-role Supabase client, so every query is scoped by user_id explicitly.
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../supabase';
import { requireAuth } from './auth';
import { requireEntitlement } from '../middleware/entitlements';
import { FeatureKey } from '../types/entitlements';
import { createUserOpenAIClient } from './ai';
import { runChatTurn, sanitizeTools } from '../services/assistantChat';

const router = Router();
router.use(requireAuth(), requireEntitlement(FeatureKey.AI_TOOLS));

const uid = (req: Request): string => (req as any).userId;
const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);

function db(res: Response) {
  if (!supabase) {
    res.status(503).json({ error: 'Database not configured' });
    return null;
  }
  return supabase;
}

function fail(res: Response, error: any, status = 500) {
  console.error('[assistants]', error?.message ?? error);
  res.status(status).json({ error: error?.message ?? 'Request failed' });
}

async function getAssistant(client: NonNullable<typeof supabase>, userId: string, id: string) {
  const { data, error } = await client.from('ai_assistants').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function getThread(client: NonNullable<typeof supabase>, userId: string, id: string) {
  const { data, error } = await client.from('ai_threads').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

router.post('/create', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const name = str(req.body?.name);
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const { data, error } = await client
      .from('ai_assistants')
      .insert({
        user_id: uid(req),
        name,
        instructions: typeof req.body?.instructions === 'string' ? req.body.instructions : '',
        model: str(req.body?.model) ?? null,
        tools: sanitizeTools(req.body?.tools),
      })
      .select()
      .single();
    if (error) throw error;
    res.json({ assistant: data });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  try {
    const { data, error } = await client
      .from('ai_assistants')
      .select('*')
      .eq('user_id', uid(req))
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ assistants: data ?? [] });
  } catch (e) {
    fail(res, e);
  }
});

// Threads (declared before /:id so "threads" is not read as an assistant id)
router.post('/threads', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  try {
    const assistantId = str(req.body?.assistantId);
    if (assistantId && !(await getAssistant(client, uid(req), assistantId))) {
      return res.status(404).json({ error: 'Assistant not found' });
    }
    const { data, error } = await client
      .from('ai_threads')
      .insert({ user_id: uid(req), assistant_id: assistantId ?? null, title: str(req.body?.title) ?? null })
      .select()
      .single();
    if (error) throw error;
    res.json({ thread: data });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/threads/:id/messages', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  try {
    if (!(await getThread(client, uid(req), req.params.id))) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    const { data, error } = await client
      .from('ai_thread_messages')
      .select('id, thread_id, role, content, created_at')
      .eq('thread_id', req.params.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    res.json({ messages: data ?? [] });
  } catch (e) {
    fail(res, e);
  }
});

router.post('/chat', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const userId = uid(req);
  const message = str(req.body?.message);
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    let thread = str(req.body?.threadId) ? await getThread(client, userId, req.body.threadId) : null;
    if (str(req.body?.threadId) && !thread) return res.status(404).json({ error: 'Thread not found' });

    const assistantId = str(req.body?.assistantId) ?? thread?.assistant_id;
    if (!assistantId) return res.status(400).json({ error: 'assistantId is required' });
    const assistant = await getAssistant(client, userId, assistantId);
    if (!assistant) return res.status(404).json({ error: 'Assistant not found' });

    if (!thread) {
      const { data, error } = await client
        .from('ai_threads')
        .insert({ user_id: userId, assistant_id: assistant.id })
        .select()
        .single();
      if (error) throw error;
      thread = data;
    }

    // Per-user key if configured, else the env key inside openaiClient.
    const userAI = await createUserOpenAIClient(userId);
    let turn;
    try {
      turn = await runChatTurn({
        assistant,
        thread,
        message,
        client: userAI?.client,
        fallbackModel: userAI?.model,
      });
    } catch (e: any) {
      if (e?.message === 'OpenAI not configured') {
        return res.status(400).json({ error: 'No OpenAI API key configured. Add your key in Settings > API Keys.' });
      }
      return fail(res, e, e?.status && e.status >= 400 && e.status < 600 ? e.status : 502);
    }

    const now = new Date().toISOString();
    const { error: msgError } = await client.from('ai_thread_messages').insert([
      { thread_id: thread.id, role: 'user', content: message, created_at: now },
      { thread_id: thread.id, role: 'assistant', content: turn.text, created_at: new Date(Date.parse(now) + 1).toISOString() },
    ]);
    if (msgError) throw msgError;
    const { error: upError } = await client
      .from('ai_threads')
      .update({
        last_response_id: turn.responseId,
        assistant_id: assistant.id,
        title: thread.title ?? message.slice(0, 80),
        updated_at: now,
      })
      .eq('id', thread.id)
      .eq('user_id', userId);
    if (upError) throw upError;

    res.json({
      threadId: thread.id,
      message: turn.text,
      responseId: turn.responseId,
      usage: turn.usage,
      model: turn.model,
    });
  } catch (e) {
    fail(res, e);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  try {
    const assistant = await getAssistant(client, uid(req), req.params.id);
    if (!assistant) return res.status(404).json({ error: 'Assistant not found' });
    res.json({ assistant });
  } catch (e) {
    fail(res, e);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  const patch: Record<string, unknown> = {};
  if (str(req.body?.name)) patch.name = req.body.name;
  if (typeof req.body?.instructions === 'string') patch.instructions = req.body.instructions;
  if (req.body?.model !== undefined) patch.model = str(req.body.model) ?? null;
  if (req.body?.tools !== undefined) patch.tools = sanitizeTools(req.body.tools);
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });
  try {
    const { data, error } = await client
      .from('ai_assistants')
      .update(patch)
      .eq('id', req.params.id)
      .eq('user_id', uid(req))
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Assistant not found' });
    res.json({ assistant: data });
  } catch (e) {
    fail(res, e);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const client = db(res);
  if (!client) return;
  try {
    const { data, error } = await client
      .from('ai_assistants')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', uid(req))
      .select('id');
    if (error) throw error;
    if (!data?.length) return res.status(404).json({ error: 'Assistant not found' });
    res.json({ deleted: true, id: req.params.id });
  } catch (e) {
    fail(res, e);
  }
});

export default router;
