import { describe, it, expect, vi, beforeEach } from 'vitest';

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('../userOpenAI', () => ({
  NO_KEY_MESSAGE: 'no key',
  // Same forwarding as the real wrapped client: chat calls go to responses.create
  getUserOpenAIClient: vi.fn(async () => {
    const m: any = await vi.importActual('../openaiResponses');
    return {
      client: {
        responses: { create },
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
  beforeEach(() => create.mockReset());

  it('researchTopic uses web_search and returns citations', async () => {
    create.mockResolvedValue(reply('{"summary":"s"}', [{ type: 'url_citation', url: 'https://src', title: 'Src' }]));
    const result = await researchTopic('CRM market');
    const request = create.mock.calls[0][0];
    expect(request.tools).toEqual([{ type: 'web_search', search_context_size: 'medium' }]);
    expect(request.store).toBe(false);
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
