import { describe, it, expect, vi } from 'vitest';
import {
  buildRequest,
  outputText,
  usageOf,
  toResponsesTool,
  respondJson,
  respondStream,
  respondWithTools,
  REASONING_HEADROOM,
} from './openaiClient';
import { normalizeEffort, resolveModel, tierModel } from '../../shared/aiModels';

const fakeClient = (create: (body: any) => any) => ({ responses: { create: vi.fn(create) } }) as any;

describe('aiModels', () => {
  it('maps tiers and honours env overrides', () => {
    expect(tierModel('fast', {})).toBe('gpt-6-luna');
    expect(tierModel('deep', { OPENAI_MODEL_DEEP: 'custom-deep' })).toBe('custom-deep');
    expect(resolveModel('gpt-x', {})).toBe('gpt-x');
    expect(resolveModel(undefined, {})).toBe('gpt-6.1-terra');
  });

  it('normalises reasoning effort per model', () => {
    expect(normalizeEffort('gpt-6.1-terra', 'minimal')).toBe('low');
    expect(normalizeEffort('gpt-6.1-sol', 'none')).toBe('low');
    expect(normalizeEffort('gpt-6-astra', 'none')).toBe('low');
    expect(normalizeEffort('gpt-6.1-terra', 'none')).toBe('none');
    expect(normalizeEffort('gpt-6-luna', 'none')).toBe('none');
    expect(normalizeEffort('gpt-6-sol', 'none')).toBe('none');
  });
});

describe('buildRequest', () => {
  it('uses Responses field names and drops sampling params without effort none', () => {
    const body = buildRequest({
      tier: 'fast',
      instructions: 'sys',
      input: 'hi',
      maxOutputTokens: 200,
      temperature: 0.3,
      topP: 0.9,
      json: true,
    });
    expect(body).toMatchObject({
      model: 'gpt-6-luna',
      instructions: 'sys',
      input: 'hi',
      max_output_tokens: 200,
      text: { format: { type: 'json_object' } },
      store: false,
    });
    expect(body).not.toHaveProperty('temperature');
    expect(body).not.toHaveProperty('top_p');
    expect(body).not.toHaveProperty('max_tokens');
    expect(body).not.toHaveProperty('response_format');
  });

  it('adds reasoning headroom to max_output_tokens only when reasoning is on', () => {
    expect(buildRequest({ tier: 'deep', input: 'x', effort: 'low', maxOutputTokens: 500 }).max_output_tokens).toBe(500 + REASONING_HEADROOM);
    expect(buildRequest({ tier: 'fast', input: 'x', effort: 'none', maxOutputTokens: 500 }).max_output_tokens).toBe(500);
  });

  it('sends temperature only when effort is none', () => {
    const body = buildRequest({ tier: 'default', input: 'x', effort: 'none', temperature: 0.2 });
    expect(body.temperature).toBe(0.2);
    expect(body.reasoning).toEqual({ effort: 'none' });
  });

  it('never sends effort none to sol/astra and drops temperature', () => {
    const body = buildRequest({ tier: 'deep', input: 'x', effort: 'none', temperature: 0.2 });
    expect(body.reasoning).toEqual({ effort: 'low' });
    expect(body).not.toHaveProperty('temperature');
  });

  it('builds json_schema text.format with strict default', () => {
    const body = buildRequest({ input: 'x', json: { name: 'p', schema: { type: 'object' } } });
    expect(body.text).toEqual({
      format: { type: 'json_schema', name: 'p', schema: { type: 'object' }, strict: true },
    });
  });

  it('flattens chat-shaped tools and tool_choice', () => {
    const chatTool = { type: 'function', function: { name: 'f', description: 'd', parameters: { type: 'object' } } };
    expect(toResponsesTool(chatTool)).toEqual({ type: 'function', name: 'f', description: 'd', parameters: { type: 'object' } });
    const body = buildRequest({
      input: 'x',
      tools: [chatTool],
      toolChoice: { type: 'function', function: { name: 'f' } },
    });
    expect((body.tools as any[])[0].name).toBe('f');
    expect(body.tool_choice).toEqual({ type: 'function', name: 'f' });
  });

  it('stores only for chained turns', () => {
    expect(buildRequest({ input: 'x', previousResponseId: 'resp_1' })).toMatchObject({
      previous_response_id: 'resp_1',
      store: true,
    });
  });
});

