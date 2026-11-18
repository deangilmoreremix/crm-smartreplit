import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));
vi.mock('../../components/AdvancedFeaturesDashboard', () => ({ default: () => <div /> }));

import SystemOverview from '../SystemOverview';

describe('SystemOverview', () => {
  it('does not render the invented implementation statistics', () => {
    const { container } = render(<SystemOverview />);
    const text = container.textContent || '';
    expect(text).not.toContain('Implementation Statistics');
    for (const label of ['Total Components', 'Pages Created', 'API Endpoints', 'Store Actions', 'Type Definitions', 'Test Cases']) {
      expect(text).not.toContain(label);
    }
  });
});
