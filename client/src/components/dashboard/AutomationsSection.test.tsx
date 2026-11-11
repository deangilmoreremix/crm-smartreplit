import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import AutomationsSection from './AutomationsSection';

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }));

const Where = () => <div data-testid="where">{useLocation().pathname}</div>;

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/dashboard" element={<AutomationsSection />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );

describe('AutomationsSection', () => {
  beforeEach(() => localStorage.clear());

  it('navigates with react-router when a card is clicked', () => {
    setup();
    fireEvent.click(screen.getByTestId('automation-email-followup'));
    expect(screen.getByTestId('where')).toHaveTextContent('/automations/email-followup');
  });

  it('shows Configured only when a local config exists', () => {
    localStorage.setItem('automation-config-email-followup', '{"isEnabled":true}');
    setup();
    expect(screen.getByTestId('text-status-email-followup')).toHaveTextContent('Configured');
    expect(screen.getByTestId('text-status-sms-reminder')).toHaveTextContent('Not configured');
  });
});
