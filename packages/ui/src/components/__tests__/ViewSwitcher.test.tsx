import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSwitcher } from '../ViewSwitcher';
import { Banner } from '../Banner';

describe('ViewSwitcher', () => {
  it('marks the controlled value selected and emits changes', () => {
    const onChange = vi.fn();
    render(<ViewSwitcher value="table" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Table' }).getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getByRole('tab', { name: 'Kanban' }));
    expect(onChange).toHaveBeenCalledWith('kanban');
  });
});

describe('Banner', () => {
  it('renders children and dismisses', () => {
    const onDismiss = vi.fn();
    render(<Banner variant="warning" onDismiss={onDismiss}>Heads up</Banner>);
    expect(screen.getByText('Heads up')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });
});
