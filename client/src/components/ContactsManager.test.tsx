import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactsManager from './ContactsManager';

vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } },
}));
vi.mock('./SavedViewsMenu', () => ({
  default: ({ onApply }: { onApply: (f: Record<string, unknown>) => void }) => (
    <button onClick={() => onApply({ search: '', status: 'customer', industry: '' })}>
      Apply view
    </button>
  ),
}));
vi.mock('./ContactActivityTimeline', () => ({ ContactActivityTimeline: () => <div>timeline</div> }));
vi.mock('./ContactAttachments', () => ({ default: () => <div>attachments</div> }));

const rows = [
  { id: 1, firstName: 'Jane', lastName: 'Doe', email: 'j@a.com', company: 'Acme', industry: 'Tech', status: 'lead' },
  { id: 2, firstName: 'Bob', lastName: 'Ray', email: 'b@a.com', company: 'Globex', industry: 'Auto', status: 'customer' },
];

describe('ContactsManager', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (init?.method === 'PUT') {
        return { ok: true, json: async () => ({ ...rows[0], ...JSON.parse(String(init.body)) }) };
      }
      return { ok: true, json: async () => rows };
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders rows, edits a cell via PUT, and applies a saved view', async () => {
    render(<ContactsManager />);
    expect(await screen.findByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('Bob Ray')).toBeTruthy();

    fireEvent.click(screen.getByText('Acme'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Initech' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('Initech')).toBeTruthy());
    const put = fetchMock.mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(put?.[0]).toBe('/api/contacts/1');
    expect(JSON.parse(put?.[1].body)).toEqual({ company: 'Initech' });

    fireEvent.click(screen.getByText('Apply view'));
    await waitFor(() => expect(screen.queryByText('Jane Doe')).toBeNull());
    expect(screen.getByText('Bob Ray')).toBeTruthy();
  });

  it('shows an error state', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    render(<ContactsManager />);
    expect(await screen.findByRole('alert')).toBeTruthy();
  });
});
