import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./openaiClient', async () => {
  const actual = await vi.importActual<typeof import('./openaiClient')>('./openaiClient');
  return { ...actual, respond: vi.fn() };
});

import { respond } from './openaiClient';
import { buildChatRequest, runChatTurn, sanitizeTools } from './assistantChat';

const assistant = { id: 'a1', user_id: 'u1', name: 'A', instructions: 'Be helpful', model: 'fast', tools: ['code_interpreter', 'retrieval'] };

describe('assistantChat', () => {
  beforeEach(() => vi.mocked(respond).mockReset());

  it('sanitizes tools to hosted Responses tools', () => {
    expect(sanitizeTools(['code_interpreter', { type: 'web_search' }, 'retrieval', 'code_interpreter'])).toEqual([
      { type: 'code_interpreter', container: { type: 'auto' } },
      { type: 'web_search' },
    ]);
    expect(sanitizeTools(undefined)).toEqual([]);
  });

  it('resends instructions and chains previous_response_id with store', () => {
    const req = buildChatRequest(assistant, { last_response_id: 'resp_1' }, 'hi');
    expect(req).toMatchObject({ instructions: 'Be helpful', input: 'hi', previousResponseId: 'resp_1', store: true, model: 'fast' });
  });

  it('omits previous_response_id on the first turn and falls back to the user model', () => {
    const req = buildChatRequest({ ...assistant, model: null, tools: [] }, { last_response_id: null }, 'hi', 'my-model');
    expect(req.previousResponseId).toBeUndefined();
    expect(req.model).toBe('my-model');
    expect(req.tools).toBeUndefined();
  });

  it('runChatTurn returns text, response id and usage', async () => {
    vi.mocked(respond).mockResolvedValue({ id: 'resp_2', model: 'gpt-6-luna', output_text: 'hello', usage: { input_tokens: 3, output_tokens: 2 } });
    const out = await runChatTurn({ assistant, thread: { id: 't', last_response_id: 'resp_1' }, message: 'hi' });
    expect(out).toEqual({ text: 'hello', responseId: 'resp_2', model: 'gpt-6-luna', usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 } });
    expect(vi.mocked(respond).mock.calls[0][0]).toMatchObject({ previousResponseId: 'resp_1', instructions: 'Be helpful' });
  });
});
