import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const fetchUnifiedItems = vi.fn();
vi.mock('../../../lib/supabase', () => ({ supabase: {} }));
vi.mock('../UnifiedActivityData', async (orig) => ({
  ...(await orig<typeof import('../UnifiedActivityData')>()),
  fetchUnifiedItems: (...a: unknown[]) => fetchUnifiedItems(...a),
}));

import UnifiedActivityWidget from '../UnifiedActivityWidget';

const renderIt = () =>
  render(
    <MemoryRouter>
      <UnifiedActivityWidget />
    </MemoryRouter>
  );

describe('UnifiedActivityWidget', () => {
  beforeEach(() => fetchUnifiedItems.mockReset());

  it('shows which sources were skipped and reloads on Retry', async () => {
    fetchUnifiedItems
      .mockResolvedValueOnce({ items: [], skipped: ['task', 'activity'] })
      .mockResolvedValueOnce({ items: [], skipped: [] });
    renderIt();
    const notice = await screen.findByTestId('unified-skipped');
    expect(notice).toHaveTextContent('Could not load tasks, activity');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(screen.queryByTestId('unified-skipped')).toBeNull());
    expect(fetchUnifiedItems).toHaveBeenCalledTimes(2);
  });

  it('does not set state after unmount', async () => {
    let resolve!: (v: unknown) => void;
    fetchUnifiedItems.mockReturnValue(new Promise((r) => (resolve = r)));
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = renderIt();
    unmount();
    resolve({ items: [], skipped: ['task'] });
    await Promise.resolve();
    expect(err).not.toHaveBeenCalled();
    err.mockRestore();
  });
});
