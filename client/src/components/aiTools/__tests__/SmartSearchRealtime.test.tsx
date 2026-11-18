import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const { embeddings } = vi.hoisted(() => ({
  embeddings: {
    createContactEmbeddings: vi.fn(),
    createDealEmbeddings: vi.fn(),
    createEmbedding: vi.fn(),
    searchContacts: vi.fn(),
    searchDeals: vi.fn(),
  },
}));
vi.mock('../../../services/geminiService', () => ({ useGemini: () => ({}) }));
vi.mock('../../../services/openaiEmbeddingsService', () => ({ useOpenAIEmbeddings: () => embeddings }));
vi.mock('../../../store/contactStore', () => ({
  useContactStore: () => ({
    contacts: { a: { id: 'a', name: 'Grace Hopper', email: 'g@navy.mil', company: 'Navy', status: 'lead' } },
  }),
}));
vi.mock('../../../store/dealStore', () => ({ useDealStore: () => ({ deals: [] }) }));

import SmartSearchRealtime from '../SmartSearchRealtime';

describe('SmartSearchRealtime', () => {
  beforeEach(() => {
    Object.values(embeddings).forEach((f) => f.mockReset());
    embeddings.createContactEmbeddings.mockRejectedValue(new Error('Add your OpenAI API key in Settings'));
    embeddings.createDealEmbeddings.mockResolvedValue([]);
  });

  it('keyword fallback results carry no constant score and no canned suggestions appear', async () => {
    const onSearchResult = vi.fn();
    render(<SmartSearchRealtime onSearchResult={onSearchResult} />);
    const input = screen.getByPlaceholderText('Search contacts and deals using keywords');
    fireEvent.change(input, { target: { value: 'grace' } });
    await new Promise((r) => setTimeout(r, 450));
    expect(screen.queryByText(/with budget over \$50k/)).toBeNull();
    expect(screen.queryByText(/in technology companies/)).toBeNull();
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(onSearchResult).toHaveBeenCalled());
    const results = onSearchResult.mock.calls[0][0];
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeUndefined();
    expect(screen.getAllByText('Keyword Match').length).toBeGreaterThan(0);
    expect(screen.queryByText(/80%/)).toBeNull();
  });
});
