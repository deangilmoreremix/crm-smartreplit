import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

let mockUser: any = null;
vi.mock('./AuthContext', () => ({
  useAuth: () => ({ user: mockUser, isAuthenticated: !!mockUser }),
}));

let resolveFetch: (v: any) => void = () => {};
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => new Promise((res) => (resolveFetch = res)),
        }),
      }),
    }),
  },
}));

import { EntitlementProvider, useEntitlements } from './EntitlementContext';

const Probe = () => {
  const { isLoading, entitlement } = useEntitlements();
  return <div data-testid="p">{`${isLoading ? 'loading' : 'ready'}:${entitlement?.package ?? 'none'}`}</div>;
};

describe('EntitlementProvider loading gap', () => {
  it('is loading (not ready/none) from the first render in which the user appears, until resolved', async () => {
    mockUser = { id: 'u1', email: 'a@b.co' };
    render(
      <EntitlementProvider>
        <Probe />
      </EntitlementProvider>
    );
    // Must never expose "ready:none" for a signed-in user before the fetch resolves
    expect(screen.getByTestId('p').textContent).toBe('loading:none');
    resolveFetch({ data: { id: 'x', email: 'a@b.co', package: 'super_admin' }, error: null });
    await waitFor(() => expect(screen.getByTestId('p').textContent).toBe('ready:super_admin'));
  });

  it('is ready with no entitlement when nobody is signed in', async () => {
    mockUser = null;
    render(
      <EntitlementProvider>
        <Probe />
      </EntitlementProvider>
    );
    await waitFor(() => expect(screen.getByTestId('p').textContent).toBe('ready:none'));
  });
});
