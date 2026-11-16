import { describe, it, expect, vi } from 'vitest';
import {
  chatToResponsesParams,
  responseToChatCompletion,
  responsesStreamAsChatChunks,
  respond,
  extractSources,
  webSearchTool,
} from '../openaiResponses';
import { DEFAULT_MODEL } from '../openaiModels';

describe('chatToResponsesParams', () => {
  it('converts vision content parts and function tools', () => {
    const params = chatToResponsesParams({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What is this?' },
            { type: 'image_url', image_url: { url: 'https://x/y.png', detail: 'high' } },
          ],
        },
      ],
      tools: [{ type: 'function', function: { name: 'lookup', description: 'd', parameters: { type: 'object' } } }],
      tool_choice: { type: 'function', function: { name: 'lookup' } },
    });
    expect(params.model).toBe(DEFAULT_MODEL);
    expect(params.input[0].content).toEqual([
      { type: 'input_text', text: 'What is this?' },
      { type: 'input_image', image_url: 'https://x/y.png', detail: 'high' },
    ]);
    expect(params.tools).toEqual([
      { type: 'function', name: 'lookup', description: 'd', parameters: { type: 'object' }, strict: false },
    ]);
    expect(params.tool_choice).toEqual({ type: 'function', name: 'lookup' });
    expect(params.store).toBe(false);
  });

  it('adds the JSON hint json_object mode requires', () => {
    const params = chatToResponsesParams({
      model: 'gpt-6-luna',
      messages: [{ role: 'user', content: 'Score this lead' }],
      response_format: { type: 'json_object' },
    });
    expect(params.instructions).toMatch(/JSON/);
  });
});

describe('responseToChatCompletion', () => {
  it('maps function_call items to tool_calls', () => {
    const completion = responseToChatCompletion({
      id: 'r',
      status: 'completed',
      output: [{ type: 'function_call', call_id: 'c1', name: 'lookup', arguments: '{"a":1}' }],
    });
    expect(completion.choices[0].finish_reason).toBe('tool_calls');
    expect(completion.choices[0].message.tool_calls[0]).toEqual({
      id: 'c1',
      type: 'function',
      function: { name: 'lookup', arguments: '{"a":1}' },
    });
  });
});

describe('responsesStreamAsChatChunks', () => {
  it('turns output_text deltas into chat chunks', async () => {
    async function* events() {
      yield { type: 'response.created' };
      yield { type: 'response.output_text.delta', delta: 'Hel' };
      yield { type: 'response.output_text.delta', delta: 'lo' };
      yield { type: 'response.completed' };
    }
    const text: string[] = [];
    for await (const chunk of responsesStreamAsChatChunks(events())) text.push(chunk.choices[0].delta.content ?? '');
    expect(text.join('')).toBe('Hello');
  });
});

describe('respond', () => {
  it('sends a web search request without storing it and returns citations', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'r1',
      status: 'completed',
      output: [
        { type: 'web_search_call', status: 'completed' },
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: '{"company":"Acme"}',
              annotations: [{ type: 'url_citation', url: 'https://acme.com', title: 'Acme' }],
            },
          ],
        },
      ],
    });
    const result = await respond({ responses: { create } } as any, {
      model: DEFAULT_MODEL,
      input: 'Research Acme',
      json: true,
      tools: [webSearchTool()],
    });
    expect(create.mock.calls[0][0]).toMatchObject({ store: false, tools: [{ type: 'web_search' }] });
    expect(result.data).toEqual({ company: 'Acme' });
    expect(result.sources).toEqual([{ url: 'https://acme.com', title: 'Acme' }]);
  });

  it('stores conversation turns', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'r2', status: 'completed', output: [] });
    await respond({ responses: { create } } as any, { model: DEFAULT_MODEL, input: 'hi', conversation: 'conv_1' });
    expect(create.mock.calls[0][0]).toMatchObject({ store: true, conversation: 'conv_1' });
  });

  it('extractSources de-duplicates citations', () => {
    const cite = { type: 'url_citation', url: 'https://a', title: 'A' };
    expect(
      extractSources({ output: [{ type: 'message', content: [{ type: 'output_text', annotations: [cite, cite] }] }] })
    ).toHaveLength(1);
  });
});
