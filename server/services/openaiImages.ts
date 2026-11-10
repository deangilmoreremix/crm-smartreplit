/**
 * GPT Image 2.6 helper (Image API). Every server-side image call goes through here.
 * The API returns base64 (`data[i].b64_json`), never a hosted URL.
 * SDK types predate `complexity` / `markup`, so those are passed through the request body.
 */
import { createHash } from 'crypto';
import type OpenAI from 'openai';
import {
  ImageComplexity,
  ImageQuality,
  ImageTier,
  imageModel,
} from '../../shared/aiModels';
import { getOpenAIClient } from './openaiClient';

export type { ImageComplexity, ImageQuality, ImageTier };

export interface GeneratedImage {
  b64: string;
  mimeType: string;
}

export interface GenerateImagesOptions {
  prompt: string;
  /** Tier name ('fast' | 'quality') or concrete model id. Defaults to the fast tier. */
  tier?: ImageTier;
  model?: string;
  size?: string;
  quality?: ImageQuality;
  complexity?: ImageComplexity;
  background?: 'transparent' | 'opaque' | 'auto';
  outputFormat?: 'png' | 'jpeg' | 'webp';
  n?: number;
  /** End-user id; sent as a sha256-hashed safety_identifier. */
  userId?: string;
  client?: OpenAI;
}

export interface EditImageOptions extends Omit<GenerateImagesOptions, 'background'> {
  /** One or more source images (first is the markup/mask reference). */
  images: Array<{ buffer: Buffer; mimeType?: string; filename?: string }>;
  /** Mask PNG; do not combine with markup. */
  mask?: { buffer: Buffer; mimeType?: string };
  /** Transparent PNG annotation layer, same size as the first image. */
  markup?: { buffer: Buffer; mimeType?: string };
}

const MAX_N = 10;
const MIME: Record<string, string> = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };

export function hashSafetyIdentifier(userId: string): string {
  return createHash('sha256').update(userId).digest('hex');
}

function common(opts: GenerateImagesOptions): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: opts.model ? imageModel(opts.model) : imageModel(opts.tier ?? 'fast'),
    prompt: opts.prompt,
    n: Math.min(MAX_N, Math.max(1, Math.floor(opts.n ?? 1))),
  };
  if (opts.size) body.size = opts.size;
  if (opts.quality) body.quality = opts.quality;
  if (opts.complexity) body.complexity = opts.complexity;
  if (opts.outputFormat) body.output_format = opts.outputFormat;
  if (opts.userId) body.safety_identifier = hashSafetyIdentifier(opts.userId);
  return body;
}

export function buildGenerateRequest(opts: GenerateImagesOptions): Record<string, unknown> {
  const body = common(opts);
  if (opts.background) body.background = opts.background;
  return body;
}

export function parseImages(response: any, outputFormat?: string): GeneratedImage[] {
  const mimeType = MIME[outputFormat ?? 'png'] ?? 'image/png';
  const images = (response?.data ?? [])
    .filter((d: any) => typeof d?.b64_json === 'string' && d.b64_json.length > 0)
    .map((d: any) => ({ b64: d.b64_json as string, mimeType }));
  if (!images.length) throw new Error('No image returned from OpenAI');
  return images;
}

function requireClient(client?: OpenAI): OpenAI {
  const c = client ?? getOpenAIClient();
  if (!c) throw new Error('OpenAI not configured');
  return c;
}

export async function generateImages(opts: GenerateImagesOptions): Promise<GeneratedImage[]> {
  const client = requireClient(opts.client);
  const response = await client.images.generate(buildGenerateRequest(opts) as any);
  return parseImages(response, opts.outputFormat);
}

export function buildEditRequest(opts: EditImageOptions, toFile: (f: any) => any): Record<string, unknown> {
  if (opts.mask && opts.markup) throw new Error('mask and markup cannot be combined');
  if (!opts.images.length) throw new Error('At least one image is required');
  const file = (f: { buffer: Buffer; mimeType?: string; filename?: string }, name: string) =>
    toFile({ buffer: f.buffer, name: f.filename ?? name, type: f.mimeType ?? 'image/png' });
  const body = common(opts);
  const files = opts.images.map((f, i) => file(f, `image-${i}.png`));
  body.image = files.length === 1 ? files[0] : files;
  if (opts.mask) body.mask = file(opts.mask, 'mask.png');
  if (opts.markup) body.markup = file(opts.markup, 'markup.png');
  return body;
}

export async function editImage(opts: EditImageOptions): Promise<GeneratedImage[]> {
  const client = requireClient(opts.client);
  const { toFile } = await import('openai');
  const body = buildEditRequest(opts, (f) => toFile(f.buffer, f.name, { type: f.type }));
  // toFile returns promises; resolve them before sending.
  for (const key of ['image', 'mask', 'markup']) {
    if (Array.isArray(body[key])) body[key] = await Promise.all(body[key] as any[]);
    else if (body[key]) body[key] = await body[key];
  }
  const response = await client.images.edit(body as any);
  return parseImages(response, opts.outputFormat);
}

export function toDataUrl(img: GeneratedImage): string {
  return `data:${img.mimeType};base64,${img.b64}`;
}
