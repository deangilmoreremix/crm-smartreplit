import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { useContext } from 'react';

let currentUser: any = null;
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: currentUser, isAuthenticated: Boolean(currentUser) }),
}));
vi.mock('../../lib/supabase', () => ({
  supabase: {},
  isSupabaseConfigured: () => false, // entitlement comes from user metadata
}));

import { EntitlementProvider, EntitlementContext } from '../EntitlementContext';

describe('EntitlementProvider', () => {
  it('reports loading until the entitlement for the signed-in user has been loaded', async () => {
    const seen: Array<{ loading: boolean; pkg: string | undefined }> = [];
    const Probe = () => {
      const ctx = useContext(EntitlementContext)!;
      seen.push({ loading: ctx.isLoading, pkg: ctx.entitlement?.package });
      return null;
    };

    // Signed out first (the provider finishes "loading" with no user)...
    const { rerender } = render(
      <EntitlementProvider>
        <Probe />
      </EntitlementProvider>
    );
    // ...then the session resolves to a super admin.
    currentUser = { email: 'admin@example.com', app_metadata: { role: 'super_admin' } };
    await act(async () => {
      rerender(
        <EntitlementProvider>
          <Probe />
        </EntitlementProvider>
      );
    });

    const afterSignIn = seen.slice(seen.findIndex((s) => s.loading === false) + 1);
    // No render with the user present may show "not loading" without the entitlement
    // (route guards would redirect to /upgrade on that render).
    expect(afterSignIn.some((s) => !s.loading && !s.pkg)).toBe(false);
    expect(seen[seen.length - 1]).toEqual({ loading: false, pkg: 'super_admin' });
  });
});
