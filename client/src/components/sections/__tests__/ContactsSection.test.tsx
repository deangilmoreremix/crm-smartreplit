import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Contact } from '../../../types/contact';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

import ContactsSection from '../ContactsSection';
import { useContactStore } from '../../../store/contactStore';

const contact = (id: string, over: Partial<Contact> = {}): Contact => ({
  id,
  name: `Person ${id}`,
  email: `${id}@x.com`,
  status: 'lead',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...over,
});

const set = (contacts: Contact[], extra: Record<string, unknown> = {}) =>
  useContactStore.setState({
    contacts: Object.fromEntries(contacts.map((c) => [c.id, c])),
    isLoading: false,
    error: null,
    ...extra,
  });

const renderIt = () =>
  render(
    <MemoryRouter>
      <ContactsSection />
    </MemoryRouter>
  );

describe('ContactsSection', () => {
  beforeEach(() => navigate.mockReset());

  it('shows a loading state, an error with retry, and an empty state', () => {
    const fetchContacts = vi.fn().mockResolvedValue(undefined);
    set([], { isLoading: true });
    const a = renderIt();
    expect(screen.getByText('Loading contacts...')).toBeInTheDocument();
    a.unmount();

    set([], { error: 'boom', fetchContacts });
    const b = renderIt();
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(fetchContacts).toHaveBeenCalled();
    b.unmount();

    set([]);
    renderIt();
    expect(screen.getByText(/No contacts yet/)).toBeInTheDocument();
  });

  it('lists the first 8 contacts with company/status/score and navigates for real ones only', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      contact(String(100 + i), { company: `Co ${i}`, status: 'customer', score: 70 + i })
    );
    set([contact('1', { isDemo: true, name: 'Sample Sam' }), ...many]);
    renderIt();
    // Real contacts first, capped at 8: the sample one is cut off here
    expect(screen.getAllByRole('listitem')).toHaveLength(8);
    expect(screen.queryByText('Sample Sam')).toBeNull();
    expect(screen.getByText('Co 0')).toBeInTheDocument();
    expect(screen.getAllByText('customer').length).toBe(8);
    expect(screen.getByText('70')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Person 100'));
    expect(navigate).toHaveBeenLastCalledWith('/contacts/100');
    fireEvent.click(screen.getByRole('button', { name: /View all/ }));
    expect(navigate).toHaveBeenLastCalledWith('/contacts');
  });

  it('renders sample contacts as non-clickable rows with a Sample badge', () => {
    set([contact('1', { isDemo: true, name: 'Sample Sam' })]);
    renderIt();
    expect(screen.getByTestId('sample-badge')).toHaveTextContent('Sample');
    fireEvent.click(screen.getByText('Sample Sam'));
    expect(navigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Sample Sam/ })).toBeNull();
  });
});
