import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { registerAllActions } from '../actions';

const dbCalls: Array<{ table: string; op: string; args: unknown[] }> = [];
let dbResult: { data: any; error: any } = { data: null, error: null };

vi.mock('../supabase', () => ({
  supabase: {
    from: (table: string) => {
      const b: any = {};
      for (const op of ['insert', 'update', 'select', 'eq']) {
        b[op] = (...args: unknown[]) => {
          dbCalls.push({ table, op, args });
          return b;
        };
      }
      b.single = () => Promise.resolve(dbResult);
      b.then = (res: any, rej: any) => Promise.resolve(dbResult).then(res, rej);
      return b;
    },
  },
}));

const sgSend = vi.fn();
vi.mock('@sendgrid/mail', () => ({ default: { setApiKey: vi.fn(), send: (...a: unknown[]) => sgSend(...a) } }));

describe('Actions', () => {
  let engine: WorkflowEngine;
  const fetchMock = vi.fn();
  const env = { ...process.env };

  beforeEach(() => {
    engine = new WorkflowEngine();
    registerAllActions(engine);
    dbCalls.length = 0;
    dbResult = { data: null, error: null };
    sgSend.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...env };
  });

  const createContext = (extra: Record<string, unknown> = {}) => ({
    workflowId: 'wf-test',
    runId: 'run-test',
    triggerType: 'MANUAL' as const,
    userId: 'user-1',
    timestamp: new Date(),
    variables: {},
    ...extra,
  });

  describe('SEND_EMAIL', () => {
    it('sends through SendGrid', async () => {
      process.env.SENDGRID_API_KEY = 'SG.test';
      sgSend.mockResolvedValue([{ headers: { 'x-message-id': 'msg-1' } }]);
      const result = await engine.executeAction('SEND_EMAIL', createContext(), {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body content',
      });
      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({ messageId: 'msg-1', to: 'test@example.com' });
      expect(sgSend).toHaveBeenCalledWith(expect.objectContaining({ to: 'test@example.com', text: 'Test body content' }));
    });

    it('fails clearly when email is not configured', async () => {
      delete process.env.SENDGRID_API_KEY;
      const result = await engine.executeAction('SEND_EMAIL', createContext(), {
        to: 'a@b.com',
        subject: 's',
        body: 'b',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Email not configured');
    });

    it('should fail when to is missing', async () => {
      const result = await engine.executeAction('SEND_EMAIL', createContext(), { subject: 'Test', body: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required');
    });
  });

  describe('UPDATE_FIELD', () => {
    it('updates a whitelisted field scoped to the owner', async () => {
      dbResult = { data: [{ id: 1 }], error: null };
      const result = await engine.executeAction('UPDATE_FIELD', createContext(), {
        objectType: 'contact',
        recordId: 1,
        field: 'status',
        value: 'active',
      });
      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({ field: 'status', newValue: 'active' });
      expect(dbCalls).toContainEqual({ table: 'contacts', op: 'update', args: [{ status: 'active' }] });
      expect(dbCalls).toContainEqual({ table: 'contacts', op: 'eq', args: ['profile_id', 'user-1'] });
    });

    it('rejects non-whitelisted fields and tables', async () => {
      const badField = await engine.executeAction('UPDATE_FIELD', createContext(), {
        objectType: 'contact', recordId: 1, field: 'profile_id', value: 'x',
      });
      expect(badField.success).toBe(false);
      expect(badField.error).toContain('not allowed');
      const badTable = await engine.executeAction('UPDATE_FIELD', createContext(), {
        objectType: 'profiles', recordId: 1, field: 'role', value: 'admin',
      });
      expect(badTable.error).toContain('Unsupported objectType');
      expect(dbCalls).toHaveLength(0);
    });

    it('fails when the record is not found', async () => {
      dbResult = { data: [], error: null };
      const result = await engine.executeAction('UPDATE_FIELD', createContext(), {
        objectType: 'deal', recordId: 9, field: 'stage', value: 'won',
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('CREATE_TASK / CREATE_DEAL / CREATE_CONTACT', () => {
    it('creates a task owned by the run user', async () => {
      dbResult = { data: { id: 42 }, error: null };
      const result = await engine.executeAction('CREATE_TASK', createContext(), { title: 'Follow up' });
      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({ taskId: 42, title: 'Follow up' });
      expect(dbCalls[0]).toEqual({
        table: 'tasks',
        op: 'insert',
        args: [{ title: 'Follow up', profile_id: 'user-1' }],
      });
    });

    it('creates a deal mapping amount to value', async () => {
      dbResult = { data: { id: 7 }, error: null };
      const result = await engine.executeAction('CREATE_DEAL', createContext(), { title: 'New Deal', amount: 5000 });
      expect(result.output).toMatchObject({ dealId: 7 });
      expect(dbCalls[0].args[0]).toMatchObject({ title: 'New Deal', value: 5000, profile_id: 'user-1' });
    });

    it('creates a contact', async () => {
      dbResult = { data: { id: 3 }, error: null };
      const result = await engine.executeAction('CREATE_CONTACT', createContext(), {
        email: 'new@example.com', firstName: 'John', lastName: 'Doe',
      });
      expect(result.output).toMatchObject({ contactId: 3, email: 'new@example.com' });
      expect(dbCalls[0].args[0]).toMatchObject({ first_name: 'John', last_name: 'Doe', profile_id: 'user-1' });
    });

    it('surfaces database errors', async () => {
      dbResult = { data: null, error: { message: 'boom' } };
      const result = await engine.executeAction('CREATE_TASK', createContext(), { title: 'x' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('boom');
    });

    it('refuses to write without a user', async () => {
      const result = await engine.executeAction('CREATE_TASK', createContext({ userId: undefined }), { title: 'x' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('no user');
    });
  });

  describe('WEBHOOK', () => {
    it('calls an https webhook', async () => {
      fetchMock.mockResolvedValue({ ok: true, status: 200, text: async () => 'ok' });
      const result = await engine.executeAction('WEBHOOK', createContext(), {
        url: 'https://example.com/webhook',
        body: { a: 1 },
      });
      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({ statusCode: 200, body: 'ok' });
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{"a":1}' });
    });

    it('rejects http and private targets', async () => {
      const http = await engine.executeAction('WEBHOOK', createContext(), { url: 'http://example.com' });
      expect(http.error).toContain('https');
      const local = await engine.executeAction('WEBHOOK', createContext(), { url: 'https://127.0.0.1/x' });
      expect(local.error).toContain('private');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('fails on non-2xx responses', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500, text: async () => 'err' });
      const result = await engine.executeAction('WEBHOOK', createContext(), { url: 'https://example.com/x' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should fail without url', async () => {
      const result = await engine.executeAction('WEBHOOK', createContext(), {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required');
    });
  });

  describe('WAIT', () => {
    it('should wait for specified duration', async () => {
      const result = await engine.executeAction('WAIT', createContext(), { duration: 50 });
      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('waited', 50);
    });

    it('rejects waits beyond the in-process bound', async () => {
      const result = await engine.executeAction('WAIT', createContext(), { duration: 5, unit: 'minutes' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should fail without duration', async () => {
      const result = await engine.executeAction('WAIT', createContext(), {});
      expect(result.success).toBe(false);
    });
  });

  describe('BRANCH', () => {
    it('evaluates against run variables', async () => {
      const result = await engine.executeAction('BRANCH', createContext({ variables: { status: 'active' } }), {
        condition: { field: 'status', operator: 'equals', value: 'active' },
      });
      expect(result.output).toMatchObject({ branchTaken: 'true' });
      const no = await engine.executeAction('BRANCH', createContext(), {
        condition: { field: 'status', operator: 'equals', value: 'active' },
      });
      expect(no.output).toMatchObject({ branchTaken: 'false' });
    });
  });

  describe('AI', () => {
    it('calls the OpenAI Responses API with the minimal request shape', async () => {
      process.env.OPENAI_API_KEY = 'sk-test';
      delete process.env.OPENAI_MODEL_FAST;
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'resp_1', model: 'gpt-6-luna', output_text: 'hello' }),
      });
      const result = await engine.executeAction('AI', createContext(), { prompt: 'Say hi', instructions: 'Be brief' });
      expect(result.success).toBe(true);
      expect(result.output).toMatchObject({ text: 'hello', responseId: 'resp_1' });
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/responses');
      const body = JSON.parse(init.body);
      expect(body).toMatchObject({ model: 'gpt-6-luna', input: 'Say hi', instructions: 'Be brief', store: false });
      expect(body.max_output_tokens).toBeGreaterThanOrEqual(16);
      expect(body).not.toHaveProperty('temperature');
      expect(init.headers.Authorization).toBe('Bearer sk-test');
    });

    it('fails clearly without a key and on API errors', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY_FALLBACK;
      const noKey = await engine.executeAction('AI', createContext(), { prompt: 'x' });
      expect(noKey.error).toContain('OpenAI not configured');

      process.env.OPENAI_API_KEY = 'sk-test';
      fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: { message: 'rate limited' } }) });
      const failed = await engine.executeAction('AI', createContext(), { prompt: 'x' });
      expect(failed.success).toBe(false);
      expect(failed.error).toContain('rate limited');
    });
  });

  describe('unsupported actions fail loudly', () => {
    it('SEND_SMS and CODE never report fake success', async () => {
      const sms = await engine.executeAction('SEND_SMS', createContext(), { to: '+1', message: 'hi' });
      expect(sms.success).toBe(false);
      expect(sms.error).toContain('SMS not configured');
      const code = await engine.executeAction('CODE', createContext(), { code: '1+1' });
      expect(code.success).toBe(false);
    });
  });
});
