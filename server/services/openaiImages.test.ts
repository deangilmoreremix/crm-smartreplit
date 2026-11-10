/// <reference types="vitest" />
import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'crypto';
import {
  buildGenerateRequest,
  buildEditRequest,
  generateImages,
  editImage,
  parseImages,
  hashSafetyIdentifier,
  toDataUrl,
} from './openaiImages';

describe('openaiImages', () => {
  it('builds a generate request with tier model, hashed safety id and 2.6 params', () => {
    const body = buildGenerateRequest({
      prompt: 'a cat',
      tier: 'quality',
      size: '1536x1024',
      quality: 'high',
      complexity: 'medium',
      background: 'transparent',
      n: 2,
      userId: 'user-1',
    });
    expect(body).toMatchObject({
      model: 'gpt-image-2.6-sunburst',
      prompt: 'a cat',
      size: '1536x1024',
      quality: 'high',
      complexity: 'medium',
      background: 'transparent',
      n: 2,
      safety_identifier: createHash('sha256').update('user-1').digest('hex'),
    });
    expect(body).not.toHaveProperty('user');
  });

  it('defaults to the fast model, n=1 and clamps n', () => {
    expect(buildGenerateRequest({ prompt: 'x' })).toEqual({ model: 'gpt-image-2.6-flare', prompt: 'x', n: 1 });
    expect(buildGenerateRequest({ prompt: 'x', n: 99 }).n).toBe(10);
    expect(buildGenerateRequest({ prompt: 'x', model: 'custom' }).model).toBe('custom');
  });

  it('parses b64_json responses and rejects empty ones', () => {
    const imgs = parseImages({ data: [{ b64_json: 'AAA' }, { url: 'x' }] });
    expect(imgs).toEqual([{ b64: 'AAA', mimeType: 'image/png' }]);
    expect(toDataUrl(imgs[0])).toBe('data:image/png;base64,AAA');
    expect(parseImages({ data: [{ b64_json: 'B' }] }, 'webp')[0].mimeType).toBe('image/webp');
    expect(() => parseImages({ data: [] })).toThrow();
  });

  it('generateImages calls client.images.generate', async () => {
    const generate = vi.fn(async () => ({ data: [{ b64_json: 'QQ==' }] }));
    const out = await generateImages({ prompt: 'p', client: { images: { generate } } as any, userId: 'u' });
    expect(out).toEqual([{ b64: 'QQ==', mimeType: 'image/png' }]);
    expect((generate.mock.calls[0] as any[])[0].safety_identifier).toBe(hashSafetyIdentifier('u'));
  });

  it('builds edit requests and forbids mask + markup together', () => {
    const toFile = (f: any) => f.name;
    const img = { buffer: Buffer.from('a') };
    const body = buildEditRequest({ prompt: 'p', images: [img], markup: img }, toFile);
    expect(body.image).toBe('image-0.png');
    expect(body.markup).toBe('markup.png');
    expect(() => buildEditRequest({ prompt: 'p', images: [img], mask: img, markup: img }, toFile)).toThrow();
    expect(buildEditRequest({ prompt: 'p', images: [img, img] }, toFile).image).toEqual(['image-0.png', 'image-1.png']);
  });

  it('editImage calls client.images.edit', async () => {
    const edit = vi.fn(async () => ({ data: [{ b64_json: 'ZZ' }] }));
    const out = await editImage({ prompt: 'p', images: [{ buffer: Buffer.from('a') }], client: { images: { edit } } as any });
    expect(out[0].b64).toBe('ZZ');
    expect((edit.mock.calls[0] as any[])[0].model).toBe('gpt-image-2.6-flare');
  });
});
