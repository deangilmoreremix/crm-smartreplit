import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DealsBoard from '../DealsBoard';
import ContactsBoard from '../ContactsBoard';
import { applyFilters } from '../applyFilters';
import { useDealStore } from '../../../store/dealStore';

describe('applyFilters', () => {
  const rows = [
    { name: 'Ada', value: 10, company: '' },
    { name: 'Bob', value: 50, company: 'Acme' },
  ];

  it('applies every condition', () => {
    expect(applyFilters(rows, [{ field: 'value', operator: 'gt', value: '20' }])).toEqual([rows[1]]);
    expect(applyFilters(rows, [{ field: 'name', operator: 'contains', value: 'ad' }])).toEqual([rows[0]]);
    expect(applyFilters(rows, [{ field: 'company', operator: 'isEmpty', value: '' }])).toEqual([rows[0]]);
    expect(applyFilters(rows, [])).toEqual(rows);
  });
});

describe('DealsBoard', () => {
  // The store starts empty and saves through /api/deals, so seed fixture deals and mock the save call
  beforeEach(() => {
    const stages = useDealStore.getState().pipelines[useDealStore.getState().activePipelineId].stages;
    const deal = (id: string, title: string, stageIndex: number) =>
      ({
        id,
        title,
        value: 1000,
        stage: stages[stageIndex],
        probability: stages[stageIndex].probability,
        contactId: 'c1',
        priority: 'medium',
        source: 'website',
        tags: [],
        customFields: {},
        activities: [],
        attachments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: 'USD',
      }) as any;
    useDealStore.setState({ deals: [deal('d1', 'Fixture deal one', 0), deal('d2', 'Fixture deal two', 1)] } as any);
    global.fetch = vi.fn(async () => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })) as any;
  });

  it('renders a kanban column per stage with the store deals', () => {
    render(<DealsBoard />);
    expect(screen.getByText('Deals board')).toBeTruthy();
    for (const stage of ['Qualification', 'Proposal', 'Negotiation']) {
      expect(screen.getAllByText(stage).length).toBeGreaterThan(0);
    }
    const firstDeal = useDealStore.getState().deals[0];
    expect(screen.getByText(firstDeal.title)).toBeTruthy();
  });

  it('switches to the table view', () => {
    render(<DealsBoard />);
    fireEvent.click(screen.getByRole('button', { name: 'Table' }));
    const table = screen.getByRole('table');
    expect(within(table).getByText('Probability')).toBeTruthy();
  });

  it('moves a deal to another stage from its card', async () => {
    render(<DealsBoard />);
    const select = screen.getAllByLabelText('Move to stage')[0] as HTMLSelectElement;
    const dealId = useDealStore.getState().deals.find((d) => d.stage.id === select.value)!.id;
    fireEvent.change(select, { target: { value: 'closed-lost' } });
    await new Promise((r) => setTimeout(r, 0));
    expect(useDealStore.getState().deals.find((d) => d.id === dealId)!.stage.id).toBe('closed-lost');
  });
});

describe('ContactsBoard', () => {
  it('renders status columns', () => {
    render(<ContactsBoard />);
    expect(screen.getByText('Contacts board')).toBeTruthy();
    expect(screen.getAllByText('Lead').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Prospect').length).toBeGreaterThan(0);
  });
});
