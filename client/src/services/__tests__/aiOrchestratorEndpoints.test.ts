import { describe, it, expect, vi, beforeEach } from 'vitest';

const { generateAI, sendConversationMessage } = vi.hoisted(() => ({
  generateAI: vi.fn(),
  sendConversationMessage: vi.fn(),
}));
vi.mock('../aiGenerate', () => ({ generateAI, sendConversationMessage }));

import { aiOrchestrator } from '../ai-orchestrator.service';

describe('ai-orchestrator uses the app AI endpoint (no missing Supabase functions)', () => {
  beforeEach(() => {
    generateAI.mockReset();
    sendConversationMessage.mockReset();
    globalThis.fetch = vi.fn(() => {
      throw new Error('should not call Supabase edge functions');
    }) as any;
  });

  it.each([
    ['contact_scoring', 'nextBestActions'],
    ['email_generation', 'subject'],
    ['email_analysis', 'toneAnalysis'],
    ['communication_analysis', 'optimalChannels'],
    ['automation_suggestions', 'suggestions'],
    ['relationship_mapping', 'influenceMap'],
  ] as const)('%s goes to generateAI with JSON and the expected fields', async (type, field) => {
    generateAI.mockResolvedValue({ data: { ok: true }, model: 'gpt-6.2-sol' });
    const res = await aiOrchestrator.executeImmediate({
      type,
      priority: 'high',
      data: { name: `test-${type}` },
      options: { useCache: false },
    });
    expect(res.result).toEqual({ ok: true });
    const call = generateAI.mock.calls[0][0];
    expect(call.json).toBe(true);
    expect(call.prompt).toContain(field);
    expect(call.prompt).toContain(`test-${type}`);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('runs task completion analysis on the task thread via the Conversations API', async () => {
    sendConversationMessage.mockResolvedValue({ content: '```json\n{"summary":"done","outcome":"won","followUps":[]}\n```', model: 'gpt-6.2-sol' });
    const res = await aiOrchestrator.executeImmediate({
      type: 'task_completion_analysis',
      priority: 'medium',
      data: { taskId: 't1' },
      context: { assistantThreadId: 'conv_123' },
      options: { useCache: false },
    });
    expect(sendConversationMessage).toHaveBeenCalledWith('conv_123', expect.stringContaining('followUps'), expect.any(Object));
    expect(res.result).toEqual({ summary: 'done', outcome: 'won', followUps: [] });
  });

  it('reports unreadable AI output as an error', async () => {
    generateAI.mockResolvedValue({ data: undefined, model: 'gpt-6.2-sol' });
    await expect(
      aiOrchestrator.executeImmediate({ type: 'contact_scoring', priority: 'high', data: {}, options: { useCache: false } })
    ).rejects.toThrow(/unreadable/);
  });
});
