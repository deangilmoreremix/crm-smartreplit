import { describe, it, expect, vi, beforeEach } from 'vitest';

const { create, retrieve } = vi.hoisted(() => ({ create: vi.fn(), retrieve: vi.fn() }));
vi.mock('../userOpenAI', () => ({
  NO_KEY_MESSAGE: 'no key',
  // Same forwarding as the real wrapped client: chat calls go to responses.create
  getUserOpenAIClient: vi.fn(async () => {
    const m: any = await vi.importActual('../openaiResponses');
    return {
      client: {
        responses: { create, retrieve },
        chat: { completions: { create: async (p: any) => m.responseToChatCompletion(await create(m.chatToResponsesParams(p))) } },
      },
      model: 'gpt-6-luna',
    };
  }),
}));

import { researchTopic, generateSalesForecast, analyzeLeadScore } from '../aiToolsService';

const reply = (text: string, annotations: any[] = []) => ({
  id: 'r',
  status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text, annotations }] }],
  usage: { input_tokens: 1, output_tokens: 2, total_tokens: 3 },
});

describe('aiToolsService on the Responses API', () => {
  beforeEach(() => {
    create.mockReset();
    retrieve.mockReset();
  });

  it('long tool calls return pending, then the result when checked again with responseId', async () => {
    create.mockResolvedValue({ id: 'resp_1', status: 'in_progress', output: [] });
    const first = await generateSalesForecast([{ value: 100, probability: 50 }], 'quarter');
    expect(first).toMatchObject({ success: true, pending: true, responseId: 'resp_1' });

    retrieve.mockResolvedValue({ ...reply('{"weighted_forecast":50}'), id: 'resp_1' });
    const second = await generateSalesForecast([{ value: 100, probability: 50 }], 'quarter', 'resp_1');
    expect(retrieve).toHaveBeenCalledWith('resp_1');
    expect(create).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ success: true, data: { weighted_forecast: 50 } });
    expect(second.pending).toBeUndefined();
  });

  it('reports a failed background job as an error', async () => {
    retrieve.mockResolvedValue({ id: 'resp_2', status: 'failed', output: [] });
    const result = await generateSalesForecast([], 'quarter', 'resp_2');
    expect(result).toMatchObject({ success: false, error: 'The AI request failed' });
  });

  it('researchTopic uses web_search and returns citations', async () => {
    create.mockResolvedValue(reply('{"summary":"s"}', [{ type: 'url_citation', url: 'https://src', title: 'Src' }]));
    const result = await researchTopic('CRM market');
    const request = create.mock.calls[0][0];
    expect(request.tools).toEqual([{ type: 'web_search', search_context_size: 'medium' }]);
    // Long tool calls run as background responses, which OpenAI requires to be stored
    expect(request.background).toBe(true);
    expect(request.store).toBe(true);
    expect(result.data).toEqual({ summary: 's', sources: [{ url: 'https://src', title: 'Src' }] });
  });

  it('generateSalesForecast uses code_interpreter', async () => {
    create.mockResolvedValue(reply('{"weighted_forecast":100}'));
    await generateSalesForecast([{ value: 200, probability: 50 }]);
    expect(create.mock.calls[0][0].tools).toEqual([{ type: 'code_interpreter', container: { type: 'auto' } }]);
  });

  it('non-research tools do not get web search', async () => {
    create.mockResolvedValue(reply('{"score":80}'));
    await analyzeLeadScore({ name: 'A' });
    expect(create.mock.calls[0][0].tools).toBeUndefined();
    expect(create.mock.calls[0][0].text).toEqual({ format: { type: 'json_object' } });
  });
});
