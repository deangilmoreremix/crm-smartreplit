import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AutomationConfig from './AutomationConfig';

vi.mock('../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/automations/daily-brief']}>
      <Routes>
        <Route path="/automations/:id" element={<AutomationConfig />} />
        <Route path="/dashboard" element={<div>Dashboard page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('AutomationConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('Back to Dashboard uses react-router', () => {
    setup();
    fireEvent.click(screen.getByTestId('button-back'));
    expect(screen.getByText('Dashboard page')).toBeInTheDocument();
  });

  it('shows Saved only for {success:true} and persists locally', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) }));
    setup();
    fireEvent.click(screen.getByTestId('button-save'));
    await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    expect(localStorage.getItem('automation-config-daily-brief')).toContain('"schedule":"daily"');
    expect(screen.getByTestId('text-storage-note')).toHaveTextContent('Stored in this browser');
  });

  it('shows an error when success is false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: false }) }));
    setup();
    fireEvent.click(screen.getByTestId('button-save'));
    await waitFor(() => expect(screen.getByTestId('text-save-error')).toBeInTheDocument());
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('loads stored config on mount', () => {
    localStorage.setItem('automation-config-daily-brief', JSON.stringify({ isEnabled: true, customRules: 'abc' }));
    setup();
    expect(screen.getByTestId('switch-enable')).toBeChecked();
    expect(screen.getByTestId('textarea-rules')).toHaveValue('abc');
  });
});
