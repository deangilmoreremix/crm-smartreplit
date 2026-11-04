/**
 * Per-user OpenAI clients. The app uses each user's own OpenAI key (user_api_keys, provider 'openai');
 * there is no server-wide key fallback.
 *
 * Returned clients normalise requests in one place so older call sites keep working on current models:
 * retired model IDs are mapped, max_tokens -> max_completion_tokens, temperature is dropped (rejected by
 * current reasoning models), and image requests use gpt-image parameters with url filled from b64_json.
 */
import OpenAI from 'openai';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { userApiKeys } from '../../shared/schema';
import { mapLegacyModel, IMAGE_MODEL } from './openaiModels';
import { currentUserId } from './requestContext';

export const NO_KEY_MESSAGE = 'Add your OpenAI API key in Settings → API Keys to use AI features.';

/** The user's active OpenAI key (default first), or null. */
export async function getUserApiKey(
  userId: string,
  provider: 'openai' = 'openai'
): Promise<{ apiKey: string; model: string | null } | null> {
  if (!db || !userId) return null;
  const key = await db.query.userApiKeys.findFirst({
    where: and(
      eq(userApiKeys.userId, userId),
      eq(userApiKeys.provider, provider),
      eq(userApiKeys.isActive, true)
    ),
    orderBy: [desc(userApiKeys.isDefault)],
  });
  return key ? { apiKey: key.apiKey, model: key.model } : null;
}

const GPT_IMAGE_SIZES: Record<string, string> = {
  '1792x1024': '1536x1024',
  '1024x1792': '1024x1536',
  '256x256': '1024x1024',
  '512x512': '1024x1024',
};

export function normalizeChatParams(params: any): any {
  const { temperature: _temperature, max_tokens, ...rest } = params;
  return {
    ...rest,
    model: mapLegacyModel(rest.model),
    ...(max_tokens != null && rest.max_completion_tokens == null
      ? { max_completion_tokens: max_tokens }
      : {}),
  };
}

export function normalizeImageParams(params: any): any {
  const { style: _style, quality, response_format: _format, size, ...rest } = params;
  return {
    ...rest,
    model: rest.model ? mapLegacyModel(rest.model) : IMAGE_MODEL,
    ...(size ? { size: GPT_IMAGE_SIZES[size] || size } : {}),
    ...(quality && !['hd', 'standard'].includes(quality) ? { quality } : {}),
  };
}

function wrapClient(client: OpenAI): OpenAI {
  const chatCreate = client.chat.completions.create.bind(client.chat.completions);
  (client.chat.completions as any).create = (params: any, options?: any) =>
    chatCreate(normalizeChatParams(params), options);

  const responsesCreate = client.responses.create.bind(client.responses);
  (client.responses as any).create = (params: any, options?: any) => {
    const { temperature: _temperature, ...rest } = params;
    return responsesCreate({ ...rest, model: mapLegacyModel(rest.model) }, options);
  };

  const imagesGenerate = client.images.generate.bind(client.images);
  (client.images as any).generate = async (params: any, options?: any) => {
    const result: any = await imagesGenerate(normalizeImageParams(params), options);
    for (const img of result?.data || []) {
      if (!img.url && img.b64_json) img.url = `data:image/png;base64,${img.b64_json}`;
    }
    return result;
  };

  return client;
}

/** OpenAI client for a user (defaults to the signed-in user of the current request), or null if they have no key. */
export async function getUserOpenAIClient(
  userId: string | undefined = currentUserId()
): Promise<{ client: OpenAI; model: string } | null> {
  if (!userId) return null;
  const keyData = await getUserApiKey(userId);
  if (!keyData) return null;
  return {
    client: wrapClient(new OpenAI({ apiKey: keyData.apiKey })),
    model: mapLegacyModel(keyData.model),
  };
}
