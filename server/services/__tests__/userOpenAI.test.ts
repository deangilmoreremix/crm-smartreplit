import { describe, it, expect, vi, beforeEach } from 'vitest';

const { findFirst, chatCreate } = vi.hoisted(() => ({ findFirst: vi.fn(), chatCreate: vi.fn() }));
vi.mock('../../db', () => ({ db: { query: { userApiKeys: { findFirst } } } }));
vi.mock('openai', () => ({
  default: class {
    apiKey: string;
    chat = { completions: { create: chatCreate } };
    responses = { create: vi.fn() };
    images = { generate: vi.fn() };
    constructor(options: { apiKey: string }) {
      this.apiKey = options.apiKey;
    }
  },
}));

import { mapLegacyModel, DEFAULT_MODEL, ADVANCED_MODEL, IMAGE_MODEL } from '../openaiModels';
import { normalizeChatParams, normalizeImageParams, getUserOpenAIClient } from '../userOpenAI';
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
    expect(mapLegacyModel('gpt-6.1-sol')).toBe('gpt-6.1-sol');
    expect(mapLegacyModel(null)).toBe(DEFAULT_MODEL);
  });
});

describe('request normalisation', () => {
  it('drops temperature and renames max_tokens for chat', () => {
    expect(normalizeChatParams({ model: 'gpt-4o-mini', temperature: 0.3, max_tokens: 100, messages: [] })).toEqual({
      model: DEFAULT_MODEL,
      messages: [],
      max_completion_tokens: 100,
    });
  });

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

    await result!.client.chat.completions.create({ model: 'gpt-4o', temperature: 0.2, max_tokens: 50, messages: [] } as any);
    expect(chatCreate).toHaveBeenCalledWith(
      { model: ADVANCED_MODEL, messages: [], max_completion_tokens: 50 },
      undefined
    );
  });

  it('defaults to the signed-in user of the current request', async () => {
    findFirst.mockResolvedValue({ apiKey: 'sk-test', model: null });
    const result = await requestContext.run({ userId: 'user-2' }, () => getUserOpenAIClient());
    expect(result).not.toBeNull();
    expect(await getUserOpenAIClient()).toBeNull(); // no request context, no user
  });
});
