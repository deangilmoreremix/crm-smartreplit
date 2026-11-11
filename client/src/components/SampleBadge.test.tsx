import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SampleBadge from './SampleBadge';

describe('SampleBadge', () => {
  it('renders "Sample" by default', () => {
    render(<SampleBadge />);
    expect(screen.getByTestId('sample-badge')).toHaveTextContent('Sample');
  });

  it('renders a custom label and class', () => {
    render(<SampleBadge label="Includes sample data" className="ml-3" />);
    const el = screen.getByTestId('sample-badge');
    expect(el).toHaveTextContent('Includes sample data');
    expect(el.className).toContain('ml-3');
  });
});