describe('response parsing', () => {
  it('reads output_text or falls back to message items', () => {
    expect(outputText({ output_text: 'hi' })).toBe('hi');
    expect(
      outputText({ output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: 'a' }, { type: 'output_text', text: 'b' }] }] })
    ).toBe('ab');
  });

  it('maps usage fields', () => {
    expect(usageOf({ usage: { input_tokens: 3, output_tokens: 4 } })).toEqual({ inputTokens: 3, outputTokens: 4, totalTokens: 7 });
    expect(usageOf({})).toEqual({ inputTokens: 0, outputTokens: 0, totalTokens: 0 });
  });
});

describe('respondJson', () => {
  it('parses JSON output and reports usage', async () => {
    const client = fakeClient(() => ({ model: 'gpt-6-luna', output_text: '{"a":1}', usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 } }));
    const out = await respondJson({ client, tier: 'fast', input: 'give json' });
    expect(out.data).toEqual({ a: 1 });
    expect(out.usage.totalTokens).toBe(3);
    expect(client.responses.create.mock.calls[0][0].text).toEqual({ format: { type: 'json_object' } });
  });
});

describe('respondStream', () => {
  it('yields deltas then done from typed events', async () => {
    const events = [
      { type: 'response.created' },
      { type: 'response.output_text.delta', delta: 'He' },
      { type: 'response.output_text.delta', delta: 'llo' },
      { type: 'response.completed', response: { usage: { input_tokens: 1, output_tokens: 1 } } },
    ];
    const client = fakeClient(async function () {
      return (async function* () {
        for (const e of events) yield e;
      })();
    });
    const out: any[] = [];
    for await (const e of respondStream({ client, input: 'x' })) out.push(e);
    expect(out.map((e) => e.type)).toEqual(['delta', 'delta', 'done']);
    expect(out[2].text).toBe('Hello');
    expect(client.responses.create.mock.calls[0][0].stream).toBe(true);
  });
});

describe('respondWithTools', () => {
  it('executes function calls and replies with function_call_output', async () => {
    const responses = [
      { output: [{ type: 'function_call', call_id: 'c1', name: 'add', arguments: '{"a":1,"b":2}' }], usage: { input_tokens: 1, output_tokens: 1 } },
      { output_text: 'sum is 3', output: [], usage: { input_tokens: 2, output_tokens: 2 } },
    ];
    let i = 0;
    const client = fakeClient(() => responses[i++]);
    const result = await respondWithTools({
      client,
      input: 'add',
      tools: [{ type: 'function', name: 'add', parameters: { type: 'object' } }],
      handlers: { add: ({ a, b }: any) => ({ sum: a + b }) },
    });
    expect(result.text).toBe('sum is 3');
    expect(result.usage.totalTokens).toBe(6);
    const secondInput = client.responses.create.mock.calls[1][0].input;
    expect(secondInput.at(-1)).toEqual({ type: 'function_call_output', call_id: 'c1', output: '{"sum":3}' });
    expect(client.responses.create.mock.calls[0][0].include).toEqual(['reasoning.encrypted_content']);
  });

  it('returns tool errors to the model instead of throwing', async () => {
    const responses = [
      { output: [{ type: 'function_call', call_id: 'c1', name: 'nope', arguments: '{}' }] },
      { output_text: 'ok', output: [] },
    ];
    let i = 0;
    const client = fakeClient(() => responses[i++]);
    const result = await respondWithTools({ client, input: 'x', handlers: {} });
    expect(result.text).toBe('ok');
    expect(client.responses.create.mock.calls[1][0].input.at(-1).output).toContain('No handler');
  });
});
