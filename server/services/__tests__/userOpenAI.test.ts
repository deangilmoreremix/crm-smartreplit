import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findFirst, chatCreate, responsesCreate } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  chatCreate: vi.fn(),
  responsesCreate: vi.fn(),
}));
vi.mock('../../db', () => ({ db: { query: { userApiKeys: { findFirst } } } }));
vi.mock('openai', () => ({
  default: class {
    apiKey: string;
    chat = { completions: { create: chatCreate } };
    responses = { create: responsesCreate };
    images = { generate: vi.fn() };
    constructor(options: { apiKey: string }) {
      this.apiKey = options.apiKey;
    }
  },
}));

import { mapLegacyModel, DEFAULT_MODEL, ADVANCED_MODEL, IMAGE_MODEL } from '../openaiModels';
import { normalizeImageParams, getUserOpenAIClient } from '../userOpenAI';
import { requestContext } from '../requestContext';

describe('mapLegacyModel', () => {
  it('maps retired OpenAI models to the current tiers', () => {
    expect(mapLegacyModel('gpt-4o-mini')).toBe(DEFAULT_MODEL);
    expect(mapLegacyModel('gpt-3.5-turbo')).toBe(DEFAULT_MODEL);
    expect(mapLegacyModel('gpt-4o')).toBe(ADVANCED_MODEL);
    expect(mapLegacyModel('gpt-4o-2024-08-06')).toBe(ADVANCED_MODEL);
    expect(mapLegacyModel('o3')).toBe(ADVANCED_MODEL);
    expect(mapLegacyModel('dall-e-3')).toBe(IMAGE_MODEL);
  });

  it('maps Gemini/Gemma IDs (OpenAI-only app) and passes current IDs through', () => {
    expect(mapLegacyModel('gemini-1.5-flash')).toBe(DEFAULT_MODEL);
    expect(mapLegacyModel('gemini-1.5-pro')).toBe(ADVANCED_MODEL);
    expect(mapLegacyModel('gemma-2-9b-it')).toBe(DEFAULT_MODEL);
    expect(mapLegacyModel('gpt-6.2-sol')).toBe('gpt-6.2-sol');
    expect(mapLegacyModel(null)).toBe(DEFAULT_MODEL);
  });

  it('upgrades earlier GPT-6 models to the 6.2 tiers', () => {
    expect(DEFAULT_MODEL).toBe('gpt-6.2-sol');
    expect(ADVANCED_MODEL).toBe('gpt-6.2-astra');
    expect(mapLegacyModel('gpt-6-luna')).toBe(DEFAULT_MODEL);
    expect(mapLegacyModel('gpt-6.1-sol')).toBe(ADVANCED_MODEL);
  });

  it('keeps GPT Image 2.6 models and maps older image models to 2.6 flare', () => {
    expect(IMAGE_MODEL).toBe('gpt-image-2.6-flare');
    expect(mapLegacyModel('gpt-image-2.6-sunburst')).toBe('gpt-image-2.6-sunburst');
    expect(mapLegacyModel('gpt-image-2.6-flare')).toBe('gpt-image-2.6-flare');
    expect(mapLegacyModel('gpt-image-2.5-flare')).toBe(IMAGE_MODEL);
    expect(mapLegacyModel('gpt-image-1')).toBe(IMAGE_MODEL);
  });
});

describe('request normalisation', () => {
  it('uses gpt-image parameters for images', () => {
    expect(normalizeImageParams({ model: 'dall-e-3', prompt: 'x', size: '1792x1024', quality: 'hd', style: 'vivid' })).toEqual({
      model: IMAGE_MODEL,
      prompt: 'x',
      size: '1536x1024',
    });
  });
});

describe('getUserOpenAIClient', () => {
  beforeEach(() => findFirst.mockReset());

  it('returns null when the user has no OpenAI key', async () => {
    findFirst.mockResolvedValue(undefined);
    expect(await getUserOpenAIClient('user-1')).toBeNull();
  });

  it('builds a client from the user key, mapping a stored legacy model', async () => {
    findFirst.mockResolvedValue({ apiKey: 'sk-test', model: 'gpt-4o-mini' });
    const result = await getUserOpenAIClient('user-1');
    expect(result?.model).toBe(DEFAULT_MODEL);
    expect((result?.client as any).apiKey).toBe('sk-test');

    responsesCreate.mockResolvedValue({
      id: 'resp_1',
      model: ADVANCED_MODEL,
      status: 'completed',
      output: [{ type: 'message', content: [{ type: 'output_text', text: '{"ok":true}' }] }],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
    });
    const completion: any = await result!.client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 50,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return JSON.' },
        { role: 'user', content: 'hi' },
      ],
    } as any);

    // Sent to /v1/responses, not chat completions
    expect(chatCreate).not.toHaveBeenCalled();
    expect(responsesCreate).toHaveBeenCalledWith(
      {
        store: false,
        model: ADVANCED_MODEL,
        instructions: 'Return JSON.',
        input: [{ role: 'user', content: 'hi' }],
        text: { format: { type: 'json_object' } },
        max_output_tokens: 50,
      },
      undefined
    );
    // Returned in the chat-completion shape older code reads
    expect(completion.choices[0].message.content).toBe('{"ok":true}');
    expect(completion.usage).toEqual({ prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 });
  });

  it('defaults to the signed-in user of the current request', async () => {
    findFirst.mockResolvedValue({ apiKey: 'sk-test', model: null });
    const result = await requestContext.run({ userId: 'user-2' }, () => getUserOpenAIClient());
    expect(result).not.toBeNull();
    expect(await getUserOpenAIClient()).toBeNull(); // no request context, no user
  });
});
