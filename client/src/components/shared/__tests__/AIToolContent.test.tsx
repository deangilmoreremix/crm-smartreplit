import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import AIToolContent from '../AIToolContent';

describe('AIToolContent', () => {
  it('renders AI output as text, never as HTML (no script injection)', () => {
    const { container } = render(
      <AIToolContent
        isLoading={false}
        error={null}
        result={'Summary <img src=x onerror="alert(1)"> and `code` here'}
      />
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror="alert(1)">');
    // Backtick highlighting still works
    expect(container.querySelector('span.font-mono')?.textContent).toBe('code');
  });
});
