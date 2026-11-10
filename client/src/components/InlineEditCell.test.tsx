import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import InlineEditCell from './InlineEditCell';

describe('InlineEditCell', () => {
  it('saves on Enter', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<InlineEditCell value="Acme" onSave={onSave} />);
    fireEvent.click(screen.getByText('Acme'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Globex' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Globex'));
    await waitFor(() => expect(screen.queryByRole('textbox')).toBeNull());
  });

  it('cancels on Escape without saving', () => {
    const onSave = vi.fn();
    render(<InlineEditCell value="Acme" onSave={onSave} />);
    fireEvent.click(screen.getByText('Acme'));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Nope' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Acme')).toBeTruthy();
  });

  it('validates numbers and keeps edit mode open on save failure', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('nope'));
    render(<InlineEditCell value={5} type="number" onSave={onSave} />);
    fireEvent.click(screen.getByText('5'));
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Enter a number')).toBeTruthy();
    fireEvent.change(input, { target: { value: '9' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('nope')).toBeTruthy());
    expect(onSave).toHaveBeenCalledWith(9);
  });
});
