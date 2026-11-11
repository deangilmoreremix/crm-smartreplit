import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OnboardingWidget } from './OnboardingWidget';

vi.mock('./RoleBasedAccess', () => ({
  useRole: () => ({
    user: { id: 'u1', firstName: '', lastName: '', productTier: '', role: 'user' },
    canAccess: () => true,
  }),
}));

const setup = () =>
  render(
    <MemoryRouter>
      <OnboardingWidget />
    </MemoryRouter>
  );

describe('OnboardingWidget', () => {
  beforeEach(() => localStorage.clear());

  it('Upcoming list excludes the highlighted next step', () => {
    setup();
    // Next step (highest priority) is the first high-priority step
    expect(screen.getAllByText('Complete Your Profile')).toHaveLength(1);
  });

  it('Skip Setup persists every step', () => {
    setup();
    fireEvent.click(screen.getByText(/Skip Setup/));
    const saved = JSON.parse(localStorage.getItem('onboarding-u1') || '[]');
    expect(saved.sort()).toEqual(
      [
        'profile_completion',
        'subscription_selection',
        'first_contact_import',
        'ai_setup',
        'first_ai_interaction',
        'create_first_deal',
      ].sort()
    );
    expect(screen.queryByText('Welcome to SmartCRM!')).not.toBeInTheDocument();
  });
});
