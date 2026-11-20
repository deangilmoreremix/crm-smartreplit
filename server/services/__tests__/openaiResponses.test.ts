import { describe, it, expect, vi } from 'vitest';
import {
  chatToResponsesParams,
  responseToChatCompletion,
  responsesStreamAsChatChunks,
  respond,
  extractSources,
  webSearchTool,
  generateImage,
  parseJSONText,
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

describe('generateImage (GPT Image 2.6, Images API)', () => {
  it('generates with gpt-image-2.6-flare on /images/generations and maps legacy quality', async () => {
    const post = vi.fn().mockResolvedValue({ data: [{ b64_json: 'AAA' }], output_format: 'webp' });
    const out = await generateImage({ post } as any, {
      prompt: 'logo',
      size: '1536x1024',
      quality: 'hd',
      output_format: 'webp',
      complexity: 'low',
    });
    expect(post).toHaveBeenCalledWith('/images/generations', {
      body: { model: 'gpt-image-2.6-flare', prompt: 'logo', size: '1536x1024', quality: 'high', output_format: 'webp', complexity: 'low' },
    });
    expect(out).toEqual({ b64: ['AAA'], model: 'gpt-image-2.6-flare', outputFormat: 'webp', mime: 'image/webp' });
  });

  it('edits with gpt-image-2.6-sunburst on /images/edits with images and markup', async () => {
    const post = vi.fn().mockResolvedValue({ data: [{ b64_json: 'BBB' }] });
    await generateImage({ post } as any, {
      prompt: 'blue background',
      inputImages: ['data:image/png;base64,X'],
      markup: 'data:image/png;base64,M',
    });
    expect(post).toHaveBeenCalledWith('/images/edits', {
      body: {
        model: 'gpt-image-2.6-sunburst',
        prompt: 'blue background',
        images: [{ image_url: 'data:image/png;base64,X' }],
        markup: { image_url: 'data:image/png;base64,M' },
      },
    });
  });

  it('forces PNG for transparent backgrounds, clamps GIF frames and rejects mask + markup', async () => {
    const post = vi.fn().mockResolvedValue({ data: [{ b64_json: 'C' }] });
    await generateImage({ post } as any, { prompt: 'icon', background: 'transparent' });
    expect(post.mock.calls[0][1].body.output_format).toBe('png');
    await generateImage({ post } as any, { prompt: 'spin', output_format: 'gif', frame_count: 40, frame_duration_ms: 5 });
    expect(post.mock.calls[1][1].body).toMatchObject({ frame_count: 16, frame_duration_ms: 20 });
    await expect(
      generateImage({ post } as any, { prompt: 'x', inputImages: ['a'], mask: 'm', markup: 'k' })
    ).rejects.toThrow(/mask or a markup/);
  });
});

describe('parseJSONText', () => {
  it('parses plain, fenced and wrapped JSON and returns undefined for prose', () => {
    expect(parseJSONText('{"a":1}')).toEqual({ a: 1 });
    expect(parseJSONText('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(parseJSONText('Here you go: {"a":3} thanks')).toEqual({ a: 3 });
    expect(parseJSONText('no json here')).toBeUndefined();
  });
});
