import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';

const rpc = vi.fn();
const from = vi.fn(() => ({
  select: () => ({ order: () => Promise.resolve({ data: [] }) }),
}));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc: (...a: unknown[]) => rpc(...a), from: (...a: unknown[]) => (from as any)(...a) } }));

import CommandMenu, { buildDefaultItems, parseRecordRoute, useCommandMenu } from './CommandMenu';

const Loc = () => <div data-testid="loc">{useLocation().pathname}{useLocation().search}</div>;

function Harness() {
  const { CommandMenuComponent } = useCommandMenu();
  return <><CommandMenuComponent /><Loc /></>;
}
const open = () => fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
const wrap = (path = '/dashboard') => render(
  <MemoryRouter initialEntries={[path]}><Routes><Route path="*" element={<Harness />} /></Routes></MemoryRouter>
);

describe('CommandMenu', () => {
  beforeEach(() => { rpc.mockReset(); rpc.mockResolvedValue({ data: [], error: null }); });

  it('opens with Ctrl+K and keeps existing commands', () => {
    wrap();
    open();
    expect(screen.getByText('Go to Contacts')).toBeInTheDocument();
    expect(screen.getByText('Create Deal')).toBeInTheDocument();
  });

  it('navigates with react-router (no full reload)', () => {
    wrap();
    open();
    fireEvent.click(screen.getByText('Create Contact'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/contacts?new=1');
  });

  it('shows record results grouped by object and navigates to them', async () => {
    vi.useFakeTimers();
    rpc.mockResolvedValue({ data: [
      { object_type: 'contact', record_id: '9', title: 'Zed Person', subtitle: null, rank: 1 },
      { object_type: 'deal', record_id: '3', title: 'Zed Deal', subtitle: null, rank: 0.5 },
    ], error: null });
    wrap();
    open();
    fireEvent.change(screen.getByPlaceholderText(/Search commands/), { target: { value: 'zed' } });
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    vi.useRealTimers();
    expect(screen.getByText('Contacts')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zed Person'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/contacts/9');
  });

  it('offers a favorite action on a record page', () => {
    wrap('/contacts/5');
    open();
    expect(screen.getByText('Add to favorites')).toBeInTheDocument();
  });

  it('works with a custom items prop', () => {
    const action = vi.fn();
    render(<MemoryRouter><CommandMenu searchRecords={false} items={[{ id: 'x', label: 'Custom', category: 'C', action }]} /></MemoryRouter>);
    open();
    fireEvent.click(screen.getByText('Custom'));
    expect(action).toHaveBeenCalled();
  });
});

describe('helpers', () => {
  it('parses record routes', () => {
    expect(parseRecordRoute('/contacts/12')).toEqual({ objectType: 'contact', recordId: '12' });
    expect(parseRecordRoute('/contacts')).toBeNull();
    expect(parseRecordRoute('/contacts/duplicates')).toBeNull();
    expect(parseRecordRoute('/companies/abc')).toEqual({ objectType: 'company', recordId: 'abc' });
    expect(parseRecordRoute('/deals/7')).toEqual({ objectType: 'deal', recordId: '7' });
  });
  it('builds items that call navigate', () => {
    const nav = vi.fn();
    buildDefaultItems(nav).find((i) => i.id === 'tasks')!.action();
    expect(nav).toHaveBeenCalledWith('/tasks');
  });
});
