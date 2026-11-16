import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateAI,
  researchAI,
  generateImageAI,
  createConversation,
  sendConversationMessage,
  listConversationMessages,
} from '../aiGenerate';

const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('aiGenerate (Responses API routes)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;
  });

  it('generateAI sends images, files and a JSON schema to /api/ai/generate', async () => {
    fetchMock.mockResolvedValue(json({ success: true, content: '{"a":1}', data: { a: 1 }, sources: [], model: 'm' }));
    const result = await generateAI({
      prompt: 'p',
      schema: { type: 'object' },
      images: ['data:image/png;base64,AA=='],
      files: [{ filename: 'a.pdf', data: 'data:application/pdf;base64,AA==' }],
    });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/generate');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      schema: { type: 'object' },
      images: ['data:image/png;base64,AA=='],
      files: [{ filename: 'a.pdf' }],
    });
    expect(result.data).toEqual({ a: 1 });
  });

  it('surfaces the server error message (e.g. missing key)', async () => {
    fetchMock.mockResolvedValue(json({ error: 'No key', message: 'Add your OpenAI API key', needsApiKey: true }, 400));
    await expect(generateAI({ prompt: 'p' })).rejects.toThrow('Add your OpenAI API key');
  });

  it('researchAI starts a background web-search response and polls until it completes', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ success: true, responseId: 'resp_1', status: 'queued', content: '', sources: [] }))
      .mockResolvedValueOnce(json({ success: true, responseId: 'resp_1', status: 'in_progress', content: '', sources: [] }))
      .mockResolvedValueOnce(
        json({
          success: true,
          responseId: 'resp_1',
          status: 'completed',
          content: 'Acme makes widgets',
          sources: [{ url: 'https://acme.com', title: 'Acme' }],
        })
      );

    const result = await researchAI({ prompt: 'Research Acme' }, { intervalMs: 1 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/research');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).background).toBe(true);
    expect(fetchMock.mock.calls[1][0]).toBe('/api/ai/responses/resp_1');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.content).toBe('Acme makes widgets');
    expect(result.sources).toEqual([{ url: 'https://acme.com', title: 'Acme' }]);
  });

  it('researchAI reports a failed background response', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ success: true, responseId: 'r', status: 'queued' }))
      .mockResolvedValueOnce(json({ success: true, responseId: 'r', status: 'failed' }));
    await expect(researchAI({ prompt: 'x' }, { intervalMs: 1 })).rejects.toThrow('failed');
  });

  it('generateImageAI posts to /api/ai/image and returns data URLs (with input images for edits)', async () => {
    fetchMock.mockResolvedValue(json({ success: true, images: ['data:image/png;base64,BB=='] }));
    const images = await generateImageAI({ prompt: 'a logo', images: ['data:image/png;base64,AA=='] });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/ai/image');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).images).toHaveLength(1);
    expect(images).toEqual(['data:image/png;base64,BB==']);
  });

  it('conversation helpers create, send to and list a conversation', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ success: true, conversationId: 'conv_1' }))
      .mockResolvedValueOnce(json({ success: true, content: 'Hi!', responseId: 'resp_2' }))
      .mockResolvedValueOnce(
        json({
          success: true,
          messages: [
            { id: 'm1', role: 'user', text: 'Hello' },
            { id: 'm2', role: 'assistant', text: 'Hi!' },
          ],
        })
      );

    const id = await createConversation('deal-assistant');
    const reply = await sendConversationMessage(id, 'Hello', { system: 'Be brief' });
    const messages = await listConversationMessages(id);

    expect(id).toBe('conv_1');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/ai/conversations/conv_1/messages');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ message: 'Hello', system: 'Be brief' });
    expect(reply.content).toBe('Hi!');
    expect(fetchMock.mock.calls[2][0]).toBe('/api/ai/conversations/conv_1/messages');
    expect(messages.map((m) => m.text)).toEqual(['Hello', 'Hi!']);
  });
});
