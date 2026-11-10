import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const fetchBrandingForHost = vi.fn();
// vi.fn records settled results on a derived promise, so a rejecting spy reports an unhandled
// rejection; use a plain function for the error case.
let rejectWith: Error | null = null;

vi.mock('../services/whitelabelService', () => ({
  isOwnHost: (h: string) =>
    h === 'localhost' || h === '127.0.0.1' || h.endsWith('.smartcrm.vip') || h.endsWith('.netlify.app'),
  fetchBrandingForHost: (...a: unknown[]) =>
    rejectWith ? (async () => { throw rejectWith; })() : fetchBrandingForHost(...a),
}));
vi.mock('../lib/supabase', () => ({ supabase: {} }));

import { DomainRouter } from '../utils/domainRouter';
import { useDomainRouting } from '../hooks/useDomainRouting';

beforeEach(() => {
  fetchBrandingForHost.mockReset();
  rejectWith = null;
});

describe('DomainRouter', () => {
  it('normalizes hosts', () => {
    expect(DomainRouter.normalizeHost(' CRM.Acme.com.:8080 ')).toBe('crm.acme.com');
  });
  it('treats built-in hosts as own without a lookup', async () => {
    expect(await DomainRouter.resolveHost('app.smartcrm.vip')).toEqual({ kind: 'own', host: 'app.smartcrm.vip', branding: null });
    expect(fetchBrandingForHost).not.toHaveBeenCalled();
  });
  it('resolves custom domains through the branding lookup', async () => {
    fetchBrandingForHost.mockResolvedValue({ companyName: 'Acme' });
    expect(await DomainRouter.resolveHost('crm.acme.com')).toEqual({ kind: 'custom', host: 'crm.acme.com', branding: { companyName: 'Acme' } });
  });
  it('reports unknown hosts instead of falling back to a default tenant', async () => {
    fetchBrandingForHost.mockResolvedValue(null);
    expect((await DomainRouter.resolveHost('stranger.example.org')).kind).toBe('unknown');
  });
});

describe('useDomainRouting', () => {
  it('exposes the resolved host kind and branding', async () => {
    fetchBrandingForHost.mockResolvedValue({ companyName: 'Acme' });
    vi.stubGlobal('location', { hostname: 'crm.acme.com', protocol: 'https:', pathname: '/' });
    const { result } = renderHook(() => useDomainRouting());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hostKind).toBe('custom');
    expect(result.current.branding).toEqual({ companyName: 'Acme' });
  });
  it('surfaces lookup errors', async () => {
    rejectWith = new Error('down');
    vi.stubGlobal('location', { hostname: 'crm.acme.com', protocol: 'https:', pathname: '/' });
    const { result } = renderHook(() => useDomainRouting());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('down');
  });
});
