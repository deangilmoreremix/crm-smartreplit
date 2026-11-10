import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import RecordTable from './RecordTable';
import type { RecordColumn } from './types';

vi.mock('../SavedViewsMenu', () => ({ default: () => null }));

interface Row { id: string; name: string }
const rows: Row[] = [{ id: 'a', name: 'Ann' }, { id: 'b', name: 'Bob' }, { id: 'c', name: 'Cy' }];
const columns: RecordColumn<Row>[] = [{ id: 'name', header: 'Name', accessor: (r) => r.name }];
const editableColumns: RecordColumn<Row>[] = [{ id: 'name', header: 'Name', accessor: (r) => r.name, editable: true }];
// RecordTable expects stable getRowId/columns references.
const getRowId = (r: Row) => r.id;
const press = (key: string, target: Element = document.body) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
const activeRow = () => document.querySelector('[data-active="true"]')?.getAttribute('data-row-id');

describe('RecordTable keyboard navigation', () => {
  const setup = (extra: Partial<React.ComponentProps<typeof RecordTable<Row>>> = {}) => {
    const onRowClick = vi.fn();
    render(<RecordTable<Row> data={rows} columns={columns} getRowId={getRowId} onRowClick={onRowClick} {...extra} />);
    return { onRowClick };
  };

  it('j/k move the focused row, Enter opens it, x toggles selection', () => {
    const { onRowClick } = setup();
    press('j');
    expect(activeRow()).toBe('a');
    press('j');
    expect(activeRow()).toBe('b');
    press('k');
    expect(activeRow()).toBe('a');
    press('ArrowDown');
    press('x');
    const checks = screen.getAllByLabelText('Select row') as HTMLInputElement[];
    expect(checks[1].checked).toBe(true);
    expect(checks[0].checked).toBe(false);
    press('Enter');
    expect(onRowClick).toHaveBeenCalledWith(rows[1]);
  });

  it('/ focuses the search input', () => {
    setup();
    press('/');
    expect(document.activeElement).toBe(screen.getByLabelText('Search'));
  });

  it('ignores keys while typing in the search box', () => {
    setup();
    const input = screen.getByLabelText('Search');
    input.focus();
    fireEvent.keyDown(input, { key: 'j' });
    expect(activeRow()).toBeUndefined();
  });

  it('Enter on an inline-edit cell does not also open the row', () => {
    const onCellEdit = vi.fn().mockResolvedValue(undefined);
    const onRowClick = vi.fn();
    render(
      <RecordTable<Row>
        data={rows}
        columns={editableColumns}
        getRowId={getRowId}
        onRowClick={onRowClick}
        onCellEdit={onCellEdit}
      />
    );
    const cell = screen.getAllByRole('button', { name: /Ann/ })[0] ?? document.querySelector('[data-edit-cell] [role="button"]')!;
    press('j');
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
