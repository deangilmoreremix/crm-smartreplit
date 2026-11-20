/**
 * Per-user OpenAI clients. The app uses each user's own OpenAI key (user_api_keys, provider 'openai');
 * there is no server-wide key fallback.
 *
 * Returned clients run on the OpenAI Responses API: chat-completion calls from older code are translated to
 * /v1/responses (retired model IDs mapped, temperature dropped, store:false), and image requests go to the
 * Images API (GPT Image 2.6) with url filled from the base64 result.
 */
import OpenAI from 'openai';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { userApiKeys } from '../../shared/schema';
import { mapLegacyModel, IMAGE_MODEL } from './openaiModels';
import { currentUserId } from './requestContext';
import {
  chatToResponsesParams,
  responseToChatCompletion,
  responsesStreamAsChatChunks,
  generateImage,
} from './openaiResponses';

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

export function normalizeImageParams(params: any): any {
  const { style: _style, quality, response_format: _format, size, ...rest } = params;
  return {
    ...rest,
    model: rest.model ? mapLegacyModel(rest.model) : IMAGE_MODEL,
    ...(size ? { size: GPT_IMAGE_SIZES[size] || size } : {}),
    ...(quality && !['hd', 'standard'].includes(quality) ? { quality } : {}),
  };
}

/**
 * Route the SDK's chat calls through the Responses API so every text and vision request uses /v1/responses;
 * image calls use the Images API with GPT Image 2.6 (embeddings keep their own endpoint).
 */
function wrapClient(client: OpenAI): OpenAI {
  const responsesCreate = client.responses.create.bind(client.responses);
  const createResponse = (params: any, options?: any) => {
    const { temperature: _temperature, top_p: _topP, ...rest } = params;
    return responsesCreate({ store: false, ...rest, model: mapLegacyModel(rest.model) }, options);
  };
  (client.responses as any).create = createResponse;

  (client.chat.completions as any).create = async (params: any, options?: any) => {
    const request = chatToResponsesParams(params);
    if (request.stream) return responsesStreamAsChatChunks((await createResponse(request, options)) as any);
    return responseToChatCompletion(await createResponse(request, options));
  };

  (client.images as any).generate = async (params: any) => {
    const { prompt, size, model, quality, n } = normalizeImageParams(params);
    const { b64, mime } = await generateImage(client, { imageModel: model, prompt, size, quality, n });
    return { created: Math.floor(Date.now() / 1000), data: b64.map((b) => ({ b64_json: b, url: `data:${mime};base64,${b}` })) };
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
